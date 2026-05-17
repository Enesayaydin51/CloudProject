import React, { useState, useEffect } from "react";
import { Text } from "react-native";

const AnimatedCounter = ({ targetValue, style }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = parseInt(targetValue, 10);

    if (isNaN(end) || end === 0) {
      setCount(String(targetValue ?? "0"));
      return;
    }

    const duration = 1000;
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);
    let currentFrame = 0;

    const timer = setInterval(() => {
      currentFrame++;
      const progress = currentFrame / totalFrames;
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);

      const currentCount = Math.round(easeOutProgress * end);

      if (currentFrame <= totalFrames) {
        setCount(currentCount);
      } else {
        setCount(end);
        clearInterval(timer);
      }
    }, frameRate);

    return () => clearInterval(timer);
  }, [targetValue]);

  return <Text style={style}>{String(count)}</Text>;
};

export default AnimatedCounter;
