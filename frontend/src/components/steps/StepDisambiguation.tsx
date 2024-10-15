import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
  onSelect: (result: DisambiguationResult) => void;
}

const StepDisambiguation: React.FC<StepDisambiguationProps> = ({
  searchResults,
  onSelect,
}) => {
  const { t } = useTranslation("mainContainer");

  return (
    <div className="space-y-6">
      {searchResults.map((item: DisambiguationResult, index: number) => (
        <Card
          key={index}
          className="p-4 hover:shadow-lg transition-shadow duration-300"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold mb-2">{item.term}</h3>
            <span className="text-sm text-right text-gray-500">
              {item.category}
            </span>
          </div>
          <p className="text-sm mb-2">{item.definition}</p>

          <div className="pb-2">
            <ResponsiveDetails item={item} />
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white"
            onClick={() => onSelect(item)}
          >
            {t("select")}
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
  const { t } = useTranslation("mainContainer");

  return (
    <div className="space-y-2">
      <div className="block md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(true)}
        >
          {t("moreDetails")}
        </Button>

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("details")}</DialogTitle>
              <DialogDescription>
                <p className="text-sm mb-2">
                  <strong>{t("usage")}:</strong> {item.usage}
                </p>
                <p className="text-sm mb-4">
                  <strong>{t("context")}:</strong> {item.context}
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                className="mt-6 w-full bg-primary hover:bg-primary/90"
                onClick={() => setShowDetails(false)}
              >
                {t("close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="hidden md:block">
        <p className="text-sm mb-2">
          <strong>{t("usage")}:</strong> {item.usage}
        </p>
        <p className="text-sm mb-4">
          <strong>{t("context")}:</strong> {item.context}
        </p>
      </div>
    </div>
  );
};

export default StepDisambiguation;
