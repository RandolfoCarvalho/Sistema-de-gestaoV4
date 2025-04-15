import { useState, useEffect } from "react";

const BackToTopButton = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            setVisible(window.scrollY > 300);
        };
        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    return (
        visible && (
            <button
                className="fixed bottom-5 right-5 bg-blue-600 text-white px-3 py-2 rounded-full shadow-md"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
                ↑
            </button>
        )
    );
};

export default BackToTopButton;
