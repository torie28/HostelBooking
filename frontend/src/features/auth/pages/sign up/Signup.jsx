import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        admissionNumber: '',
        level: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [levels, setLevels] = useState([]);
    const [levelsLoading, setLevelsLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        fetchLevels();
    }, []);

    const fetchLevels = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/levels');
            if (response.ok) {
                const data = await response.json();
                setLevels(data);
            } else {
                console.error('Failed to fetch levels');
                // Fallback to hardcoded levels if API fails
                setLevels([
                    'Level 1',
                    'Level 2',
                    'Level 3',
                    'Level 4',
                    'Level 5',
                    'Level 6',
                    'Level 7-1',
                    'Level 7-2',
                    'Level 8'
                ]);
            }
        } catch (error) {
            console.error('Error fetching levels:', error);
            // Fallback to hardcoded levels if API fails
            setLevels([
                'Level 1',
                'Level 2',
                'Level 3',
                'Level 4',
                'Level 5',
                'Level 6',
                'Level 7-1',
                'Level 7-2',
                'Level 8'
            ]);
        } finally {
            setLevelsLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required';
        }

        if (!formData.admissionNumber.trim()) {
            newErrors.admissionNumber = 'Admission number is required';
        }

        if (!formData.level) {
            newErrors.level = 'Academic level is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Phone number is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const hashPassword = async (password) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
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
            const submissionData = {
                name: formData.name,
                email: formData.email,
                admission_number: formData.admissionNumber,
                level_id: formData.level,
                phone_number: formData.phoneNumber,
                password: formData.password,
                password_confirmation: formData.confirmPassword
            };

            console.log('Submitting registration data:', submissionData);

            const response = await fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(submissionData),
            });

            const responseData = await response.json();

            if (response.ok && responseData.success) {
                navigate('/signin', { state: { message: 'Registration successful! Please sign in with your credentials.' } });
            } else {
                setErrors({
                    submit: responseData.message || 'Registration failed',
                    ...responseData.errors
                });
            }

        } catch (error) {
            console.error('Registration error:', error);
            setErrors({ submit: 'Registration failed. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl">
                {/* Main Content with Left Image and Right Form */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Left Side Illustration */}
                    <div className="flex-1 hidden lg:block">
                        <img
                            src="/src/assets/image/login-page-illustration-svg-download-png-3783954.webp"
                            alt="Login Page Illustration"
                            className="w-full h-auto max-w-2xl rounded-lg"
                        />
                    </div>

                    {/* Right Side Registration Form */}
                    <div className="flex-1">
                        <div className=" rounded-full  p-12 animate-fadeInScale max-w-2xl mx-auto border border-white/30">
                            {/* Header at top of right form */}
                            <div className="text-center mb-8 animate-fadeInUp">
                                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                                    Welcome to hostel booking
                                </h1>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Personal Information Section */}
                                <div className="space-y-4">
                                    <div>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-full focus:border-transparent transition-all ${errors.name ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter your full name"
                                            disabled={isLoading}
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Admission Number */}
                                    <div>
                                        <input
                                            type="text"
                                            id="admissionNumber"
                                            name="admissionNumber"
                                            value={formData.admissionNumber}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-full  focus:border-transparent transition-all ${errors.admissionNumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="Enter your admission number"
                                            disabled={isLoading}
                                        />
                                        {errors.admissionNumber && (
                                            <p className="mt-1 text-sm text-red-600">{errors.admissionNumber}</p>
                                        )}
                                    </div>

                                    {/* Academic Level */}
                                    <div>
                                        <select
                                            id="level"
                                            name="level"
                                            value={formData.level}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-full  focus:border-transparent transition-all ${errors.level ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            disabled={isLoading || levelsLoading}
                                        >
                                            <option value="">
                                                {levelsLoading ? 'Loading levels...' : 'Select your level'}
                                            </option>
                                            {levels.map(level => (
                                                <option key={level.id || level} value={level.id || level}>
                                                    {level.name || level}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.level && (
                                            <p className="mt-1 text-sm text-red-600">{errors.level}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Information Section */}
                                <div className="space-y-4">

                                    {/* Email */}
                                    <div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-full focus:border-transparent transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="email address"
                                            disabled={isLoading}
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <input
                                            type="tel"
                                            id="phoneNumber"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 border rounded-full  focus:border-transparent transition-all ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="phone number"
                                            disabled={isLoading}
                                        />
                                        {errors.phoneNumber && (
                                            <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Security Section */}
                                <div className="space-y-4">
                                    {/* Password */}
                                    <div>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-2 pr-10 border rounded-full focus:border-transparent transition-all ${errors.password ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Create a strong password"
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
                                        <p className="mt-1 text-xs text-gray-500">
                                            Must be at least 8 characters with uppercase, lowercase, and numbers
                                        </p>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-2 pr-10 border rounded-full  focus:border-transparent transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                placeholder="Re-enter your password"
                                                disabled={isLoading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                disabled={isLoading}
                                            >
                                                {showConfirmPassword ? (
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
                                        {errors.confirmPassword && (
                                            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Submit Error */}
                                {errors.submit && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                        {errors.submit}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="pt-4 flex justify-center">
                                    <button
                                        type="submit"
                                        className={`mx-auto w-3/4 py-3 px-4 rounded-full font-semibold text-white transition-all transform hover:scale-[1.02] ${isLoading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                                            }`}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                                    </button>
                                </div>

                                {/* Login Link */}
                                <div className="text-center pt-4 border-t">
                                    <p className="text-gray-600">
                                        Already have an account?{' '}
                                        <button
                                            type="button"
                                            onClick={() => navigate('/')}
                                            className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                            disabled={isLoading}
                                        >
                                            Sign In
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

export default Signup;