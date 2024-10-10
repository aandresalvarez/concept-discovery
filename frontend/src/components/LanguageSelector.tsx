// src/components/LanguageSelector.tsx

import React from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LanguageSelectorProps {
  onLanguageChange: (language: string) => void;
  selectedLanguage: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageChange,
  selectedLanguage,
}) => {
  const languages = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
    { code: "it", label: "Italiano" },
    { code: "pt", label: "Português" },
    { code: "ru", label: "Русский" },
    { code: "zh", label: "中文" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={selectedLanguage === lang.code ? "default" : "ghost"}
          onClick={() => onLanguageChange(lang.code)}
          className="flex items-center"
        >
          <Languages className="mr-2 h-4 w-4" />
          {lang.label}
        </Button>
      ))}
    </div>
  );
};

export default LanguageSelector;
