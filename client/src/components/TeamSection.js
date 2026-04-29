import React from "react";
import "./TeamSection.css";

export default function TeamSection() {
  const team = [
    {
      name: "Supervisor (Product Lead)",
      title: "Vision, roadmap, client requirements, delivery",
      img: "/team/ceo.jpg",
    },
    {
      name: "Hafiz Zubair Iftikhar (Full-Stack Engineer)",
      title: "React + Node.js + MongoDB, auth, dashboards, APIs",
      img: "/team/fullstack.jpg",
    },
    {
      name: "Hifza Khalid (AI Engineer)",
      title: "Ollama (Llama 3), evaluation prompts, scoring pipeline",
      img: "/team/ai.jpg",
    },
    {
      name: "Baqir Sultan (Proctoring Engineer)",
      title: "TensorFlow.js + Coco-SSD + MediaPipe FaceMesh",
      img: "/team/proctor.jpg",
    },
  ];

  return (
    <section className="team-wrap">
      <div className="team-inner">
        <div className="team-head">
          <h2 className="team-title">Project Builders</h2>
          <p className="team-sub">
            A professional breakdown of roles that built the Smartly Hire platform.
          </p>
        </div>

        <div className="team-grid">
          {team.map((m, i) => (
            <div key={i} className="team-card">
              <div className="team-img">
                <img src={m.img} alt={m.name} />
              </div>
              <div className="team-info">
                <div className="team-name">{m.name}</div>
                <div className="team-role">{m.title}</div>
              </div>
            </div>
          ))}
        </div>

        
      </div>
    </section>
  );
}
