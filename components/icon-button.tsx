import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

// The app's one icon-only button. Two sizes only: the standard control size,
// and a larger one for the mobile header's menu button.
const sizes = {
  md: { box: "size-8", icon: "size-4" },
  lg: { box: "size-10", icon: "size-6" },
};

const tones = {
  neutral: "hover:text-foreground",
  danger: "hover:text-danger",
};

export function IconButton({
  icon: Icon,
  label,
  tone = "neutral",
  size = "md",
  className = "",
  type = "button",
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  icon: LucideIcon;
  label: string;
  tone?: keyof typeof tones;
  size?: keyof typeof sizes;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`flex ${sizes[size].box} shrink-0 items-center justify-center rounded-full text-detail transition duration-150 active:scale-95 ${tones[tone]} ${className}`}
      {...props}
    >
      <Icon className={sizes[size].icon} aria-hidden="true" />
    </button>
  );
}
