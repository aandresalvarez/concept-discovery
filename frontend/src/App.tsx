import "./index.css";
import "./App.css";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

const MainContainer = () => {
  const [customLanguage, setCustomLanguage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    if (value !== "custom") {
      setCustomLanguage("");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <div
        className="bg-primary text-primary-foreground fixed top-0 left-0 right-0 z-50 shadow-md"
        style={{ minHeight: "1.5rem" }}
      >
        <div className="container mx-auto flex justify-between items-center">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar left */}
        <aside className="w-1/6 p-4 hidden md:block"></aside>

        {/* Main content area */}
        <main className="flex-1 p-4 relative max-w-4xl mx-auto">
          {/* Language Selection */}
          <div className="flex space-x-4 mb-4">
            <Select
              onValueChange={handleLanguageChange}
              value={selectedLanguage}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {selectedLanguage === "custom" && (
              <Input
                type="text"
                placeholder="Enter your language"
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                className="w-[200px]"
              />
            )}
          </div>

          {/* Search Box */}
          <div className="relative mb-4">
            <Input
              type="text"
              placeholder="Buscar"
              className="pl-10 pr-4 py-2 w-full rounded-full"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={20}
            />
          </div>

          {/* Disambiguation */}
          <div className="divider divider-start text-primary">
            Desambiguación
          </div>
          <Card
            className="mb-4 hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => console.log("Card clicked")}
          >
            <CardContent className="p-4">
              <h2 className="text-xl font-bold">Resfriado:</h2>
              <p className="text-base mt-2">
                <strong>Definición:</strong> "Constipado" en español puede
                significar un resfriado común, una infección viral que causa
                síntomas como congestión nasal y tos.
                <br />
                <strong>Categoría:</strong> Dominio de Observación - Síntomas
              </p>
            </CardContent>
          </Card>
          <Card
            className="mb-4 hover:bg-accent hover:text-accent-foreground cursor-pointer"
            onClick={() => console.log("Card clicked")}
          >
            <CardContent className="p-4">
              <h2 className="text-xl font-bold">Estreñimiento:</h2>
              <p className="text-base mt-2">
                <strong>Definición:</strong> "Constipado" también puede
                referirse a estreñimiento, una condición en la que una persona
                tiene dificultad para evacuar las heces.
                <br />
                <strong>Categoría:</strong> Dominio de Condiciones - Trastornos
                Digestivos
              </p>
            </CardContent>
          </Card>

          {/* Synonym Identification */}
          <div className="divider divider-start text-primary">
            Identificación de Sinónimos
          </div>
          <ul className="mb-4">
            {["Resfriado", "Catarro", "Congestión nasal", "Estreñimiento"].map(
              (synonym, index) => (
                <li
                  key={index}
                  className="p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={() => console.log(`Synonym clicked: ${synonym}`)}
                >
                  <strong>Nombre en Español:</strong> {synonym}
                </li>
              ),
            )}
          </ul>

          {/* Medical Concepts */}
          <div className="divider divider-start text-primary">
            Conceptos Médicos para "Resfriado"
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-primary">Opción</TableHead>
                <TableHead className="text-primary">ID del Concepto</TableHead>
                <TableHead className="text-primary">Nombre</TableHead>
                <TableHead className="text-primary">Dominio</TableHead>
                <TableHead className="text-primary">Vocabulario</TableHead>
                <TableHead className="text-primary">
                  Concepto Estándar
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  id: 4224149,
                  name: "Resfriado",
                  domain: "Valor de Medición",
                  vocabulary: "SNOMED",
                  standard: "Estándar",
                },
                {
                  id: 4266493,
                  name: "Aglutinina de Resfriado",
                  domain: "Observación",
                  vocabulary: "SNOMED",
                  standard: "Estándar",
                },
                // Add more rows as needed
              ].map((concept, index) => (
                <TableRow key={concept.id} className="hover:bg-muted">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{concept.id}</TableCell>
                  <TableCell>{concept.name}</TableCell>
                  <TableCell>{concept.domain}</TableCell>
                  <TableCell>{concept.vocabulary}</TableCell>
                  <TableCell>{concept.standard}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Recommendation */}
          <div className="divider divider-start text-primary">
            Recomendación
          </div>
          <p className="mb-4">
            Recomendamos continuar explorando el concepto Cold con ID 4224149
            como el concepto estándar. Verifique en Athena:
            <a
              href="https://athena.ohdsi.org/search-terms/terms/4224149"
              className="text-primary hover:underline"
            >
              https://athena.ohdsi.org/search-terms/terms/4224149
            </a>
          </p>
        </main>

        {/* Sidebar right */}
        <aside className="w-1/6 p-4 hidden md:block"></aside>
      </div>

      {/* Footer */}
      <footer className="p-4 bg-background text-foreground text-center">
        <p>© 2024</p>
      </footer>
    </div>
  );
};

export default MainContainer;
