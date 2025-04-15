export const CardHeader = ({ children }) => (
    <div className="card-header">{children}</div>
);

export const CardTitle = ({ title }) => (
    <h2 className="card-title">{title}</h2>
);

export const CardContent = ({ children }) => (
    <div className="card-content">{children}</div>
);

const Card = ({ className, children, bgColor }) => {
    return (
        <div
            className={`rounded-lg shadow-md ${className}`}
            style={{ backgroundColor: bgColor || 'white' }}
        >
            {children}
        </div>
    );
};


export default Card;
