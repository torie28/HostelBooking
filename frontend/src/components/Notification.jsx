import React, { useEffect, useState } from 'react';

const Notification = ({ message, type = 'info', duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation
        setIsVisible(true);
        
        // Auto close after duration
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Allow exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getStyles = () => {
        const baseStyles = "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 max-w-sm";
        
        const typeStyles = {
            info: "bg-blue-500 text-white",
            error: "bg-red-500 text-white",
            warning: "bg-yellow-500 text-black",
            success: "bg-green-500 text-white"
        };

        const animationStyles = isVisible 
            ? "translate-x-0 opacity-100" 
            : "translate-x-full opacity-0";

        return `${baseStyles} ${typeStyles[type]} ${animationStyles}`;
    };

    return (
        <div className={getStyles()}>
            <div className="flex items-center">
                <div className="flex-1">
                    <p className="font-medium">{message}</p>
                </div>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(onClose, 300);
                    }}
                    className="ml-4 text-white hover:text-gray-200 focus:outline-none"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Notification;
