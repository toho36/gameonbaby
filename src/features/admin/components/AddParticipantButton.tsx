import { ButtonHTMLAttributes } from "react";
import { Button } from "~/shared/components/ui/button";

interface AddParticipantButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  isFirst?: boolean;
}

export default function AddParticipantButton({
  onClick,
  className = "",
  label = "Add Participant",
  isFirst = false,
  ...props
}: AddParticipantButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={`bg-green-600 text-white shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${className}`}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="mr-1 h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
      </svg>
      {isFirst ? "Add First Participant" : label}
    </Button>
  );
}
