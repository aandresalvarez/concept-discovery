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
  name: string;
  standard_concept: string;
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
      <div className="mt-2 p-4 rounded-lg">
        <p className="text-center text-muted-foreground">
          {t("noConceptsFound")}
        </p>
      </div>
    );
  }

  const SimpleTable = () => (
    <div className="space-y-2">
      {conceptTable.map((concept, index) => (
        <div key={index} className="p-2 rounded-lg">
          <h3 className="font-semibold text-lg">{concept.name}</h3>
          <p className="text-sm">
            <strong>{t("conceptId")}:</strong> {concept.concept_id}
          </p>
          <p className="text-sm">
            <strong>{t("standardConcept")}:</strong> {concept.standard_concept}
          </p>
          <div className="mt-1 flex justify-between items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                >
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
                    <strong>{t("name")}:</strong> {concept.name}
                  </p>
                  <p>
                    <strong>{t("standardConcept")}:</strong>{" "}
                    {concept.standard_concept}
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
            <a
              href={`https://athena.ohdsi.org/search-terms/terms/${concept.concept_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center"
            >
              <Button
                variant="ghost"
                size="sm"
                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
              >
                {t("seeInAthena")}
                <ExternalLink className="ml-1 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      ))}
    </div>
  );

  const FullTable = () => (
    <Table className="w-full">
      <TableHeader>
        <TableRow className="border-none">
          <TableHead>{t("conceptId")}</TableHead>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("standardConcept")}</TableHead>
          <TableHead>{t("domain")}</TableHead>
          <TableHead>{t("vocabulary")}</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {conceptTable.map((concept, index) => (
          <TableRow key={index} className="border-none">
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
            <TableCell>{concept.name}</TableCell>
            <TableCell>{concept.standard_concept}</TableCell>
            <TableCell>{concept.domain}</TableCell>
            <TableCell>{concept.vocabulary}</TableCell>
            <TableCell>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden">
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
                      <strong>{t("name")}:</strong> {concept.name}
                    </p>
                    <p>
                      <strong>{t("standardConcept")}:</strong>{" "}
                      {concept.standard_concept}
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="mt-2 w-full">
      <h3 className="text-xl font-semibold mb-4 text-primary">
        {t("conceptTable")}
      </h3>
      <div className="w-full">
        {isSmallScreen ? <SimpleTable /> : <FullTable />}
      </div>
    </div>
  );
};

export default StepTableResults;
