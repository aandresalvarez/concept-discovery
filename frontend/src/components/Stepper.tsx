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

  const renderStepIndicators = useMemo(() => {
    return steps.map((step, index) => {
      const isCompleted = index < currentStep;
      const isActive = index === currentStep;

      return (
        <React.Fragment key={`step-${index}`}>
          {/* Step Indicator */}
          <button
            type="button"
            onClick={() => handleStepClick(index)}
            className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2",
              isCompleted || isActive ? activeColor : inactiveColor,
              "hover:ring-2 hover:ring-offset-2 hover:ring-blue-500",
              "z-10",
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
            {isCompleted ? <Check size={16} /> : index + 1}
          </button>

          {/* Connector Line (except after the last step) */}
          {index < steps.length - 1 && (
            <div
              key={`connector-${index}`}
              className={cn(
                "flex-grow h-1 sm:h-1.5",
                isCompleted ? activeColor : "bg-gray-200",
              )}
            ></div>
          )}
        </React.Fragment>
      );
    });
  }, [steps, currentStep, activeColor, inactiveColor, handleStepClick]);

  const renderStepTitles = useMemo(() => {
    return steps.map((step, index) => (
      <div
        key={`title-${index}`}
        className="text-xs sm:text-sm text-center w-8 sm:w-10 mt-2"
      >
        {step.title}
      </div>
    ));
  }, [steps]);

  return (
    <div
      className={cn("w-full", className)}
      role="navigation"
      aria-label="Step Progress"
    >
      {/* Step Indicators and Connectors */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-between w-full">
          {renderStepIndicators}
        </div>
        {/* Step Titles */}
        <div className="flex items-center justify-between w-full mt-2">
          {renderStepTitles}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-6 sm:mb-8 px-4">
        <h2
          className={cn(
            "text-lg sm:text-2xl font-bold mb-2 sm:mb-4 text-center",
          )}
        >
          {steps[currentStep].title}
        </h2>
        <div className={cn("border p-4 sm:p-6 rounded-lg")}>
          {steps[currentStep].content}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between px-4">
        <Button
          onClick={handleBack}
          disabled={isFirstStep}
          variant="outline"
          className={cn(
            "flex items-center text-xs sm:text-sm",
            isFirstStep ? "opacity-50 cursor-not-allowed" : "",
          )}
        >
          <ChevronLeft className="mr-1 sm:mr-2" size={16} />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLastStep && currentStep === steps.length - 1}
          className={cn(
            "flex items-center text-xs sm:text-sm",
            isLastStep && currentStep === steps.length - 1
              ? "opacity-50 cursor-not-allowed"
              : "",
          )}
        >
          {isLastStep ? "Finish" : "Next"}
          <ChevronRight className="ml-1 sm:ml-2" size={16} />
        </Button>
      </div>
    </div>
  );
};

export default Stepper;
