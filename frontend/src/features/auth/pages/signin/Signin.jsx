import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function Signin() {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Show success message if redirected from registration
    React.useEffect(() => {
        if (location.state?.message) {
            // You could show a toast or alert here
            console.log('Registration successful:', location.state.message);
        }
    }, [location]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username or admission number is required';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const responseData = await response.json();

            if (response.ok && responseData.success) {
                // Store token in localStorage
                localStorage.setItem('auth_token', responseData.token);
                localStorage.setItem('user', JSON.stringify(responseData.user));

                alert('Login successful! Redirecting to dashboard...');

                // Redirect to the intended page or default to studentdashboard
                const from = location.state?.from?.pathname || '/studentdashboard';
                navigate(from, { replace: true });
            } else {
                setErrors({
                    submit: responseData.message || 'Login failed'
                });
            }

        } catch (error) {
            console.error('Login error:', error);
            setErrors({ submit: 'Login failed. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl">
                {/* Main Content with Left Image and Right Form */}
                <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
                    {/* Left Side Illustration */}
                    <div className="flex-1 hidden lg:block">
                        <img
                            src="/images/login-page-illustration-svg-download-png-3783954.webp"
                            alt="Login Page Illustration"
                            className="w-full h-auto max-w-2xl rounded-lg"
                        />
                    </div>

                    {/* Right Side Login Form */}
                    <div className="flex-1">
                        <div className=" p-12 animate-fadeInScale max-w-2xl mx-auto">
                            {/* Header at top of right form */}
                            <div className="text-center mb-8 animate-fadeInUp w-3/4">
                                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                                    Welcome
                                </h1>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Username Field */}
                                <div>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className={`mx-auto w-3/4 py-3 px-4 border rounded-full  focus:border-transparent transition-all ${errors.username ? '' : 'border-black/60'
                                            }`}
                                        placeholder="Enter username or admission number"
                                        disabled={isLoading}
                                    />
                                    {errors.username && (
                                        <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                                    )}
                                </div>

                                {/* Password Field */}
                                <div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`mx-auto w-3/4 py-3 px-4 pr-10 border rounded-full focus:border-transparent transition-all ${errors.password ? '' : 'border-black/60'
                                                }`}
                                            placeholder="Enter your password"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.845-2.752m.149-3.202c.166-.36.285-.75.285-1.154 0-1.743-2.943-3.198-5.064-3.198-2.12 0-4.121.855-5.064 3.198" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                {/* Submit Error */}
                                {errors.submit && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                        {errors.submit}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`mx-auto w-3/4 py-3 px-4 rounded-full font-semibold text-white transition-all transform hover:scale-[1.02] ${isLoading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-600 shadow-lg hover:shadow-xl'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Signing In...
                                            </span>
                                        ) : (
                                            'Sign In'
                                        )}
                                    </button>
                                </div>

                                {/* Register Link */}
                                <div className="pt-4 border-t">
                                    <p className="text-gray-600 mx-auto w-3/4">
                                        Don't have an account?{' '}
                                        <button
                                            type="button"
                                            onClick={() => navigate('/signup')}
                                            className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                            disabled={isLoading}
                                        >
                                            Sign Up
                                        </button>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
