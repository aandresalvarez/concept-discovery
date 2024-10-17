import React from "react";
import { useTranslation } from "react-i18next";

const Header: React.FC = () => {
  const { t } = useTranslation("mainContainer");

  return (
    <header className="bg-primary text-primary-foreground p-2 shadow-md">
      <div className="container mx-auto">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">
          {t("title")}
        </h1>
      </div>
    </header>
  );
};

export default Header;
