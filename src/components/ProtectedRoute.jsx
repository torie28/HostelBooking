import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Notification from './Notification';

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    const [showNotification, setShowNotification] = useState(false);
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useEffect(() => {
        console.log('ProtectedRoute - Checking auth:', { token: !!token, user: !!user });

        if (!token || !user) {
            console.log('ProtectedRoute - No auth found, showing notification');
            // Show notification first
            setShowNotification(true);

            // Set redirect after a delay to allow user to see the notification
            const redirectTimer = setTimeout(() => {
                console.log('ProtectedRoute - Setting redirect');
                setShouldRedirect(true);
            }, 2000); // 2 second delay

            return () => clearTimeout(redirectTimer);
        } else {
            console.log('ProtectedRoute - Auth found, allowing access');
        }
    }, [token, user]);

    const handleNotificationClose = () => {
        setShowNotification(false);
    };

    if (!token || !user) {
        console.log('ProtectedRoute - Rendering redirect screen');
        if (shouldRedirect) {
            console.log('ProtectedRoute - Executing redirect to /');
            return <Navigate to="/" state={{ from: location }} replace />;
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirecting to login...</p>
                </div>
                {showNotification && (
                    <Notification
                        message="You need to login to access the dashboard"
                        type="warning"
                        onClose={handleNotificationClose}
                    />
                )}
            </div>
        );
    }

    console.log('ProtectedRoute - Allowing access to protected content');
    return children;
};

export default ProtectedRoute;
