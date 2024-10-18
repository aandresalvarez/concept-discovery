import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Dashboard from "@/components/Dashboard"; // Adjust the import path as necessary
import { Toggle } from "@/components/ui/toggle";
import { ChartPie } from "lucide-react";

const Header: React.FC = () => {
  const { t } = useTranslation("mainContainer");
  const [showDashboard, setShowDashboard] = useState(false);

  const toggleDashboard = () => {
    setShowDashboard(!showDashboard);
  };

  return (
    <>
      <header className="bg-primary text-primary-foreground p-2 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">
            {t("title")}
          </h1>
          <Toggle pressed={showDashboard} onPressedChange={toggleDashboard}>
            <ChartPie />
          </Toggle>
        </div>
      </header>
      {showDashboard && (
        <div className="container mx-auto mt-4">
          <Dashboard />
        </div>
      )}
    </>
  );
};

export default Header;
