import React, { useEffect } from "react";
import "./Reveal.css";

const Reveal = ({ onFinish }) => {
  useEffect(() => {
    // Match animation time (1.2s)
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onFinish]);

return (
  <div className="reveal-div">
    <div className="reveal-container">
      <span className="reveal-text">TEDxTIET</span>
      <span className="reveal-bar"></span>
    </div>
    </div>
  );
};

export default Reveal;