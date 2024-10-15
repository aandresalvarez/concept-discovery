import React from "react";
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
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  if (conceptTable.length === 0) {
    return (
      <div className="mt-2 p-4 rounded-lg border border-accent/10">
        <p className="text-center text-muted-foreground">
          No concepts found for the selected synonym.
        </p>
      </div>
    );
  }

  const SimpleTable = () => (
    <div className="space-y-2">
      {conceptTable.map((concept, index) => {
        return (
          <div key={index} className="border p-2 rounded-lg">
            <h3 className="font-semibold text-lg">{concept.name}</h3>
            <p className="text-sm">
              <strong>Concept ID:</strong> {concept.concept_id}
            </p>
            <p className="text-sm">
              <strong>Code:</strong> {concept.code}
            </p>
            <p className="text-sm">
              <strong>Class:</strong> {concept.class_name}
            </p>
            <p className="text-sm">
              <strong>Standard Concept:</strong> {concept.standard_concept}
            </p>
            <div className="mt-1 flex justify-between items-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    See More Details
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{concept.name}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-2">
                    <p>
                      <strong>Concept ID:</strong> {concept.concept_id}
                    </p>
                    <p>
                      <strong>Code:</strong> {concept.code}
                    </p>
                    <p>
                      <strong>Class:</strong> {concept.class_name}
                    </p>
                    <p>
                      <strong>Standard Concept:</strong>{" "}
                      {concept.standard_concept}
                    </p>
                    <p>
                      <strong>Invalid Reason:</strong>{" "}
                      {concept.invalid_reason || "N/A"}
                    </p>
                    <p>
                      <strong>Domain:</strong> {concept.domain}
                    </p>
                    <p>
                      <strong>Vocabulary:</strong> {concept.vocabulary}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Show the See in Athena button only in small screens */}
              {isSmallScreen && (
                <a
                  href={`https://athena.ohdsi.org/search-terms/terms/${concept.concept_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  <Button variant="ghost" size="sm">
                    See in Athena
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const FullTable = () => (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead>Concept ID</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Class</TableHead>
          <TableHead>Standard Concept</TableHead>
          <TableHead>Invalid Reason</TableHead>
          <TableHead>Domain</TableHead>
          <TableHead>Vocabulary</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {conceptTable.map((concept, index) => (
          <TableRow key={index}>
            {/* Make Concept ID a hyperlink */}
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
            <TableCell>{concept.invalid_reason || "N/A"}</TableCell>
            <TableCell>{concept.domain}</TableCell>
            <TableCell>{concept.vocabulary}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="mt-2 p-4 rounded-lg border border-accent/10 w-full">
      <h3 className="text-xl font-semibold mb-4 text-primary">Concept Table</h3>
      <div className="overflow-x-auto w-full">
        {isSmallScreen ? <SimpleTable /> : <FullTable />}
      </div>
    </div>
  );
};

export default StepTableResults;
