import { ButtonHTMLAttributes } from "react";
import { Button } from "~/components/ui/button";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isProcessing?: boolean;
  size?: "sm" | "default" | "lg";
}

export function EditButton({
  onClick,
  className = "",
  isProcessing = false,
  size = "default",
  disabled = false,
  ...props
}: ActionButtonProps) {
  const sizeClass = size === "sm" ? "px-2 py-1 text-xs" : "px-4 py-2";

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className={`bg-blue-600 text-white hover:bg-blue-700 ${sizeClass} ${className}`}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`mr-1 ${size === "sm" ? "h-3 w-3" : "h-4 w-4"}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
      {isProcessing ? "..." : "Edit"}
    </Button>
  );
}

export function DeleteButton({
  onClick,
  className = "",
  isProcessing = false,
  size = "default",
  disabled = false,
  ...props
}: ActionButtonProps) {
  const sizeClass = size === "sm" ? "px-2 py-1 text-xs" : "px-4 py-2";

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className={`bg-red-600 text-white hover:bg-red-700 ${sizeClass} ${className}`}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`mr-1 ${size === "sm" ? "h-3 w-3" : "h-4 w-4"}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {isProcessing ? "..." : "Delete"}
    </Button>
  );
}

export function DuplicateButton({
  onClick,
  className = "",
  isProcessing = false,
  size = "default",
  disabled = false,
  ...props
}: ActionButtonProps) {
  const sizeClass = size === "sm" ? "px-2 py-1 text-xs" : "px-4 py-2";

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className={`bg-purple-600 text-white hover:bg-purple-700 ${sizeClass} ${className}`}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`mr-1 ${size === "sm" ? "h-3 w-3" : "h-4 w-4"}`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
        <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
      </svg>
      {isProcessing ? "..." : "Duplicate"}
    </Button>
  );
}
