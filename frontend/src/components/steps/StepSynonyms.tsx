// src/components/steps/StepSynonyms.tsx

import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import axios from "axios"; // Added axios import

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
  searchId: number | null; // Added searchId prop
}

const StepSynonyms: React.FC<StepSynonymsProps> = ({
  synonyms,
  onSynonymClick,
  selectedTerm,
  searchId,
}) => {
  const { t } = useTranslation("mainContainer");

  // New function to handle synonym click and record selection
  const handleSynonymClick = async (synonym: string) => {
    if (searchId) {
      try {
        await axios.post("/api/select_synonym", {
          search_id: searchId,
          synonym: synonym,
        });
      } catch (error) {
        console.error("Error recording selected synonym:", error);
      }
    }
    onSynonymClick(synonym);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl">
        {t("synonymsFor", { term: selectedTerm?.term || t("selectedTerm") })}
      </h2>
      {selectedTerm && (
        <div className="hidden md:block">
          <Card className="p-4 bg-secondary/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {/* First Column: Term and Category */}
              <div>
                <p className="font-semibold text-md">{selectedTerm.term}</p>
                <small className="text-sm text-gray-500">
                  - {selectedTerm.category}
                </small>
                <p className="mt-2">{selectedTerm.definition}</p>
              </div>
              {/* Second Column: Usage */}
              <div>
                <p className="font-semibold">{t("usage")}:</p>
                <p>{selectedTerm.usage}</p>
              </div>
              {/* Third Column: Context */}
              <div>
                <p className="font-semibold">{t("context")}:</p>
                <p>{selectedTerm.context}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {synonyms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {synonyms.map((synonym, index) => (
            <Card
              key={index}
              className="p-4 cursor-pointer hover:shadow-md transition-all duration-300 group"
              onClick={() => handleSynonymClick(synonym)} // Updated onClick handler
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">
                  {synonym}
                </h3>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors duration-300" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          {t("noSynonymsFound")}
        </p>
      )}
    </div>
  );
};

export default StepSynonyms;
