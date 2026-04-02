import React, { useEffect, useState } from 'react';

const SuccessNotification = ({ message, onCountdownComplete, isVisible }) => {
    const [countdown, setCountdown] = useState(3);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (!isVisible) return;

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onCountdownComplete();
                    return 0;
                }
                return prev - 1;
            });
            
            setProgress((prev) => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - (100 / 3);
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isVisible, onCountdownComplete]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-500 scale-100 animate-bounce-in">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                        <svg className="w-12 h-12 text-green-500 animate-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* Success Message */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Successful!</h2>
                    <p className="text-gray-600">{message}</p>
                </div>

                {/* Countdown Display */}
                <div className="mb-4">
                    <div className="flex justify-center items-center space-x-2">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl animate-pulse">
                            {countdown}
                        </div>
                        <span className="text-gray-600 font-medium">seconds to redirect</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Redirect Info */}
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">Redirecting to your dashboard...</p>
                </div>
            </div>
        </div>
    );
};

export default SuccessNotification;
