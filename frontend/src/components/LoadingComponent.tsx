import React from "react";
import { cn } from "@/lib/utils";

interface LoadingComponentProps {
  size?: "sm" | "md" | "lg";
  loadingText: string;
  showAdditionalInfo?: boolean;
  additionalInfoText?: string;
  primaryColor?: string;
  accentColor?: string;
  secondaryColor?: string;
  className?: string;
  textAlignment?: "center" | "left" | "right";
}

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "w-20 h-20",
  md: "w-28 h-28",
  lg: "w-36 h-36",
};

const textSizeClasses: Record<Size, string> = {
  sm: "text-base sm:text-lg",
  md: "text-lg sm:text-xl md:text-2xl",
  lg: "text-xl sm:text-2xl md:text-3xl",
};

const LoadingComponent: React.FC<LoadingComponentProps> = ({
  size = "md",
  loadingText,
  showAdditionalInfo = true,
  additionalInfoText,
  primaryColor = "primary",
  accentColor = "accent",
  secondaryColor = "secondary",
  className = "",
  textAlignment = "center",
}) => {
  const validatedSize: Size = size in sizeClasses ? size : "md";
  const selectedSizeClass = sizeClasses[validatedSize];
  const selectedTextSizeClass = textSizeClasses[validatedSize];

  return (
    <div
      className={cn(
        "w-full bg-background flex flex-col items-center justify-center py-16 px-4 overflow-visible",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className={cn("relative", selectedSizeClass, "mb-12")}>
        <div
          className={cn(
            "absolute inset-0 border-4 rounded-full animate-ping-slow",
            `border-${primaryColor}`,
          )}
          aria-hidden="true"
        ></div>
        <div
          className={cn(
            "absolute inset-3 border-4 rounded-full animate-ping-slower",
            `border-${accentColor}`,
          )}
          style={{ animationDelay: "0.5s" }}
          aria-hidden="true"
        ></div>
        <div
          className={cn(
            "absolute inset-6 border-4 rounded-full animate-ping-slowest",
            `border-${secondaryColor}`,
          )}
          style={{ animationDelay: "1s" }}
          aria-hidden="true"
        ></div>
      </div>
      <div className={cn("text-center space-y-3", `text-${textAlignment}`)}>
        <h2
          className={cn(
            "font-serif font-bold drop-shadow-md",
            `text-${primaryColor}`,
            selectedTextSizeClass,
          )}
        >
          {loadingText}
        </h2>
        {showAdditionalInfo && additionalInfoText && (
          <p className={cn("text-muted-foreground text-sm max-w-md")}>
            {additionalInfoText}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingComponent;
