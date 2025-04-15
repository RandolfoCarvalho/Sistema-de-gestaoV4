import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TrendsChart = ({ data }) => {
    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="pedidos"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ fill: '#2563eb' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
