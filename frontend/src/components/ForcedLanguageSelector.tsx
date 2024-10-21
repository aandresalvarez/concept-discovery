import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, X, Globe, Plus } from "lucide-react";

interface Language {
  value: string;
  label: string;
  nativeName: string;
}

interface LanguageSelectorProps {
  onLanguageSelected: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageSelected,
}) => {
  const { t, i18n } = useTranslation("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [languageOptions, setLanguageOptions] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isCreatingLanguage, setIsCreatingLanguage] = useState(false);
  const [newLanguage, setNewLanguage] = useState({
    name: "",
    code: "",
    nativeName: "",
  });
  const [error, setError] = useState<string | null>(null);

  const fetchLanguages = useCallback(async () => {
    try {
      const response = await axios.get("/api/languages");
      setLanguageOptions(response.data.languages);
    } catch (err) {
      console.error("Error fetching languages:", err);
      setLanguageOptions([
        { value: "en", label: "English", nativeName: "English" },
        { value: "es", label: "Spanish", nativeName: "Español" },
        { value: "fr", label: "French", nativeName: "Français" },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  const filteredLanguages = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return languageOptions.filter(
      (lang) =>
        lang.label.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.value.toLowerCase().includes(query),
    );
  }, [searchQuery, languageOptions]);

  const handleLanguageSelect = useCallback(
    (language: string) => {
      setSelectedLanguage(language);
      i18n.changeLanguage(language);
      onLanguageSelected(language);
    },
    [i18n, onLanguageSelected],
  );

  const handleCreateLanguage = () => {
    setIsCreatingLanguage(true);
    setError(null);
  };

  const handleSaveNewLanguage = async () => {
    try {
      const { name, code, nativeName } = newLanguage;

      if (!name || !code || !nativeName) {
        setError(t("allFieldsRequired"));
        return;
      }

      if (code.length !== 2) {
        setError(t("invalidLanguageCode"));
        return;
      }

      const response = await axios.post("/api/create_language", {
        name,
        code,
        native_name: nativeName,
      });

      if (response.data.success) {
        setIsCreatingLanguage(false);
        setNewLanguage({ name: "", code: "", nativeName: "" });
        setError(null);
        await fetchLanguages();
      } else {
        setError(response.data.message || t("failedToCreateLanguage"));
      }
    } catch (err: any) {
      console.error("Error creating language:", err);
      setError(err.response?.data?.detail || t("errorCreatingLanguage"));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {t("selectYourLanguage")}
      </h1>
      <div className="relative mb-8">
        <Input
          type="text"
          placeholder={t("searchLanguage")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredLanguages.map((lang) => (
          <Card
            key={lang.value}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedLanguage === lang.value ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => handleLanguageSelect(lang.value)}
          >
            <CardContent className="flex items-center p-4">
              <Globe className="h-6 w-6 mr-3 text-primary" />
              <div>
                <h2 className="font-semibold">{lang.nativeName}</h2>
                <p className="text-sm text-muted-foreground">{lang.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card
          className="cursor-pointer transition-all hover:shadow-lg"
          onClick={handleCreateLanguage}
        >
          <CardContent className="flex items-center justify-center p-4 h-full">
            <Plus className="h-6 w-6 mr-2 text-primary" />
            <span>{t("createLanguage")}</span>
          </CardContent>
        </Card>
      </div>
      {filteredLanguages.length === 0 && !isCreatingLanguage && (
        <p className="text-center text-muted-foreground mt-8">
          {t("noLanguageFound")}
        </p>
      )}

      <Dialog open={isCreatingLanguage} onOpenChange={setIsCreatingLanguage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createLanguage")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder={t("languageName")}
              value={newLanguage.name}
              onChange={(e) =>
                setNewLanguage({ ...newLanguage, name: e.target.value })
              }
            />
            <Input
              placeholder={t("languageCode")}
              value={newLanguage.code}
              onChange={(e) =>
                setNewLanguage({ ...newLanguage, code: e.target.value })
              }
            />
            <Input
              placeholder={t("nativeName")}
              value={newLanguage.nativeName}
              onChange={(e) =>
                setNewLanguage({ ...newLanguage, nativeName: e.target.value })
              }
            />
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md">
                <p>{error}</p>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreatingLanguage(false)}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleSaveNewLanguage}>{t("save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LanguageSelector;
