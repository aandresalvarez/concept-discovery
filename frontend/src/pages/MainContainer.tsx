import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { SearchBox, Header, Footer } from "@/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";

interface DisambiguationOption {
  label: string;
  domain: string;
  definition: string;
  usage: string;
  medicalContext: string;
  synonyms: string[];
  relatedSymptoms: string[];
}

interface SearchResults {
  inputTerm: string;
  language: string;
  disambiguationOptions: DisambiguationOption[];
}

const MainContainer: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] =
    useState<DisambiguationOption | null>(null);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
  };

  const handleSearch = async (term: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<SearchResults>(`/api/search`, {
        params: {
          term,
          language: selectedLanguage,
        },
      });

      setSearchResults(response.data);
      setHasSearched(true);
    } catch (err) {
      setError("An error occurred while fetching results. Please try again.");
      console.error("API call error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (content: DisambiguationOption) => {
    setDialogContent(content);
    setIsDialogOpen(true);
  };

  const renderSearchResult = (item: DisambiguationOption, index: number) => {
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card
          className="mb-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
          onClick={() => openDialog(item)}
        >
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">{item.label}</h3>
            <p className="text-sm text-muted-foreground mb-2">{item.domain}</p>
            <p className="text-sm">{item.definition.substring(0, 100)}...</p>
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
                  placeholder="Enter a medical term, e.g., 'aspirin'"
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
                  placeholder="Enter a medical term, e.g., 'aspirin'"
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
                  <h2 className="text-xl font-semibold mb-4">
                    Results for "{searchResults.inputTerm}" in{" "}
                    {searchResults.language}
                  </h2>
                  {searchResults.disambiguationOptions.map((item, index) =>
                    renderSearchResult(item, index),
                  )}
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent?.label}</DialogTitle>
            <DialogDescription>{dialogContent?.domain}</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="mb-2">
              <strong>Definition:</strong> {dialogContent?.definition}
            </p>
            <p className="mb-2">
              <strong>Usage:</strong> {dialogContent?.usage}
            </p>
            <p className="mb-2">
              <strong>Medical Context:</strong> {dialogContent?.medicalContext}
            </p>
            <div className="mb-2">
              <strong>Synonyms:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {dialogContent?.synonyms.map((synonym, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleSearch(synonym);
                      setIsDialogOpen(false);
                    }}
                  >
                    {synonym}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <strong>Related Symptoms:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {dialogContent?.relatedSymptoms.map((symptom, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleSearch(symptom);
                      setIsDialogOpen(false);
                    }}
                  >
                    {symptom}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MainContainer;
