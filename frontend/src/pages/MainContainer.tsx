import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { SearchBox, Header } from "@/components";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";

const MainContainer: React.FC = () => {
  const { t, i18n } = useTranslation(["mainContainer", "common"]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [lastSearchTerm, setLastSearchTerm] = useState<string>("");

  const handleSearch = async (term: string) => {
    setLoading(true);
    setError(null);
    setLastSearchTerm(term);
    setHasSearched(true);

    try {
      const response = await axios.get(`/api/search`, {
        params: { term, language: i18n.language },
      });

      setSearchResults(response.data.results);
    } catch (err: any) {
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
    } finally {
      setLoading(false);
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

  const renderSearchResult = (item: any, index: number) => {
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className="mb-6 p-4 rounded-lg hover:bg-accent/5 transition-colors duration-200 border border-accent/10 sm:border-0 sm:hover:border-accent/10"
      >
        <h3 className="text-lg font-semibold mb-2 text-primary">{item.term}</h3>
        <p className="text-sm text-muted-foreground mb-2 inline-block bg-accent/10 px-2 py-1 rounded">
          {item.category}
        </p>
        <p className="text-sm text-foreground mt-2">{item.definition}</p>
      </motion.div>
    );
  };

  const renderSkeletons = () => {
    return Array(3)
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
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MainContainer;
