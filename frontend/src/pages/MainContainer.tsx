import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SearchBox, Header } from "@/components";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import axios from "axios";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [selectedTerm, setSelectedTerm] = useState<DisambiguationResult | null>(
    null,
  );
  const [selectedSynonym, setSelectedSynonym] = useState<string | null>(null);
  const [lastSearchTerm, setLastSearchTerm] = useState<string>("");

  const handleSearch = async (term: string) => {
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
    }
  };

  const handleDisambiguationSelect = async (term: DisambiguationResult) => {
    setLoading(true);
    setError(null);
    setSelectedTerm(term);
    setSelectedSynonym(null);
    setConceptTable([]);

    try {
      const response = await axios.get(`/api/synonyms`, {
        params: {
          term: term.term,
          context: term.definition, // Corrected parameter name
          language: i18n.language,
        },
      });
      setSynonyms(response.data.synonyms);
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
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

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleRetry = () => {
    if (lastSearchTerm) {
      handleSearch(lastSearchTerm);
    }
  };

  const renderSearchResult = (item: DisambiguationResult, index: number) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="mb-6 p-4 rounded-lg hover:bg-accent/5 transition-colors duration-200 border border-accent/10 sm:border-0 sm:hover:border-accent/10 cursor-pointer"
      onClick={() => handleDisambiguationSelect(item)}
    >
      <h3 className="text-lg font-semibold mb-2 text-primary">{item.term}</h3>
      <Separator />

      <p className="text-base text-foreground mt-2">{item.definition}</p>
      <p className="text-base text-foreground mt-2">
        <strong>{t("usage")}:</strong> {item.usage}
      </p>
      <p className="text-base text-foreground mt-2">
        <strong>{t("context")}:</strong> {item.context}
      </p>
    </motion.div>
  );

  const renderSynonyms = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mt-6 p-6 rounded-lg bg-accent/5 border border-accent/10"
    >
      {selectedTerm && (
        <div className="mb-6 p-4">
          <h3 className="text-xl font-semibold mb-2 text-primary">
            {selectedTerm.term}
          </h3>
          <Separator />

          <p className="text-base text-foreground mt-2">
            {selectedTerm.definition}
          </p>
          <p className="text-base text-foreground mt-2">
            <strong>{t("usage")}:</strong> {selectedTerm.usage}
          </p>
          <p className="text-base text-foreground mt-2">
            <strong>{t("context")}:</strong> {selectedTerm.context}
          </p>
        </div>
      )}
      <h3 className="text-xl font-semibold mb-4 text-primary">
        {t("synonymsFor", { term: selectedTerm?.term })}
      </h3>
      <ToggleGroup
        type="single"
        value={selectedSynonym || ""}
        className="flex flex-wrap gap-2"
      >
        {synonyms.map((synonym, index) => (
          <ToggleGroupItem
            key={index}
            value={synonym.synonym}
            onClick={() => handleSynonymClick(synonym.synonym)}
            className={`px-3 py-1 rounded-lg text-base transition-colors duration-200 ${
              selectedSynonym === synonym.synonym
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {synonym.synonym}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </motion.div>
  );

  const renderConceptTable = () => {
    if (conceptLoading) {
      return (
        <div className="mt-6">
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
          <table className="w-full text-base text-left text-foreground">
            <thead className="text-xs text-foreground uppercase bg-accent/10">
              <tr>
                <th className="px-6 py-3">{t("conceptId")}</th>
                <th className="px-6 py-3">{t("name")}</th>
                <th className="px-6 py-3">{t("domain")}</th>
                <th className="px-6 py-3">{t("vocabulary")}</th>
                <th className="px-6 py-3">{t("standardConcept")}</th>
              </tr>
            </thead>
            <tbody>
              {conceptTable.map((row, index) => (
                <tr key={index} className="bg-background border-b">
                  <td className="px-6 py-4">
                    <a
                      href={`https://athena.ohdsi.org/search-terms/terms/${row.concept_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline hover:underline"
                    >
                      {row.concept_id}
                    </a>
                  </td>
                  <td className="px-6 py-4">{row.name}</td>
                  <td className="px-6 py-4">{row.domain}</td>
                  <td className="px-6 py-4">{row.vocabulary}</td>
                  <td className="px-6 py-4">{row.standard_concept}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  const renderSkeletons = () => (
    <>
      {Array(3)
        .fill(null)
        .map((_, index) => (
          <div
            key={index}
            className="mb-6 p-4 border border-accent/10 sm:border-0 rounded-lg"
          >
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/3 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
    </>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex flex-col flex-1 container mx-auto px-4 py-6">
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
              <div className="w-full max-w-2xl">
                <SearchBox
                  onSearch={handleSearch}
                  placeholder={t("searchPlaceholder", { ns: "mainContainer" })}
                  onLanguageChange={handleLanguageChange}
                  selectedLanguage={i18n.language}
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
                />
              </div>

              {loading ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-foreground">
                    {t("loading", { ns: "mainContainer" })}
                  </h2>
                  {renderSkeletons()}
                </div>
              ) : error ? (
                <div className="text-center text-destructive">
                  <p>{error}</p>
                  <Button onClick={handleRetry} className="mt-4">
                    {t("retry", { ns: "common" })}
                  </Button>
                </div>
              ) : (
                <>
                  {selectedTerm ? (
                    <>
                      {renderSynonyms()}
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

              {selectedTerm && (
                <div className="mt-6">
                  <Button
                    onClick={handleBack}
                    className="w-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent"
                    variant="outline"
                    aria-label={t("backToResults", { ns: "common" })}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t("backToResults", { ns: "common" })}
                  </Button>
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
