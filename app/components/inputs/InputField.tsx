import { FC, ChangeEvent } from "react";
import { FieldError, UseFormRegister } from "react-hook-form";

interface InputFieldProps {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  register: UseFormRegister<any>; 
  error?: FieldError;
  height?: 'sm' | 'xs';
  min?: string | number;
  max?: string | number;
  step?: string;
  className?: boolean;
  disabled?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  transform?: (value: any) => any;
}

const InputField: FC<InputFieldProps> = ({
  id,
  name,
  type,
  label,
  placeholder,
  autoComplete,
  required,
  register,
  height = "xs",
  error,
  min,
  max,
  step,
  className,
  disabled,
  onChange,
  transform,
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (transform) {
      const transformedValue = transform(e.target.value);
      if (transformedValue !== e.target.value) {
        e.target.value = transformedValue;
      }
    }
    onChange?.(e);
  };

  const heightClass = height === 'xs'
    ? "px-3 py-2"
    : "px-4 py-3";
  
  const inputClass = `${heightClass} appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 bg-gray-700 text-white sm:text-sm`;

  return (
    <div className="w-full">
      <label className="block mb-2" htmlFor={id ? id : name}>
        <span className="font-medium text-gray-400">{label}</span>
        {required ? (
          <span className="text-red-500"> *</span>
        ) : (
          <span className="text-gray-500"> (optionnel)</span>
        )}
      </label>

      <div className="mt-1">
        <input
          id={id ? id : name}
          type={type}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          max={max !== undefined ? max : undefined}
          min={min !== undefined ? min : undefined}
          step={step}
          disabled={disabled}
          {...register(name, {
            valueAsNumber: type === "number",
            onChange: handleChange,
          })}
          className={inputClass}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error.message}</p>}
      </div>
    </div>
  );
};

export default InputField;