import React, { useState } from "react";

interface SliderProps {
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (values: number) => void;
  onValueChange?: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  className = "",
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = 0,
  onChange,
  onValueChange,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState<number>(value ?? defaultValue);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setInternalValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
    
    if (onValueChange) {
      onValueChange(newValue);
    }
  };
  
  // Update internal value when prop changes
  React.useEffect(() => {
    if (value !== undefined && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value]);

  return (
    <div className={`w-full ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value !== undefined ? value : internalValue}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        {...props}
      />
    </div>
  );
};
