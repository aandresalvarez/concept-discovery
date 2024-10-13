import React, { useState, useMemo, KeyboardEvent } from "react";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

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
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange(nextStep);
    } else {
      onFinish(currentStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange(prevStep);
    }
  };

  const handleStepClick = (index: number) => {
    if (index <= currentStep + 1) {
      // Allow navigation to next step if previous steps are completed
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
          className="flex-1 flex items-center relative"
        >
          {/* Step Indicator */}
          <button
            type="button"
            onClick={() => handleStepClick(index)}
            className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2",
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
            {isCompleted ? <Check size={20} /> : index + 1}
          </button>

          {/* Step Details */}
          <div className="ml-4">
            <div className="text-sm font-medium">{step.title}</div>
            {step.description && (
              <div className="text-xs text-gray-500">{step.description}</div>
            )}
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 bg-gray-200 mx-4 hidden sm:block">
              <div
                className={clsx(
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
  }, [steps, currentStep, activeColor, inactiveColor]);

  return (
    <div
      className={clsx("w-full max-w-4xl mx-auto p-4", className)}
      role="navigation"
      aria-label="Step Progress"
    >
      {/* Step Indicators */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center">
          {renderSteps}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{steps[currentStep].title}</h2>
        <div className="border p-4 rounded-lg">
          {steps[currentStep].content}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={handleBack}
          disabled={isFirstStep}
          variant="outline"
          className="flex items-center disabled:opacity-50"
        >
          <ChevronLeft className="mr-2" size={16} />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentStep >= steps.length}
          className="flex items-center"
        >
          {isLastStep ? "Finish" : "Next"}
          <ChevronRight className="ml-2" size={16} />
        </Button>
      </div>
    </div>
  );
};

export default Stepper;
