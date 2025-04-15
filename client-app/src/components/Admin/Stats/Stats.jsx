import Card from "./Card";
import { empolyeesData } from "../Constants";
import Balance from "./Balance";

const Stats = ({darkMode}) => {
  return (
    <div className="flex flex-col md:flex-row gap-5 
    p-4 // Added overall padding
    space-y-4 md:space-y-0 // Vertical spacing for mobile, removed for desktop
    md:space-x-4 // Horizontal spacing for desktop
    ">
      <div className="flex flex-col gap-4 h-full 
      w-full md:w-auto // Full width on mobile, auto on desktop
      ">
        {empolyeesData.map((data, index) => (
          <Card key={index} data={data} />
        ))}
      </div>
      <Balance darkMode={darkMode}/>
    </div>
  );
};

export default Stats;