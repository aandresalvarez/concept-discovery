// src/components/SearchBox.tsx

import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchBoxProps } from "@/types";

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  return (
    <div className="relative mb-4 w-full">
      <Input
        type="text"
        placeholder="Search medical term"
        className="pl-10 pr-4 py-2 w-full rounded-full border-2 border-gray-300"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
      />
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground cursor-pointer"
        size={20}
        onClick={handleSearch}
      />
    </div>
  );
};

export default SearchBox;
