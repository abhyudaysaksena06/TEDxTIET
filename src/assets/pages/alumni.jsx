import { useState } from "react";
import Image9 from '../gridimages/Image9.webp';
import Image7 from '../gridimages/Image7.webp';
import Image10 from '../gridimages/Image10.webp';
import Image8 from '../gridimages/Image8.webp';
import Image2 from '../gridimages/Image2.webp';
import Image6 from '../gridimages/Image6.webp';
import Image3 from '../gridimages/Image3.webp';
import Image5 from '../gridimages/Image5.webp';
import Image1 from '../gridimages/Image1.webp';
import Image4 from '../gridimages/Image4.webp';

const allAlumni = [
  { name: "Japneet Khanna", url: "https://www.linkedin.com/in/japneet-khanna-069919288/", img: Image9 },
  { name: "Pranjal Batish", url: "https://www.linkedin.com/in/pranjalbatish/", img: Image7 },
  { name: "Tanay Mukker", url: "https://www.linkedin.com/in/tanay-mukker/", img: Image10 },
  { name: "Aman", url: "https://www.linkedin.com/in/aman-aasees-kaur/", img: Image8 },
  { name: "Shambhavi Sharma", url: "https://www.linkedin.com/in/shambhavi-sharma-42b04b258/", img: Image2 },
  { name: "Amit Katoch", url: "https://www.linkedin.com/in/amit-katoch-5o5/", img: Image6 },
  { name: "Raghav Jindal", url: "https://www.linkedin.com/in/raghavjindal17/", img: Image3 },
  { name: "Rohit Arora", url: "https://www.linkedin.com/in/rohit-arora-93415024a/", img: Image5 },
  { name: "Priyam Ganguli", url: "https://www.linkedin.com/in/priyam-ganguli/", img: Image1 },
  { name: "Bhavya Arora", url: "https://www.linkedin.com/in/bhavya-arora-7a9381266/", img: Image4 },
];

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  );
}

function AlumniCard({ name, url, img }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="alumni-card"
      style={{
        ...styles.card,
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        boxShadow: hovered ? "0 14px 36px rgba(255,0,0,0.2)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.imageWrapper}>
        <img
          src={img}
          alt={name}
          style={{
            ...styles.cardImg,
            filter: hovered ? "brightness(1) scale(1.05)" : "brightness(0.85) scale(1)",
          }}
          loading="lazy"
        />
        <div style={{...styles.overlay, opacity: hovered ? 1 : 0}}>
           <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} on LinkedIn`}
            style={styles.linkedinLink}
            onClick={(e) => e.stopPropagation()}
          >
            <LinkedInIcon />
          </a>
        </div>
      </div>
      <div style={styles.cardInfo}>
        <p style={styles.cardName}>{name}</p>
      </div>
    </div>
  );
}

export default function AlumniPage() {
  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
        
        .alumni-container {
          display: flex;
          flex-wrap: wrap;
          gap: 30px;
          justify-content: center;
          max-width: 1200px;
          margin: 0 auto;
        }

        .alumni-card {
          flex: 0 0 100%;
          max-width: 300px;
        }

        @media (min-width: 640px) {
          .alumni-card { flex: 0 0 calc(50% - 30px); }
        }

        @media (min-width: 992px) {
          .alumni-card { flex: 0 0 calc(33.33% - 30px); }
        }

        @media (min-width: 1200px) {
          .alumni-card { flex: 0 0 calc(25% - 30px); }
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.heading}>Alumni</h1>
        <p style={styles.subheading}>Honoring the visionaries who have shaped the TEDxTIET legacy and continue to inspire across the globe.</p>
      </div>

      {/* Content */}
      <div className="alumni-container">
        {allAlumni.map((a, i) => (
          <AlumniCard key={i} {...a} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    background: "#050505",
    minHeight: "100vh",
    padding: "6rem 2rem",
    color: "#fff",
  },
  header: {
    textAlign: "center",
    marginBottom: "4rem",
  },
  heading: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "3.5rem",
    fontWeight: 700,
    margin: "0 0 1rem",
    letterSpacing: "-1px",
    color: "#fff",
  },
  subheading: {
    color: "#888",
    fontSize: "1.1rem",
    fontWeight: 300,
    margin: 0,
    letterSpacing: "1px",
  },
  card: {
    position: "relative",
    borderRadius: "15px",
    overflow: "hidden",
    background: "#111",
    transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease",
    border: "1px solid #222",
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: "350px",
    overflow: "hidden",
  },
  cardImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    display: "block",
    transition: "all 0.6s ease",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.3s ease",
    backdropFilter: "blur(2px)",
  },
  linkedinLink: {
    background: "#0077b5",
    color: "#fff",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    transition: "transform 0.3s ease, background 0.3s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    ":hover": {
      transform: "scale(1.1)",
      background: "#00a0dc",
    }
  },
  cardInfo: {
    padding: "1.5rem",
    textAlign: "center",
    background: "linear-gradient(to bottom, #111, #080808)",
  },
  cardName: {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: 500,
    color: "#fff",
    letterSpacing: "0.5px",
  },
};
