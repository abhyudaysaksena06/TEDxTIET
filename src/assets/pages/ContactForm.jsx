import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, LoaderCircle, Mail } from "lucide-react";
import "./queryform.css";

/**
 * Contact form.
 *
 * The EmailJS credentials used to be read as `process.env.REACT_APP_*`, which
 * is Create-React-App syntax. This app is built by Vite, where `process` does
 * not exist in the browser — so the first line of the submit handler threw
 * `ReferenceError: process is not defined` and the message was never sent.
 * Vite exposes env through `import.meta.env`, and only keys prefixed `VITE_`.
 *
 * Those keys are not set yet, so rather than failing at the moment someone has
 * finished typing, the form checks up front and hands over a mailto: fallback
 * that carries whatever they already wrote.
 */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const CONFIGURED = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

const INBOX = "tedx@thapar.edu";
const RED = "#eb0028";
const RED_INK = "#ff3b52"; // the brand red is under 4.5:1 at this size

export default function ContactForm() {
    const formRef = useRef(null);
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    // { tone: 'ok' | 'error' | 'info', text: string } — shown in the form's own
    // live region instead of alert(), which steals focus and reads badly on a
    // phone
    const [status, setStatus] = useState(null);

    /** build a mailto: that keeps what the person already typed */
    const mailtoFallback = () => {
        const data = new FormData(formRef.current);
        const name = (data.get("name") || "").toString().trim();
        const email = (data.get("email") || "").toString().trim();
        const message = (data.get("message") || "").toString().trim();
        const body = `${message}\n\n— ${name}${email ? ` (${email})` : ""}`;
        return `mailto:${INBOX}?subject=${encodeURIComponent(
            `Website enquiry from ${name || "the TEDxTIET site"}`
        )}&body=${encodeURIComponent(body)}`;
    };

    const sendEmail = async (e) => {
        e.preventDefault();
        setStatus(null);

        if (!CONFIGURED) {
            setStatus({
                tone: "info",
                text: "The form isn't connected to an inbox yet — opening your mail app with this message instead.",
            });
            window.location.href = mailtoFallback();
            return;
        }

        setIsSubmitting(true);
        try {
            await emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, PUBLIC_KEY);
            setStatus({ tone: "ok", text: "Message sent. We'll reply to the address you gave." });
            formRef.current.reset();
            // give the confirmation a moment to be read before leaving
            setTimeout(() => navigate("/"), 2200);
        } catch (err) {
            console.error("EmailJS send failed", err);
            setStatus({
                tone: "error",
                text: `Couldn't send that. Try again, or email us directly at ${INBOX}.`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const toneColor =
        status?.tone === "ok" ? "#4ade80" : status?.tone === "error" ? RED_INK : "#d4d4d4";

    return (
        <div className="contact-form-container">
            <div className="login-box">
                {/* the bar says CONTACT — see alumni.jsx */}
                <h1 className="sr-only">Contact Us</h1>

                <form ref={formRef} onSubmit={sendEmail}>
                    {/* every label is tied to its input by id — they were plain
                        <label> elements with no association, so assistive tech
                        announced the fields as unlabelled */}
                    <div className="user-box">
                        <input type="text" id="contact-name" name="name" required autoComplete="name" />
                        <label htmlFor="contact-name">Name</label>
                    </div>

                    <div className="user-box">
                        <input type="email" id="contact-email" name="email" required autoComplete="email" />
                        <label htmlFor="contact-email">Email</label>
                    </div>

                    <div className="user-box">
                        <textarea id="contact-message" name="message" required />
                        <label htmlFor="contact-message">Message</label>
                    </div>

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                Sending...
                                <LoaderCircle aria-hidden="true" className="ml-2 inline-block h-4 w-4 animate-spin align-[-3px]" />
                            </>
                        ) : (
                            <>
                                Send
                                <ArrowRight aria-hidden="true" className="ml-2 inline-block h-4 w-4 align-[-3px]" />
                            </>
                        )}
                    </button>

                    {/* announced to screen readers when it changes, rather than
                        interrupting with alert() */}
                    <p
                        role="status"
                        aria-live="polite"
                        style={{
                            minHeight: "1.2em",
                            marginTop: "14px",
                            fontSize: "0.8rem",
                            lineHeight: 1.5,
                            color: toneColor,
                        }}
                    >
                        {status?.text || ""}
                    </p>

                    <p style={{ marginTop: "4px", fontSize: "0.72rem", color: "#9a9a9a" }}>
                        <Mail aria-hidden="true" className="mr-1 inline-block h-3.5 w-3.5 align-[-3px]" />
                        Prefer email?{" "}
                        <a href={`mailto:${INBOX}`} style={{ color: RED_INK }}>
                            {INBOX}
                        </a>
                    </p>
                </form>
            </div>

            {/* the accessible name belongs on the control, not on the <svg> inside it */}
            <button
                type="button"
                onClick={() => navigate("/")}
                aria-label="Back to home"
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
                    transition: "transform 0.3s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
                <span
                    className="flex h-[50px] w-[50px] items-center justify-center rounded-full"
                    style={{ backgroundColor: RED }}
                >
                    <ArrowLeft aria-hidden="true" className="h-6 w-6 text-white" strokeWidth={2.5} />
                </span>
            </button>
        </div>
    );
}
