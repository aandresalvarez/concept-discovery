// src/components/MainContainer.tsx

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SearchBox, Header, LoadingComponent } from "@/components";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  ChevronRight,
  Tag,
  Info,
  Book,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ForcedLanguageSelector from "@/components/ForcedLanguageSelector";

import ConceptTable from "@/components/ConceptTable"; // Import ConceptTable
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

import { useMediaQuery } from "@/hooks/useMediaQuery"; // Import the useMediaQuery hook

interface DisambiguationResult {
  term: string;
  definition: string;
  category: string;
  usage: string;
  context: string;
}

interface SynonymResult {
  synonym: string;
}

interface ConceptTableRow {
  concept_id: number;
  name: string;
  domain: string;
  vocabulary: string;
  standard_concept: string;
}

const MainContainer: React.FC = () => {
  const { t, i18n } = useTranslation(["mainContainer", "common"]);
  const [searchResults, setSearchResults] = useState<DisambiguationResult[]>(
    [],
  );
  const [synonyms, setSynonyms] = useState<SynonymResult[]>([]);
  const [conceptTable, setConceptTable] = useState<ConceptTableRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [conceptLoading, setConceptLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(false); // New state
  const [synonymLoading, setSynonymLoading] = useState<boolean>(false); // New state
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [selectedTerm, setSelectedTerm] = useState<DisambiguationResult | null>(
    null,
  );
  const [selectedSynonym, setSelectedSynonym] = useState<string | null>(null);
  const [lastSearchTerm, setLastSearchTerm] = useState<string>("");
  const [languageSelected, setLanguageSelected] = useState<boolean>(false);

  // Use the useMediaQuery hook to determine screen size
  const isSmallScreen = useMediaQuery("(max-width: 767px)"); // Tailwind's 'md' breakpoint is 768px
  const loadingSize: "sm" | "md" = isSmallScreen ? "sm" : "md";

  // Handle language change from SearchBox (optional: allows changing language later)
  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  // Handle retry after error
  const handleRetry = () => {
    if (lastSearchTerm) {
      handleSearch(lastSearchTerm);
    }
  };

  const handleLanguageSelected = () => {
    setLanguageSelected(true);
  };

  const handleSearch = async (term: string) => {
    setInitialLoading(true); // Start initial loading
    setLoading(true);
    setError(null);
    setLastSearchTerm(term);
    setHasSearched(true);
    setSelectedTerm(null);
    setSelectedSynonym(null);
    setConceptTable([]);

    try {
      const response = await axios.get(`/api/search`, {
        params: { term, language: i18n.language },
      });
      setSearchResults(response.data.results);
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
      setInitialLoading(false); // End initial loading
    }
  };

  const handleDisambiguationSelect = async (term: DisambiguationResult) => {
    setSynonymLoading(true); // Start synonym loading
    setLoading(true);
    setError(null);
    setSelectedTerm(term);
    setSelectedSynonym(null);
    setConceptTable([]);

    try {
      const response = await axios.get(`/api/synonyms`, {
        params: {
          term: term.term,
          context: term.definition,
          language: i18n.language,
        },
      });
      setSynonyms(response.data.synonyms);
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
      setSynonymLoading(false); // End synonym loading
    }
  };

  const handleSynonymClick = async (synonym: string) => {
    setConceptLoading(true);
    setError(null);
    setSelectedSynonym(synonym);

    try {
      const response = await axios.get(`/api/concept_lookup`, {
        params: { term: synonym, language: i18n.language },
      });

      if (response.data.concepts && response.data.concepts.length > 0) {
        setConceptTable(response.data.concepts);
      } else {
        setConceptTable([]);
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setConceptLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedTerm(null);
    setSelectedSynonym(null);
    setConceptTable([]);
  };

  const handleError = (err: any) => {
    console.error("API call error:", err);
    if (err.response) {
      setError(
        `${t("serverError", { ns: "common" })}: ${
          err.response.data.detail || t("unknownError", { ns: "common" })
        }`,
      );
    } else if (err.request) {
      setError(t("noResponseError", { ns: "common" }));
    } else {
      setError(`${t("genericError", { ns: "common" })}: ${err.message}`);
    }
  };

  // Define the renderConceptTable function inside the MainContainer component
  const renderConceptTable = () => {
    if (conceptLoading) {
      return (
        <div className="mt-6 p-4">
          <Skeleton className="h-8 w-1/4 mb-4" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
        </div>
      );
    }

    if (conceptTable.length === 0 && selectedSynonym) {
      return (
        <div className="mt-6 p-6 rounded-lg bg-accent/5 border border-accent/10">
          <p className="text-center text-muted-foreground">
            {t("noConceptsFound", { synonym: selectedSynonym })}
          </p>
        </div>
      );
    }

    if (conceptTable.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-6 p-6 rounded-lg bg-accent/5 border border-accent/10"
      >
        <h3 className="text-xl font-semibold mb-4 text-primary">
          {t("conceptTable")}
        </h3>
        <div className="overflow-x-auto">
          <ConceptTable data={conceptTable} />
        </div>
      </motion.div>
    );
  };

  const renderSearchResult = (item: DisambiguationResult, index: number) => (
    <Card
      key={index}
      className="hover:shadow-lg transition-shadow duration-300 overflow-hidden border-border mb-6"
      onClick={() => handleDisambiguationSelect(item)}
    >
      <CardHeader className="bg-secondary pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl font-bold text-foreground font-serif hover:text-[#007C92] hover:underline transition-colors duration-200">
            {item.term}
          </span>
          <Badge
            variant="outline"
            className="text-sm px-2 py-1 bg-accent text-accent-foreground"
          >
            {item.category}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 bg-card text-card-foreground">
        <div className="text-base mb-4 flex items-start font-sans">
          <Book className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
          <span>{item.definition}</span>
        </div>
        <Separator className="my-4 bg-border" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-sans">
          <div className="flex items-start">
            <Tag className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            <p>
              <strong>{t("usage")}:</strong> {item.usage}
            </p>
          </div>
          <div className="flex items-start">
            <Info className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            <p>
              <strong>{t("context")}:</strong> {item.context}
            </p>
          </div>
        </div>
        <Button className="mt-6 w-full bg-[#8C1515] hover:bg-[#8C1515]/90 text-white transition-colors duration-200 font-sans">
          {t("viewDetails", { ns: "common" })}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderDisambiguationScreen = () => (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Back Button */}
      <Button
        onClick={handleBack}
        variant="outline"
        className="mb-4 text-foreground hover:text-primary transition-colors duration-200"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Volver a los Resultados
      </Button>

      {/* Term Details Card */}
      {selectedTerm && (
        <Card className="border-border overflow-hidden shadow-md">
          <CardHeader className="bg-secondary pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="text-3xl font-bold text-primary font-serif">
                {selectedTerm.term}
              </span>
              <Badge
                variant="outline"
                className="text-sm px-2 py-1 bg-accent text-accent-foreground"
              >
                Término Médico
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 bg-card text-card-foreground">
            <div className="space-y-4">
              <div className="flex items-start">
                <Book className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                <p className="text-base">{selectedTerm.definition}</p>
              </div>
              <Separator className="my-2 bg-border" />
              <div className="flex items-start">
                <Tag className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                <div>
                  <strong className="font-semibold">Uso:</strong>{" "}
                  {selectedTerm.usage}
                </div>
              </div>
              <div className="flex items-start">
                <Info className="mr-2 h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                <div>
                  <strong className="font-semibold">Contexto:</strong>{" "}
                  {selectedTerm.context}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Synonyms Selection Card */}
      <Card className="border-border shadow-md bg-accent/10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary font-serif flex items-center">
            <ArrowRight className="mr-2 h-6 w-6" />
            Seleccione un sinónimo para '{selectedTerm?.term}'
          </CardTitle>
          <p className="text-muted-foreground font-medium">
            Para continuar, elija uno de los siguientes sinónimos. Esto nos
            ayudará a refinar su búsqueda y proporcionar resultados más
            precisos.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {synonyms.map((synonym, index) => (
              <Button
                key={index}
                onClick={() => handleSynonymClick(synonym.synonym)}
                variant="outline"
                className="bg-background text-foreground hover:bg-primary hover:text-primary-foreground transition-colors duration-200 border-2 border-primary"
              >
                {synonym.synonym}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex flex-col flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <AnimatePresence mode="wait">
          {!hasSearched ? (
            <motion.div
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center flex-grow"
            >
              <h1 className="text-4xl font-bold mb-8 text-foreground text-center">
                {t("title", { ns: "mainContainer" })}
              </h1>
              <div className="w-full">
                <SearchBox
                  onSearch={handleSearch}
                  placeholder={t("searchPlaceholder", { ns: "mainContainer" })}
                  onLanguageChange={handleLanguageChange}
                  selectedLanguage={i18n.language}
                  showLangSelection={false}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-grow"
            >
              <div className="mb-6">
                <SearchBox
                  onSearch={handleSearch}
                  placeholder={t("searchPlaceholder", { ns: "mainContainer" })}
                  onLanguageChange={handleLanguageChange}
                  selectedLanguage={i18n.language}
                  showLangSelection={false}
                />
              </div>

              {/* Loading States Integration */}
              {(initialLoading || synonymLoading || conceptLoading) && (
                <LoadingComponent
                  loadingText={
                    initialLoading
                      ? t("loadingInitial", {
                          ns: "mainContainer",
                          defaultValue: "Searching...",
                        })
                      : synonymLoading
                        ? t("loadingSynonyms", {
                            ns: "mainContainer",
                            defaultValue: "Fetching synonyms...",
                          })
                        : t("loadingConcepts", {
                            ns: "mainContainer",
                            defaultValue: "Retrieving concepts...",
                          })
                  }
                  size={loadingSize} // Use responsive size
                  showAdditionalInfo={conceptLoading} // Show additional info only during concept loading
                  additionalInfoText={
                    conceptLoading
                      ? t("loadingAdditionalInfo", {
                          ns: "mainContainer",
                          defaultValue: "This might take a few seconds...",
                        })
                      : undefined
                  }
                  primaryColor="primary" // Update to match Tailwind config (without 'border-' prefix)
                  accentColor="accent"
                  secondaryColor="secondary"
                />
              )}

              {/* Conditional Rendering based on loading and error states */}
              {!initialLoading && !synonymLoading && !conceptLoading && (
                <>
                  {loading ? null : error ? (
                    <div className="text-center text-destructive">
                      <p>{error}</p>
                      <Button onClick={handleRetry} className="mt-4">
                        {t("retry", { ns: "common" })}
                      </Button>
                    </div>
                  ) : selectedTerm ? (
                    <>
                      {renderDisambiguationScreen()}
                      {renderConceptTable()}
                    </>
                  ) : searchResults.length > 0 ? (
                    <>
                      <h2 className="text-xl font-semibold mb-4 text-foreground">
                        {t("results", { ns: "mainContainer" })}
                      </h2>
                      {searchResults.map((item, index) =>
                        renderSearchResult(item, index),
                      )}
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      {t("noResults", { ns: "mainContainer" })}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {!languageSelected && (
        <ForcedLanguageSelector onLanguageSelected={handleLanguageSelected} />
      )}
    </div>
  );
};

export default MainContainer;
