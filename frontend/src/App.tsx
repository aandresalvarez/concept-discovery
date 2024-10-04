import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
    { value: "custom", label: "Custom" },
  ];

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
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-4">
      <Select onValueChange={handleLanguageChange} value={selectedLanguage}>
        <SelectTrigger className="w-full sm:w-[180px] hover:shadow-md transition-shadow duration-300">
          <SelectValue placeholder="Select Language" />
        </SelectTrigger>
        <SelectContent>
          {languageOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedLanguage === "custom" && (
        <div className="relative w-full sm:w-auto flex-grow">
          <Input
            type="text"
            placeholder="Enter your language"
            className="pl-10 pr-4 py-2 w-full rounded-full border-2 border-gray-300"
            value={customLanguage}
            onChange={(e) => {
              setCustomLanguage(e.target.value);
              onLanguageChange(e.target.value);
            }}
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={20}
          />
        </div>
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

const Disambiguation: React.FC<DisambiguationProps> = ({
  options,
  onSelect,
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Disambiguation</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map((option, index) => (
          <Card
            key={index}
            className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-200"
            onClick={() => onSelect(option)}
          >
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2">{option.term}</h3>
              <p className="text-sm">
                <strong>Definition:</strong> {option.definition}
              </p>
              <p className="text-sm mt-1">
                <strong>Category:</strong> {option.category}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

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

const MainContainer: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

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
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 100);

    try {
      // Simulated API call
      const response: SearchResults = await new Promise((resolve) => {
        setTimeout(() => {
          clearInterval(progressInterval);
          setProgress(100);
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
                id: 1000000 + term.length,
                name: term,
                domain: "Observation",
                vocabulary: "SNOMED",
                standard: "Standard",
              },
              {
                id: 2000000 + term.length,
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
      clearInterval(progressInterval);
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
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Medical Concept Discovery</h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!hasSearched ? (
            <motion.div
              key="centered-search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <h2 className="text-3xl font-bold mb-8 text-center">
                Search in any language
              </h2>
              <div className="w-full max-w-2xl">
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

              {loading && <Progress value={progress} className="mb-4" />}
              {error && <p className="text-destructive mb-4">{error}</p>}

              {searchResults && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <Disambiguation
                      options={searchResults.disambiguation}
                      onSelect={handleDisambiguationSelect}
                    />
                    <SynonymList
                      synonyms={searchResults.synonyms}
                      onSynonymClick={handleSynonymClick}
                    />
                  </div>
                  <div>
                    <MedicalConceptsTable concepts={searchResults.concepts} />
                    <div className="mt-8">
                      <h2 className="text-xl font-bold mb-4">Recommendation</h2>
                      <p className="text-sm">
                        We recommend exploring the concept "Cold" with ID
                        4224149 as the standard concept. Verify in Athena:
                      </p>
                      <a
                        href="https://athena.ohdsi.org/search-terms/terms/4224149"
                        className="text-primary hover:underline text-sm break-all"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        https://athena.ohdsi.org/search-terms/terms/4224149
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-background text-foreground p-4 text-center">
        <div className="container mx-auto">
          <p className="text-sm">© 2024 Medical Concept Discovery Tool</p>
        </div>
      </footer>
    </div>
  );
};

export default MainContainer;
