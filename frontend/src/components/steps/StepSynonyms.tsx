import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

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
  const { t } = useTranslation("mainContainer");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {t("synonymsFor", { term: selectedTerm?.term || t("selectedTerm") })}
      </h2>
      {selectedTerm && (
        <Card className="p-4 bg-secondary/50">
          <h3 className="font-semibold">{selectedTerm.term}</h3>
          <p className="text-sm mt-2">{selectedTerm.definition}</p>
          <p className="text-sm mt-2">
            <strong>{t("category")}:</strong> {selectedTerm.category}
          </p>
          <p className="text-sm mt-2">
            <strong>{t("usage")}:</strong> {selectedTerm.usage}
          </p>
          <p className="text-sm mt-2">
            <strong>{t("context")}:</strong> {selectedTerm.context}
          </p>
        </Card>
      )}
      {synonyms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {synonyms.map((synonym, index) => (
            <Card
              key={index}
              className="p-4 cursor-pointer hover:shadow-md transition-all duration-300 group"
              onClick={() => onSynonymClick(synonym)}
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
