// components/ModalContainer.tsx

import { X } from "lucide-react";
import Image from "next/image";
import React from "react";

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  classname?: string;
}

const ModalContainer: React.FC<ModalContainerProps> = ({
  isOpen,
  onClose,
  children,
  footer,
  classname,
}) => {
  if (!isOpen) return null;

  
  return (
    <div className="w-screen md:min-h-screen min-h-[170vh] absolute top-0 left-0 bg-black bg-opacity-60 z-50 flex 
    md:items-center justify-center pt-20 md:pt-0 " >
      <div
        className={
          classname
            ? `${classname} bg-gray-900  p-4 relative w-[90%]  h-fit rounded-lg`
            : "bg-gray-900  p-4 relative  h-fit rounded-lg w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] 2xl:w-[60%]"
        }
      >
        {children}

        <div
          className="absolute top-4 right-4 cursor-pointer"
          onClick={onClose}
        >
          
          <X  width={18} height={18} className="text-gray-500 hover:text-gray-300" />
        </div>
        {footer && footer}
      </div>
    </div>
  );
};

export default ModalContainer;
