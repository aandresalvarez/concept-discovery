import React from "react";
import { useTranslation } from "react-i18next";
import { Toggle } from "@/components/ui/toggle";
import { ChartPie } from "lucide-react";

interface HeaderProps {
  showDashboard: boolean;
  toggleDashboard: () => void;
}

const Header: React.FC<HeaderProps> = ({ showDashboard, toggleDashboard }) => {
  const { t } = useTranslation("mainContainer");

  return (
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
  );
};

export default Header;
