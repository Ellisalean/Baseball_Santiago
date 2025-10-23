
import React from 'react';

interface BaseballDiamondProps {
  bases: [boolean, boolean, boolean];
}

const Base: React.FC<{ isOccupied: boolean; label: string; position: string }> = ({ isOccupied, label, position }) => (
  <div className={`absolute w-10 h-10 md:w-16 md:h-16 transform -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-amber-800 bg-stone-200 flex items-center justify-center ${position}`}>
    <div className="transform -rotate-45 text-amber-900 font-bold text-xs md:text-base">
      {isOccupied && <div className="absolute w-6 h-6 md:w-10 md:h-10 rounded-full bg-blue-800 border-2 border-white -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />}
      {label}
    </div>
  </div>
);


const BaseballDiamond: React.FC<BaseballDiamondProps> = ({ bases }) => {
  const [first, second, third] = bases;

  return (
    <div className="relative w-64 h-64 md:w-96 md:h-96 mx-auto my-8">
      {/* Paths */}
      <div className="absolute top-1/2 left-1/2 w-[calc(50%-4px)] h-2 bg-stone-300 transform -translate-y-1/2 -translate-x-full"></div>
      <div className="absolute top-1/2 right-1/2 w-[calc(50%-4px)] h-2 bg-stone-300 transform -translate-y-1/2 translate-x-full"></div>
      <div className="absolute left-1/2 bottom-1/2 h-[calc(50%-4px)] w-2 bg-stone-300 transform -translate-x-1/2 translate-y-full"></div>
      <div className="absolute left-1/2 top-1/2 h-[calc(50%-4px)] w-2 bg-stone-300 transform -translate-x-1/2 -translate-y-full"></div>

      {/* Bases */}
      <Base isOccupied={false} label="Home" position="bottom-0 left-1/2" />
      <Base isOccupied={first} label="1ra" position="top-1/2 right-0" />
      <Base isOccupied={second} label="2da" position="top-0 left-1/2" />
      <Base isOccupied={third} label="3ra" position="top-1/2 left-0" />

      {/* Pitcher's mound */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-stone-300 rounded-full border-2 border-amber-800"></div>
    </div>
  );
};

export default BaseballDiamond;
