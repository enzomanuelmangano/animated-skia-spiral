import {
  BlurMask,
  Canvas,
  Extrapolate,
  Group,
  interpolate,
  Path,
  Skia,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Dimensions, View } from 'react-native';
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

// The logarithmic spiral will depend on the index
const logarithmicSpiral = ({
  angle,
  index,
}: {
  angle: number;
  index: number;
}) => {
  'worklet';
  const a = index / 4;
  const k = 0.005;
  return {
    x: a * Math.exp(k * angle) * Math.cos(angle * index),
    y: a * Math.exp(k * angle) * Math.sin(angle * index),
  };
};

const spiralCircleCount = 1500;

const Spiral = (dimensions?: { width: number; height: number }) => {
  const { width, height } = {
    width: windowWidth,
    height: windowHeight,
    ...dimensions,
  };

  const MAX_DISTANCE_FROM_CENTER = Math.sqrt(
    (width / 2) ** 2 + (height / 2) ** 2,
  );

  const angle = useSharedValue(Math.PI / 2);

  const spiralCoordinates = useDerivedValue(() => {
    const coordinates = [];
    for (let index = 0; index < spiralCircleCount; index++) {
      const { x, y } = logarithmicSpiral({
        angle: angle.value,
        index,
      });
      coordinates.push({ x, y });
    }
    return coordinates;
  });

  const animatedSpiralCoordinatesX = useDerivedValue(() => {
    return withTiming(
      spiralCoordinates.value.map(coordinate => {
        return coordinate.x;
      }),
      {
        duration: 1500,
      },
    );
  });

  const animatedSpiralCoordinatesY = useDerivedValue(() => {
    return withTiming(
      spiralCoordinates.value.map(coordinate => {
        return coordinate.y;
      }),
      {
        duration: 1500,
      },
    );
  });

  const path = useDerivedValue(() => {
    const circles = Skia.Path.Make();

    for (let index = 0; index < spiralCircleCount; index++) {
      const x = animatedSpiralCoordinatesX.value[index];
      const y = animatedSpiralCoordinatesY.value[index];

      const distanceFromCenter = Math.sqrt(x ** 2 + y ** 2);

      const radius = interpolate(
        distanceFromCenter,
        [0, MAX_DISTANCE_FROM_CENTER],
        [1.2, 0.2],
        Extrapolate.CLAMP,
      );

      circles.addCircle(x, y, radius);
    }

    return circles;
  });

  return (
    <View
      style={{ flex: 1 }}
      onTouchEnd={() => {
        angle.value = Math.PI * 2 * Math.random();
      }}>
      <StatusBar style="light" />
      <Canvas style={{ flex: 1, backgroundColor: '#010101' }}>
        <Group
          transform={[
            {
              translateX: width / 2,
            },
            {
              translateY: height / 2,
            },
          ]}>
          <Path path={path} />
          <SweepGradient
            c={vec(0, 0)}
            colors={['cyan', 'magenta', 'yellow', 'cyan']}
          />
          <BlurMask blur={5} style="solid" />
        </Group>
      </Canvas>
    </View>
  );
};

// eslint-disable-next-line import/no-default-export
export default Spiral;