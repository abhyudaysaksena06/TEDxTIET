import React, { useEffect } from "react";
import { ArrowUpRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import "./Event.css";

/** Registration is handled on Unstop for this edition. */
const REGISTRATION_URL =
  "https://unstop.com/o/J4DHu2p?utm_medium=Share&utm_source=tedxsoc5964&utm_campaign=Competitions";

const Event = () => {

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
          <h1 className="event-title">RED DAY 2026</h1>
          <p className="event-tagline">Moments That Shape Us</p>

          <div className="event-info">
            <p className="event-info-item">
              <CalendarDays aria-hidden="true" className="event-info-icon" />
              <strong>Date:</strong> 23 April 2026
            </p>
            <p className="event-info-item">
              <Clock3 aria-hidden="true" className="event-info-icon" />
              <strong>Time:</strong> 2:30 PM
            </p>
            <p className="event-info-item">
              <MapPin aria-hidden="true" className="event-info-icon" />
              <strong>Venue:</strong> Main Auditorium
            </p>
          </div>

          {/* <div className="speakers">
            <h3>Featured Speakers</h3>
            <p>Speaker lineup will be revealed soon — stay tuned!</p>
          </div> */}

          {/* A real anchor, not navigate(). React Router's navigate() treats
              its argument as an in-app path, so the absolute URL was pushed
              onto the current route — the only call to action on this page
              dead-ended at /event/https:/unstop.com/... and rendered the 404. */}
          <a
            className="register-btn"
            href={REGISTRATION_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Register Now
            <ArrowUpRight aria-hidden="true" className="ml-2 inline-block h-4 w-4 align-[-3px]" />
          </a>
        </div>
      </section>
    </div>
    </div>
  );
};

export default Event;
