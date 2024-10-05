import * as React from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import TypewriterEffect from "@/components/Typewriter-effect";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

interface LanguageSelectorProps {
  onLanguageChange: (language: string) => void;
}

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "custom", label: "Custom" },
];

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);

  return matches;
}

export default function LanguageSelector({
  onLanguageChange,
}: LanguageSelectorProps) {
  const [customLanguage, setCustomLanguage] = React.useState("");
  const [selectedLanguage, setSelectedLanguage] = React.useState("");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleLanguageChange = React.useCallback(
    (value: string) => {
      setSelectedLanguage(value);
      if (value !== "custom") {
        setCustomLanguage("");
        onLanguageChange(value);
      }
    },
    [onLanguageChange],
  );

  const handleCustomLanguageChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCustomLanguage(value);
      onLanguageChange(value);
    },
    [onLanguageChange],
  );

  const renderLanguageOptions = () => (
    <div className="mt-4 space-y-2">
      {languageOptions.map((option) => (
        <Button
          key={option.value}
          variant="ghost"
          className="w-full justify-start"
          onClick={() => handleLanguageChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
      {selectedLanguage === "custom" && (
        <Input
          type="text"
          placeholder="Enter your language"
          value={customLanguage}
          onChange={handleCustomLanguageChange}
          className="mt-2 w-full"
        />
      )}
    </div>
  );

  return (
    <div className="flex items-center justify-between px-4 py-6 mb-4 w-full max-w-2xl mx-auto">
      <div className="flex items-center space-x-4">
        {isMobile ? (
          <Drawer>
            <DrawerTrigger asChild>
              <Button size="icon" className="h-10 w-10">
                <Languages className="h-6 w-6" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="p-4">
              <DrawerHeader>
                <DrawerTitle>Select Language</DrawerTitle>
                <DrawerDescription>
                  Choose a language or enter a custom one below.
                </DrawerDescription>
              </DrawerHeader>
              {renderLanguageOptions()}
              <DrawerClose />
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" className="h-10 w-10">
                <Languages className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="p-6 max-w-lg mx-auto">
              <DialogHeader>
                <DialogTitle>Select Language</DialogTitle>
                <DialogDescription>
                  Choose a language or enter a custom one below.
                </DialogDescription>
              </DialogHeader>
              {renderLanguageOptions()}
            </DialogContent>
          </Dialog>
        )}
        <TypewriterEffect
          typingSpeed={80}
          deletingSpeed={40}
          pauseDuration={2000}
          width="auto"
          height="60px"
          fontSize="1.5rem"
        />
      </div>
    </div>
  );
}
