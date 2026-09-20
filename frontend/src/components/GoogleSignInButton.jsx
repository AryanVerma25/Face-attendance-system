import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function GoogleSignInButton() {
    const buttonRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const initializeGoogle = () => {
            if (!window.google || !buttonRef.current) {
                return;
            }

            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

                callback: async (response) => {
                    try {
                        const result = await api.post("/auth/google", {
                            credential: response.credential
                        });

                        console.log("Google login successful:", result.data);

                        localStorage.setItem(
                            "token",
                            result.data.token
                        );

                        localStorage.setItem(
                            "user",
                            JSON.stringify(result.data.user)
                        );

                        navigate("/dashboard");

                    } catch (error) {
                        console.error(
                            "Google login failed:",
                            error.response?.data || error.message
                        );
                    }
                },
            });

            window.google.accounts.id.renderButton(
                buttonRef.current,
                {
                    theme: "outline",
                    size: "large",
                    width: 350,
                    text: "continue_with",
                }
            );
        };

        if (window.google) {
            initializeGoogle();
            return;
        }

        const script = document.createElement("script");

        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;

        script.onload = initializeGoogle;

        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [navigate]);

    return <div ref={buttonRef}></div>;
}

export default GoogleSignInButton;