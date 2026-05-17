module.exports = {
  expo: {
    name: "Proje2",
    slug: "Proje2",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: { supportsTablet: true },
    android: {
      package: "com.anonymous.proje2",
      adaptiveIcon: { backgroundColor: "#ffffff" },
      edgeToEdgeEnabled: true,
      permissions: ["android.permission.health.READ_STEPS"],
    },
    plugins: [
      "expo-router",
      "expo-health-connect",
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 26,
            compileSdkVersion: 35,
            targetSdkVersion: 35,
          },
        },
      ],
    ],
  },
};
