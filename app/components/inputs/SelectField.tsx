import React from "react";
import { FieldError } from "react-hook-form";

type SelectFieldProp = {
  full?: boolean;
  height?: 'sm' | 'xs';
  width?: string;
  options: any[];
  label?: string;
  register?: any;
  id?: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  description?: string;
  error?: FieldError;
  inputProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
  required?: boolean;
  disabled?: boolean;
  subtable?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  valueKey?: string;
  textKey?: string;
};

const SelectField = ({
  options = [],
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
  subtable,
  placeholder,
  width,
  onChange,
  valueKey = "id",
  textKey = "title",
}: SelectFieldProp) => {
  const divClass = full
    ? "flex flex-col gap-2 w-full"
    : width
    ? `${width} flex flex-col gap-2`
    : "flex flex-col gap-2 w-full";
  
  const heightClass = height === 'xs'
    ? "px-3 py-2"
    : "px-4 py-3";
  
  const inputClass = `${heightClass} appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 bg-gray-700 text-white sm:text-sm`;

  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className={divClass}>
      <label className="block" htmlFor={id ? id : name}>
        <span className="font-medium text-gray-400">{label}</span>
        {required ? (
          <span className="text-red-500"> *</span>
        ) : (
          <span className="text-gray-500"> (optionnel)</span>
        )}
      </label>

      <select
        {...(register ? register(name) : {})}
        {...inputProps}
        defaultValue={defaultValue || ''}
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
        
        {subtable ? (
          options.map((i: any) => (
            <option 
              key={i.subtable?.[valueKey]} 
              value={i.subtable?.[valueKey] || ''}
            >
              {i.subtable?.[textKey]}
            </option>
          ))
        ) : (
          options.map((i: any) => (
            <option 
              key={i[valueKey]} 
              value={i[valueKey] || ''}
            >
              {i[textKey]}
            </option>
          ))
        )}
      </select>

      {description && <p className="text-xs text-light font-medium">{description}</p>}
      {error?.message && (
        <p className="text-xs text-red-400">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default SelectField;