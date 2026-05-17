import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const GLASS_H = 196;
const GLASS_W = 118;
const RIM = 3;
const INNER_H = GLASS_H - RIM * 2;

/**
 * Günlük su ilerlemesini bardak doluluğu ile gösterir; miktar değişince animasyon.
 */
export default function WaterGlassFill({ todayMl, goalMl }) {
  const ratio = goalMl > 0 ? Math.min(1, todayMl / goalMl) : 0;
  const overflow = goalMl > 0 && todayMl > goalMl;
  const anim = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: ratio,
      useNativeDriver: false,
      friction: 8,
      tension: 42,
    }).start();
  }, [ratio, anim]);

  const fillHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, INNER_H],
  });

  return (
    <View style={styles.wrap}>
      <View style={[styles.glassOuter, { width: GLASS_W, height: GLASS_H }]}>
        <View style={styles.glassInner}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.waterClip,
              {
                height: fillHeight,
              },
            ]}
          >
            <LinearGradient
              colors={["#5eead4", "#22d3ee", "#0ea5e9"]}
              locations={[0, 0.45, 1]}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>
      {overflow ? (
        <Text style={styles.overflowHint}>Hedef aşıldı</Text>
      ) : ratio >= 1 && goalMl > 0 ? (
        <Text style={styles.doneHint}>Hedef tamam</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  glassOuter: {
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "rgba(65, 179, 162, 0.45)",
    backgroundColor: "rgba(255,255,255,0.5)",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  glassInner: {
    ...StyleSheet.absoluteFillObject,
    margin: RIM,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  waterClip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
  },
  overflowHint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#0ea5e9",
  },
  doneHint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#41B3A2",
  },
});
