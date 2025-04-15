import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    FaClipboardList, FaCheckCircle, FaTimesCircle, FaCog,
    FaTruck, FaPlusCircle, FaDollarSign, FaBox, FaCalendarDay,
    FaChartLine, FaChartBar, FaChartPie, FaSync
} from 'react-icons/fa';

const FluidMetricsCard = ({ icon: Icon, title, value, trend, description }) => {
    const [wave1Offset, setWave1Offset] = useState(0);
    const [wave2Offset, setWave2Offset] = useState(0);

    // Animação das ondas
    useEffect(() => {
        const wave1Interval = setInterval(() => {
            setWave1Offset(prev => (prev + 1) % 100);
        }, 100);

        const wave2Interval = setInterval(() => {
            setWave2Offset(prev => (prev + 1.5) % 100);
        }, 100);

        return () => {
            clearInterval(wave1Interval);
            clearInterval(wave2Interval);
        };
    }, []);

    // Determinar cor base na tendência
    const trendColor = trend >= 0 ? '#10B981' : '#EF4444';
    const waveColor1 = trend >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)';
    const waveColor2 = trend >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';

    return (
        <div className="relative bg-white p-6 rounded-lg shadow-lg overflow-hidden">
            <div className="z-10 relative">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-gray-100 p-3 rounded-full">
                        <Icon size={28} className={trend >= 0 ? "text-green-500" : "text-red-500"} />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-gray-900">{value}</p>
                            <span
                                className={`text-sm font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}
                            >
                                {trend >= 0 ? `+${trend}%` : `${trend}%`}
                            </span>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-gray-500 mb-10">{description}</p>
            </div>

            {/* Wave SVG animations */}
            <div className="absolute bottom-0 left-0 w-full h-20 overflow-hidden">
                <svg
                    className="absolute bottom-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={waveColor1} stopOpacity="0.8" />
                            <stop offset="50%" stopColor={waveColor1} stopOpacity="0.6" />
                            <stop offset="100%" stopColor={waveColor1} stopOpacity="0.8" />
                        </linearGradient>
                    </defs>
                    {/* First wave */}
                    <path
                        fill="url(#waveGradient)"
                        d={`M0,64 C300,100 600,30 1200,64 L1200,120 L0,120 Z`}
                        style={{ transform: `translateX(-${wave1Offset}px)` }}
                    />

                    {/* Second wave */}
                    <path
                        fill={waveColor2}
                        d={`M0,80 C400,40 800,100 1200,80 L1200,120 L0,120 Z`}
                        style={{ transform: `translateX(-${wave2Offset}px)` }}
                    />
                </svg>
            </div>

            {/* Animated dots/bubbles */}
            <div className={`absolute bottom-4 right-4 w-2 h-2 rounded-full bg-white opacity-70`}
                style={{ animation: 'bubble 3s infinite ease-in-out' }} />
            <div className={`absolute bottom-8 right-12 w-1.5 h-1.5 rounded-full bg-white opacity-60`}
                style={{ animation: 'bubble 2.5s infinite ease-in-out 0.5s' }} />
            <div className={`absolute bottom-6 right-20 w-1 h-1 rounded-full bg-white opacity-50`}
                style={{ animation: 'bubble 4s infinite ease-in-out 1s' }} />

            {/* CSS Animation for bubbles */}
            <style jsx>{`
        @keyframes bubble {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 0.7; }
          100% { transform: translateY(-40px); opacity: 0; }
        }
      `}</style>
        </div>
    );
};

export default FluidMetricsCard;

