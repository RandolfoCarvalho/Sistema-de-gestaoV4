import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';


const MetricsCard = ({ icon: Icon, title, value, trend, description }) => (
    <Card className="bg-white">
        <CardContent className="p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-50">
                        <Icon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                    </div>
                </div>
                {trend && (
                    <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${trend >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {trend >= 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            {description && (
                <p className="mt-2 text-sm text-gray-500">{description}</p>
            )}
        </CardContent>
    </Card>
);

export default MetricsCard;