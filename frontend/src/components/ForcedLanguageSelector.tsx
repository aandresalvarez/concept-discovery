import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Languages, Plus, Search, Check, X } from "lucide-react";

interface Language {
  value: string;
  label: string;
  nativeName: string;
}

interface ForcedLanguageSelectorProps {
  onLanguageSelected: (language: string) => void;
}

const initialLanguageOptions: Language[] = [
  { value: "en", label: "English", nativeName: "English" },
  { value: "es", label: "Spanish", nativeName: "Español" },
  { value: "fr", label: "French", nativeName: "Français" },
  { value: "de", label: "German", nativeName: "Deutsch" },
  { value: "it", label: "Italian", nativeName: "Italiano" },
  { value: "pt", label: "Portuguese", nativeName: "Português" },
  { value: "ru", label: "Russian", nativeName: "Русский" },
  { value: "zh", label: "Chinese", nativeName: "中文" },
  { value: "ja", label: "Japanese", nativeName: "日本語" },
  { value: "ko", label: "Korean", nativeName: "한국어" },
  { value: "ar", label: "Arabic", nativeName: "العربية" },
  { value: "hi", label: "Hindi", nativeName: "हिन्दी" },
  { value: "po", label: "Polish", nativeName: "Polski" },
  { value: "tr", label: "Turkish", nativeName: "Türkçe" },
];

const ForcedLanguageSelector: React.FC<ForcedLanguageSelectorProps> = ({
  onLanguageSelected,
}) => {
  const { t, i18n } = useTranslation("common");
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [searchQuery, setSearchQuery] = useState("");
  const [languageOptions, setLanguageOptions] = useState(
    initialLanguageOptions,
  );
  const [filteredLanguages, setFilteredLanguages] = useState(languageOptions);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isCreatingLanguage, setIsCreatingLanguage] = useState(false);
  const [newLanguage, setNewLanguage] = useState({
    name: "",
    code: "",
    nativeName: "",
  });
  const [error, setError] = useState<string | null>(null);

  const filterLanguages = useCallback(() => {
    const filtered = languageOptions.filter(
      (lang) =>
        lang.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.value.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredLanguages(filtered);
  }, [searchQuery, languageOptions]);

  useEffect(() => {
    filterLanguages();
  }, [filterLanguages]);

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    i18n.changeLanguage(language);
    onLanguageSelected(language);
  };

  const handleCreateLanguage = () => {
    setIsCreatingLanguage(true);
    setError(null);
  };

  const handleSaveNewLanguage = async () => {
    try {
      if (!newLanguage.name || !newLanguage.code || !newLanguage.nativeName) {
        setError(t("allFieldsRequired"));
        return;
      }

      const response = await axios.post("/api/create_language", {
        name: newLanguage.name,
        code: newLanguage.code,
        native_name: newLanguage.nativeName,
      });

      if (response.data.success) {
        const newLangOption = {
          value: newLanguage.code,
          label: newLanguage.name,
          nativeName: newLanguage.nativeName,
        };
        setLanguageOptions([...languageOptions, newLangOption]);
        setIsCreatingLanguage(false);
        setNewLanguage({ name: "", code: "", nativeName: "" });
        setError(null);
      } else {
        setError(response.data.message || t("failedToCreateLanguage"));
      }
    } catch (error) {
      console.error("Error creating language:", error);
      setError(t("errorCreatingLanguage"));
    }
  };

  const renderLanguageButton = (lang: Language) => (
    <Button
      key={lang.value}
      variant={selectedLanguage === lang.value ? "default" : "outline"}
      className="justify-start text-left h-auto py-3 w-full"
      onClick={() => handleLanguageSelect(lang.value)}
    >
      <div className="flex flex-col items-start">
        <span className="font-semibold">{lang.nativeName}</span>
        <span className="text-sm text-muted-foreground">{lang.label}</span>
      </div>
      {selectedLanguage === lang.value && <Check className="ml-auto h-4 w-4" />}
    </Button>
  );

  const renderLanguageList = () => (
    <ScrollArea className="h-[calc(100vh-200px)] mt-4">
      <div className="pr-4 space-y-2">
        {filteredLanguages.map(renderLanguageButton)}
      </div>
    </ScrollArea>
  );

  const renderLanguageGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {filteredLanguages.map(renderLanguageButton)}
    </div>
  );

  const renderCreateLanguageForm = () => (
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
      {error && <p className="text-destructive">{error}</p>}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setIsCreatingLanguage(false)}>
          {t("cancel")}
        </Button>
        <Button onClick={handleSaveNewLanguage}>{t("save")}</Button>
      </div>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className={`sm:max-w-[425px] md:max-w-[600px] lg:max-w-[800px] ${!isDesktop ? "h-[100vh] max-h-[100vh] p-0" : ""}`}
      >
        <DialogHeader
          className={`flex items-center mb-4 ${!isDesktop ? "px-4 py-2 border-b" : ""}`}
        >
          <Languages className="mr-2 h-6 w-6" />
          <DialogTitle>{t("selectYourLanguage")}</DialogTitle>
        </DialogHeader>
        <div className={`flex flex-col gap-4 ${!isDesktop ? "px-4" : ""}`}>
          <div className="relative w-full">
            <Input
              type="text"
              placeholder={t("searchLanguage")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
              aria-label={t("searchLanguage")}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {isCreatingLanguage ? (
          renderCreateLanguageForm()
        ) : filteredLanguages.length > 0 ? (
          isDesktop ? (
            renderLanguageGrid()
          ) : (
            renderLanguageList()
          )
        ) : (
          <div className={`text-center mt-4 ${!isDesktop ? "px-4" : ""}`}>
            <p className="text-muted-foreground mb-2">{t("noLanguageFound")}</p>
            <Button onClick={handleCreateLanguage}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createLanguage")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForcedLanguageSelector;
