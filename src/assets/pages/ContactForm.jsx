import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { useNavigate } from "react-router-dom";
import "./queryform.css";

export default function ContactForm() {
    const formRef = useRef();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const sendEmail = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        emailjs
            .sendForm(
                process.env.REACT_APP_EMAILJS_SERVICE_ID,
                process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
                formRef.current,
                process.env.REACT_APP_EMAILJS_PUBLIC_KEY
            )
            .then(
                (response) => {
                    setIsSubmitting(false);
                    alert("Message sent successfully! ✅");
                    console.log("SUCCESS", response);
                    e.target.reset(); // Clear form
                    navigate("/");    // Redirect to home
                },
                (error) => {
                    setIsSubmitting(false);
                    alert("Failed to send message. Please try again. ❌");
                    console.error("FAILED", error);
                }
            );
    };

    const goHome = () => {
        navigate("/");
    };

    return (
        <div className="contact-form-container">
            <div className="login-box">
                <h2>Contact Us</h2>
                <form ref={formRef} onSubmit={sendEmail}>
                    <div className="user-box">
                        <input type="text" name="name" required />
                        <label>Name</label>
                    </div>

                    <div className="user-box">
                        <input type="email" name="email" required />
                        <label>Email</label>
                    </div>

                    <div className="user-box">
                        <textarea name="message" required />
                        <label>Message</label>
                    </div>

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send"}
                    </button>
                </form>
            </div>
            
            <button
                onClick={goHome}
                style={{
                    position: "fixed",
                    bottom: "20px",
                    left: "20px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    width: "50px",
                    height: "50px",
                    padding: 0,
                    zIndex: 1000,
                    transition: "transform 0.3s ease"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
                <svg width="50" height="50" viewBox="0 0 50 50" aria-label="Back">
                    <circle cx="25" cy="25" r="24" fill="#E02424" />
                    <path d="M29 16 L20 25 L29 34" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="21" y1="25" x2="36" y2="25" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
}
