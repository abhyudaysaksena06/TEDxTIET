import React from "react";

function NotFound() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "5rem", color: "red" }}>404</h1>
      <h2>Oops! Page Not Found</h2>
      <p>The page you’re looking for doesn’t exist or has been moved.</p>
      <a
        href="/"
        style={{
          marginTop: "1rem",
          padding: "10px 20px",
          background: "#cc2829",
          color: "#fff",
          borderRadius: "5px",
          textDecoration: "none"
        }}
      >
        Go Back Home
      </a>
    </div>
  );
}

export default NotFound;
