import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface DisambiguationResult {
  term: string;
  definition: string;
  category: string;
  usage: string;
  context: string;
}

interface StepSynonymsProps {
  synonyms: string[];
  onSynonymClick: (synonym: string) => void;
  selectedTerm: DisambiguationResult | null;
}

const StepSynonyms: React.FC<StepSynonymsProps> = ({
  synonyms,
  onSynonymClick,
  selectedTerm,
}) => {
  return (
    <Card className="border-border shadow-md bg-accent/10">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary font-serif flex items-center">
          <ArrowRight className="mr-2 h-6 w-6" />
          Select a synonym for '{selectedTerm?.term}'
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {synonyms.map((synonym, index) => (
            <Button
              key={index}
              onClick={() => onSynonymClick(synonym)}
              variant="outline"
              className="bg-background text-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-200 border-2 border-primary"
            >
              {synonym}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StepSynonyms;
