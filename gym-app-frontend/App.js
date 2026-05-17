import React from "react";
import RootNavigation from "./src/navigation/rootNavigation";
import { Provider } from "react-redux";
import { store } from "./src/redux/store";
import { ThemeProvider } from "./src/theme/ThemeContext";
import { LanguageProvider } from "./src/i18n/LanguageContext";

const App = () => {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <ThemeProvider>
          <RootNavigation />
        </ThemeProvider>
      </LanguageProvider>
    </Provider>
  );
};

export default App

