import { useState, useEffect, useRef } from 'react';

export const useHeaderVisibility = () => {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const headerRef = useRef(null);

    const handleActivateSearch = () => setIsSearchActive(true);
    const handleDeactivateSearch = () => setIsSearchActive(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Se o header existe e o clique foi fora dele
            if (headerRef.current && !headerRef.current.contains(event.target)) {
                if (isSearchActive) {
                    handleDeactivateSearch();
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isSearchActive]); // Dependência é crucial

    return {
        headerRef,
        isSearchActive,
        handleActivateSearch,
        handleDeactivateSearch,
    };
};