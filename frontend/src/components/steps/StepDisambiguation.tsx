import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

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
          <h3 className="text-lg font-semibold mb-2">{item.term}</h3>
          <p className="text-sm mb-2">{item.definition}</p>
          <p className="text-sm mb-2">
            <strong>Category:</strong> {item.category}
          </p>
          <p className="text-sm mb-2">
            <strong>Usage:</strong> {item.usage}
          </p>
          <p className="text-sm mb-4">
            <strong>Context:</strong> {item.context}
          </p>
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

export default StepDisambiguation;
