import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Event.css";

const Event = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const cursor = document.querySelector(".cursor-circle");
    const section = document.querySelector(".event-details");

    if (!cursor || !section) return;

    let mouseX = 0,
      mouseY = 0;
    let currentX = 0,
      currentY = 0;

    const moveCursor = (e) => {
      const rect = section.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const animate = () => {
      currentX += (mouseX - currentX) * 0.15;
      currentY += (mouseY - currentY) * 0.15;
      cursor.style.transform = `translate(${currentX - 110}px, ${currentY - 160}px)`;
      requestAnimationFrame(animate);
    };

    section.addEventListener("mousemove", moveCursor);
    animate();

    return () => {
      section.removeEventListener("mousemove", moveCursor);
    };
  }, []);

  return (
  <div className="event-container-main">
    <div className="event-container">
      {/* ==== Event Details Section ==== */}
      <section className="event-details" id="event">
        <div className="cursor-circle"></div>

        <div className="event-content">
          <h2 className="event-title">RED DAY 2026</h2>
          <p className="event-tagline">Moments That Shape Us</p>

          <div className="event-info">
            <p>
              <strong>Date:</strong> 23 April 2026
            </p>
            <p>
              <strong>Time:</strong> 2:30 PM
            </p>
            <p>
              <strong>Venue:</strong> Main Auditorium
            </p>
          </div>

          {/* <div className="speakers">
            <h3>Featured Speakers</h3>
            <p>Speaker lineup will be revealed soon — stay tuned!</p>
          </div> */}

          <button
            className="register-btn"
            onClick={() => navigate("https://unstop.com/o/J4DHu2p?utm_medium=Share&utm_source=tedxsoc5964&utm_campaign=Competitions")}
          >
            Register Now
          </button>
        </div>
      </section>
    </div>
    </div>
  );
};

export default Event;
