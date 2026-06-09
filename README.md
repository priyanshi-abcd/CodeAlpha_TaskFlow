# TaskFlow - Full-Stack Project Management Platform

TaskFlow is a high-velocity, full-stack project management application engineered to streamline project execution, manage development pipelines, and track workspace operations in real-time. Built using the MERN stack and styled with premium Tailwind CSS components.

## Key Features
* **Operational Control Shells (Workspaces):** Easily initialize new workspaces with dedicated scopes, milestones, and project titles.
* **Dynamic Task Node Tracking:** Manage your workflow efficiently with responsive project boards split into actionable tracking lanes.
* **Robust Client-Side Validation:** Secure login and registration systems backed by pre-flight email regex and credential length verifications.
* **Premium Tech UI:** Features a sleek dark/light mode transition designed for modern developer workspaces.

## Tech Stack
* **Frontend:** React.js, Tailwind CSS, React Router DOM, Axios
* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Icons & Style:** Lucide React

---

## Environment Variables Configuration

Before starting the backend server, create a `.env` file inside the `Backend/` directory and configure the following variables with your own local database strings:

```env
PORT = 5000
MONGO_URI = mongodb://127.0.0.1:27017/Project-Management
JWT_SECRET = your_private_jwt_secret_string
```

## Local Installation & Setup

```bash
git clone [https://github.com/priyanshi-abcd/CodeAlpha_TaskFlow.git](https://github.com/priyanshi-abcd/CodeAlpha_TaskFlow.git)
cd CodeAlpha_TaskFlow

cd Backend
npm install
npm start

cd frontend
npm install
npm run dev
```
