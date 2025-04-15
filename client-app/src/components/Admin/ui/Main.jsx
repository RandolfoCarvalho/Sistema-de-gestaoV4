const Main = ({ children }) => {
    return (
        <div className="w-full mx-auto text-gray-500 bg-gray-100 p-2 
        sm:ml-0 flex gap-4 flex-col lg:flex-row flex-grow transition-all
        duration-300 mt-14 dark:bg-gray-800">
            {children}
        </div>
    );
};
export default Main;
