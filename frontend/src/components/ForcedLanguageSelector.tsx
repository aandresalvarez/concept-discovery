import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, X, Globe, Plus, AlertCircle, Loader2 } from "lucide-react";

interface Language {
  value: string;
  label: string;
  nativeName: string;
}

interface LanguageSelectorProps {
  onLanguageSelected: (language: string) => void;
}

const CreateLanguageDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (languageName: string) => Promise<void>;
  t: (key: string) => string;
}> = ({ isOpen, onClose, onSave, t }) => {
  const [newLanguageName, setNewLanguageName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (value: string) => {
    setNewLanguageName(value);
    setError(value.length < 2 ? t("languageNameError") : "");
  };

  const handleSave = async () => {
    if (newLanguageName.length >= 2) {
      setIsLoading(true);
      setError("");
      try {
        await onSave(newLanguageName);
        setIsSuccess(true);
        setNewLanguageName("");
        setTimeout(() => {
          setIsSuccess(false);
          window.location.reload(); // Refresh the page after successful creation
        }, 2000);
      } catch (err) {
        setError(t("errorCreatingLanguage"));
      } finally {
        setIsLoading(false);
      }
    } else {
      setError(t("languageNameError"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center">
            <Globe className="w-6 h-6 mr-2" />
            {t("createLanguage")}
          </DialogTitle>
          <DialogDescription>
            {t("createLanguageDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-4">
          <Label htmlFor="languageName" className="text-lg font-semibold">
            {t("languageName")}
          </Label>
          <Input
            id="languageName"
            value={newLanguageName}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={t("languageNamePlaceholder")}
            className="text-lg p-6"
            disabled={isLoading || isSuccess}
          />
          {error && (
            <p className="text-sm text-destructive flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </p>
          )}
          {isLoading && (
            <p className="text-sm text-muted-foreground flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("creatingLanguage")}
            </p>
          )}
          {isSuccess && (
            <p className="text-sm text-green-600 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              {t("languageCreatedSuccess")}
            </p>
          )}
        </div>
        <DialogFooter className="flex justify-between items-center mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={newLanguageName.length < 2 || isLoading || isSuccess}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageSelected,
}) => {
  const { t, i18n } = useTranslation("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [languageOptions, setLanguageOptions] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isCreatingLanguage, setIsCreatingLanguage] = useState(false);
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

  const handleSaveNewLanguage = async (languageName: string) => {
    try {
      const response = await axios.get(
        `/api/language_info?input_text=${encodeURIComponent(languageName)}`,
      );
      const languageInfo = response.data;

      const createResponse = await axios.post("/api/create_language", {
        name: languageInfo.name,
        code: languageInfo.code,
        native_name: languageInfo.nativeName,
      });

      if (createResponse.data.success) {
        setError(null);
        await fetchLanguages();
      } else {
        throw new Error(
          createResponse.data.message || t("failedToCreateLanguage"),
        );
      }
    } catch (err: any) {
      console.error("Error creating language:", err);
      throw err;
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

      <CreateLanguageDialog
        isOpen={isCreatingLanguage}
        onClose={() => setIsCreatingLanguage(false)}
        onSave={handleSaveNewLanguage}
        t={t}
      />

      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
