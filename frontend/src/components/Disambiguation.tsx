// src/components/Disambiguation.tsx

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DisambiguationProps } from "@/types";

const Disambiguation: React.FC<DisambiguationProps> = ({
  options,
  onSelect,
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Disambiguation</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map((option, index) => (
          <Card
            key={index}
            className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-200"
            onClick={() => onSelect(option)}
          >
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">{option.term}</h3>
              <p className="text-sm">
                <strong>Definition:</strong> {option.definition}
              </p>
              <p className="text-sm mt-1">
                <strong>Category:</strong> {option.category}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Disambiguation;
