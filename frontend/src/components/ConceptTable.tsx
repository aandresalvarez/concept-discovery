// src/components/ConceptTable.tsx

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";

type Concept = {
  concept_id: number;
  name: string;
  domain: string;
  vocabulary: string;
  standard_concept: string;
};

const columns: ColumnDef<Concept>[] = [
  {
    accessorKey: "concept_id",
    header: "Concept ID",
    cell: ({ row }) => {
      const concept_id = row.getValue("concept_id") as number;
      return (
        <a
          href={`https://athena.ohdsi.org/search-terms/terms/${concept_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-primary-500 hover:text-primary-700 underline font-semibold group"
          aria-label={`Open concept ${concept_id} in Athena OHDSI`}
        >
          {concept_id}
          <ExternalLink className="ml-1 h-4 w-4 text-primary-500 group-hover:text-primary-700" />
        </a>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "name",
    header: "Name",
    enableSorting: true,
  },
  {
    accessorKey: "domain",
    header: "Domain",
    enableSorting: true,
  },
  {
    accessorKey: "vocabulary",
    header: "Vocabulary",
    enableSorting: true,
  },
  {
    accessorKey: "standard_concept",
    header: "Standard Concept",
    enableSorting: true,
  },
];

const ConceptTable: React.FC<{ data: Concept[] }> = ({ data }) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
                className="cursor-pointer select-none"
              >
                <div className="flex items-center">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  {header.column.getIsSorted() ? (
                    header.column.getIsSorted() === "asc" ? (
                      <span className="ml-1">▲</span>
                    ) : (
                      <span className="ml-1">▼</span>
                    )
                  ) : null}
                </div>
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ConceptTable;
