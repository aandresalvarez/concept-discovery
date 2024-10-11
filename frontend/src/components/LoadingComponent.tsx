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
}

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

const textSizeClasses: Record<Size, string> = {
  sm: "text-xl sm:text-2xl md:text-3xl",
  md: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl",
  lg: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl",
};

const LoadingComponent: React.FC<LoadingComponentProps> = ({
  size = "md",
  loadingText = "Cargando...",
  showAdditionalInfo = true,
  additionalInfoText = "Por favor, espere mientras preparamos su contenido",
  primaryColor = "border-primary",
  accentColor = "border-accent",
  secondaryColor = "border-secondary",
}) => {
  // Ensure the size is one of the defined sizes
  const validatedSize: Size = size in sizeClasses ? size : "md";
  const selectedSizeClass = sizeClasses[validatedSize];
  const selectedTextSizeClass = textSizeClasses[validatedSize];

  return (
    <div
      className="relative min-h-screen w-full bg-background flex items-center justify-center overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8">
        {/* Custom Loading Animation */}
        <div className={`relative mb-8 ${selectedSizeClass}`}>
          <div
            className={`absolute inset-0 ${primaryColor} border-4 rounded-full animate-ping-slow`}
            aria-hidden="true"
          ></div>
          <div
            className={`absolute inset-3 ${accentColor} border-4 rounded-full animate-ping-slower`}
            style={{ animationDelay: "0.5s" }}
            aria-hidden="true"
          ></div>
          <div
            className={`absolute inset-6 ${secondaryColor} border-4 rounded-full animate-ping-slowest`}
            style={{ animationDelay: "1s" }}
            aria-hidden="true"
          ></div>
        </div>
        {/* Loading Text */}
        <div className="text-center">
          <h2
            className={`font-serif font-bold text-primary foreground drop-shadow-lg ${selectedTextSizeClass} animate-scale`}
          >
            {loadingText}
          </h2>
        </div>
        {/* Additional Info */}
        {showAdditionalInfo && (
          <div className="mt-4 text-muted-foreground text-center hidden md:block">
            <p className="text-sm lg:text-base">{additionalInfoText}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingComponent;
