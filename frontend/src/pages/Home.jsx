import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Kanban, Shield, Layers, Users, Zap, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';

const Home = () => {
  const token = localStorage.getItem('token');
  
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="bg-slate-50 dark:bg-[#05070f] font-sans text-slate-800 dark:text-slate-100 min-h-screen w-full overflow-x-hidden selection:bg-blue-500 selection:text-white transition-colors duration-300">
      <section className="relative h-[calc(100vh-73px)] flex items-center justify-center bg-slate-100/60 dark:bg-[#070913] overflow-hidden px-6 border-b border-slate-200 dark:border-slate-900/60 transition-colors duration-300">
        
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 dark:bg-blue-600/5 blur-[130px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/5 dark:bg-purple-600/5 blur-[130px]" />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-4 py-1.5 rounded-full text-[10px] tracking-[0.3em] font-black uppercase text-blue-600 dark:text-blue-400 mb-2">
            <Sparkles size={12} className="animate-pulse" />
            <span>TaskFlow v2.0 Live Telemetry Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.05] transition-colors duration-300">
            The Art of <br /> 
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-500 bg-clip-text text-transparent italic font-light">
              Productivity
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-normal transition-colors duration-300">
            A meticulously curated digital workspace built for high-velocity teams. Streamline project execution, manage development columns, and sync tasks seamlessly with real-time feedback loops.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            {token ? (
              <Link 
                to="/dashboard" 
                className="w-full sm:w-auto bg-blue-600 text-white px-12 py-4 text-xs uppercase tracking-[0.25em] font-bold hover:bg-blue-500 transition-all duration-300 rounded-xl shadow-xl shadow-blue-600/10 dark:shadow-blue-600/20 text-center flex items-center justify-center gap-2 group border border-blue-400/20"
              >
                Go to Workspace Dashboard
                <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            ) : (
              <>
                <Link 
                  to="/register" 
                  className="w-full sm:w-auto bg-blue-600 text-white px-12 py-4 text-xs uppercase tracking-[0.25em] font-bold hover:bg-blue-500 transition-all duration-300 rounded-xl shadow-xl shadow-blue-600/10 dark:shadow-blue-600/20 text-center border border-blue-400/20"
                >
                  Get Started Free
                </Link>
                <Link 
                  to="/login" 
                  className="w-full sm:w-auto text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-12 py-4 text-xs uppercase tracking-[0.25em] font-bold hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-300 rounded-xl text-center shadow-sm"
                >
                  Workspace Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. LIVE INTERACTIVE TEASER - Kanban Widescreen Geometry */}
      <section className="py-24 bg-slate-50 dark:bg-[#05070f] px-4 md:px-12 w-full transition-colors duration-300">
        <div className="w-full max-w-[1440px] mx-auto">
          
          <div className="flex flex-col lg:flex-row justify-between items-baseline mb-16 gap-6 px-2">
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-blue-600 dark:text-blue-400 mb-3 font-bold">The Blueprint</h2>
              <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">Visual Fluid Architecture</p>
            </div>
            <p className="text-slate-600 dark:text-slate-400 max-w-md text-sm md:text-base leading-relaxed font-light transition-colors duration-300">
              An interface crafted for technical excellence, designed to provide comprehensive visibility over full stack deployments at a single glance.
            </p>
          </div>

          {/* Kanban Board Container Mockup */}
          <div className="w-full border border-slate-200 dark:border-slate-900 bg-white dark:bg-[#070a14]/60 p-6 rounded-2xl shadow-xl dark:shadow-3xl backdrop-blur-md group hover:border-slate-300 dark:hover:border-slate-800/80 transition-colors duration-300">
            
            {/* Mock Board Header */}
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100 dark:border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2 tracking-widest uppercase flex items-center gap-2">
                  <Kanban size={14} className="text-blue-600 dark:text-blue-400" /> Sprint Board: Production Release v2.0
                </span>
              </div>
              <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest font-bold px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 rounded-md">
                3 Active Engine Pools
              </span>
            </div>

            {/* Kanban Columns Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              
              {/* Column 1 */}
              <div className="bg-slate-50 dark:bg-[#05070f]/80 border border-slate-200 dark:border-slate-900 p-5 rounded-xl space-y-4 transition-colors duration-300">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-slate-600 dark:text-slate-400 text-xs tracking-widest uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> Backlog Queue
                  </h3>
                  <span className="text-[10px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-slate-400 dark:text-slate-500 font-bold border border-slate-200 dark:border-slate-800">2</span>
                </div>
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 p-4 rounded-lg hover:border-slate-400 dark:hover:border-slate-700 transition-all cursor-pointer group/card relative shadow-sm">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1 flex justify-between items-center">
                    Integrate Payment Gateways <ArrowUpRight size={14} className="opacity-0 group-hover/card:opacity-100 text-blue-600 dark:text-blue-400 transition-opacity" />
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Configure webhooks and transaction settlement event listeners.</p>
                </div>
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 p-4 rounded-lg hover:border-slate-400 dark:hover:border-slate-700 transition-all cursor-pointer group/card shadow-sm">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1 flex justify-between items-center">
                    Profile Dashboard Layout <ArrowUpRight size={14} className="opacity-0 group-hover/card:opacity-100 text-blue-600 dark:text-blue-400 transition-opacity" />
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Build responsive views for user preferences and JWT tracking parameters.</p>
                </div>
              </div>

              {/* Column 2 */}
              <div className="bg-slate-50 dark:bg-[#05070f]/80 border border-slate-200 dark:border-slate-900 p-5 rounded-xl space-y-4 transition-colors duration-300">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-slate-600 dark:text-slate-400 text-xs tracking-widest uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> In Progress
                  </h3>
                  <span className="text-[10px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-slate-400 dark:text-slate-500 font-bold border border-slate-200 dark:border-slate-800">1</span>
                </div>
                <div className="bg-white dark:bg-slate-900/90 border border-blue-200 dark:border-blue-500/20 p-4 rounded-lg bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 shadow-md cursor-pointer group/card">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      Secure Authentication Core
                    </h4>
                    <span className="text-[9px] bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Critical</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Wiring up server hooks, token validation controllers, and password matching.</p>
                </div>
              </div>

              {/* Column 3 */}
              <div className="bg-slate-50 dark:bg-[#05070f]/80 border border-slate-200 dark:border-slate-900 p-5 rounded-xl space-y-4 transition-colors duration-300">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-slate-600 dark:text-slate-400 text-xs tracking-widest uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed
                  </h3>
                  <span className="text-[10px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-slate-400 dark:text-slate-500 font-bold border border-slate-200 dark:border-slate-800">1</span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-950 p-4 rounded-lg opacity-40 line-through decoration-slate-400 dark:decoration-slate-800 cursor-pointer">
                  <h4 className="font-semibold text-sm text-slate-500 dark:text-slate-500 mb-1">Database Cluster Verification</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-600">Established persistent connection streams with cloud MongoDB instances.</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. PERFORMANCE INFRASTRUCTURE - Core Features Grid */}
      <section className="py-24 bg-slate-100/50 dark:bg-[#03040a] border-t border-slate-200 dark:border-slate-900/60 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { icon: <Shield size={24} />, title: "JWT Security", desc: "Cryptographic Protection" },
            { icon: <Zap size={24} />, title: "Instant Engine", desc: "Zero-Latency Updates" },
            { icon: <Layers size={24} />, title: "Mongoose Core", desc: "Structured Data Schemas" },
            { icon: <Users size={24} />, title: "Team Synergy", desc: "Multi-User Workspaces" }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center group">
              <div className="text-blue-600 dark:text-blue-400 mb-6 transition-transform duration-500 group-hover:scale-110">{item.icon}</div>
              <h4 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-800 dark:text-slate-200 mb-3">{item.title}</h4>
              <div className="w-6 h-[1px] bg-slate-300 dark:bg-slate-800 mb-3"></div>
              <p className="text-slate-500 text-[10px] uppercase tracking-[0.15em]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. REAL-WORLD UPGRADE: FAQ EXPLAINER ACCORDION */}
      <section className="py-24 bg-slate-50 dark:bg-[#05070f] border-t border-slate-200 dark:border-slate-900/60 px-6 transition-colors duration-300">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-[10px] uppercase tracking-[0.4em] text-blue-600 dark:text-blue-400 font-bold">FAQ Telemetry</h2>
            <p className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">Frequently Asked Questions</p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-900 border-y border-slate-200 dark:border-slate-900">
            {[
              { q: "How do real-time broadcasts work in TaskFlow?", a: "TaskFlow leverages WebSockets (Socket.io) to instantly push notifications, comments, and task assignments directly to logged-in workspace contributors without needing a page refresh." },
              { q: "Is my workspace configuration secured?", a: "Absolutely. All routes, boards, and backend logs are strictly locked down using JSON Web Tokens (JWT) mapped securely inside your browser session configuration parameters." },
              { q: "Can I manage multiple project boards concurrently?", a: "Yes. The dashboard layer is designed with scalable database clusters allowing you to build, populate, and delegate individual tasks across infinite dynamic workspaces." }
            ].map((faq, index) => (
              <div key={index} className="py-4">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center text-left py-2 font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white transition-colors focus:outline-none group text-sm md:text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={16} className={`text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-slate-300 transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 max-h-0 ${activeFaq === index ? 'max-h-24 mt-2' : ''}`}>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed pl-1">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimalistic Footer Node */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-950 bg-slate-100 dark:bg-[#04060d] py-8 text-center text-[10px] text-slate-500 dark:text-slate-600 uppercase tracking-widest transition-colors duration-300">
        &copy; {new Date().getFullYear()} TaskFlow Dev Engine Node. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;