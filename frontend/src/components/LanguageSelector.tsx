// src/components/LanguageSelector.tsx

import React, { useState } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { LanguageSelectorProps } from "@/types";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageChange,
}) => {
  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
    { value: "custom", label: "Custom" },
  ];

  const [customLanguage, setCustomLanguage] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const isMobile = useMediaQuery("(max-width: 768px)"); // Custom hook to check screen size

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    if (value !== "custom") {
      setCustomLanguage("");
      onLanguageChange(value);
    }
  };

  const handleCustomLanguageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setCustomLanguage(value);
    onLanguageChange(value);
  };

  return (
    <div className="flex items-center justify-center space-x-4 mb-4">
      <h2 className="text-2xl font-bold">Search in any language</h2>
      {isMobile ? (
        // Use Drawer on mobile devices
        <Drawer>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Languages size={24} />
              <span>Select Language</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="p-6">
            <DialogHeader>
              <DialogTitle>Select Language</DialogTitle>
              <DialogDescription>
                Choose a language or enter a custom one below.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {languageOptions.map((option) => (
                <div key={option.value} className="mb-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleLanguageChange(option.value)}
                  >
                    {option.label}
                  </Button>
                </div>
              ))}
              {selectedLanguage === "custom" && (
                <Input
                  type="text"
                  placeholder="Enter your language"
                  className="mt-4"
                  value={customLanguage}
                  onChange={handleCustomLanguageChange}
                />
              )}
            </div>
          </DialogContent>
        </Drawer>
      ) : (
        // Use Dialog on desktop
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Languages size={24} />
              <span>Select Language</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="p-6">
            <DialogHeader>
              <DialogTitle>Select Language</DialogTitle>
              <DialogDescription>
                Choose a language or enter a custom one below.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {languageOptions.map((option) => (
                <div key={option.value} className="mb-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleLanguageChange(option.value)}
                  >
                    {option.label}
                  </Button>
                </div>
              ))}
              {selectedLanguage === "custom" && (
                <Input
                  type="text"
                  placeholder="Enter your language"
                  className="mt-4"
                  value={customLanguage}
                  onChange={handleCustomLanguageChange}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LanguageSelector;
