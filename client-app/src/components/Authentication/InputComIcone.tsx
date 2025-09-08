import * as React from "react";
interface InputComIconeProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: React.ReactElement<{ className?: string }>;
}

const InputComIcone = React.forwardRef<HTMLInputElement, InputComIconeProps>(
  ({ id, label, icon, ...props }, ref) => {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900">
          {label}
        </label>
        <div className="mt-2 relative rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {React.cloneElement(icon, {
              className: "h-5 w-5 text-gray-400",
            })}
          </div>
          <input
            id={id}
            ref={ref}
            className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all duration-150"
            {...props}
          />
        </div>
      </div>
    );
  }
);

InputComIcone.displayName = "InputComIcone";

export default InputComIcone;