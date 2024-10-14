import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DisambiguationResult {
  term: string;
  definition: string;
  category: string;
  usage: string;
  context: string;
}

interface StepDisambiguationProps {
  searchResults: DisambiguationResult[];
  onSelect: (term: DisambiguationResult) => void;
}

const StepDisambiguation: React.FC<StepDisambiguationProps> = ({
  searchResults,
  onSelect,
}) => {
  return (
    <div className="space-y-6">
      {searchResults.map((item, index) => (
        <Card
          key={index}
          className="p-4 hover:shadow-lg transition-shadow duration-300"
        >
          {/* Main content (always visible) */}
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold mb-2">{item.term}</h3>
            <span className="text-sm text-right text-gray-500">
              {item.category}
            </span>
          </div>
          <p className="text-sm mb-2">{item.definition}</p>

          {/* Conditional Dialog for mobile with added padding */}
          <div className="pb-2">
            <ResponsiveDetails item={item} />
          </div>

          {/* Button (always at the bottom) */}
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white"
            onClick={() => onSelect(item)}
          >
            Select
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      ))}
    </div>
  );
};

const ResponsiveDetails: React.FC<{ item: DisambiguationResult }> = ({
  item,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-2">
      {/* "More Details" Button and Dialog only visible on small screens */}
      <div className="block md:hidden">
        <Button
          variant="outline"
          size="ssm"
          onClick={() => setShowDetails(true)}
        >
          More Details
        </Button>

        {/* Dialog for showing Usage and Context */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Details</DialogTitle>
              <DialogDescription>
                <p className="text-sm mb-2">
                  <strong>Usage:</strong> {item.usage}
                </p>
                <p className="text-sm mb-4">
                  <strong>Context:</strong> {item.context}
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                className="mt-6 w-full bg-primary hover:bg-primary/90"
                onClick={() => setShowDetails(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Always visible on large screens */}
      <div className="hidden md:block">
        <p className="text-sm mb-2">
          <strong>Usage:</strong> {item.usage}
        </p>
        <p className="text-sm mb-4">
          <strong>Context:</strong> {item.context}
        </p>
      </div>
    </div>
  );
};

export default StepDisambiguation;
