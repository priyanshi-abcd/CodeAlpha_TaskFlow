const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app); 

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});
app.set('socketio', io);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

io.on("connection", (socket) => {
    console.log(`Teammate Connected: ${socket.id}`);

    socket.on("join_user_room", (userId) => {
        socket.join(userId.toString());
        console.log(`User linked to private notification room: ${userId}`);
    });

    // 1. Join a Project Workspace Room
    socket.on("join_project", (projectId) => {
        socket.join(projectId);
        console.log(`User joined workspace room: ${projectId}`);
    });

    socket.on("task_changed", (data) => {
        socket.to(data.projectId).emit("task_updated_stream", data);
    });

    socket.on("send_message", (data) => {
        socket.to(data.projectId).emit("receive_message", data);
    });

    socket.on("new_project_deployed", (newProjectData) => {
        socket.broadcast.emit("global_project_created", newProjectData);
    });

    socket.on("disconnect", () => {
        console.log("Teammate disconnected");
    });
});

app.get("/", (req, res) => {
    res.send("Project Management Tool API is running...");
});

app.use("/auth/api", require("./routes/authRoute"));
app.use("/api/projects", require("./routes/projectRoute"));
app.use("/api/tasks", require("./routes/taskRoute"));
app.use("/api/comments", require("./routes/commentRoute"));
app.use("/api/notifications",require("./routes/notificationRoute"));

mongoose.connect(MONGO_URI)
.then(() => {
    console.log("MongoDB Connected Successfully");
    
    server.listen(PORT, () => {
        console.log(`Server spinning on port ${PORT}`);
    });
})
.catch((err) => {
    console.log("DataBase Connection Error:", err.message);
});