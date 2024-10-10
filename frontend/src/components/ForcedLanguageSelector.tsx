// src/components/ForcedLanguageSelector.tsx

import React, { useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Languages, Check } from "lucide-react"; // Added Languages icon
import { useTranslation } from "react-i18next";

interface ForcedLanguageSelectorProps {
  onLanguageSelected: (language: string) => void;
}

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "ru", label: "Русский" },
  { value: "zh", label: "中文" },
];

const ForcedLanguageSelector: React.FC<ForcedLanguageSelectorProps> = ({
  onLanguageSelected,
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const { i18n, t } = useTranslation("common"); // Assuming "common" namespace

  const handleLanguageSelect = (language: string) => {
    i18n.changeLanguage(language);
    setSelectedLanguage(language);
    onLanguageSelected(language);
  };

  const renderLanguageOptions = () => (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {languageOptions.map((option) => (
        <Button
          key={option.value}
          variant={selectedLanguage === option.value ? "default" : "ghost"}
          className="w-full justify-start flex items-center"
          onClick={() => handleLanguageSelect(option.value)}
        >
          {option.label}
          {selectedLanguage === option.value && (
            <Check className="ml-2 h-4 w-4" />
          )}
        </Button>
      ))}
    </div>
  );

  return isDesktop ? (
    <Dialog
      open
      onOpenChange={() => {
        /* Prevent closing */
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex items-center">
          <Languages className="mr-2 h-6 w-6" /> {/* Languages icon added */}
          <DialogTitle>{t("selectYourLanguage")}</DialogTitle>
        </DialogHeader>
        {renderLanguageOptions()}
      </DialogContent>
    </Dialog>
  ) : (
    <Drawer
      open
      onOpenChange={() => {
        /* Prevent closing */
      }}
    >
      <DrawerContent>
        <DrawerHeader className="flex items-center">
          <Languages className="mr-2 h-6 w-6" /> {/* Languages icon added */}
          <DrawerTitle>{t("selectYourLanguage")}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">{renderLanguageOptions()}</div>
      </DrawerContent>
    </Drawer>
  );
};

export default ForcedLanguageSelector;
