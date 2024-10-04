import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

// Interface definitions
interface LanguageSelectorProps {
  onLanguageChange: (lang: string) => void;
}

interface SearchBoxProps {
  onSearch: (term: string) => void;
}

interface DisambiguationOption {
  term: string;
  definition: string;
  category: string;
}

interface DisambiguationProps {
  options: DisambiguationOption[];
  onSelect: (option: DisambiguationOption) => void;
}

interface SynonymListProps {
  synonyms: string[];
  onSynonymClick: (synonym: string) => void;
}

interface MedicalConcept {
  id: number;
  name: string;
  domain: string;
  vocabulary: string;
  standard: string;
}

interface MedicalConceptsTableProps {
  concepts: MedicalConcept[];
}

interface SearchResults {
  disambiguation: DisambiguationOption[];
  synonyms: string[];
  concepts: MedicalConcept[];
}

// Component definitions
const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageChange,
}) => {
  const [customLanguage, setCustomLanguage] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    if (value !== "custom") {
      setCustomLanguage("");
      onLanguageChange(value);
    }
  };

  return (
    <div className="flex space-x-4 mb-4">
      <Select onValueChange={handleLanguageChange} value={selectedLanguage}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="fr">Français</SelectItem>
          <SelectItem value="de">Deutsch</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      {selectedLanguage === "custom" && (
        <Input
          type="text"
          placeholder="Enter your language"
          value={customLanguage}
          onChange={(e) => {
            setCustomLanguage(e.target.value);
            onLanguageChange(e.target.value);
          }}
          className="w-[200px]"
        />
      )}
    </div>
  );
};

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  return (
    <div className="relative mb-4">
      <Input
        type="text"
        placeholder="Search medical term"
        className="pl-10 pr-4 py-2 w-full rounded-full"
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

const Disambiguation: React.FC<DisambiguationProps> = ({
  options,
  onSelect,
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Disambiguation</h2>
      {options.map((option, index) => (
        <Card
          key={index}
          className="mb-4 hover:bg-accent hover:text-accent-foreground cursor-pointer"
          onClick={() => onSelect(option)}
        >
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold">{option.term}</h3>
            <p className="text-base mt-2">
              <strong>Definition:</strong> {option.definition}
              <br />
              <strong>Category:</strong> {option.category}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const SynonymList: React.FC<SynonymListProps> = ({
  synonyms,
  onSynonymClick,
}) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Synonyms</h2>
      <ul className="mb-4">
        {synonyms.map((synonym, index) => (
          <li
            key={index}
            className="p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => onSynonymClick(synonym)}
          >
            {synonym}
          </li>
        ))}
      </ul>
    </div>
  );
};

const MedicalConceptsTable: React.FC<MedicalConceptsTableProps> = ({
  concepts,
}) => {
  return (
    <div>
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

const MainContainer: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    setHasSearched(false);
    setSearchResults(null);
  }, []);

  const handleLanguageChange = (lang: string) => {
    console.log(`Language changed to: ${lang}`);
  };

  const handleSearch = async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      // Simulated API call
      const response: SearchResults = await new Promise((resolve) => {
        setTimeout(() => {
          // Use the term in the simulated response
          resolve({
            disambiguation: [
              {
                term: term,
                definition: `A condition or symptom related to "${term}".`,
                category: "General Medical Term",
              },
              {
                term: `${term} (specific)`,
                definition: `A more specific medical condition related to "${term}".`,
                category: "Specific Medical Condition",
              },
            ],
            synonyms: [term, `${term} synonym 1`, `${term} synonym 2`],
            concepts: [
              {
                id: 1000000 + term.length, // Just for simulation
                name: term,
                domain: "Observation",
                vocabulary: "SNOMED",
                standard: "Standard",
              },
              {
                id: 2000000 + term.length, // Just for simulation
                name: `${term} related concept`,
                domain: "Measurement",
                vocabulary: "LOINC",
                standard: "Non-Standard",
              },
            ],
          });
        }, 1000);
      });
      setSearchResults(response);
      setHasSearched(true);
    } catch (err) {
      setError("An error occurred while fetching results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisambiguationSelect = (option: DisambiguationOption) => {
    console.log("Selected disambiguation option:", option);
  };

  const handleSynonymClick = (synonym: string) => {
    console.log("Clicked synonym:", synonym);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <h1 className="text-2xl font-bold">Medical Concept Discovery</h1>
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto">
        <AnimatePresence>
          {!hasSearched ? (
            <motion.div
              key="centered-search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <h2 className="text-3xl font-bold mb-8">
                Search in any language
              </h2>
              <div className="w-full max-w-md">
                <LanguageSelector onLanguageChange={handleLanguageChange} />
                <SearchBox onSearch={handleSearch} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-8">
                <LanguageSelector onLanguageChange={handleLanguageChange} />
                <SearchBox onSearch={handleSearch} />
              </div>

              {loading && <p>Loading...</p>}
              {error && <p className="text-destructive">{error}</p>}

              {searchResults && (
                <>
                  <Disambiguation
                    options={searchResults.disambiguation}
                    onSelect={handleDisambiguationSelect}
                  />
                  <SynonymList
                    synonyms={searchResults.synonyms}
                    onSynonymClick={handleSynonymClick}
                  />
                  <MedicalConceptsTable concepts={searchResults.concepts} />
                </>
              )}

              {searchResults && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4">Recommendation</h2>
                  <p>
                    We recommend exploring the concept "Cold" with ID 4224149 as
                    the standard concept. Verify in Athena:
                    <a
                      href="https://athena.ohdsi.org/search-terms/terms/4224149"
                      className="text-primary hover:underline ml-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://athena.ohdsi.org/search-terms/terms/4224149
                    </a>
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-4 bg-background text-foreground text-center">
        <p>© 2024 Medical Concept Discovery Tool</p>
      </footer>
    </div>
  );
};

export default MainContainer;
