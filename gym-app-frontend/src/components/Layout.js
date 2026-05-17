import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";

const Layout = ({ children }) => {
  const { resolvedMode, colors } = useTheme();

  if (resolvedMode === "dark") {
    return <View style={[styles.background, { backgroundColor: colors.bg }]}>{children}</View>;
  }

  return (
    <ImageBackground
      source={require("../../assets/images/backgroundimg.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default Layout;
