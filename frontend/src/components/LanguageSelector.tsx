// src/components/LanguageSelector.tsx

import React, { useState } from "react";
import { Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface LanguageSelectorProps {
  onLanguageChange: (language: string) => void;
  initialLanguage?: string;
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

export function LanguageSelector({
  onLanguageChange,
  initialLanguage = "en",
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [customLanguage, setCustomLanguage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    onLanguageChange(value);
    setOpen(false);
  };

  const handleCustomLanguageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setCustomLanguage(value);
    if (value) {
      setSelectedLanguage("custom");
      onLanguageChange(value);
    }
  };

  const renderContent = () => (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-2 mb-4">
        {languageOptions.map((option) => (
          <Button
            key={option.value}
            variant={selectedLanguage === option.value ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleLanguageChange(option.value)}
          >
            {option.label}
            {selectedLanguage === option.value && (
              <Check className="ml-2 h-4 w-4" />
            )}
          </Button>
        ))}
      </div>
      <div className="mt-4">
        <Input
          type="text"
          placeholder="Enter custom language"
          value={customLanguage}
          onChange={handleCustomLanguageChange}
          className={`w-full ${selectedLanguage === "custom" ? "border-primary" : ""}`}
        />
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="h-10 w-10 rounded-full"
            variant="secondary"
          >
            <Languages className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Language</DialogTitle>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          className="h-10 w-10 rounded-full"
          variant="secondary"
        >
          <Languages className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Select Language</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">{renderContent()}</div>
      </DrawerContent>
    </Drawer>
  );
}

export default LanguageSelector;
