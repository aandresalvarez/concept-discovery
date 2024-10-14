import React from "react";
import ConceptTable from "@/components/ConceptTable";

interface ConceptTableRow {
  concept_id: number;
  name: string;
  domain: string;
  vocabulary: string;
  standard_concept: string;
}

interface StepTableResultsProps {
  conceptTable: ConceptTableRow[];
}

const StepTableResults: React.FC<StepTableResultsProps> = ({
  conceptTable,
}) => {
  if (conceptTable.length === 0) {
    return (
      <div className="mt-6 p-6 rounded-lg border border-accent/10">
        <p className="text-center text-muted-foreground">
          No concepts found for the selected synonym.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-6 rounded-lg border border-accent/10">
      <h3 className="text-xl font-semibold mb-4 text-primary">Concept Table</h3>
      <div className="overflow-x-auto">
        <ConceptTable data={conceptTable} />
      </div>
    </div>
  );
};

export default StepTableResults;
