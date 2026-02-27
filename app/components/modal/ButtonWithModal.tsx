"use client"
import React, { useState } from 'react'
import ModalContainer from './ModalContainer';
import { Briefcase, Eye, Pencil, Trash } from 'lucide-react';
import { InvestmentPlan } from '@/types';
import Button from '../ui/Button';

interface ButtonWithModalProps {
  content: React.ReactElement<{
    onModalClose?: () => void;
    onSuccess?: () => void;
    type?: "create" | "update";
    id?: string;
  }>;
  footer?: React.ReactNode;
  size?: string;
  otherIcon?: React.ReactNode;
  button?: boolean;
  title?: string;
  className?: string;
  type?: "create" | "delete" | "update" | "archive" | "view" | "upload" | "download" | "send" | "bill" | "other";
  variant?: string;
  onSuccess?: () => void;
}

const getColor = (type: string | undefined): string => {
  switch (type) {
    case "archive":
      return "text-gray-400 hover:text-gray-300";
    case "delete":
      return "text-red-400 hover:text-red-300";
    default:
      return "text-primary hover:text-blue-600";
  }
}

const getSize = (size: string | undefined): string => {
  switch (size) {
    case "xs":
      return "h-3 w-3";
    case "sm":
      return "h-4 w-4";
    case "lg":
      return "h-6 w-6";
    default:
      return "h-5 w-5";
  }
}

const getIcon = (type: string | undefined, size: string = "h-5 w-5"): React.ReactNode => {
  switch (type) {
    case "view":
      return <Eye className={size} />;
    case "delete":
      return <Trash className={size} />;
    case "archive":
      return <Briefcase className={size} />;
    case "update":
      return <Pencil className={size} />;
    default:
      return null;
  }
}

const ButtonWithModal = ({
  content,
  size,
  button,
  title,
  otherIcon,
  type = "create",
  footer,
  className,
  onSuccess,
  variant,
}: ButtonWithModalProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    setIsModalOpen(false);
  };

  const icon = otherIcon || getIcon(type, getSize(size));
  const color = getColor(type);
  const buttonSize = getSize(size);

  return (
    <div>
      {button ? (
        <Button
          onClick={() => setIsModalOpen(true)}
          className={className ? className : ""}
          variant={(variant as any) || "primary"}
          size={size as any}
          icon={icon}
          iconPosition="left"
        >
          {title || (type === 'create' ? 'Créer' : 'Modifier')}
        </Button>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className={`${buttonSize} flex items-center justify-center rounded-full ${color}`}
        >
          {icon}
        </button>
      )}

      <ModalContainer 
        isOpen={isModalOpen} 
        onClose={handleClose} 
        footer={footer}
      >
        {React.cloneElement(content, {
          onModalClose: handleClose,
          onSuccess: handleSuccess,
        })}
      </ModalContainer>
    </div>
  );
};

export default ButtonWithModal;