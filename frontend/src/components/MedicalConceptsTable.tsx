// src/components/MedicalConceptsTable.tsx

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MedicalConceptsTableProps } from "@/types";

const MedicalConceptsTable: React.FC<MedicalConceptsTableProps> = ({
  concepts,
}) => {
  return (
    <div className="mb-8 overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Medical Concepts</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-primary">Option</TableHead>
            <TableHead className="text-primary">Concept ID</TableHead>
            <TableHead className="text-primary">Name</TableHead>
            <TableHead className="text-primary">Domain</TableHead>
            <TableHead className="text-primary">Vocabulary</TableHead>
            <TableHead className="text-primary">Standard Concept</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {concepts.map((concept, index) => (
            <TableRow key={concept.id} className="hover:bg-muted">
              <TableCell>{index + 1}</TableCell>
              <TableCell>{concept.id}</TableCell>
              <TableCell>{concept.name}</TableCell>
              <TableCell>{concept.domain}</TableCell>
              <TableCell>{concept.vocabulary}</TableCell>
              <TableCell>{concept.standard}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MedicalConceptsTable;
