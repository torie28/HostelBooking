import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
            {/* Background tattoo-style patterns */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full"></div>
                <div className="absolute bottom-20 right-20 w-24 h-24 border-4 border-white rotate-45"></div>
                <div className="absolute top-1/3 right-1/4 w-16 h-16 border-4 border-white"></div>
            </div>

            <div className="text-center z-10 px-4">
                {/* Tattoo Image */}
                <div className="mb-8 flex justify-center">
                    <img
                        src="/Tattoo idea #tattooidea #overthinktattooidea #overthinktattoo.jpg"
                        alt="404 Tattoo Art"
                        className="w-64 h-64 object-contain filter drop-shadow-2xl"
                    />
                </div>

                {/* 404 Text with tattoo-style font */}
                <h1 className="text-8xl font-bold text-white mb-4 tracking-wider"
                    style={{
                        fontFamily: 'serif',
                        textShadow: '3px 3px 6px rgba(0,0,0,0.7), -1px -1px 2px rgba(255,255,255,0.1)',
                        letterSpacing: '0.2em'
                    }}>
                    404
                </h1>

                {/* Error message */}
                <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
                    Lost in the ink? This page has vanished into the shadows.
                </p>

                {/* Navigation buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="px-8 py-3 bg-white text-black font-semibold rounded-lg border-2 border-white hover:bg-transparent hover:text-white transition-all duration-300 transform hover:scale-105"
                    >
                        Return Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="px-8 py-3 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-black transition-all duration-300 transform hover:scale-105"
                    >
                        Go Back
                    </button>
                </div>

                {/* Decorative tattoo-style elements */}
                <div className="mt-12 flex justify-center space-x-8">
                    <div className="w-12 h-12 border-2 border-gray-600 rotate-45"></div>
                    <div className="w-8 h-8 border-2 border-gray-600 rounded-full"></div>
                    <div className="w-12 h-12 border-2 border-gray-600 rotate-45"></div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
