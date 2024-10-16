import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface LoadingComponentProps {
  size?: "sm" | "md" | "lg";
  loadingText?: string;
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
  loadingText,
  showAdditionalInfo = true,
  additionalInfoText,
  primaryColor = "primary",
  accentColor = "accent",
  secondaryColor = "secondary",
  className = "",
  textAlignment = "center",
}) => {
  const { t } = useTranslation("common");
  const validatedSize: Size = size in sizeClasses ? size : "md";
  const selectedSizeClass = sizeClasses[validatedSize];
  const selectedTextSizeClass = textSizeClasses[validatedSize];
  const primaryBorderColor = `border-${primaryColor}`;
  const accentBorderColor = `border-${accentColor}`;
  const secondaryBorderColor = `border-${secondaryColor}`;
  const textColorClass = `text-${primaryColor}`;
  const alignmentClass = `text-${textAlignment}`;

  return (
    <div
      className={cn(
        "w-full bg-background flex flex-col items-center justify-center pt-16 overflow-hidden",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className={cn("relative", selectedSizeClass, "mb-8")}>
        <div
          className={cn(
            "absolute inset-0",
            primaryBorderColor,
            "border-4 rounded-full animate-ping-slow",
          )}
          aria-hidden="true"
        ></div>
        <div
          className={cn(
            "absolute inset-3",
            accentBorderColor,
            "border-4 rounded-full animate-ping-slower",
          )}
          style={{ animationDelay: "0.5s" }}
          aria-hidden="true"
        ></div>
        <div
          className={cn(
            "absolute inset-6",
            secondaryBorderColor,
            "border-4 rounded-full animate-ping-slowest",
          )}
          style={{ animationDelay: "1s" }}
          aria-hidden="true"
        ></div>
      </div>
      <div className="flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 space-y-4 max-w-xl">
        <h2
          className={cn(
            "font-serif font-bold drop-shadow-lg animate-scale",
            textColorClass,
            selectedTextSizeClass,
            alignmentClass,
          )}
        >
          {loadingText || t("loading")}
        </h2>
        {showAdditionalInfo && (
          <p
            className={cn(
              "text-muted-foreground text-sm lg:text-base max-w-md",
              alignmentClass,
            )}
          >
            {additionalInfoText || t("loadingAdditionalInfo")}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingComponent;
