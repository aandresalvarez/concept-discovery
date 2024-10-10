// src/types/index.ts

export interface LanguageSelectorProps {
  onLanguageChange: (lang: string) => void;
}

export interface SearchBoxProps {
  onSearch: (term: string) => void;
  onLanguageChange: (lang: string) => void;
  placeholder?: string;
  selectedLanguage: string;
  showLangSelection?: boolean; // New optional prop
}

export interface DisambiguationOption {
  term: string;
  definition: string;
  category: string;
}

export interface DisambiguationProps {
  options: DisambiguationOption[];
  onSelect: (option: DisambiguationOption) => void;
}

export interface SynonymListProps {
  synonyms: string[];
  onSynonymClick: (synonym: string) => void;
}

export interface MedicalConcept {
  id: number;
  name: string;
  domain: string;
  vocabulary: string;
  standard: string;
}

export interface MedicalConceptsTableProps {
  concepts: MedicalConcept[];
}

export interface SearchResults {
  disambiguation: DisambiguationOption[];
  synonyms: string[];
  concepts: MedicalConcept[];
}
