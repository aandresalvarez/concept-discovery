import React, { useState, useMemo, KeyboardEvent } from "react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "../lib/utils";

interface Step {
  id?: string | number;
  title: string;
  description?: string;
  content: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  initialStep?: number;
  onStepChange?: (currentStep: number) => void;
  onFinish?: (currentStep: number) => void;
  activeColor?: string;
  inactiveColor?: string;
  className?: string;
}

const Stepper: React.FC<StepperProps> = ({
  steps,
  initialStep = 0,
  onStepChange = () => {},
  onFinish = () => {},
  activeColor = "bg-blue-500",
  inactiveColor = "bg-gray-300",
  className = "",
}) => {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onFinish(currentStep);
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange(nextStep);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange(prevStep);
    }
  };

  const handleStepClick = (index: number) => {
    if (index <= currentStep + 1) {
      setCurrentStep(index);
      onStepChange(index);
    }
  };

  const renderSteps = useMemo(() => {
    return steps.map((step, index) => {
      const isCompleted = index < currentStep;
      const isActive = index === currentStep;

      return (
        <div
          key={step.id ?? index}
          className="flex-1 flex flex-col items-center relative"
        >
          {/* Step Indicator */}
          <button
            type="button"
            onClick={() => handleStepClick(index)}
            className={cn(
              "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2",
              isCompleted || isActive ? activeColor : inactiveColor,
              "hover:ring-2 hover:ring-offset-2 hover:ring-blue-500",
            )}
            aria-current={isActive ? "step" : undefined}
            aria-label={`Step ${index + 1}: ${step.title}`}
            tabIndex={0}
            onKeyPress={(e: KeyboardEvent<HTMLButtonElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                handleStepClick(index);
              }
            }}
          >
            {isCompleted ? <Check size={12} /> : index + 1}
          </button>

          {/* Step Title */}
          <div className="mt-1 text-xs sm:text-sm font-medium">
            {step.title}
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="absolute top-3 sm:top-4 left-1/2 w-full h-0.5 bg-gray-200">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  isCompleted ? activeColor : "bg-gray-200",
                )}
                style={{ width: isCompleted ? "100%" : "0%" }}
              ></div>
            </div>
          )}
        </div>
      );
    });
  }, [steps, currentStep, activeColor, inactiveColor, handleStepClick]);

  return (
    <div
      className={cn("w-full", className)}
      role="navigation"
      aria-label="Step Progress"
    >
      {/* Step Indicators */}
      <div className="mb-4 sm:mb-8">
        <div className="flex items-center justify-between">{renderSteps}</div>
      </div>

      {/* Step Content */}
      <div className="mb-4 sm:mb-8">
        <h2 className={cn("text-lg sm:text-2xl font-bold mb-2 sm:mb-4")}>
          {steps[currentStep].title}
        </h2>
        <div className={cn("border p-2 sm:p-4 rounded-lg")}>
          {steps[currentStep].content}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={handleBack}
          disabled={isFirstStep}
          variant="outline"
          className={cn(
            "flex items-center text-xs sm:text-sm",
            isFirstStep && "opacity-50 cursor-not-allowed",
          )}
        >
          <ChevronLeft className={cn("mr-1 sm:mr-2")} size={16} />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentStep >= steps.length}
          className={cn(
            "flex items-center text-xs sm:text-sm",
            currentStep >= steps.length && "opacity-50 cursor-not-allowed",
          )}
        >
          {isLastStep ? "Finish" : "Next"}
          <ChevronRight className={cn("ml-1 sm:ml-2")} size={16} />
        </Button>
      </div>
    </div>
  );
};

export default Stepper;
