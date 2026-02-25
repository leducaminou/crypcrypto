import React from "react";
import { FieldError, UseFormRegister } from "react-hook-form";

interface CryptoOption {
  code: string;
  name: string;
}

interface CryptoSelectFieldProps {
  name: string;
  label: string;
  options: CryptoOption[];
  register: UseFormRegister<any>;
  error?: FieldError;
  required?: boolean;
  placeholder?: string;
  valueKey?: string;
  textKey?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
}

const CryptoSelectField: React.FC<CryptoSelectFieldProps> = ({
  name,
  label,
  options = [],
  register,
  error,
  required = false,
  placeholder = "Select a cryptocurrency",
  valueKey = "code",
  textKey = "name",
  onChange,
  disabled = false,
}) => {
  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="block" htmlFor={name}>
        <span className="font-medium text-gray-400">{label}</span>
        {required ? (
          <span className="text-red-500"> *</span>
        ) : (
          <span className="text-gray-500"> (optional)</span>
        )}
      </label>

      <select
        {...register(name)}
        id={name}
        disabled={disabled}
        onChange={handleChange}
        className="px-3 py-2 appearance-none block w-full border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 bg-gray-700 text-white sm:text-sm"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option[valueKey as keyof CryptoOption] as string} value={option[valueKey as keyof CryptoOption] as string}>
            {option[textKey as keyof CryptoOption] as string}
          </option>
        ))}
      </select>

      {error?.message && (
        <p className="text-xs text-red-400">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default CryptoSelectField;