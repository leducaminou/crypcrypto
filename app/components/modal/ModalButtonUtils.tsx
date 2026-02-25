

import { Briefcase, Eye, Pencil, Trash } from 'lucide-react';
import { InvestmentPlan } from '@/types';

export const getColor = (type: string | undefined): string => {
  switch (type) {
    case "archive":
      return "text-gray-400 hover:text-gray-300";
    case "delete":
      return "text-red-400 hover:text-red-300";
    default:
      return "text-primary hover:text-blue-600";
  }
}

export const getSize = (size: string | undefined): string => {
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

export const getIcon = (type: string | undefined, size: string = "h-5 w-5"): React.ReactNode => {
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
