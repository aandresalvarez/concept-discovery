import { useState, useEffect } from "react";

interface Phrase {
  text: string;
  color: string;
}

const defaultPhrases: Phrase[] = [
  { text: "Search in any language", color: "text-primary" },
  { text: "Busca en cualquier idioma", color: "text-secondary" },
  { text: "Suche in jeder Sprache", color: "text-accent" },
  { text: "Recherchez dans n'importe quelle langue", color: "text-muted" },
];

interface TypewriterEffectProps {
  phrases?: Phrase[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  width?: string;
  height?: string;
  fontSize?: string;
  backgroundColor?: string;
}

export default function TypewriterEffect({
  phrases = defaultPhrases,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 1500,
  width = "100%",
  height = "100px",
  fontSize = "2rem",
  backgroundColor = "transparent",
}: TypewriterEffectProps) {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex].text;
    const timer = setTimeout(
      () => {
        if (!isDeleting && text === currentPhrase) {
          setTimeout(() => setIsDeleting(true), pauseDuration);
        } else if (isDeleting && text === "") {
          setIsDeleting(false);
          setPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
        } else if (isDeleting) {
          setText(currentPhrase.substring(0, text.length - 1));
        } else {
          setText(currentPhrase.substring(0, text.length + 1));
        }
      },
      isDeleting ? deletingSpeed : typingSpeed,
    );
    return () => clearTimeout(timer);
  }, [
    text,
    isDeleting,
    phraseIndex,
    phrases,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
  ]);

  return (
    <div
      className="flex items-start justify-start"
      style={{ width, height, backgroundColor }}
    >
      <div className="font-bold relative" style={{ fontSize }}>
        <span className={`${phrases[phraseIndex].color}`}>{text}</span>
        <span className="inline-block w-[0.05em] h-[1.2em] bg-primary ml-[1px] animate-blink" />
      </div>
    </div>
  );
}
