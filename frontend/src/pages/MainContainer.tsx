import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { SearchBox, Header, Footer } from "@/components";
import { SearchResults, DisambiguationOption, MedicalConcept } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const MainContainer: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
  };

  const handleSearch = async (term: string) => {
    setLoading(true);
    setError(null);

    try {
      // Simulated API call
      const response: SearchResults = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            disambiguation: [
              {
                term: term,
                definition: `A condition or symptom related to "${term}" in ${selectedLanguage}.`,
                category: "General Medical Term",
              },
              {
                term: `${term} (specific)`,
                definition: `A more specific medical condition related to "${term}" in ${selectedLanguage}.`,
                category: "Specific Medical Condition",
              },
            ],
            synonyms: [
              term,
              `${term} synonym 1 (${selectedLanguage})`,
              `${term} synonym 2 (${selectedLanguage})`,
            ],
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
                name: `${term} related concept (${selectedLanguage})`,
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

  const renderSearchResult = (
    item: DisambiguationOption | MedicalConcept,
    index: number,
  ) => {
    const isDisambiguation = "category" in item;
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">
              {isDisambiguation ? item.term : item.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {isDisambiguation
                ? item.category
                : `${item.domain} | ${item.vocabulary}`}
            </p>
            <p className="text-sm">
              {isDisambiguation
                ? item.definition
                : `Standard: ${item.standard}`}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!hasSearched ? (
            <motion.div
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[calc(100vh-200px)]"
            >
              <h1 className="text-4xl font-bold mb-8">
                Medical Concept Discovery
              </h1>
              <div className="w-full max-w-2xl">
                <SearchBox
                  onSearch={handleSearch}
                  onLanguageChange={handleLanguageChange}
                  placeholder="Enter a medical term, e.g., 'hypertension'"
                  selectedLanguage={selectedLanguage}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-8">
                <SearchBox
                  onSearch={handleSearch}
                  onLanguageChange={handleLanguageChange}
                  placeholder="Enter a medical term, e.g., 'hypertension'"
                  selectedLanguage={selectedLanguage}
                />
              </div>

              {loading ? (
                <div className="flex justify-center items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center text-destructive">{error}</div>
              ) : searchResults ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">
                      Disambiguation
                    </h2>
                    {searchResults.disambiguation.map((item, index) =>
                      renderSearchResult(item, index),
                    )}
                  </div>

                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">Synonyms</h2>
                    <div className="flex flex-wrap gap-2">
                      {searchResults.synonyms.map((synonym, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSearch(synonym)}
                        >
                          {synonym}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">
                      Medical Concepts
                    </h2>
                    {searchResults.concepts.map((item, index) =>
                      renderSearchResult(item, index),
                    )}
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Explore more on{" "}
                      <a
                        href={`https://athena.ohdsi.org/search-terms/terms/${searchResults.concepts[0].id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Athena
                      </a>
                    </p>
                  </div>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default MainContainer;
