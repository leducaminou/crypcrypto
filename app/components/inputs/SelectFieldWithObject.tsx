import React from "react";
import { FieldError } from "react-hook-form";

type SelectFieldWithObjectProp = {
  full?: boolean;
  height?: 'sm' | 'xs';
  width?: string;
  options: any[];
  label?: string;
  register: any;
  id?: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  description?: string;
  error?: FieldError;
  inputProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
  valueKey?: string;
  textKey?: string;
};

const SelectFieldWithObject = ({
  options,
  label,
  register,
  id,
  name,
  defaultValue,
  height = "xs",
  full,
  description,
  error,
  inputProps,
  required,
  disabled,
  placeholder,
  width,
  onChange,
  valueKey = "id",
  textKey = "title",
}: SelectFieldWithObjectProp) => {
  const divClass = full
    ? "flex flex-col gap-2 w-full"
    : width
    ? `${width} flex flex-col gap-2`
    : "flex flex-col gap-2 w-full md:w-1/4";
    
  const heightClass = height === 'xs'
    ? "px-3 py-2"
    : "px-4 py-3";
  
  const inputClass = `${heightClass} appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 bg-gray-700 text-white sm:text-sm`;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
    if (register && register.onChange) {
      register.onChange(e);
    }
  };

  return (
    <div className={divClass}>
      {label && (
        <label className="block" htmlFor={id ? id : name}>
          <span className="font-medium text-gray-400">{label}</span>
          {required ? (
            <span className="text-red-500"> *</span>
          ) : (
            <span className="text-gray-500"> (optionnel)</span>
          )}
        </label>
      )}

      <select
        {...register(name)}
        {...inputProps}
        defaultValue={defaultValue}
        id={id}
        disabled={disabled}
        onChange={handleChange}
        className={inputClass}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        
        {options.map((option) => (
          <option 
            key={option[valueKey]} 
            value={option[valueKey]}
          >
            {option[textKey]}
          </option>
        ))}
      </select>

      {description && <p className="text-xs text-light font-medium">{description}</p>}
      {error?.message && (
        <p className="text-xs text-red-400">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default SelectFieldWithObject;