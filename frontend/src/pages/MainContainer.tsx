import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { SearchBox, Header } from "@/components";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";

const MainContainer: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [lastSearchTerm, setLastSearchTerm] = useState<string>("");

  const handleSearch = async (term: string) => {
    setLoading(true);
    setError(null);
    setLastSearchTerm(term);
    setHasSearched(true);

    try {
      const response = await axios.get(`/api/search`, {
        params: { term, language: selectedLanguage },
      });

      setSearchResults(response.data.results);
    } catch (err: any) {
      console.error("API call error:", err);
      if (err.response) {
        setError(
          `Server error: ${err.response.data.detail || "Unknown error"}`,
        );
      } else if (err.request) {
        setError("No response received from server. Please try again.");
      } else {
        setError(`An error occurred: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
  };

  const handleRetry = () => {
    if (lastSearchTerm) {
      handleSearch(lastSearchTerm);
    }
  };

  const renderSearchResult = (item: any, index: number) => {
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">{item.term}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {item.category}
            </p>
            <p className="text-sm">{item.definition}</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderSkeletons = () => {
    return Array(3)
      .fill(null)
      .map((_, index) => (
        <Card key={index} className="mb-4">
          <CardContent className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {!hasSearched ? (
            <motion.div
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[calc(100vh-120px)]"
            >
              <h1 className="text-4xl font-bold mb-8">
                Medical Concept Discovery
              </h1>
              <div className="w-full max-w-2xl">
                <SearchBox
                  onSearch={handleSearch}
                  placeholder="Enter a medical term, e.g., 'aspirin'"
                  onLanguageChange={handleLanguageChange}
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
              <div className="mb-6">
                <SearchBox
                  onSearch={handleSearch}
                  placeholder="Enter a medical term, e.g., 'aspirin'"
                  onLanguageChange={handleLanguageChange}
                  selectedLanguage={selectedLanguage}
                />
              </div>

              {loading ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Loading results...
                  </h2>
                  {renderSkeletons()}
                </div>
              ) : error ? (
                <div className="text-center text-destructive">
                  <p>{error}</p>
                  <Button onClick={handleRetry} className="mt-4">
                    Retry
                  </Button>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <>
                  <h2 className="text-xl font-semibold mb-4">Results</h2>
                  {searchResults.map((item: any, index: number) =>
                    renderSearchResult(item, index),
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  No results found. Try another search term.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MainContainer;
