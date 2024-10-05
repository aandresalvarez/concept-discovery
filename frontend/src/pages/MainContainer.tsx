// src/pages/MainContainer.tsx

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import {
  LanguageSelector,
  SearchBox,
  Disambiguation,
  SynonymList,
  MedicalConceptsTable,
  Recommendation,
  Header,
  Footer,
} from "@/components";
import { SearchResults, DisambiguationOption } from "@/types";

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
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col">
        <AnimatePresence mode="wait">
          {!hasSearched ? (
            <motion.div
              key="centered-search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center flex-grow"
            >
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
              className="w-full"
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
                    <Recommendation />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default MainContainer;
