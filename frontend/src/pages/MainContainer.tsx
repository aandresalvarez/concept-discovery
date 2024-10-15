// src/pages/MainContainer.tsx

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SearchBox, Header, LoadingComponent } from "@/components";
import { Button } from "@/components/ui/button";
import Stepper from "@/components/Stepper";
import StepDisambiguation from "@/components/steps/StepDisambiguation";
import StepSynonyms from "@/components/steps/StepSynonyms";
import StepTableResults from "@/components/steps/StepTableResults";
import ForcedLanguageSelector from "@/components/ForcedLanguageSelector";
import axios from "axios";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface DisambiguationResult {
  term: string;
  definition: string;
  category: string;
  usage: string;
  context: string;
}

interface ConceptTableRow {
  concept_id: number;
  code: string;
  name: string;
  class_name: string;
  standard_concept: string;
  invalid_reason: string | null;
  domain: string;
  vocabulary: string;
  score: number | null;
}

const MainContainer: React.FC = () => {
  const { t, i18n } = useTranslation(["mainContainer", "common"]);
  const [searchResults, setSearchResults] = useState<DisambiguationResult[]>(
    [],
  );
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [conceptTable, setConceptTable] = useState<ConceptTableRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [conceptLoading, setConceptLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(false);
  const [synonymLoading, setSynonymLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [selectedTerm, setSelectedTerm] = useState<DisambiguationResult | null>(
    null,
  );
  const [lastSearchTerm, setLastSearchTerm] = useState<string>("");
  const [languageSelected, setLanguageSelected] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const isSmallScreen = useMediaQuery("(max-width: 767px)");
  const loadingSize: "sm" | "md" = isSmallScreen ? "sm" : "md";

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleRetry = () => {
    if (lastSearchTerm) {
      handleSearch(lastSearchTerm);
    }
  };

  const handleLanguageSelected = () => {
    setLanguageSelected(true);
  };

  const handleSearch = async (term: string) => {
    setInitialLoading(true);
    setLoading(true);
    setError(null);
    setLastSearchTerm(term);
    setHasSearched(true);
    setSelectedTerm(null);
    setConceptTable([]);
    setCurrentStep(0);

    try {
      const response = await axios.get(`/api/search`, {
        params: { term, language: i18n.language },
      });
      setSearchResults(response.data.results);
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handleDisambiguationSelect = async (term: DisambiguationResult) => {
    setSynonymLoading(true);
    setLoading(true);
    setError(null);
    setSelectedTerm(term);
    setConceptTable([]);

    try {
      const response = await axios.get(`/api/synonyms`, {
        params: {
          term: term.term,
          context: term.definition,
          language: i18n.language,
        },
      });
      setSynonyms(
        response.data.synonyms.map((s: { synonym: string }) => s.synonym),
      );
      setCurrentStep(1); // Move to the synonyms step
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
      setSynonymLoading(false);
    }
  };

  const handleSynonymClick = async (synonym: string) => {
    setConceptLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/concept_lookup`, {
        params: { term: synonym, language: i18n.language },
      });

      if (response.data.concepts && response.data.concepts.length > 0) {
        setConceptTable(response.data.concepts);
        setCurrentStep(2); // Move to the results step
      } else {
        setConceptTable([]);
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setConceptLoading(false);
    }
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

  const steps = [
    {
      title: "Disambiguation",
      content: (
        <StepDisambiguation
          searchResults={searchResults}
          onSelect={handleDisambiguationSelect}
        />
      ),
    },
    {
      title: "Synonyms",
      content: (
        <StepSynonyms
          synonyms={synonyms}
          onSynonymClick={handleSynonymClick}
          selectedTerm={selectedTerm}
        />
      ),
    },
    {
      title: "Results",
      content: <StepTableResults conceptTable={conceptTable} />,
    },
  ];

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleStepperFinish = () => {
    console.log("Stepper finished");
  };

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
                  size={loadingSize}
                  showAdditionalInfo={conceptLoading}
                  additionalInfoText={
                    conceptLoading
                      ? t("loadingAdditionalInfo", {
                          ns: "mainContainer",
                          defaultValue: "This might take a few seconds...",
                        })
                      : undefined
                  }
                  primaryColor="primary"
                  accentColor="accent"
                  secondaryColor="secondary"
                />
              )}

              {!initialLoading && !synonymLoading && !conceptLoading && (
                <>
                  {loading ? null : error ? (
                    <div className="text-center text-destructive">
                      <p>{error}</p>
                      <Button onClick={handleRetry} className="mt-4">
                        {t("retry", { ns: "common" })}
                      </Button>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <Stepper
                      steps={steps}
                      initialStep={currentStep}
                      onStepChange={handleStepChange}
                      onFinish={handleStepperFinish}
                      activeColor="bg-primary"
                      inactiveColor="bg-secondary"
                    />
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
