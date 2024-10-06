// src/App.tsx
import React, { Suspense } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import MainContainer from "./pages/MainContainer";

const App: React.FC = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<div>Loading...</div>}>
        <MainContainer />
      </Suspense>
    </I18nextProvider>
  );
};

export default App;
