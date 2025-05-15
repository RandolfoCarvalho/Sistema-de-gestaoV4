import { Link } from 'react-router-dom';

const LinkItem = ({ href, icon: Icon, text, badge, isActive }) => {
    return (
        <li className="mb-1">
            <Link
                to={href}
                className={`
                    flex items-center py-2.5 px-4 text-sm font-medium rounded-lg
                    transition-all duration-200 ease-in-out
                    ${isActive 
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-800/60 dark:text-blue-200" 
                        : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }
                `}
            >
                {Icon && (
                    <span className={`mr-3 ${isActive ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"}`}>
                        <Icon size={20} />
                    </span>
                )}
                
                <span className="flex-1 font-medium"> {text} </span>
                
                {badge && (
                    <span className={`
                        inline-flex items-center justify-center h-5 min-w-5 px-1.5 ml-2 text-xs font-medium rounded-full
                        ${badge.color || "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-200"}
                    `}>
                        {badge.text}
                    </span>
                )}
            </Link>
        </li>
    );
};

export default LinkItem;