// src/components/SynonymList.tsx

import React from "react";
import { SynonymListProps } from "@/types";

const SynonymList: React.FC<SynonymListProps> = ({
  synonyms,
  onSynonymClick,
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Synonyms</h2>
      <div className="flex flex-wrap gap-2">
        {synonyms.map((synonym, index) => (
          <button
            key={index}
            className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
            onClick={() => onSynonymClick(synonym)}
          >
            {synonym}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SynonymList;
