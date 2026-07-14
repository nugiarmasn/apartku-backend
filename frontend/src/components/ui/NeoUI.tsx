import type { ReactNode } from 'react';

export const NeoCard = ({ 
  children, 
  className = "",
  onClick
}: { 
  children: ReactNode, 
  className?: string,
  onClick?: () => void
}) => (
  <div 
    className={`bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export const NeoButton = ({ children, onClick, variant = "gold", className = "", disabled }: any) => {
  const styles = {
    gold: "bg-[#F5A623] text-black hover:bg-[#FFB84D]",
    navy: "bg-[#0F1F3D] text-white hover:bg-[#1A2B4D]",
    white: "bg-white text-black hover:bg-gray-100",
  };
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`border-[4px] border-black px-8 py-3 font-[900] uppercase italic tracking-tighter shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant as keyof typeof styles]} ${className}`}
    >
      {children}
    </button>
  );
};

export const NeoInput = (props: any) => (
  <div className="flex flex-col mb-4">
    {props.label && (
      <label className="font-[900] uppercase text-[10px] mb-1 tracking-widest text-[#0F1F3D] italic">
        {props.label}
      </label>
    )}
    <input 
      {...props}
      className={`w-full border-[4px] border-black p-3 font-bold text-black bg-white focus:outline-none focus:bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-gray-300 ${props.className || ''}`}
    />
  </div>
);