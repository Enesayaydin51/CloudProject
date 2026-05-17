import React, { useRef, useEffect } from "react";
import { StyleSheet, View, Text, Platform, Pressable, Animated, Dimensions } from "react-native";
import {
  HomePage,
  ProfilePage,
  ExercisesPage,
  DietPage,
  StepPage,
  ExercisesDetailPage,
  AchievementsPage,
} from "../screens";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Ionicons from "@expo/vector-icons/Ionicons";
import { FontAwesome6 } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { playClickSound } from "../utils/clickSound";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const { width } = Dimensions.get("window");

const BAR_MARGIN = 30;
const BAR_WIDTH = width - BAR_MARGIN;
const TAB_WIDTH = BAR_WIDTH / 5;

/** Özel kayan animasyonlu tab bar */
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * TAB_WIDTH,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  return (
    <View
      style={[
        styles.tabBarContainer,
        { backgroundColor: colors.barBg },
        Platform.select({
          ios: {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
          },
          android: { elevation: 10 },
        }),
      ]}
    >
      <Animated.View
        style={[
          styles.slidingIndicator,
          {
            width: TAB_WIDTH,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={[styles.indicatorPill, { backgroundColor: colors.primaryLight }]} />
      </Animated.View>

      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          playClickSound();
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName;
        let IconComponent;
        let label;
        let iconSize = 24;

        switch (route.name) {
          case "Home":
            IconComponent = Ionicons;
            iconName = isFocused ? "home" : "home-outline";
            label = t("nav.home");
            iconSize = 22;
            break;
          case "Exercises":
            IconComponent = FontAwesome6;
            iconName = "dumbbell";
            label = t("nav.exercises");
            iconSize = 18;
            break;
          case "Diet":
            IconComponent = MaterialCommunityIcons;
            iconName = isFocused ? "food-apple" : "food-apple-outline";
            label = t("nav.diet");
            iconSize = 25;
            break;
          case "Steppage":
            IconComponent = MaterialCommunityIcons;
            iconName = "walk";
            label = t("nav.step");
            iconSize = 25;
            break;
          case "Profile":
            IconComponent = Ionicons;
            iconName = isFocused ? "person" : "person-outline";
            label = t("nav.profile");
            iconSize = 22;
            break;
          default:
            IconComponent = Ionicons;
            iconName = "home";
            label = "";
        }

        return (
          <Pressable key={index} onPress={onPress} style={styles.tabButton}>
            <View style={styles.iconContainer}>
              <IconComponent
                name={iconName}
                size={iconSize}
                color={isFocused ? colors.primary : colors.textLight}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: colors.textLight },
                isFocused && { color: colors.primary, fontWeight: "800" },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const UserTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Exercises" component={ExercisesPage} />
      <Tab.Screen name="Diet" component={DietPage} />
      <Tab.Screen name="Steppage" component={StepPage} />
      <Tab.Screen name="Profile" component={ProfilePage} />
    </Tab.Navigator>
  );
};

const UserStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserTabs" component={UserTabs} />
      <Stack.Screen name="ExercisesDetailPage" component={ExercisesDetailPage} />
      <Stack.Screen name="AchievementsPage" component={AchievementsPage} />
    </Stack.Navigator>
  );
};

export default UserStack;

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 30 : 20,
    left: 15,
    right: 15,
    height: 75,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  slidingIndicator: {
    position: "absolute",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  indicatorPill: {
    width: 52,
    height: 38,
    borderRadius: 16,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    zIndex: 1,
  },
  iconContainer: {
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
});
