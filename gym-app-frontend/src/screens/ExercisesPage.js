import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated, // Animated eklendi
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import * as ImagePicker from "expo-image-picker";
import * as FileSystemLegacy from "expo-file-system/legacy";

import Layout from "../components/Layout";
import apiService from "../services/api";
import {
  normalizeMonthlyAiProgram,
  dayCompletionKey,
  buildProgramPayloadForApi,
} from "../utils/aiExerciseProgramUtils";
import { showNotificationsIfNewlyUnlocked } from "../utils/achievementNotifications";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";

const { width, height } = Dimensions.get("window");

// Animasyon hesaplamaları için sabitler
const TAB_CONTAINER_WIDTH = width - 40;
const TAB_WIDTH = TAB_CONTAINER_WIDTH / 3;

const muscleGridItemWidth = (width - 55) / 2;

function getExerciseCommonStyles(COLORS) {
  return StyleSheet.create({
    shadowLight: {
      ...Platform.select({
        ios: {
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.06,
          shadowRadius: 15,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    shadowPremium: {
      ...Platform.select({
        ios: {
          shadowColor: COLORS.purple,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 15,
        },
        android: {
          elevation: 6,
        },
      }),
    },
  });
}

const LOCAL_VIDEOS = {
  "Hanging Leg Raise": require("../../assets/videos/exercisesvideos/karın/HangingLegRaise.gif"),
  "Kicks": require("../../assets/videos/exercisesvideos/karın/Kicks.gif"),
  "Kneeling Cable Crunch": require("../../assets/videos/exercisesvideos/karın/KneelingCableCrunch.gif"),
  "Lying Leg Raise": require("../../assets/videos/exercisesvideos/karın/LyingLegRaise.jpg"),
  "Mountain Climber": require("../../assets/videos/exercisesvideos/karın/MountainClimberGirl.gif"),
  "Plank": require("../../assets/videos/exercisesvideos/karın/Plank.gif"),
  "Russian Twist": require("../../assets/videos/exercisesvideos/karın/RussianTwist.gif"),
  "Side Crunch": require("../../assets/videos/exercisesvideos/karın/SideCruch.gif"),
  "Side Twist": require("../../assets/videos/exercisesvideos/karın/SideTwist.gif"),
  "Weighted Crunch": require("../../assets/videos/exercisesvideos/karın/WeightedCrunch.gif"),
  "Weighted Plank": require("../../assets/videos/exercisesvideos/karın/WeightedPlank.gif"),
  "Abductor Machine": require("../../assets/videos/exercisesvideos/bacak/Abductor.gif"),
  "Adductor Machine": require("../../assets/videos/exercisesvideos/bacak/Adductor.gif"),
  "Back Squat": require("../../assets/videos/exercisesvideos/bacak/Back Squat.jpg"),
  "Barbell Front Squat": require("../../assets/videos/exercisesvideos/bacak/BarbellFrontSquat.gif"),
  "Barbell Sumo Deadlift": require("../../assets/videos/exercisesvideos/bacak/BarbellSumoDeadlift.gif"),
  "Bicycle": require("../../assets/videos/exercisesvideos/bacak/Bicycle.gif"),
  "Bicycle (Girl)": require("../../assets/videos/exercisesvideos/bacak/BicycleGirl.gif"),
  "Bodyweight Squat": require("../../assets/videos/exercisesvideos/bacak/BodyWeightSquatGirl.gif"),
  "Bulgarian Split Squat": require("../../assets/videos/exercisesvideos/bacak/BulgarianSplitSquat.gif"),
  "Cable Donkey Kickback": require("../../assets/videos/exercisesvideos/bacak/CableDonkeyKickback.gif"),
  "Dumbbell Goblet Squat": require("../../assets/videos/exercisesvideos/bacak/DumbellGobletSquat.gif"),
  "Glute Bridge": require("../../assets/videos/exercisesvideos/bacak/GluteBridge.gif"),
  "Hack Squat": require("../../assets/videos/exercisesvideos/bacak/HackSquat.gif"),
  "Hip Adductor (Girl)": require("../../assets/videos/exercisesvideos/bacak/HipAdductorGirl.jpg"),
  "Hip Thrust": require("../../assets/videos/exercisesvideos/bacak/HipThrusts.gif"),
  "Leg Extension": require("../../assets/videos/exercisesvideos/bacak/LegExtension.gif"),
  "Leg Press": require("../../assets/videos/exercisesvideos/bacak/LegPress.gif"),
  "Machine Calf Raise": require("../../assets/videos/exercisesvideos/bacak/MachineCalfRaise.gif"),
  "Smith Machine Calf Raise": require("../../assets/videos/exercisesvideos/bacak/SmithMachineCalfRaise.gif"),
  "Smith Machine Squat": require("../../assets/videos/exercisesvideos/bacak/SmithMachineSquat.gif"),
  "Treadmill": require("../../assets/videos/exercisesvideos/bacak/TreadmillGirl.gif"),
  "Barbell Curl": require("../../assets/videos/exercisesvideos/biceps/BarbellCurlGirl.gif"),
  "Concentration Curl": require("../../assets/videos/exercisesvideos/biceps/ConcentrationCurl.gif"),
  "Dumbbell Curl": require("../../assets/videos/exercisesvideos/biceps/DumbellCurl.gif"),
  "EZ Bar Curl": require("../../assets/videos/exercisesvideos/biceps/EzBarCurlGirl.gif"),
  "Hammer Curl": require("../../assets/videos/exercisesvideos/biceps/HammerCurls.gif"),
  "Preacher Curl": require("../../assets/videos/exercisesvideos/biceps/PreacherCurl.gif"),
  "Rope Curl": require("../../assets/videos/exercisesvideos/biceps/RopeCurl.gif"),
  "Scott Curl": require("../../assets/videos/exercisesvideos/biceps/ScotCurl.gif"),
  "Single Arm Cable Curl": require("../../assets/videos/exercisesvideos/biceps/SingleArmCableCurl.gif"),
  "Archer Push Up": require("../../assets/videos/exercisesvideos/göğüs/ArcherPushUp.gif"),
  "Cable Crossover": require("../../assets/videos/exercisesvideos/göğüs/CableCrossover.gif"),
  "Decline Barbell Bench Press": require("../../assets/videos/exercisesvideos/göğüs/DeclineBarbellBenchpress.gif"),
  "Decline Dumbbell Fly": require("../../assets/videos/exercisesvideos/göğüs/DeclineDumbbellFly.gif"),
  "Decline Push Up": require("../../assets/videos/exercisesvideos/göğüs/DeclinePushUp.gif"),
  "Diamond Push Up": require("../../assets/videos/exercisesvideos/göğüs/DiamondPushUp.gif"),
  "Dips": require("../../assets/videos/exercisesvideos/göğüs/Dips.gif"),
  "Flat Barbell Bench Press": require("../../assets/videos/exercisesvideos/göğüs/FlatBarbellBenchPress.gif"),
  "Flat Dumbbell Bench Press": require("../../assets/videos/exercisesvideos/göğüs/FlatDumbbellBenchPress.gif"),
  "Incline Dumbbell Bench Press": require("../../assets/videos/exercisesvideos/göğüs/InclineDumbbellBenchPress.gif"),
  "Incline Barbell Press": require("../../assets/videos/exercisesvideos/göğüs/InclineBarbellPress.gif"),
  "Incline Dumbbell Fly": require("../../assets/videos/exercisesvideos/göğüs/InclineDumbellFly.gif"),
  "Incline Machine Press": require("../../assets/videos/exercisesvideos/göğüs/InclineMachinePress.gif"),
  "Incline Push Up": require("../../assets/videos/exercisesvideos/göğüs/InclinePushUp.gif"),
  "Machine Press": require("../../assets/videos/exercisesvideos/göğüs/MachinePress.gif"),
  "Pec Deck": require("../../assets/videos/exercisesvideos/göğüs/PeckDeck.gif"),
  "Push Up": require("../../assets/videos/exercisesvideos/göğüs/PushUp.gif"),
  "Wide Grip Push Up": require("../../assets/videos/exercisesvideos/göğüs/WideGripPushUp.gif"),
  "Arnold Press": require("../../assets/videos/exercisesvideos/omuz/ArnoldPress.gif"),
  "Barbell Front Raise": require("../../assets/videos/exercisesvideos/omuz/BarbellFrontRaise.gif"),
  "Barbell Shoulder Press": require("../../assets/videos/exercisesvideos/omuz/BarbellShoulderPress.gif"),
  "Cable Front Raise": require("../../assets/videos/exercisesvideos/omuz/CableFrontRaise.gif"),
  "Cable Lateral Raise": require("../../assets/videos/exercisesvideos/omuz/CableLateralRaise.gif"),
  "Cable Rear Delt Fly": require("../../assets/videos/exercisesvideos/omuz/CableReardelt.gif"),
  "Dumbbell Upright Row": require("../../assets/videos/exercisesvideos/omuz/DumbellUprightRow.gif"),
  "Dumbbell Front Raise": require("../../assets/videos/exercisesvideos/omuz/DumbellFrontRaise.gif"),
  "Dumbbell Lateral Raise": require("../../assets/videos/exercisesvideos/omuz/DumbellLateralRaise.gif"),
  "Dumbbell Shoulder Press": require("../../assets/videos/exercisesvideos/omuz/DumbellShoulderPress.gif"),
  "Kneeling High Pulley Row": require("../../assets/videos/exercisesvideos/omuz/KneelingHighPulleyRow.gif"),
  "Lateral Raise Machine": require("../../assets/videos/exercisesvideos/omuz/LateralRaiseMachine.gif"),
  "Pec Deck Machine": require("../../assets/videos/exercisesvideos/omuz/PecDeckMachine.gif"),
  "Plate Front Raise": require("../../assets/videos/exercisesvideos/omuz/PlateFrontRaise.gif"),
  "Rope Pull Over": require("../../assets/videos/exercisesvideos/omuz/RopePullOver.gif"),
  "Seated Dumbbell Rear Delt": require("../../assets/videos/exercisesvideos/omuz/SeatedDumbellReardelt.gif"),
  "Seated Dumbbell Shoulder Press": require("../../assets/videos/exercisesvideos/omuz/SeatedDumbellShoulderPress.gif"),
  "Deadlift": require("../../assets/videos/exercisesvideos/sırt/Deadlift.gif"),
  "Barbell Romanian Deadlift": require("../../assets/videos/exercisesvideos/sırt/BarbellRomanianDeadlift.gif"),
  "Pull Up": require("../../assets/videos/exercisesvideos/sırt/PullUp.gif"),
  "Chin Up": require("../../assets/videos/exercisesvideos/sırt/ChinUp.gif"),
  "Close Grip Lat Pulldown": require("../../assets/videos/exercisesvideos/sırt/CloseGripLatPulldown.gif"),
  "Cable Row": require("../../assets/videos/exercisesvideos/sırt/CableRow.gif"),
  "Machine Row": require("../../assets/videos/exercisesvideos/sırt/MachineRow.gif"),
  "Machine Row (Up)": require("../../assets/videos/exercisesvideos/sırt/MachineRowUp.gif"),
  "Single Dumbbell Row": require("../../assets/videos/exercisesvideos/sırt/SingleDumbellRow.gif"),
  "T-Bar Row": require("../../assets/videos/exercisesvideos/sırt/Tbarrow.gif"),
  "Bench Dips": require("../../assets/videos/exercisesvideos/triceps/BenchDips.gif"),
  "Dips (Triceps)": require("../../assets/videos/exercisesvideos/triceps/Dips.gif"),
  "Diamond Push Up (Triceps)": require("../../assets/videos/exercisesvideos/triceps/DiamondPushUp.gif"),
  "Rope Pushdown": require("../../assets/videos/exercisesvideos/triceps/RopePushdown.gif"),
  "Dumbbell Triceps Extension": require("../../assets/videos/exercisesvideos/triceps/DumbellTriceps.gif"),
  "EZ Barbell Triceps Extension": require("../../assets/videos/exercisesvideos/triceps/EzBarbellTriceps.gif"),
};

function normalizeExerciseWord(word) {
  const w = word.toLowerCase().trim();
  const map = { dumbell: "dumbbell", dumbel: "dumbbell", barbel: "barbell", barbele: "barbell" };
  return map[w] || w;
}

function getWords(str) {
  return str.replace(/[()]/g, " ").split(/\s+/).map((s) => normalizeExerciseWord(s.trim())).filter((s) => s.length >= 2);
}

function getVideoForExerciseName(aiName) {
  if (!aiName || typeof aiName !== "string") return null;
  const trimmed = aiName.trim();
  if (LOCAL_VIDEOS[trimmed]) return LOCAL_VIDEOS[trimmed];
  const lower = trimmed.toLowerCase();
  const exactKey = Object.keys(LOCAL_VIDEOS).find((k) => k.toLowerCase() === lower);
  if (exactKey) return LOCAL_VIDEOS[exactKey];
  const aiWords = new Set(getWords(trimmed));
  const keyWordsMatch = Object.keys(LOCAL_VIDEOS).map((key) => {
    const keyWords = getWords(key);
    const allFound = keyWords.every((kw) => aiWords.has(kw));
    return allFound ? { key, wordCount: keyWords.length } : null;
  }).filter(Boolean);
  if (keyWordsMatch.length) {
    keyWordsMatch.sort((a, b) => b.wordCount - a.wordCount);
    return LOCAL_VIDEOS[keyWordsMatch[0].key];
  }
  const containing = Object.keys(LOCAL_VIDEOS).filter((k) => k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase()));
  if (containing.length) return LOCAL_VIDEOS[containing.sort((a, b) => b.length - a.length)[0]];
  return null;
}

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const EXERCISE_LIBRARY = {
  Karın: [
    { name: "Hanging Leg Raise", gif: LOCAL_VIDEOS["Hanging Leg Raise"], desc: "Alt karın odaklı, kontrollü kaldırış.", muscle_group: "Karın", level: "Orta" },
    { name: "Kicks", gif: LOCAL_VIDEOS["Kicks"], desc: "Core aktivasyonu ve alt karın için dinamik hareket.", muscle_group: "Karın", level: "Başlangıç" },
    { name: "Kneeling Cable Crunch", gif: LOCAL_VIDEOS["Kneeling Cable Crunch"], desc: "Kablo ile karın sıkıştırma, iyi izolasyon.", muscle_group: "Karın", level: "Orta" },
    { name: "Lying Leg Raise", gif: LOCAL_VIDEOS["Lying Leg Raise"], desc: "Alt karın için temel bacak kaldırma.", muscle_group: "Karın", level: "Başlangıç" },
    { name: "Mountain Climber", gif: LOCAL_VIDEOS["Mountain Climber"], desc: "Core + kardiyo, tempo kontrollü yapılmalı.", muscle_group: "Karın", level: "Başlangıç" },
    { name: "Plank", gif: LOCAL_VIDEOS["Plank"], desc: "Core stabilizasyonu, bel boşluğunu koru.", muscle_group: "Karın", level: "Başlangıç" },
    { name: "Russian Twist", gif: LOCAL_VIDEOS["Russian Twist"], desc: "Oblique odaklı rotasyon.", muscle_group: "Karın", level: "Orta" },
    { name: "Side Crunch", gif: LOCAL_VIDEOS["Side Crunch"], desc: "Yan karın için side crunch varyasyonu.", muscle_group: "Karın", level: "Başlangıç" },
    { name: "Side Twist", gif: LOCAL_VIDEOS["Side Twist"], desc: "Yan core rotasyon/direnç odaklı.", muscle_group: "Karın", level: "Orta" },
    { name: "Weighted Crunch", gif: LOCAL_VIDEOS["Weighted Crunch"], desc: "Ağırlıkla crunch, kontrollü nefes.", muscle_group: "Karın", level: "Orta" },
    { name: "Weighted Plank", gif: LOCAL_VIDEOS["Weighted Plank"], desc: "Plank üzerine yük bindirilmiş varyasyon.", muscle_group: "Karın", level: "İleri" },
  ],
  Bacak: [
    { name: "Back Squat", gif: LOCAL_VIDEOS["Back Squat"], desc: "Temel squat; core ve form kritik.", muscle_group: "Bacak", level: "Orta" },
    { name: "Barbell Front Squat", gif: LOCAL_VIDEOS["Barbell Front Squat"], desc: "Quadriceps odaklı squat varyasyonu.", muscle_group: "Bacak", level: "Orta" },
    { name: "Hack Squat", gif: LOCAL_VIDEOS["Hack Squat"], desc: "Makinede squat; bacak izolasyonu iyi.", muscle_group: "Bacak", level: "Başlangıç" },
    { name: "Dumbbell Goblet Squat", gif: LOCAL_VIDEOS["Dumbbell Goblet Squat"], desc: "Başlangıç için en iyi squat varyasyonlarından.", muscle_group: "Bacak", level: "Başlangıç" },
    { name: "Bodyweight Squat", gif: LOCAL_VIDEOS["Bodyweight Squat"], desc: "Vücut ağırlığı ile temel squat.", muscle_group: "Bacak", level: "Başlangıç" },
    { name: "Bulgarian Split Squat", gif: LOCAL_VIDEOS["Bulgarian Split Squat"], desc: "Tek bacak kuvvet + denge.", muscle_group: "Bacak", level: "Orta" },
    { name: "Leg Press", gif: LOCAL_VIDEOS["Leg Press"], desc: "Quadriceps + glute, ayak yerleşimi önemli.", muscle_group: "Bacak", level: "Başlangıç" },
    { name: "Leg Extension", gif: LOCAL_VIDEOS["Leg Extension"], desc: "Quadriceps izolasyonu.", muscle_group: "Bacak", level: "Başlangıç" },
    { name: "Machine Calf Raise", gif: LOCAL_VIDEOS["Machine Calf Raise"], desc: "Baldır için makine calf raise.", muscle_group: "Bacak", level: "Başlangıç" },
    { name: "Smith Machine Calf Raise", gif: LOCAL_VIDEOS["Smith Machine Calf Raise"], desc: "Smith ile calf raise.", muscle_group: "Bacak", level: "Başlangıç" },
    { name: "Smith Machine Squat", gif: LOCAL_VIDEOS["Smith Machine Squat"], desc: "Smith squat; kontrollü iniş.", muscle_group: "Bacak", level: "Başlangıç" },
  ],
  Kalça: [
    { name: "Hip Thrust", gif: LOCAL_VIDEOS["Hip Thrust"], desc: "Glute için en etkili hareketlerden.", muscle_group: "Kalça", level: "Orta" },
    { name: "Glute Bridge", gif: LOCAL_VIDEOS["Glute Bridge"], desc: "Hip thrust’un temel varyasyonu.", muscle_group: "Kalça", level: "Başlangıç" },
    { name: "Cable Donkey Kickback", gif: LOCAL_VIDEOS["Cable Donkey Kickback"], desc: "Kalça izolasyonu, cable kickback.", muscle_group: "Kalça", level: "Başlangıç" },
    { name: "Abductor Machine", gif: LOCAL_VIDEOS["Abductor Machine"], desc: "Glute medius odaklı abductor.", muscle_group: "Kalça", level: "Başlangıç" },
    { name: "Adductor Machine", gif: LOCAL_VIDEOS["Adductor Machine"], desc: "İç bacak/adductor odaklı.", muscle_group: "Kalça", level: "Başlangıç" },
    { name: "Hip Adductor (Girl)", gif: LOCAL_VIDEOS["Hip Adductor (Girl)"], desc: "Adductor odaklı varyasyon.", muscle_group: "Kalça", level: "Başlangıç" },
  ],
  Göğüs: [
    { name: "Flat Barbell Bench Press", gif: LOCAL_VIDEOS["Flat Barbell Bench Press"], desc: "Göğüs için temel barbell bench press.", muscle_group: "Göğüs", level: "Orta" },
    { name: "Flat Dumbbell Bench Press", gif: LOCAL_VIDEOS["Flat Dumbbell Bench Press"], desc: "Dumbbell ile bench; stabilizasyon artar.", muscle_group: "Göğüs", level: "Orta" },
    { name: "Incline Barbell Press", gif: LOCAL_VIDEOS["Incline Barbell Press"], desc: "Üst göğüs odaklı incline press.", muscle_group: "Göğüs", level: "Orta" },
    { name: "Incline Dumbbell Bench Press", gif: LOCAL_VIDEOS["Incline Dumbbell Bench Press"], desc: "Üst göğüs için dumbbell incline.", muscle_group: "Göğüs", level: "Orta" },
    { name: "Decline Barbell Bench Press", gif: LOCAL_VIDEOS["Decline Barbell Bench Press"], desc: "Alt göğüs odaklı decline press.", muscle_group: "Göğüs", level: "Orta" },
    { name: "Decline Dumbbell Fly", gif: LOCAL_VIDEOS["Decline Dumbbell Fly"], desc: "Alt göğüste esneme odaklı fly.", muscle_group: "Göğüs", level: "Orta" },
    { name: "Cable Crossover", gif: LOCAL_VIDEOS["Cable Crossover"], desc: "Göğüs izolasyonu, peak contraction iyi.", muscle_group: "Göğüs", level: "Orta" },
    { name: "Machine Press", gif: LOCAL_VIDEOS["Machine Press"], desc: "Makine press; kontrollü itiş.", muscle_group: "Göğüs", level: "Başlangıç" },
    { name: "Incline Machine Press", gif: LOCAL_VIDEOS["Incline Machine Press"], desc: "Üst göğüs için incline machine press.", muscle_group: "Göğüs", level: "Başlangıç" },
    { name: "Pec Deck", gif: LOCAL_VIDEOS["Pec Deck"], desc: "Pec deck ile göğüs izolasyonu.", muscle_group: "Göğüs", level: "Başlangıç" },
    { name: "Push Up", gif: LOCAL_VIDEOS["Push Up"], desc: "Vücut ağırlığı temel itiş.", muscle_group: "Göğüs", level: "Başlangıç" },
    { name: "Incline Push Up", gif: LOCAL_VIDEOS["Incline Push Up"], desc: "Başlangıç için daha kolay push-up.", muscle_group: "Göğüs", level: "Başlangıç" },
    { name: "Decline Push Up", gif: LOCAL_VIDEOS["Decline Push Up"], desc: "Daha zor push-up; üst göğüs/omuz.", muscle_group: "Göğüs", level: "Orta" },
    { name: "Diamond Push Up", gif: LOCAL_VIDEOS["Diamond Push Up"], desc: "Triceps + iç göğüs odaklı.", muscle_group: "Göğüs", level: "Orta" },
    { name: "Wide Grip Push Up", gif: LOCAL_VIDEOS["Wide Grip Push Up"], desc: "Göğüs aktivasyonu daha belirgin.", muscle_group: "Göğüs", level: "Başlangıç" },
    { name: "Archer Push Up", gif: LOCAL_VIDEOS["Archer Push Up"], desc: "Tek kola yük bindiren zor varyasyon.", muscle_group: "Göğüs", level: "İleri" },
    { name: "Dips", gif: LOCAL_VIDEOS["Dips"], desc: "Göğüs + triceps; form önemli.", muscle_group: "Göğüs", level: "Orta" },
  ],
  Deltoidler: [
    { name: "Arnold Press", gif: LOCAL_VIDEOS["Arnold Press"], desc: "Omuzlara farklı açı kazandırır.", muscle_group: "Omuz", level: "Orta" },
    { name: "Dumbbell Shoulder Press", gif: LOCAL_VIDEOS["Dumbbell Shoulder Press"], desc: "Omuz press; kontrollü.", muscle_group: "Omuz", level: "Orta" },
    { name: "Barbell Shoulder Press", gif: LOCAL_VIDEOS["Barbell Shoulder Press"], desc: "Barbell OHP varyasyonu.", muscle_group: "Omuz", level: "Orta" },
    { name: "Seated Dumbbell Shoulder Press", gif: LOCAL_VIDEOS["Seated Dumbbell Shoulder Press"], desc: "Seated press; stabil.", muscle_group: "Omuz", level: "Başlangıç" },
    { name: "Smith Machine Shoulder Press", gif: LOCAL_VIDEOS["Smith Machine Shoulder Press"], desc: "Smith ile shoulder press.", muscle_group: "Omuz", level: "Başlangıç" },
    { name: "Dumbbell Lateral Raise", gif: LOCAL_VIDEOS["Dumbbell Lateral Raise"], desc: "Orta omuz; genişlik.", muscle_group: "Omuz", level: "Başlangıç" },
    { name: "Cable Lateral Raise", gif: LOCAL_VIDEOS["Cable Lateral Raise"], desc: "Kablo ile sürekli tansiyon.", muscle_group: "Omuz", level: "Orta" },
    { name: "Lateral Raise Machine", gif: LOCAL_VIDEOS["Lateral Raise Machine"], desc: "Makinede lateral raise.", muscle_group: "Omuz", level: "Başlangıç" },
    { name: "Dumbbell Front Raise", gif: LOCAL_VIDEOS["Dumbbell Front Raise"], desc: "Ön omuz izolasyonu.", muscle_group: "Omuz", level: "Başlangıç" },
    { name: "Barbell Front Raise", gif: LOCAL_VIDEOS["Barbell Front Raise"], desc: "Ön omuz; barbell.", muscle_group: "Omuz", level: "Orta" },
    { name: "Cable Front Raise", gif: LOCAL_VIDEOS["Cable Front Raise"], desc: "Kablo ile front raise.", muscle_group: "Omuz", level: "Orta" },
    { name: "Plate Front Raise", gif: LOCAL_VIDEOS["Plate Front Raise"], desc: "Plate ile front raise.", muscle_group: "Omuz", level: "Başlangıç" },
    { name: "Dumbbell Upright Row", gif: LOCAL_VIDEOS["Dumbbell Upright Row"], desc: "Trapez + omuz; dirseği çok yükseltme.", muscle_group: "Omuz", level: "Orta" },
    { name: "Cable Rear Delt Fly", gif: LOCAL_VIDEOS["Cable Rear Delt Fly"], desc: "Arka omuz izolasyonu.", muscle_group: "Omuz", level: "Orta" },
    { name: "Seated Dumbbell Rear Delt", gif: LOCAL_VIDEOS["Seated Dumbbell Rear Delt"], desc: "Arka omuz; seated.", muscle_group: "Omuz", level: "Orta" },
    { name: "Pec Deck Machine", gif: LOCAL_VIDEOS["Pec Deck Machine"], desc: "Arka omuz/pec deck varyasyonu.", muscle_group: "Omuz", level: "Başlangıç" },
    { name: "Rope Pull Over", gif: LOCAL_VIDEOS["Rope Pull Over"], desc: "Üst sırt + lat destekli.", muscle_group: "Omuz", level: "Orta" },
    { name: "Kneeling High Pulley Row", gif: LOCAL_VIDEOS["Kneeling High Pulley Row"], desc: "Üst sırt/arka omuz hissi verir.", muscle_group: "Omuz", level: "Orta" },
  ],
  Sırt: [
    { name: "Deadlift", gif: LOCAL_VIDEOS["Deadlift"], desc: "Posterior chain; form en kritik.", muscle_group: "Sırt", level: "Orta" },
    { name: "Barbell Romanian Deadlift", gif: LOCAL_VIDEOS["Barbell Romanian Deadlift"], desc: "Hamstring + bel; kontrollü.", muscle_group: "Sırt", level: "Orta" },
    { name: "Pull Up", gif: LOCAL_VIDEOS["Pull Up"], desc: "Lat genişliği; vücut ağırlığı.", muscle_group: "Sırt", level: "Orta" },
    { name: "Chin Up", gif: LOCAL_VIDEOS["Chin Up"], desc: "Pull-up’ın biceps ağırlıklı hali.", muscle_group: "Sırt", level: "Orta" },
    { name: "Close Grip Lat Pulldown", gif: LOCAL_VIDEOS["Close Grip Lat Pulldown"], desc: "Dar tutuş pulldown.", muscle_group: "Sırt", level: "Başlangıç" },
    { name: "Cable Row", gif: LOCAL_VIDEOS["Cable Row"], desc: "Orta sırt; scapula kontrolü.", muscle_group: "Sırt", level: "Başlangıç" },
    { name: "Machine Row", gif: LOCAL_VIDEOS["Machine Row"], desc: "Makine row; sabit çekiş.", muscle_group: "Sırt", level: "Başlangıç" },
    { name: "Machine Row (Up)", gif: LOCAL_VIDEOS["Machine Row (Up)"], desc: "Makine row varyasyonu.", muscle_group: "Sırt", level: "Başlangıç" },
    { name: "Single Dumbbell Row", gif: LOCAL_VIDEOS["Single Dumbbell Row"], desc: "Tek kol row; lat/orta sırt.", muscle_group: "Sırt", level: "Orta" },
    { name: "T-Bar Row", gif: LOCAL_VIDEOS["T-Bar Row"], desc: "Kalınlık için t-bar row.", muscle_group: "Sırt", level: "Orta" },
  ],
  Biceps: [
    { name: "Barbell Curl", gif: LOCAL_VIDEOS["Barbell Curl"], desc: "Biceps temel curl.", muscle_group: "Biceps", level: "Başlangıç" },
    { name: "Dumbbell Curl", gif: LOCAL_VIDEOS["Dumbbell Curl"], desc: "Dumbbell ile biceps curl.", muscle_group: "Biceps", level: "Başlangıç" },
    { name: "Hammer Curl", gif: LOCAL_VIDEOS["Hammer Curl"], desc: "Brachialis + önkol.", muscle_group: "Biceps", level: "Başlangıç" },
    { name: "EZ Bar Curl", gif: LOCAL_VIDEOS["EZ Bar Curl"], desc: "Bileğe daha rahat tutuş.", muscle_group: "Biceps", level: "Başlangıç" },
    { name: "Concentration Curl", gif: LOCAL_VIDEOS["Concentration Curl"], desc: "İzolasyon; strict form.", muscle_group: "Biceps", level: "Orta" },
    { name: "Preacher Curl", gif: LOCAL_VIDEOS["Preacher Curl"], desc: "Alt pozisyonda cheating’i azaltır.", muscle_group: "Biceps", level: "Orta" },
    { name: "Rope Curl", gif: LOCAL_VIDEOS["Rope Curl"], desc: "Kablo/rope ile sürekli tansiyon.", muscle_group: "Biceps", level: "Orta" },
    { name: "Scott Curl", gif: LOCAL_VIDEOS["Scott Curl"], desc: "Preacher/Scott curl varyasyonu.", muscle_group: "Biceps", level: "Orta" },
    { name: "Single Arm Cable Curl", gif: LOCAL_VIDEOS["Single Arm Cable Curl"], desc: "Tek kol cable curl.", muscle_group: "Biceps", level: "Orta" },
  ],
  Triceps: [
    { name: "Bench Dips", gif: LOCAL_VIDEOS["Bench Dips"], desc: "Bench dips; omuzları koru.", muscle_group: "Triceps", level: "Başlangıç" },
    { name: "Dips (Triceps)", gif: LOCAL_VIDEOS["Dips (Triceps)"], desc: "Triceps ağırlıklı dips.", muscle_group: "Triceps", level: "Orta" },
    { name: "Diamond Push Up (Triceps)", gif: LOCAL_VIDEOS["Diamond Push Up (Triceps)"], desc: "Triceps odaklı push-up.", muscle_group: "Triceps", level: "Orta" },
    { name: "Rope Pushdown", gif: LOCAL_VIDEOS["Rope Pushdown"], desc: "Kablo ile triceps pushdown.", muscle_group: "Triceps", level: "Başlangıç" },
    { name: "Dumbbell Triceps Extension", gif: LOCAL_VIDEOS["Dumbbell Triceps Extension"], desc: "Overhead triceps; uzun baş.", muscle_group: "Triceps", level: "Orta" },
    { name: "EZ Barbell Triceps Extension", gif: LOCAL_VIDEOS["EZ Barbell Triceps Extension"], desc: "Skull crusher tarzı.", muscle_group: "Triceps", level: "Orta" },
  ],
};

const IMAGE_MAP = {
  Göğüs: require("../../assets/images/exercisesicons/chest.png"),
  Sırt: require("../../assets/images/exercisesicons/back.png"),
  Bacak: require("../../assets/images/exercisesicons/leg.png"),
  Kalça: require("../../assets/images/exercisesicons/glutes.png"),
  Deltoidler: require("../../assets/images/exercisesicons/omuz.jpg"),
  Biceps: require("../../assets/images/exercisesicons/biceps.png"),
  Triceps: require("../../assets/images/exercisesicons/triceps.png"),
};

const IMAGE_MAP_KEYS = Object.keys(IMAGE_MAP);

const LEVEL_OPTIONS = [
  { key: "beginner", label: "Başlangıç", desc: "Haftada 2 kez kas grubu, temel yoğunluk." },
  { key: "intermediate", label: "Orta Seviye", desc: "Haftada 2–3 kez kas grubu, orta hacim." },
  { key: "advanced", label: "Pro", desc: "Haftada 3 kez kas grubu, yüksek hacim." },
];

const DAYS_PER_WEEK_OPTIONS = [3, 4, 5, 6];

const AI_PLACE_OPTIONS = [
  { key: "Ev", label: "Ev" },
  { key: "Salon", label: "Salon (Spor Salonu)" },
  { key: "Her ikisi", label: "Her ikisi" },
];
const AI_EQUIPMENT_OPTIONS = [
  { key: "Vücut ağırlığı", label: "Vücut ağırlığı" },
  { key: "Dambıl", label: "Dambıl" },
  { key: "Makine", label: "Makine" },
  { key: "Tam ekipman", label: "Tam ekipman (Salon)" },
];
const AI_FOCUS_OPTIONS = [
  { key: "Güç", label: "Güç" },
  { key: "Dayanıklılık", label: "Dayanıklılık" },
  { key: "Kas kütlesi", label: "Kas geliştirme" },
  { key: "Esneklik", label: "Esneklik" },
  { key: "Genel form", label: "Genel form" },
];
const AI_DURATION_OPTIONS = [
  { key: "30-45 dk", label: "30-45 dk" },
  { key: "45-60 dk", label: "45-60 dk" },
  { key: "60-90 dk", label: "60-90 dk" },
];

const AI_FOCUS_MUSCLE_OPTIONS = [
  { key: "", label: "Öncelik vermek istemiyorum" },
  { key: "Göğüs", label: "Göğüs" },
  { key: "Sırt", label: "Sırt" },
  { key: "Bacak", label: "Bacak" },
  { key: "Omuz", label: "Omuz" },
  { key: "Biceps", label: "Biceps" },
  { key: "Triceps", label: "Triceps" },
  { key: "Core", label: "Karın (Core)" },
  { key: "Kalça", label: "Kalça" },
];

const ExercisesPage = ({ navigation }) => {
  const { colors: COLORS } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createExercisesPageStyles(COLORS), [COLORS]);
  const COMMON_STYLES = useMemo(() => getExerciseCommonStyles(COLORS), [COLORS]);

  const [tab, setTab] = useState("map");
  const [selectedMuscle, setSelectedMuscle] = useState(null);

  // 🎬 ANİMASYON STATE'İ
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Sekme değiştikçe kayma animasyonunu çalıştır
  useEffect(() => {
    let toValue = 0;
    if (tab === "aiprogram") toValue = TAB_WIDTH;
    if (tab === "formscore") toValue = TAB_WIDTH * 2;

    Animated.spring(slideAnim, {
      toValue,
      tension: 50,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [tab]);

  // Dinamik kapsül rengi fonksiyonu
  const getIndicatorColor = () => {
    if (tab === "map") return COLORS.primary;
    if (tab === "aiprogram") return COLORS.purple;
    if (tab === "formscore") return COLORS.secondary;
    return COLORS.primary;
  };

  const user = useSelector((state) => state.user.user);
  const userDetails = useSelector((state) => state.user.userDetails);
  const token = useSelector((state) => state.user.token);
  const isPro = !!(user?.isPro ?? userDetails?.isPro);

  const [expandedExercises, setExpandedExercises] = useState({});
  const [videoModal, setVideoModal] = useState(false);
  const [selectedExerciseData, setSelectedExerciseData] = useState(null);

  const [aiMonthlyProgram, setAiMonthlyProgram] = useState(null);
  const [aiSelectedWeek, setAiSelectedWeek] = useState(1);
  const [aiTabSelectedDay, setAiTabSelectedDay] = useState("Pazartesi");
  const [aiSavingCompletion, setAiSavingCompletion] = useState(false);
  const [savedAiPrograms, setSavedAiPrograms] = useState([]);
  const [loadingAiPrograms, setLoadingAiPrograms] = useState(false);
  const [aiProgramLoading, setAiProgramLoading] = useState(false);
  const [selectedAiProgramId, setSelectedAiProgramId] = useState(null);
  const [aiConfigModalVisible, setAiConfigModalVisible] = useState(false);
  const [aiLevel, setAiLevel] = useState("beginner");
  const [aiDaysPerWeek, setAiDaysPerWeek] = useState(3);
  const [aiPlace, setAiPlace] = useState("");
  const [aiEquipment, setAiEquipment] = useState([]);
  const [aiFocus, setAiFocus] = useState("");
  const [aiDuration, setAiDuration] = useState("");
  const [aiFocusMuscle, setAiFocusMuscle] = useState([]);
  const [deletingAiId, setDeletingAiId] = useState(null);
  const [aiProgramNameDraft, setAiProgramNameDraft] = useState("");
  const [aiEditedExerciseProgramName, setAiEditedExerciseProgramName] = useState("");
  const [aiProgramNameSaving, setAiProgramNameSaving] = useState(false);

  const [formScoreLoading, setFormScoreLoading] = useState(false);
  const [formScoreFeedback, setFormScoreFeedback] = useState(null);
  const [formScoreError, setFormScoreError] = useState(null);

  const toggleAiEquipment = (key) => {
    setAiEquipment((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };
  const toggleAiFocusMuscle = (key) => {
    if (key === "") {
      setAiFocusMuscle([]);
      return;
    }
    setAiFocusMuscle((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const toggleExpand = (weekNum, day, index) => {
    const key = `${weekNum}-${day}-${index}`;
    setExpandedExercises((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const MAX_VIDEO_SIZE_MB = 15;
  const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

  const resolveFormScoreMimeType = (uri, asset = {}) => {
    if (asset.mimeType && String(asset.mimeType).startsWith("video/")) return asset.mimeType;
    if (uri.endsWith(".mov") || asset.fileName?.endsWith?.(".mov")) return "video/quicktime";
    return "video/mp4";
  };

  const processFormScoreVideo = async (uri, asset = {}) => {
    if (!isPro) {
      Alert.alert(
        "Pro üyelik gerekli",
        "AI ile video form analizi yalnızca Pro üyeler içindir. Profilden Pro’ya yükseltebilirsiniz (100 ₺/ay, şu an demo).",
        [
          { text: "İptal", style: "cancel" },
          { text: "Profil", onPress: () => navigation.navigate("Profile") },
        ]
      );
      return;
    }
    let fileSize = 0;
    try {
      const info = await FileSystemLegacy.getInfoAsync(uri, { size: true });
      fileSize = info?.size ?? 0;
    } catch (_) {}
    if (fileSize > MAX_VIDEO_SIZE_BYTES) {
      Alert.alert(
        "Video çok büyük",
        `Bellek hatası olmaması için en fazla ${MAX_VIDEO_SIZE_MB} MB video seçin veya çekin.`
      );
      return;
    }
    setFormScoreLoading(true);
    setFormScoreError(null);
    setFormScoreFeedback(null);
    try {
      let base64;
      try {
        const file = new File(uri);
        base64 = await file.base64();
      } catch (_) {
        base64 = await FileSystemLegacy.readAsStringAsync(uri, {
          encoding: FileSystemLegacy.EncodingType?.Base64 ?? "base64",
        });
      }
      const mimeType = resolveFormScoreMimeType(uri, asset);
      const res = await apiService.analyzeFormScore(base64, mimeType);
      if (res.success && res.data?.feedback) {
        setFormScoreFeedback(res.data.feedback);
      } else {
        setFormScoreError("Puanlama alınamadı.");
      }
    } catch (e) {
      setFormScoreError("Video yüklenirken hata oluştu.");
      setFormScoreFeedback(null);
    } finally {
      setFormScoreLoading(false);
    }
  };

  const pickVideoFromGalleryForScore = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin gerekli", "Video seçmek için galeri izni vermeniz gerekiyor.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const a = result.assets[0];
      await processFormScoreVideo(a.uri, a);
    } catch (e) {
      setFormScoreError("Video seçilirken hata oluştu.");
      setFormScoreFeedback(null);
    }
  };

  const recordVideoForFormScore = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin gerekli", "Video çekmek için kamera izni vermeniz gerekiyor.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 180,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const a = result.assets[0];
      await processFormScoreVideo(a.uri, a);
    } catch (e) {
      setFormScoreError("Video çekilirken hata oluştu.");
      setFormScoreFeedback(null);
    }
  };

  const loadSavedAiPrograms = async () => {
    setLoadingAiPrograms(true);
    try {
      const res = await apiService.getExercisePrograms(20, 0);
      if (res.success && Array.isArray(res.data)) setSavedAiPrograms(res.data);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingAiPrograms(false);
    }
  };

  useEffect(() => {
    if (tab === "aiprogram") loadSavedAiPrograms();
  }, [tab]);

  const handleGenerateAiProgram = async () => {
    setAiProgramLoading(true);
    Alert.alert(
      t("aiPreparation.workoutTitle"),
      t("aiPreparation.workoutMessage"),
      [{ text: t("aiPreparation.ok") }]
    );
    try {
      const res = await apiService.generateAIExerciseProgram({
        difficulty: aiLevel,
        daysPerWeek: aiDaysPerWeek,
        programName: aiProgramNameDraft.trim() || undefined,
        survey: {
          place: aiPlace || null,
          equipment: Array.isArray(aiEquipment) && aiEquipment.length ? aiEquipment : null,
          focus: aiFocus || null,
          duration: aiDuration || null,
          focusMuscle: Array.isArray(aiFocusMuscle) && aiFocusMuscle.length ? aiFocusMuscle : null,
        },
      });
      if (res.success && res.data?.program) {
        const prog = normalizeMonthlyAiProgram(res.data.program);
        setAiMonthlyProgram(prog);
        setAiSelectedWeek(1);
        setSelectedAiProgramId(res.data.id || null);
        const sched = prog?.weeks?.[0]?.weeklySchedule;
        const firstDay = DAYS.find((d) => (sched?.[d] || []).length > 0) || "Pazartesi";
        setAiTabSelectedDay(firstDay);
        setAiConfigModalVisible(false);
        setAiProgramNameDraft("");
        setAiEditedExerciseProgramName(res.data?.programName || "");
        await loadSavedAiPrograms();
        showNotificationsIfNewlyUnlocked(res);
        Alert.alert("Hazır", "AI programın oluşturuldu ve kaydedildi.");
      } else {
        Alert.alert("Hata", "Program oluşturulamadı.");
      }
    } catch (e) {
      if (e.code === 'PRO_REQUIRED') {
        Alert.alert(
          "Pro üyelik gerekli",
          e.userMessage || "Bu özelliği daha fazla kullanmak için Pro plana geçmelisiniz.",
          [
            { text: "İptal", style: "cancel" },
            { text: "Profil", onPress: () => navigation.navigate("Profile") }
          ]
        );
      } else {
        Alert.alert("Hata", "Bağlantı hatası.");
      }
    } finally {
      setAiProgramLoading(false);
    }
  };

  const handleViewAiProgram = (item) => {
    const pd = typeof item.programData === "string" ? JSON.parse(item.programData) : item.programData;
    const prog = normalizeMonthlyAiProgram(pd);
    setAiMonthlyProgram(prog);
    setAiSelectedWeek(1);
    setSelectedAiProgramId(item.id);
    setAiEditedExerciseProgramName(item.programName || "");
    const sched = prog?.weeks?.[0]?.weeklySchedule;
    const firstDay = DAYS.find((d) => (sched?.[d] || []).length > 0) || "Pazartesi";
    setAiTabSelectedDay(firstDay);
  };

  const persistAiProgram = async (nextProg) => {
    if (!selectedAiProgramId) {
      setAiMonthlyProgram(nextProg);
      return;
    }
    try {
      setAiSavingCompletion(true);
      const res = await apiService.updateExerciseProgram(
        selectedAiProgramId,
        buildProgramPayloadForApi(nextProg),
        undefined
      );
      if (res.success && res.data?.programData) {
        showNotificationsIfNewlyUnlocked(res);
        const pd =
          typeof res.data.programData === "string" ? JSON.parse(res.data.programData) : res.data.programData;
        setAiMonthlyProgram(normalizeMonthlyAiProgram(pd));
        setSavedAiPrograms((prev) =>
          prev.map((p) => (p.id === selectedAiProgramId ? { ...p, programData: res.data.programData } : p))
        );
      } else {
        setAiMonthlyProgram(nextProg);
      }
    } catch (e) {
      Alert.alert("Kaydedilemedi", e?.message || "Tekrar deneyin.");
    } finally {
      setAiSavingCompletion(false);
    }
  };

  const selectAiWeek = (w) => {
    setAiSelectedWeek(w);
    const sched = aiMonthlyProgram?.weeks?.[w - 1]?.weeklySchedule;
    if (!sched) return;
    const firstDay = DAYS.find((d) => (sched[d] || []).length > 0) || "Pazartesi";
    setAiTabSelectedDay(firstDay);
  };

  const toggleAiDayComplete = () => {
    if (!aiMonthlyProgram) return;
    const key = dayCompletionKey(aiSelectedWeek, aiTabSelectedDay);
    const prev = !!aiMonthlyProgram.completion?.days?.[key];
    const next = {
      ...aiMonthlyProgram,
      completion: {
        ...aiMonthlyProgram.completion,
        days: { ...aiMonthlyProgram.completion.days, [key]: !prev },
      },
    };
    persistAiProgram(next);
  };

  const toggleAiWeekComplete = () => {
    if (!aiMonthlyProgram) return;
    const wk = String(aiSelectedWeek);
    const prev = !!aiMonthlyProgram.completion?.weeks?.[wk];
    const next = {
      ...aiMonthlyProgram,
      completion: {
        ...aiMonthlyProgram.completion,
        weeks: { ...aiMonthlyProgram.completion.weeks, [wk]: !prev },
      },
    };
    persistAiProgram(next);
  };

  const toggleAiMonthComplete = () => {
    if (!aiMonthlyProgram) return;
    const prev = !!aiMonthlyProgram.completion?.month;
    const next = {
      ...aiMonthlyProgram,
      completion: {
        ...aiMonthlyProgram.completion,
        month: !prev,
      },
    };
    persistAiProgram(next);
  };

  const saveExerciseProgramDisplayName = async () => {
    if (!selectedAiProgramId || !aiMonthlyProgram) return;
    const name = aiEditedExerciseProgramName.trim();
    if (!name) {
      Alert.alert("Plan adı", "Lütfen bir isim girin.");
      return;
    }
    setAiProgramNameSaving(true);
    try {
      const res = await apiService.updateExerciseProgram(
        selectedAiProgramId,
        buildProgramPayloadForApi(aiMonthlyProgram),
        name
      );
      if (res.success && res.data) {
        showNotificationsIfNewlyUnlocked(res);
        setSavedAiPrograms((prev) =>
          prev.map((p) =>
            p.id === selectedAiProgramId ? { ...p, programName: res.data.programName ?? name } : p
          )
        );
        Alert.alert("Kaydedildi", "Plan adı güncellendi.");
      } else {
        Alert.alert("Hata", res?.message || "Ad güncellenemedi.");
      }
    } catch (e) {
      Alert.alert("Hata", e?.message || "Ad güncellenemedi.");
    } finally {
      setAiProgramNameSaving(false);
    }
  };

  const handleDeleteAiProgram = (item) => {
    Alert.alert("Programı Sil", "Bu program silinsin mi?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          setDeletingAiId(item.id);
          try {
            const res = await apiService.deleteExerciseProgram(item.id);
            if (res.success) {
              await loadSavedAiPrograms();
              if (selectedAiProgramId === item.id) {
                setAiMonthlyProgram(null);
                setSelectedAiProgramId(null);
              }
              Alert.alert("Silindi", "Program silindi.");
            } else Alert.alert("Hata", "Silinemedi.");
          } catch (e) {
            Alert.alert("Hata", "Silinemedi.");
          } finally {
            setDeletingAiId(null);
          }
        },
      },
    ]);
  };

  const formatAiDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  };

  const aiWeekBlock = aiMonthlyProgram?.weeks?.[(aiSelectedWeek || 1) - 1];
  const aiTabProgram = aiWeekBlock?.weeklySchedule ?? null;
  const aiDayDoneKey = aiMonthlyProgram ? dayCompletionKey(aiSelectedWeek, aiTabSelectedDay) : "";
  const aiDayDone = !!aiMonthlyProgram?.completion?.days?.[aiDayDoneKey];
  const aiWeekDone = !!aiMonthlyProgram?.completion?.weeks?.[String(aiSelectedWeek)];
  const aiMonthDone = !!aiMonthlyProgram?.completion?.month;

  return (
    <Layout>
      <View style={styles.container}>
        
        <View style={styles.topBar}>
            <Text style={styles.pageTitle}>Antrenman</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          {/* 🚀 ANİMASYONLU KAYAN SEKME (TOP TAB) */}
          <View style={[styles.tabContainer, COMMON_STYLES.shadowLight]}>
            
            {/* 🟦 KAYAN KAPSÜL (SLIDER) */}
            <Animated.View style={[
                styles.slidingIndicator, 
                { 
                  width: TAB_WIDTH - 6, // Padding payı
                  transform: [{ translateX: slideAnim }],
                  backgroundColor: getIndicatorColor()
                }
            ]} />

            <Pressable style={styles.tabWrapper} onPress={() => { setTab("map"); setSelectedMuscle(null); }}>
                <Text style={[styles.tabText, tab === "map" && styles.activeTabText]}>KASLAR</Text>
            </Pressable>
            <Pressable style={styles.tabWrapper} onPress={() => setTab("aiprogram")}>
                <Text style={[styles.tabText, tab === "aiprogram" && styles.activeTabText]}>AI PROGRAM</Text>
            </Pressable>
            <Pressable style={styles.tabWrapper} onPress={() => setTab("formscore")}>
                <Text style={[styles.tabText, tab === "formscore" && styles.activeTabText]}>FORM PUANLA</Text>
            </Pressable>
          </View>

          {/* KASLAR IZGARA */}
          {tab === "map" && !selectedMuscle && (
            <View style={styles.contentSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Kas Grupları</Text>
              </View>

              <View style={styles.muscleGridGroup}>
                {IMAGE_MAP_KEYS.slice(0, 6).map((muscle, i) => (
                  <Pressable
                    key={muscle}
                    onPress={() => setSelectedMuscle(muscle)}
                    style={[styles.muscleCardGrid, COMMON_STYLES.shadowLight]}
                  >
                    <Image source={IMAGE_MAP[muscle]} style={styles.muscleCardImageGrid} />
                    <Text style={styles.muscleCardTitleGrid}>{muscle}</Text>
                  </Pressable>
                ))}
              </View>
              
              {IMAGE_MAP_KEYS.length % 2 !== 0 && (() => {
                  const muscle = IMAGE_MAP_KEYS[IMAGE_MAP_KEYS.length - 1];
                  return (
                    <Pressable
                        key={muscle}
                        onPress={() => setSelectedMuscle(muscle)}
                        style={[styles.muscleCardGrid, COMMON_STYLES.shadowLight, { alignSelf: 'center', marginTop: 15 }]}
                    >
                      <Image source={IMAGE_MAP[muscle]} style={styles.muscleCardImageGrid} />
                      <Text style={styles.muscleCardTitleGrid}>{muscle}</Text>
                    </Pressable>
                  );
              })()}
            </View>
          )}

          {/* KAS EGZERSİZ LİSTESİ */}
          {tab === "map" && selectedMuscle && (
            <View style={styles.contentSection}>
              <View style={styles.headerRow}>
                <Pressable onPress={() => setSelectedMuscle(null)} style={styles.backButtonIcon}>
                  <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
                </Pressable>
                <Text style={styles.headerTitle}>{selectedMuscle}</Text>
                <View style={styles.titleLine} />
              </View>
              {(EXERCISE_LIBRARY[selectedMuscle] || []).map((ex, i) => (
                <View key={i} style={[styles.exerciseCard, COMMON_STYLES.shadowLight]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.descriptionSmall} numberOfLines={2}>{ex.desc}</Text>
                  </View>
                  <Pressable
                    style={styles.playButton}
                    onPress={() => {
                      setSelectedExerciseData(ex);
                      setVideoModal(true);
                    }}
                  >
                    <Ionicons name={ex.gif ? "play" : "eye"} size={20} color={COLORS.white} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* AI PROGRAM */}
          {tab === "aiprogram" && (
            <View style={styles.contentSection}>
              {!aiMonthlyProgram ? (
                <>
                  <Pressable 
                      style={[styles.aiCreateCard, COMMON_STYLES.shadowPremium]}
                      onPress={() => setAiConfigModalVisible(true)}
                      disabled={aiProgramLoading}
                  >
                    <LinearGradient colors={[COLORS.purple, COLORS.purpleDark]} style={styles.aiCreateGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                      <View style={{ flex: 1, marginRight: 15 }}>
                        <Text style={styles.aiCreateTitle}>Sihirli Plan Yarat</Text>
                        <Text style={styles.aiCreateSubtitle}>Yapay zeka ile sana özel antrenman oluştur.</Text>
                      </View>
                      <View style={styles.aiCreateIconWrap}>
                          {aiProgramLoading ? <ActivityIndicator color={COLORS.purple} /> : <Ionicons name="sparkles" size={24} color={COLORS.purple} />}
                      </View>
                    </LinearGradient>
                  </Pressable>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Kayıtlı AI Programlarım</Text>
                  </View>
                  {loadingAiPrograms ? (
                    <ActivityIndicator color={COLORS.purple} style={{ marginVertical: 20 }} />
                  ) : savedAiPrograms.length === 0 ? (
                    <View style={styles.emptyStateBox}>
                        <Ionicons name="document-text-outline" size={40} color={COLORS.textLight} />
                        <Text style={styles.emptyListText}>Henüz bir program kaydetmedin.</Text>
                    </View>
                  ) : (
                    savedAiPrograms.map((item) => (
                      <View key={item.id} style={[styles.savedProgramCard, COMMON_STYLES.shadowLight]}>
                        <View style={{flex: 1}}>
                            <Text style={styles.savedProgramName}>{item.programName || "İsimsiz Program"}</Text>
                            <Text style={styles.savedProgramDate}>{formatAiDate(item.createdAt)}</Text>
                        </View>
                        <View style={styles.savedProgramActions}>
                            <Pressable style={styles.actionBtnView} onPress={() => handleViewAiProgram(item)}>
                              <Ionicons name="eye" size={16} color={COLORS.white} />
                            </Pressable>
                            <Pressable style={styles.actionBtnDelete} onPress={() => handleDeleteAiProgram(item)} disabled={deletingAiId === item.id}>
                              {deletingAiId === item.id ? <ActivityIndicator size="small" color={COLORS.redish} /> : <Ionicons name="trash" size={16} color={COLORS.redish} />}
                            </Pressable>
                        </View>
                      </View>
                    ))
                  )}
                </>
              ) : (
                <>
                  <View style={styles.headerRow}>
                    <Pressable
                      onPress={() => {
                        setAiMonthlyProgram(null);
                        setSelectedAiProgramId(null);
                        setAiSelectedWeek(1);
                        setAiEditedExerciseProgramName("");
                      }}
                      style={styles.backButtonIcon}
                    >
                      <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
                    </Pressable>
                    <Text style={styles.headerTitle}>AI Program (4 Hafta)</Text>
                    <View style={styles.titleLine} />
                  </View>
                  {selectedAiProgramId ? (
                    <View style={[styles.aiNameEditBlock, COMMON_STYLES.shadowLight]}>
                      <Text style={styles.configLabel}>Plan adı</Text>
                      <View style={styles.aiNameEditRow}>
                        <TextInput
                          style={styles.aiNameInput}
                          value={aiEditedExerciseProgramName}
                          onChangeText={setAiEditedExerciseProgramName}
                          placeholder="Örn: Kış kuvvet planım"
                          placeholderTextColor={COLORS.textLight}
                          maxLength={120}
                        />
                        <Pressable
                          style={[styles.aiNameSaveBtn, aiProgramNameSaving && { opacity: 0.7 }]}
                          onPress={saveExerciseProgramDisplayName}
                          disabled={aiProgramNameSaving}
                        >
                          {aiProgramNameSaving ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                          ) : (
                            <Text style={styles.aiNameSaveBtnText}>Kaydet</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                  {!!aiMonthlyProgram?.monthlySummary && (
                    <View style={[styles.aiMonthlySummaryBox, COMMON_STYLES.shadowLight]}>
                      <Text style={styles.aiMonthlySummaryTitle}>Aylık özet</Text>
                      <Text style={styles.aiMonthlySummaryText}>{aiMonthlyProgram.monthlySummary}</Text>
                    </View>
                  )}
                  <Text style={styles.aiWeekPickerLabel}>Hafta seç</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {[1, 2, 3, 4].map((w) => {
                      const isW = aiSelectedWeek === w;
                      return (
                        <Pressable
                          key={w}
                          onPress={() => selectAiWeek(w)}
                          style={[styles.weekPill, isW && styles.weekPillActive]}
                        >
                          <Text style={[styles.weekPillText, isW && styles.weekPillTextActive]}>{w}. Hafta</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  {!!aiWeekBlock?.weeklySummary && (
                    <Text style={styles.aiWeekSummaryText}>{aiWeekBlock.weeklySummary}</Text>
                  )}
                  {!!aiWeekBlock?.focus && (
                    <Text style={styles.aiWeekFocusText}>Odak: {aiWeekBlock.focus}</Text>
                  )}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                    {DAYS.map((day) => {
                      const isActive = aiTabSelectedDay === day;
                      return (
                        <Pressable key={day} onPress={() => setAiTabSelectedDay(day)} style={[styles.dayPill, isActive && styles.dayPillActive]}>
                          <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{day.substring(0, 3)}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      {aiSelectedWeek}. Hafta · {aiTabSelectedDay}
                    </Text>
                  </View>
                  {(aiTabProgram?.[aiTabSelectedDay] || []).length === 0 ? (
                     <View style={styles.emptyStateBox}>
                        <Ionicons name="cafe-outline" size={40} color={COLORS.textLight} />
                        <Text style={styles.emptyListText}>Bu gün dinlenme günü veya egzersiz yok.</Text>
                    </View>
                  ) : (
                    ((aiTabProgram || {})[aiTabSelectedDay] || []).map((ex, index) => {
                      const key = `${aiSelectedWeek}-${aiTabSelectedDay}-${index}`;
                      const expanded = expandedExercises[key];
                      return (
                        <Pressable key={key} style={[styles.aiExerciseCard, COMMON_STYLES.shadowLight]} onPress={() => toggleExpand(aiSelectedWeek, aiTabSelectedDay, index)}>
                            <View style={styles.aiExerciseHeader}>
                                <View style={styles.aiExerciseTitleWrap}>
                                    <View style={styles.muscleBadge}>
                                         <Text style={styles.muscleBadgeText}>{ex.muscle_group?.substring(0,3).toUpperCase() || "EGZ"}</Text>
                                    </View>
                                    <Text style={styles.aiExerciseName}>{ex.name}</Text>
                                </View>
                                <Ionicons name={expanded ? "chevron-up-circle" : "chevron-down-circle"} size={22} color={expanded ? COLORS.purple : COLORS.textLight} />
                            </View>
                            {expanded && (
                              <View style={styles.aiExerciseDetails}>
                                <View style={styles.detailsGrid}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.detailLabel}>Set / Tekrar</Text>
                                        <Text style={styles.detailValue}>{ex.sets || "-"} x {ex.reps || "-"}</Text>
                                    </View>
                                    {ex.rest_time && (
                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailLabel}>Dinlenme</Text>
                                            <Text style={styles.detailValue}>{ex.rest_time} sn</Text>
                                        </View>
                                    )}
                                </View>
                                {ex.notes && (
                                  <View style={styles.noteBox}>
                                    <Ionicons name="information-circle" size={16} color={COLORS.purple} style={{marginRight: 6}}/>
                                    <Text style={styles.noteText}>{ex.notes}</Text>
                                  </View>
                                )}
                                <Pressable style={styles.programDetailBtn} onPress={() => navigation.navigate("ExercisesDetailPage", { exercise: { ...ex, gif: getVideoForExerciseName(ex.name), desc: ex.notes || ex.desc } })}>
                                  <Text style={styles.programDetailBtnText}>Hareket Detayı</Text>
                                  <Ionicons name="arrow-forward" size={14} color={COLORS.purple} />
                                </Pressable>
                              </View>
                            )}
                        </Pressable>
                      );
                    })
                  )}
                  <Pressable
                    style={[styles.aiCompletionRow, aiDayDone && styles.aiCompletionRowDone, { marginTop: 16 }]}
                    onPress={toggleAiDayComplete}
                    disabled={aiSavingCompletion}
                  >
                    <Ionicons
                      name={aiDayDone ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={aiDayDone ? COLORS.secondary : COLORS.textLight}
                    />
                    <Text style={[styles.aiCompletionLabel, aiDayDone && styles.aiCompletionLabelDone]}>
                      Bu günün antrenmanını tamamladım
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.aiCompletionRow, aiWeekDone && styles.aiCompletionRowDone, { marginBottom: 4 }]}
                    onPress={toggleAiWeekComplete}
                    disabled={aiSavingCompletion}
                  >
                    <Ionicons
                      name={aiWeekDone ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={aiWeekDone ? COLORS.secondary : COLORS.textLight}
                    />
                    <Text style={[styles.aiCompletionLabel, aiWeekDone && styles.aiCompletionLabelDone]}>
                      {aiSelectedWeek}. haftayı tamamladım
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.aiCompletionRow, aiMonthDone && styles.aiCompletionRowDone, { marginTop: 12 }]}
                    onPress={toggleAiMonthComplete}
                    disabled={aiSavingCompletion}
                  >
                    <Ionicons
                      name={aiMonthDone ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={aiMonthDone ? COLORS.secondary : COLORS.textLight}
                    />
                    <Text style={[styles.aiCompletionLabel, aiMonthDone && styles.aiCompletionLabelDone]}>
                      1 aylık programı tamamladım
                    </Text>
                  </Pressable>
                  {selectedAiProgramId && (() => {
                    const item = savedAiPrograms.find((p) => p.id === selectedAiProgramId);
                    return item ? (
                      <Pressable style={styles.deleteOutlineBtn} onPress={() => handleDeleteAiProgram(item)}>
                        <Ionicons name="trash-outline" size={18} color={COLORS.redish} style={{marginRight: 8}}/>
                        <Text style={styles.deleteOutlineBtnText}>Programı Sil</Text>
                      </Pressable>
                    ) : null;
                  })()}
                </>
              )}
            </View>
          )}

          {/* FORM PUANLA SEKME — yalnızca Pro */}
          {tab === "formscore" && (
            <View style={styles.contentSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Form Puanlama</Text>
              </View>
              {!isPro ? (
                <View style={[styles.formScorePaywall, COMMON_STYLES.shadowPremium]}>
                  <LinearGradient
                    colors={[COLORS.purpleLight, COLORS.white]}
                    style={styles.formScorePaywallInner}
                  >
                    <Ionicons name="lock-closed" size={36} color={COLORS.purple} />
                    <Text style={styles.formScorePaywallTitle}>Pro özelliği</Text>
                    <Text style={styles.formScorePaywallText}>
                      AI ile hareket videosu analizi yalnızca Pro üyeler içindir. Aylık 100 ₺ (şu an demo ödeme).
                    </Text>
                    <Pressable style={styles.formScorePaywallBtn} onPress={() => navigation.navigate("Profile")}>
                      <Text style={styles.formScorePaywallBtnText}>Profilden Pro’ya geç</Text>
                      <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                    </Pressable>
                  </LinearGradient>
                </View>
              ) : (
                <>
                  <Text style={styles.formScoreDesc}>
                    Hareket videonu galeriden seç veya kamerayla çek; yapay zeka formunu inceleyip sana özel geri bildirim versin.
                  </Text>
                  <View style={[styles.noteBox, { backgroundColor: COLORS.accentLight }]}>
                    <Ionicons name="warning" size={16} color={COLORS.accent} style={{ marginRight: 6 }} />
                    <Text style={[styles.noteText, { color: COLORS.accent }]}>Max 15 MB kısa video yükleyiniz.</Text>
                  </View>

                  <View style={[styles.formScoreInfoCard, COMMON_STYLES.shadowLight]}>
                    <Text style={styles.formScoreInfoTitle}>Değerlendirilen Kriterler</Text>
                    <View style={styles.formScoreCriteriaRow}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                      <Text style={styles.formScoreCriteriaText}>Hareket Genişliği</Text>
                    </View>
                    <View style={styles.formScoreCriteriaRow}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                      <Text style={styles.formScoreCriteriaText}>Hız ve Kontrol</Text>
                    </View>
                    <View style={styles.formScoreCriteriaRow}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                      <Text style={styles.formScoreCriteriaText}>Nefes Zamanlaması</Text>
                    </View>
                    <View style={styles.formScoreCriteriaRow}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
                      <Text style={styles.formScoreCriteriaText}>Vücut Hizalaması</Text>
                    </View>
                  </View>

                  <View style={styles.formScoreActionsRow}>
                    <Pressable
                      style={[styles.formScoreActionButton, COMMON_STYLES.shadowPremium, formScoreLoading && { opacity: 0.7 }]}
                      onPress={pickVideoFromGalleryForScore}
                      disabled={formScoreLoading}
                    >
                      {formScoreLoading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <LinearGradient colors={[COLORS.secondary, "#319795"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.formScoreActionGradient}>
                          <Ionicons name="images-outline" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                          <Text style={styles.formScoreActionButtonText} numberOfLines={1}>
                            Galeri
                          </Text>
                        </LinearGradient>
                      )}
                    </Pressable>
                    <Pressable
                      style={[styles.formScoreActionButton, COMMON_STYLES.shadowPremium, formScoreLoading && { opacity: 0.7 }]}
                      onPress={recordVideoForFormScore}
                      disabled={formScoreLoading}
                    >
                      {formScoreLoading ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.formScoreActionGradient}>
                          <Ionicons name="videocam-outline" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
                          <Text style={styles.formScoreActionButtonText} numberOfLines={1}>
                            Video çek
                          </Text>
                        </LinearGradient>
                      )}
                    </Pressable>
                  </View>

                  {formScoreError && (
                    <View style={[styles.noteBox, { backgroundColor: COLORS.redishLight, marginTop: 15 }]}>
                      <Text style={[styles.noteText, { color: COLORS.redish }]}>{formScoreError}</Text>
                    </View>
                  )}

                  {formScoreFeedback && (
                    <View style={[styles.formScoreFeedbackCard, COMMON_STYLES.shadowPremium]}>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                        <Ionicons name="analytics" size={20} color={COLORS.secondary} style={{ marginRight: 8 }} />
                        <Text style={styles.formScoreTitle}>AI Analiz Sonucu</Text>
                      </View>
                      <Text style={styles.formScoreFeedbackText}>{formScoreFeedback}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

        </ScrollView>
      </View>

      {/* VIDEO PREVIEW MODAL */}
      <Modal visible={videoModal} animationType="fade" transparent>
        <BlurView intensity={30} tint="light" style={styles.modalBackground}>
          <View style={[styles.modalCardPremium, COMMON_STYLES.shadowPremium]}>
            <View style={styles.modalHeaderPremium}>
                <View style={{flex: 1}}>
                    <Text style={styles.modalTitlePremium} numberOfLines={1}>{selectedExerciseData?.name}</Text>
                    <View style={styles.modalMuscleBadge}>
                        <Ionicons name="barbell-outline" size={12} color={COLORS.white} />
                        <Text style={styles.modalMuscleText}>{selectedExerciseData?.muscle_group || "Egzersiz"}</Text>
                    </View>
                </View>
                <Pressable style={styles.closeButtonPremium} onPress={() => setVideoModal(false)}>
                    <Ionicons name="close" size={20} color={COLORS.textDark} />
                </Pressable>
            </View>

            <View style={[styles.videoContainerPremium, COMMON_STYLES.shadowLight]}>
                {selectedExerciseData?.gif ? (
                    <Image source={selectedExerciseData.gif} style={styles.videoImagePremium} />
                ) : (
                    <View style={styles.noImageContainer}>
                        <Ionicons name="image-outline" size={50} color={COLORS.textLight}/>
                        <Text style={{ color: COLORS.textLight, marginTop:10, fontSize:12 }}>Görsel Bulunamadı</Text>
                    </View>
                )}
            </View>

            <Text style={styles.descriptionPremium} numberOfLines={3}>{selectedExerciseData?.desc}</Text>

            <Pressable
                style={styles.primaryButtonModal}
                onPress={() => {
                    setVideoModal(false);
                    navigation.navigate("ExercisesDetailPage", { exercise: selectedExerciseData });
                }}
            >
                <Text style={styles.primaryButtonTextModal}>DETAYLARI İNCELE</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.white} style={{marginLeft: 8}} />
            </Pressable>
          </View>
        </BlurView>
      </Modal>

      {/* AI PROGRAM OLUŞTURMA MODAL */}
      <Modal visible={aiConfigModalVisible} transparent animationType="slide">
        <BlurView intensity={30} tint="light" style={styles.modalBackgroundBottom}>
          <View style={[styles.configModalCard, COMMON_STYLES.shadowPremium]}>
            
            <View style={styles.configHeader}>
                <Text style={styles.configModalTitle}>Sihirli Plan Anket</Text>
                <Text style={styles.configModalDesc}>Yapay zeka için detayları belirle.</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.65 }} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.configLabel}>Plan adı (isteğe bağlı)</Text>
              <TextInput
                style={styles.aiConfigNameInput}
                value={aiProgramNameDraft}
                onChangeText={setAiProgramNameDraft}
                placeholder="Boş bırakırsan otomatik isim atanır"
                placeholderTextColor={COLORS.textLight}
                maxLength={120}
              />

              <Text style={[styles.configLabel, { marginTop: 16 }]}>Seviye</Text>
              {LEVEL_OPTIONS.map((opt) => {
                const isSelected = aiLevel === opt.key;
                return (
                  <Pressable key={opt.key} style={[styles.optionRow, isSelected && styles.optionRowSelected]} onPress={() => setAiLevel(opt.key)}>
                    <View style={{flex: 1}}>
                      <Text style={[styles.optionTitle, isSelected && styles.primaryText]}>{opt.label}</Text>
                      <Text style={styles.optionDesc}>{opt.desc}</Text>
                    </View>
                    <Ionicons name={isSelected ? "radio-button-on" : "radio-button-off"} size={22} color={isSelected ? COLORS.purple : COLORS.border} />
                  </Pressable>
                );
              })}

              <Text style={[styles.configLabel, { marginTop: 20 }]}>Haftalık Gün Sayısı</Text>
              <View style={styles.daysRow}>
                {DAYS_PER_WEEK_OPTIONS.map((d) => (
                  <Pressable key={d} style={[styles.daySelectPill, aiDaysPerWeek === d && styles.daySelectPillActive]} onPress={() => setAiDaysPerWeek(d)}>
                    <Text style={[styles.daySelectText, aiDaysPerWeek === d && styles.daySelectTextActive]}>{d} Gün</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.configLabel, { marginTop: 20 }]}>Nerede antrenman yapacaksın?</Text>
              {AI_PLACE_OPTIONS.map((opt) => {
                const isSelected = aiPlace === opt.key;
                return (
                  <Pressable key={opt.key} style={[styles.optionRow, isSelected && styles.optionRowSelected]} onPress={() => setAiPlace(opt.key)}>
                    <Text style={[styles.optionTitle, isSelected && styles.primaryText]}>{opt.label}</Text>
                    <Ionicons name={isSelected ? "radio-button-on" : "radio-button-off"} size={22} color={isSelected ? COLORS.purple : COLORS.border} />
                  </Pressable>
                );
              })}

              <Text style={[styles.configLabel, { marginTop: 20 }]}>Hangi ekipmanlar var? (Çoklu Seçim)</Text>
              {AI_EQUIPMENT_OPTIONS.map((opt) => {
                const isSelected = aiEquipment.includes(opt.key);
                return (
                  <Pressable key={opt.key} style={[styles.optionRow, isSelected && styles.optionRowSelected]} onPress={() => toggleAiEquipment(opt.key)}>
                    <Text style={[styles.optionTitle, isSelected && styles.primaryText]}>{opt.label}</Text>
                    <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={22} color={isSelected ? COLORS.purple : COLORS.border} />
                  </Pressable>
                );
              })}

              <Text style={[styles.configLabel, { marginTop: 20 }]}>Ne tür antrenman hedefliyorsun?</Text>
              {AI_FOCUS_OPTIONS.map((opt) => {
                const isSelected = aiFocus === opt.key;
                return (
                  <Pressable key={opt.key} style={[styles.optionRow, isSelected && styles.optionRowSelected]} onPress={() => setAiFocus(opt.key)}>
                    <Text style={[styles.optionTitle, isSelected && styles.primaryText]}>{opt.label}</Text>
                    <Ionicons name={isSelected ? "radio-button-on" : "radio-button-off"} size={22} color={isSelected ? COLORS.purple : COLORS.border} />
                  </Pressable>
                );
              })}

              <Text style={[styles.configLabel, { marginTop: 20 }]}>Tercih ettiğin antrenman süresi</Text>
              {AI_DURATION_OPTIONS.map((opt) => {
                const isSelected = aiDuration === opt.key;
                return (
                  <Pressable key={opt.key} style={[styles.optionRow, isSelected && styles.optionRowSelected]} onPress={() => setAiDuration(opt.key)}>
                    <Text style={[styles.optionTitle, isSelected && styles.primaryText]}>{opt.label}</Text>
                    <Ionicons name={isSelected ? "radio-button-on" : "radio-button-off"} size={22} color={isSelected ? COLORS.purple : COLORS.border} />
                  </Pressable>
                );
              })}

              <Text style={[styles.configLabel, { marginTop: 20 }]}>Öncelikli kas grupları (Çoklu Seçim)</Text>
              {AI_FOCUS_MUSCLE_OPTIONS.map((opt) => {
                const isNone = opt.key === "";
                const isSelected = isNone ? aiFocusMuscle.length === 0 : aiFocusMuscle.includes(opt.key);
                return (
                  <Pressable key={opt.key || "yok"} style={[styles.optionRow, isSelected && styles.optionRowSelected]} onPress={() => toggleAiFocusMuscle(opt.key)}>
                    <Text style={[styles.optionTitle, isSelected && styles.primaryText]}>{opt.label}</Text>
                    <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={22} color={isSelected ? COLORS.purple : COLORS.border} />
                  </Pressable>
                );
              })}

            </ScrollView>
            
            <View style={styles.modalButtonsRow}>
                <Pressable style={styles.cancelButton} onPress={() => setAiConfigModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Vazgeç</Text>
                </Pressable>
                <Pressable style={styles.primaryModalBtn} onPress={handleGenerateAiProgram} disabled={aiProgramLoading}>
                    {aiProgramLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryModalBtnText}>Oluştur</Text>}
                </Pressable>
            </View>

          </View>
        </BlurView>
      </Modal>

    </Layout>
  );
};

function createExercisesPageStyles(COLORS) {
  return StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: COLORS.bg,
  },
  scrollContainer: { 
      paddingBottom: Platform.OS === 'ios' ? 100 : 120, 
      alignItems: "center" 
  },
  contentSection: {
      width: '100%',
      paddingHorizontal: 20,
  },

  topBar: {
      width: '100%',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'android' ? 40 : 15,
      marginBottom: 20,
      marginTop: 30
  },
  pageTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: COLORS.textDark,
      letterSpacing: -0.5,
  },

  // --- ANİMASYONLU TAB STİLLERİ ---
  tabContainer: {
    flexDirection: "row",
    width: TAB_CONTAINER_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 3, // Padding'i küçülttüm ki kapsül daha şık dursun
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  slidingIndicator: {
    position: 'absolute',
    top: 3,
    left: 3,
    bottom: 3,
    borderRadius: 17,
  },
  tabWrapper: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: "center", 
    justifyContent: 'center',
    zIndex: 1, // Yazıların kapsülün üstünde kalması için
  },
  tabText: { fontSize: 11, fontWeight: "700", color: COLORS.textLight },
  activeTabText: { color: COLORS.white },

  sectionHeader: { marginBottom: 12, marginTop: 5 },
  sectionTitle: { color: COLORS.textDark, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },

  muscleGridGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 15, 
      width: '100%'
  },
  muscleCardGrid: {
      width: muscleGridItemWidth,
      aspectRatio: 1, 
      backgroundColor: COLORS.white,
      borderRadius: 24,
      padding: 15,
      alignItems: 'center',
      justifyContent: 'center', 
      borderWidth: 1,
      borderColor: COLORS.border,
  },
  muscleCardImageGrid: {
      width: 100, 
      height: 100,
      resizeMode: 'contain',
      marginBottom: 10
  },
  muscleCardTitleGrid: {
      fontSize: 15, 
      fontWeight: '800',
      color: COLORS.textDark,
      textAlign: 'center'
  },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 15 },
  backButtonIcon: { width: 40, height: 40, backgroundColor: COLORS.white, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: "800", color: COLORS.textDark, letterSpacing: -0.5 },
  titleLine: { flex: 1, height: 1, backgroundColor: COLORS.border, marginLeft: 5 },

  exerciseCard: {
      backgroundColor: COLORS.white,
      padding: 18,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: 'space-between',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
  },
  exerciseName: { fontSize: 16, fontWeight: "800", color: COLORS.textDark, marginBottom: 4 },
  descriptionSmall: { fontSize: 12, color: COLORS.textMain, lineHeight: 18 },
  playButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },

  aiCreateCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 25 },
  aiCreateGradient: { flexDirection: 'row', alignItems: 'center', padding: 25 },
  aiCreateTitle: { color: COLORS.black, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  aiCreateSubtitle: { color: "rgba(0, 0, 0, 0.8)", fontSize: 13, lineHeight: 18 },
  aiCreateIconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },

  savedProgramCard: { backgroundColor: COLORS.white, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  savedProgramName: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, marginBottom: 4 },
  savedProgramDate: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  savedProgramActions: { flexDirection: 'row', gap: 10 },
  actionBtnView: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.purple, alignItems: 'center', justifyContent: 'center' },
  actionBtnDelete: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.redishLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: "rgba(255, 129, 129, 0.2)" },

  dayPill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: COLORS.white, marginRight: 10, borderWidth: 1, borderColor: COLORS.border },
  dayPillActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  dayText: { color: COLORS.textMain, fontWeight: "700", fontSize: 13 },
  dayTextActive: { color: COLORS.white },

  weekPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weekPillActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  weekPillText: { color: COLORS.textMain, fontWeight: "800", fontSize: 13 },
  weekPillTextActive: { color: COLORS.primary },
  aiWeekPickerLabel: { fontSize: 12, fontWeight: "800", color: COLORS.textLight, marginBottom: 8 },
  aiMonthlySummaryBox: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiMonthlySummaryTitle: { fontSize: 12, fontWeight: "800", color: COLORS.purple, marginBottom: 6 },
  aiMonthlySummaryText: { fontSize: 13, color: COLORS.textMain, lineHeight: 20, fontWeight: "500" },
  aiWeekSummaryText: { fontSize: 13, color: COLORS.textMain, marginBottom: 6, lineHeight: 19, fontWeight: "500" },
  aiWeekFocusText: { fontSize: 12, color: COLORS.textLight, marginBottom: 10, fontWeight: "600" },
  aiConfigNameInput: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  aiNameEditBlock: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiNameEditRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  aiNameInput: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  aiNameSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.purple,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  aiNameSaveBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
  aiCompletionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    gap: 10,
  },
  aiCompletionRowDone: { backgroundColor: COLORS.secondaryLight, borderColor: "rgba(79, 209, 197, 0.35)" },
  aiCompletionLabel: { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.textDark },
  aiCompletionLabelDone: { color: COLORS.textDark },

  aiExerciseCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  aiExerciseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  aiExerciseTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  muscleBadge: { backgroundColor: COLORS.purpleLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  muscleBadgeText: { fontSize: 10, color: COLORS.purple, fontWeight: '800' },
  aiExerciseName: { fontSize: 15, fontWeight: "800", color: COLORS.textDark, flex: 1 },
  aiExerciseDetails: { marginTop: 15, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 15 },
  detailsGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  detailItem: { flex: 1, backgroundColor: COLORS.bg, padding: 10, borderRadius: 12, alignItems: 'center' },
  detailLabel: { color: COLORS.textLight, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  detailValue: { color: COLORS.textDark, fontWeight: "800", fontSize: 14 },
  noteBox: { flexDirection: 'row', backgroundColor: COLORS.purpleLight, padding: 12, borderRadius: 12, marginBottom: 12 },
  noteText: { flex: 1, color: COLORS.purple, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  programDetailBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  programDetailBtnText: { color: COLORS.purple, fontWeight: '700', fontSize: 12 },
  deleteOutlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.redishLight, backgroundColor: COLORS.white },
  deleteOutlineBtnText: { color: COLORS.redish, fontWeight: '800', fontSize: 14 },
  emptyStateBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, opacity: 0.7 },
  emptyListText: { color: COLORS.textMain, fontSize: 14, fontWeight: '600', marginTop: 10 },

  formScoreDesc: { color: COLORS.textMain, fontSize: 14, lineHeight: 20, marginBottom: 10 },
  formScorePaywall: { borderRadius: 22, overflow: "hidden", marginTop: 6 },
  formScorePaywallInner: { padding: 24, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 22 },
  formScorePaywallTitle: { fontSize: 20, fontWeight: "900", color: COLORS.textDark, marginTop: 12, marginBottom: 8 },
  formScorePaywallText: { fontSize: 14, color: COLORS.textMain, textAlign: "center", lineHeight: 20, marginBottom: 18 },
  formScorePaywallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.purple,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
  },
  formScorePaywallBtnText: { color: COLORS.white, fontWeight: "800", fontSize: 15 },
  formScoreInfoCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  formScoreInfoTitle: { color: COLORS.textDark, fontSize: 15, fontWeight: '800', marginBottom: 12 },
  formScoreCriteriaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  formScoreCriteriaText: { color: COLORS.textMain, fontSize: 13, fontWeight: '500', marginLeft: 8 },
  formScoreFeedbackCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  formScoreTitle: { color: COLORS.textDark, fontSize: 16, fontWeight: '800' },
  formScoreFeedbackText: { color: COLORS.textMain, fontSize: 14, lineHeight: 22, fontWeight: '500' },

  primaryButton: { borderRadius: 16, overflow: 'hidden', marginTop: 5 },
  primaryButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  primaryButtonText: { color: COLORS.white, fontWeight: "800", fontSize: 14 },

  formScoreActionsRow: { flexDirection: "row", marginTop: 5, gap: 10 },
  formScoreActionButton: { flex: 1, borderRadius: 16, overflow: "hidden", minHeight: 52, justifyContent: "center" },
  formScoreActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  formScoreActionButtonText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },

  modalBackground: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "rgba(45, 55, 72, 0.4)" },
  modalBackgroundBottom: { flex: 1, justifyContent: 'flex-end', backgroundColor: "rgba(45, 55, 72, 0.4)" },
  modalCardPremium: { width: "100%", backgroundColor: COLORS.white, borderRadius: 32, padding: 25, borderWidth: 1, borderColor: COLORS.border },
  modalHeaderPremium: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitlePremium: { fontSize: 22, fontWeight: "900", color: COLORS.textDark, letterSpacing: -0.5, marginBottom: 4 },
  modalMuscleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4, alignSelf: 'flex-start' },
  modalMuscleText: { fontSize: 10, color: COLORS.white, fontWeight: '700' },
  closeButtonPremium: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center" },
  videoContainerPremium: { width: "100%", aspectRatio: 16 / 9, backgroundColor: COLORS.bg, borderRadius: 20, overflow: "hidden", marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  videoImagePremium: { width: "100%", height: "100%", resizeMode: "cover" },
  noImageContainer: { flex:1, alignItems:'center', justifyContent:'center', gap: 10 },
  descriptionPremium: { fontSize: 14, color: COLORS.textMain, lineHeight: 22, marginBottom: 25, fontWeight: '500' },
  primaryButtonModal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16 },
  primaryButtonTextModal: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  
  configModalCard: { width: "100%", backgroundColor: COLORS.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
  configHeader: { marginBottom: 20 },
  configModalTitle: { fontSize: 22, fontWeight: "800", color: COLORS.textDark, letterSpacing: -0.5 },
  configModalDesc: { fontSize: 13, color: COLORS.textLight, fontWeight: '600', marginTop: 2 },
  configLabel: { fontSize: 14, fontWeight: "800", color: COLORS.textDark, marginBottom: 12 },
  optionRow: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.bg, padding: 18, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  optionRowSelected: { borderColor: COLORS.purple, backgroundColor: COLORS.purpleLight },
  optionTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textDark, marginBottom: 3 },
  optionDesc: { fontSize: 12, color: COLORS.textMain, lineHeight: 16 },
  primaryText: { color: COLORS.purple },
  daysRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  daySelectPill: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.bg, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  daySelectPillActive: { backgroundColor: COLORS.purpleLight, borderColor: COLORS.purple },
  daySelectText: { color: COLORS.textMain, fontWeight: "700", fontSize: 13 },
  daySelectTextActive: { color: COLORS.purple },
  modalButtonsRow: { flexDirection: "row", marginTop: 20, gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  cancelButton: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: "center", backgroundColor: COLORS.bg },
  cancelButtonText: { color: COLORS.textDark, fontWeight: "700" },
  primaryModalBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: "center", backgroundColor: COLORS.purple },
  primaryModalBtnText: { color: COLORS.white, fontWeight: "800" },
  });
}

export default ExercisesPage;