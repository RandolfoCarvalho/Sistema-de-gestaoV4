import React from "react";
import { ShareIcon } from "lucide-react";

const ShareButton = ({ currentStore }) => {
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: currentStore,
                url: window.location.href,
            }).catch(error => console.log("Erro ao compartilhar:", error));
        } else {
            navigator.clipboard.writeText(window.location.href)
                .then(() => alert("Link copiado para a área de transferência!"))
                .catch(err => console.error("Erro ao copiar link:", err));
        }
    };

    return (
        <button onClick={handleShare} className="p-2 hover:bg-blue-600 rounded-full">
            <ShareIcon className="w-5 h-5 text-white" />
        </button>
    );
};

export default ShareButton;
