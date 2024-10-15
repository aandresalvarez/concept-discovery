import React from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ExternalLink } from "lucide-react";

interface ConceptTableRow {
  concept_id: number;
  code: string;
  name: string;
  class_name: string;
  standard_concept: string;
  invalid_reason: string | null;
  domain: string;
  vocabulary: string;
}

interface StepTableResultsProps {
  conceptTable: ConceptTableRow[];
}

const StepTableResults: React.FC<StepTableResultsProps> = ({
  conceptTable,
}) => {
  const { t } = useTranslation("mainContainer");
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  if (conceptTable.length === 0) {
    return (
      <div className="mt-2 p-4 rounded-lg border border-accent/10">
        <p className="text-center text-muted-foreground">
          {t("noConceptsFound")}
        </p>
      </div>
    );
  }

  const SimpleTable = () => (
    <div className="space-y-2">
      {conceptTable.map((concept, index) => (
        <div key={index} className="border p-2 rounded-lg">
          <h3 className="font-semibold text-lg">{concept.name}</h3>
          <p className="text-sm">
            <strong>{t("conceptId")}:</strong> {concept.concept_id}
          </p>
          <p className="text-sm">
            <strong>{t("code")}:</strong> {concept.code}
          </p>
          <p className="text-sm">
            <strong>{t("class")}:</strong> {concept.class_name}
          </p>
          <p className="text-sm">
            <strong>{t("standardConcept")}:</strong> {concept.standard_concept}
          </p>
          <div className="mt-1 flex justify-between items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  {t("seeMoreDetails")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{concept.name}</DialogTitle>
                </DialogHeader>
                <div className="mt-2">
                  <p>
                    <strong>{t("conceptId")}:</strong> {concept.concept_id}
                  </p>
                  <p>
                    <strong>{t("code")}:</strong> {concept.code}
                  </p>
                  <p>
                    <strong>{t("class")}:</strong> {concept.class_name}
                  </p>
                  <p>
                    <strong>{t("standardConcept")}:</strong>{" "}
                    {concept.standard_concept}
                  </p>
                  <p>
                    <strong>{t("invalidReason")}:</strong>{" "}
                    {concept.invalid_reason || t("notApplicable")}
                  </p>
                  <p>
                    <strong>{t("domain")}:</strong> {concept.domain}
                  </p>
                  <p>
                    <strong>{t("vocabulary")}:</strong> {concept.vocabulary}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            {isSmallScreen && (
              <a
                href={`https://athena.ohdsi.org/search-terms/terms/${concept.concept_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center"
              >
                <Button variant="ghost" size="sm">
                  {t("seeInAthena")}
                  <ExternalLink className="ml-1 h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const FullTable = () => (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead>{t("conceptId")}</TableHead>
          <TableHead>{t("code")}</TableHead>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("class")}</TableHead>
          <TableHead>{t("standardConcept")}</TableHead>
          <TableHead>{t("invalidReason")}</TableHead>
          <TableHead>{t("domain")}</TableHead>
          <TableHead>{t("vocabulary")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {conceptTable.map((concept, index) => (
          <TableRow key={index}>
            <TableCell>
              <a
                href={`https://athena.ohdsi.org/search-terms/terms/${concept.concept_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {concept.concept_id}
              </a>
            </TableCell>
            <TableCell>{concept.code}</TableCell>
            <TableCell>{concept.name}</TableCell>
            <TableCell>{concept.class_name}</TableCell>
            <TableCell>{concept.standard_concept}</TableCell>
            <TableCell>
              {concept.invalid_reason || t("notApplicable")}
            </TableCell>
            <TableCell>{concept.domain}</TableCell>
            <TableCell>{concept.vocabulary}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="mt-2 p-4 rounded-lg border border-accent/10 w-full">
      <h3 className="text-xl font-semibold mb-4 text-primary">
        {t("conceptTable")}
      </h3>
      <div className="overflow-x-auto w-full">
        {isSmallScreen ? <SimpleTable /> : <FullTable />}
      </div>
    </div>
  );
};

export default StepTableResults;
