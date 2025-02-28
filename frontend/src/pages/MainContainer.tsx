import React, { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { SearchBox, Header, LoadingComponent } from "@/components";
import { Button } from "@/components/ui/button";
import Stepper from "@/components/Stepper";
import StepDisambiguation from "@/components/steps/StepDisambiguation";
import StepSynonyms from "@/components/steps/StepSynonyms";
import StepTableResults from "@/components/steps/StepTableResults";
import ForcedLanguageSelector from "@/components/ForcedLanguageSelector";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Languages } from "lucide-react";
import Dashboard from "@/components/Dashboard";

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
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [selectedTerm, setSelectedTerm] = useState<DisambiguationResult | null>(
    null,
  );
  const [lastSearchTerm, setLastSearchTerm] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [canProceed, setCanProceed] = useState<boolean>(false);
  const [showLanguageSelector, setShowLanguageSelector] =
    useState<boolean>(true);
  const [showDashboard, setShowDashboard] = useState<boolean>(false);
  const [searchId, setSearchId] = useState<number | null>(null);

  const isSmallScreen = useMediaQuery("(max-width: 767px)");
  const loadingSize = isSmallScreen ? "sm" : "md";

  const handleLanguageChange = useCallback(
    (lang: string) => {
      i18n.changeLanguage(lang);
    },
    [i18n],
  );

  const handleLanguageRefresh = useCallback(() => {
    setShowLanguageSelector(true);
  }, []);

  const handleError = useCallback(
    (err: any) => {
      console.error("API call error:", err);
      if (err.response) {
        setError(
          `${t("serverError", { ns: "common" })}: ${err.response.data.detail || t("unknownError", { ns: "common" })}`,
        );
      } else if (err.request) {
        setError(t("noResponseError", { ns: "common" }));
      } else {
        setError(`${t("genericError", { ns: "common" })}: ${err.message}`);
      }
    },
    [t],
  );

  const handleSearch = useCallback(
    async (term: string) => {
      setLoading(true);
      setError(null);
      setLastSearchTerm(term);
      setHasSearched(true);
      setSelectedTerm(null);
      setSynonyms([]);
      setConceptTable([]);
      setCurrentStep(0);
      setCanProceed(false);
      setSearchId(null);

      try {
        const response = await axios.get(`/api/search`, {
          params: { term, language: i18n.language },
        });
        setSearchResults(response.data.results);
        setSearchId(response.data.search_id);
      } catch (err: any) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [i18n.language, handleError],
  );

  const handleDisambiguationSelect = useCallback(
    async (term: DisambiguationResult) => {
      setLoading(true);
      setError(null);
      setSelectedTerm(term);
      setSynonyms([]);
      setConceptTable([]);
      setCanProceed(false);

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
        setCurrentStep(1);
      } catch (err: any) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [i18n.language, handleError],
  );

  const handleSynonymClick = useCallback(
    async (synonym: string) => {
      setLoading(true);
      setError(null);
      setConceptTable([]);

      try {
        const response = await axios.get(`/api/concept_lookup`, {
          params: {
            term: synonym,
            context: selectedTerm?.definition,
            language: i18n.language,
          },
        });

        if (response.data.concepts && response.data.concepts.length > 0) {
          setConceptTable(response.data.concepts);
          setCurrentStep(2);
          setCanProceed(true);
        } else {
          setError(t("noConceptsFound", { ns: "mainContainer" }));
        }
      } catch (err: any) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [i18n.language, handleError, t, selectedTerm],
  );

  const handleStepChange = useCallback(
    (step: number) => {
      if (step <= currentStep) {
        setCurrentStep(step);
        setCanProceed(step < currentStep);
      }
    },
    [currentStep],
  );

  const handleStepperFinish = useCallback(() => {
    console.log("Stepper finished");
  }, []);

  const handleRetry = useCallback(() => {
    if (lastSearchTerm) {
      handleSearch(lastSearchTerm);
    }
  }, [lastSearchTerm, handleSearch]);

  const handleLanguageSelected = useCallback(() => {
    setShowLanguageSelector(false);
  }, []);

  const toggleDashboard = useCallback(() => {
    setShowDashboard((prev) => !prev);
  }, []);

  const loadingText = useMemo(() => {
    if (!loading) return "";

    switch (currentStep) {
      case 0:
        return t("loadingInitial");
      case 1:
        return t("loadingConcepts");
      case 2:
        return t("loadingAdditionalInfo");
      default:
        return t("loading");
    }
  }, [loading, currentStep, t]);

  const steps = [
    {
      title: t("disambiguationStep", { ns: "mainContainer" }),
      content: (
        <StepDisambiguation
          searchResults={searchResults}
          onSelect={handleDisambiguationSelect}
        />
      ),
    },
    {
      title: t("synonymsStep", { ns: "mainContainer" }),
      content: (
        <StepSynonyms
          synonyms={synonyms}
          onSynonymClick={handleSynonymClick}
          selectedTerm={selectedTerm}
          searchId={searchId}
        />
      ),
    },
    {
      title: t("resultsStep", { ns: "mainContainer" }),
      content: <StepTableResults conceptTable={conceptTable} />,
    },
  ];

  const renderLanguageButton = () => (
    <Button
      variant="link"
      size="sm"
      className="p-1"
      onClick={handleLanguageRefresh}
      title={t("changeLanguage", { ns: "common" })}
    >
      <Languages className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header showDashboard={showDashboard} toggleDashboard={toggleDashboard} />
      <main className="flex flex-col flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {showDashboard ? (
          <Dashboard />
        ) : showLanguageSelector ? (
          <motion.div
            key="language-selection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center flex-grow"
          >
            <ForcedLanguageSelector
              onLanguageSelected={handleLanguageSelected}
            />
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {!hasSearched ? (
              <motion.div
                key="initial"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center flex-grow"
              >
                <div className="flex items-center justify-center mb-8">
                  <h1 className="text-4xl font-bold text-foreground text-center mr-2">
                    {t("title", { ns: "mainContainer" })}
                  </h1>
                  {renderLanguageButton()}
                </div>
                <div className="w-full">
                  <SearchBox
                    onSearch={handleSearch}
                    placeholder={t("searchPlaceholder", {
                      ns: "mainContainer",
                    })}
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
                    placeholder={t("searchPlaceholder", {
                      ns: "mainContainer",
                    })}
                    onLanguageChange={handleLanguageChange}
                    selectedLanguage={i18n.language}
                    showLangSelection={false}
                  />
                </div>

                {loading ? (
                  <div className="pt-16">
                    <LoadingComponent
                      loadingText={loadingText}
                      size={loadingSize}
                      showAdditionalInfo={currentStep === 2}
                      additionalInfoText={t("loadingAdditionalInfo", {
                        ns: "mainContainer",
                      })}
                      primaryColor="primary"
                      accentColor="accent"
                      secondaryColor="secondary"
                    />
                  </div>
                ) : error ? (
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
                    canProceed={canProceed}
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    {t("noResults", { ns: "mainContainer" })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default MainContainer;
