// LoadingComponent.tsx
import React from "react";

interface LoadingComponentProps {
  size?: "sm" | "md" | "lg";
  loadingText?: string;
  showAdditionalInfo?: boolean;
  additionalInfoText?: string;
  primaryColor?: string;
  accentColor?: string;
  secondaryColor?: string;
  className?: string; // Allows custom styling from parent components
  textAlignment?: "center" | "left" | "right"; // Controls text alignment
}

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

const textSizeClasses: Record<Size, string> = {
  sm: "text-base sm:text-lg md:text-xl",
  md: "text-lg sm:text-xl md:text-2xl lg:text-3xl",
  lg: "text-xl sm:text-2xl md:text-3xl lg:text-4xl",
};

const LoadingComponent: React.FC<LoadingComponentProps> = ({
  size = "md",
  loadingText = "Cargando...",
  showAdditionalInfo = true,
  additionalInfoText = "Por favor, espere mientras preparamos su contenido",
  primaryColor = "primary",
  accentColor = "accent",
  secondaryColor = "secondary",
  className = "",
  textAlignment = "center",
}) => {
  // Ensure the size is one of the defined sizes
  const validatedSize: Size = size in sizeClasses ? size : "md";
  const selectedSizeClass = sizeClasses[validatedSize];
  const selectedTextSizeClass = textSizeClasses[validatedSize];

  // Construct color classes
  const primaryBorderColor = `border-${primaryColor}`;
  const accentBorderColor = `border-${accentColor}`;
  const secondaryBorderColor = `border-${secondaryColor}`;
  const textColorClass = `text-${primaryColor}`;

  // Text alignment class
  const alignmentClass = `text-${textAlignment}`;

  return (
    <div
      className={`w-full bg-background flex items-start justify-center pt-16 overflow-hidden ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 space-y-4 max-w-xl">
        {/* Custom Loading Animation */}
        <div className={`relative ${selectedSizeClass}`}>
          <div
            className={`absolute inset-0 ${primaryBorderColor} border-4 rounded-full animate-ping-slow`}
            aria-hidden="true"
          ></div>
          <div
            className={`absolute inset-3 ${accentBorderColor} border-4 rounded-full animate-ping-slower`}
            style={{ animationDelay: "0.5s" }}
            aria-hidden="true"
          ></div>
          <div
            className={`absolute inset-6 ${secondaryBorderColor} border-4 rounded-full animate-ping-slowest`}
            style={{ animationDelay: "1s" }}
            aria-hidden="true"
          ></div>
        </div>
        {/* Loading Text */}
        <h2
          className={`font-serif font-bold ${textColorClass} drop-shadow-lg ${selectedTextSizeClass} animate-scale ${alignmentClass}`}
        >
          {loadingText}
        </h2>
        {/* Additional Info */}
        {showAdditionalInfo && (
          <p
            className={`text-muted-foreground ${alignmentClass} text-sm lg:text-base max-w-md`}
          >
            {additionalInfoText}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingComponent;
