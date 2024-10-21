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
import { Search, X, Globe, Plus, Check, AlertCircle } from "lucide-react";

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
  onSave: (language: {
    name: string;
    code: string;
    nativeName: string;
  }) => void;
  t: (key: string) => string;
}> = ({ isOpen, onClose, onSave, t }) => {
  const [step, setStep] = useState(1);
  const [newLanguage, setNewLanguage] = useState({
    name: "",
    code: "",
    nativeName: "",
  });
  const [errors, setErrors] = useState({ name: "", code: "", nativeName: "" });

  const validateField = (field: string, value: string) => {
    switch (field) {
      case "name":
        return value.length < 2 ? t("languageNameError") : "";
      case "code":
        return value.length !== 2 ? t("languageCodeError") : "";
      case "nativeName":
        return value.length < 2 ? t("nativeNameError") : "";
      default:
        return "";
    }
  };

  const handleChange = (field: string, value: string) => {
    setNewLanguage((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return newLanguage.name.length > 1 && !errors.name;
      case 2:
        return newLanguage.code.length === 2 && !errors.code;
      case 3:
        return newLanguage.nativeName.length > 1 && !errors.nativeName;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 3) setStep((prev) => prev + 1);
    else onSave(newLanguage);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Label htmlFor="languageName" className="text-lg font-semibold">
              {t("languageName")}
            </Label>
            <Input
              id="languageName"
              value={newLanguage.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder={t("languageNamePlaceholder")}
              className="text-lg p-6"
            />
            <p className="text-sm text-muted-foreground">
              {t("languageNameDescription")}
            </p>
            {errors.name && (
              <p className="text-sm text-destructive flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.name}
              </p>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <Label htmlFor="languageCode" className="text-lg font-semibold">
              {t("languageCode")}
            </Label>
            <Input
              id="languageCode"
              value={newLanguage.code}
              onChange={(e) =>
                handleChange("code", e.target.value.toLowerCase())
              }
              placeholder={t("languageCodePlaceholder")}
              className="text-lg p-6 uppercase"
              maxLength={2}
            />
            <p className="text-sm text-muted-foreground">
              {t("languageCodeDescription")}
            </p>
            {errors.code && (
              <p className="text-sm text-destructive flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.code}
              </p>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <Label htmlFor="nativeName" className="text-lg font-semibold">
              {t("nativeName")}
            </Label>
            <Input
              id="nativeName"
              value={newLanguage.nativeName}
              onChange={(e) => handleChange("nativeName", e.target.value)}
              placeholder={t("nativeNamePlaceholder")}
              className="text-lg p-6"
            />
            <p className="text-sm text-muted-foreground">
              {t("nativeNameDescription")}
            </p>
            {errors.nativeName && (
              <p className="text-sm text-destructive flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.nativeName}
              </p>
            )}
          </div>
        );
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
        <div className="mt-6">
          <div className="flex justify-between mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-secondary-foreground"
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
            ))}
          </div>
          {renderStep()}
        </div>
        <DialogFooter className="flex justify-between items-center mt-6">
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleNext} disabled={!isStepValid()}>
            {step === 3 ? t("save") : t("next")}
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

  const handleSaveNewLanguage = async (newLanguage: {
    name: string;
    code: string;
    nativeName: string;
  }) => {
    try {
      const { name, code, nativeName } = newLanguage;

      const response = await axios.post("/api/create_language", {
        name,
        code,
        native_name: nativeName,
      });

      if (response.data.success) {
        setIsCreatingLanguage(false);
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
