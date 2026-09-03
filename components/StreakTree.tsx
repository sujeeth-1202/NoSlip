import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

interface StreakTreeProps {
  streak: number;
  size?: number;
  variant?: 'growth' | 'buddy';
}

export function StreakTree({
  streak,
  size = 280,
  variant = 'growth',
}: StreakTreeProps) {
  const scale = useSharedValue(1);
  const prevStreakRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevStreakRef.current !== null && streak > prevStreakRef.current) {
      // Gentle, organic scale bounce when streak increases
      scale.value = withSequence(
        withTiming(1.14, { duration: 220 }),
        withSpring(1, { damping: 12, stiffness: 120 }),
      );
    }
    prevStreakRef.current = streak;
  }, [streak, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isBuddy = variant === 'buddy';

  // Continuous subtle scaling across the entire lifetime of the streak
  // Provides day-to-day visual expansion even between major milestone stages,
  // strictly capped to guarantee full containment in the viewBox.
  const continuousScale =
    streak <= 0
      ? 1
      : 1 + Math.min(0.04, streak * 0.0002 + Math.log10(streak + 1) * 0.01);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.animatedWrap, animatedStyle]}>
        {/*
          viewBox="-24 -32 148 148":
          A 1:1 square canvas centered at x=50, providing 15-20 units of clearance
          in all directions (top, bottom, left, right), completely eliminating
          vertical top-clipping past Day 120+ while maintaining horizontal containment.
        */}
        <Svg width={size} height={size} viewBox="-24 -32 148 148">
          <Defs>
            {/* Trunk Gradient */}
            <LinearGradient id="quietTrunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#695345" />
              <Stop offset="50%" stopColor="#534035" />
              <Stop offset="100%" stopColor="#3E3027" />
            </LinearGradient>

            {/* Wilted Trunk Gradient */}
            <LinearGradient id="quietWiltedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#8A7E73" />
              <Stop offset="100%" stopColor="#63594F" />
            </LinearGradient>

            {/* Growth Canopy Gradient */}
            <LinearGradient id="growthCanopyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#7DA183" />
              <Stop offset="50%" stopColor="#4D7053" />
              <Stop offset="100%" stopColor="#304A35" />
            </LinearGradient>

            {/* Buddy Canopy Gradient */}
            <LinearGradient id="buddyCanopyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#9C8CA3" />
              <Stop offset="50%" stopColor="#6B5B73" />
              <Stop offset="100%" stopColor="#4A3D51" />
            </LinearGradient>

            {/*
              Warm Ambient Glow: Radial gradient that cleanly fades to transparent (stopOpacity 0)
              before outer boundary, eliminating hard clipping cutoffs entirely.
            */}
            <RadialGradient
              id="quietGlow"
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="#EADBBA" stopOpacity="0.55" />
              <Stop offset="55%" stopColor="#EADBBA" stopOpacity="0.25" />
              <Stop offset="88%" stopColor="#E7DFCE" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#E7DFCE" stopOpacity="0" />
            </RadialGradient>

            {/*
              Radiant Celestial Glow: Radial gradient fading to zero opacity at outer perimeter.
            */}
            <RadialGradient
              id="celestialGlow"
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0%" stopColor="#F5E4BE" stopOpacity="0.65" />
              <Stop offset="45%" stopColor="#EADBBA" stopOpacity="0.32" />
              <Stop offset="82%" stopColor="#EADBBA" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#E7DFCE" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Root growth group scaled strictly from the trunk ground base (50, 88) */}
          <G transform={`translate(50, 88) scale(${continuousScale}) translate(-50, -88)`}>
            {renderTree(streak, isBuddy)}
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Procedural SVG Generation with Extended Milestones (up to 120+)
// ---------------------------------------------------------------------------

function renderTree(streak: number, isBuddy: boolean) {
  if (streak <= 0) {
    return <WiltedStage />;
  }
  if (streak <= 2) {
    return <SeedlingStage streak={streak} isBuddy={isBuddy} />;
  }
  if (streak <= 6) {
    return <SaplingStage streak={streak} isBuddy={isBuddy} />;
  }
  if (streak <= 13) {
    return <YoungTreeStage streak={streak} isBuddy={isBuddy} />;
  }
  if (streak <= 29) {
    return <EstablishedTreeStage streak={streak} isBuddy={isBuddy} />;
  }
  if (streak <= 44) {
    return <FlourishingTreeStage streak={streak} isBuddy={isBuddy} />;
  }
  if (streak <= 59) {
    return <AncientCanopyStage streak={streak} isBuddy={isBuddy} />;
  }
  if (streak <= 89) {
    return <GrandElderStage streak={streak} isBuddy={isBuddy} />;
  }
  if (streak <= 119) {
    return <CelestialStage streak={streak} isBuddy={isBuddy} />;
  }
  return <EternalLivingStage streak={streak} isBuddy={isBuddy} />;
}

/** Stage 0: Wilted (Bare brown stub, drooping, gentle start-again feel) */
function WiltedStage() {
  return (
    <G>
      {/* Ground mound in stone tones */}
      <Ellipse cx="50" cy="88" rx="22" ry="4.5" fill="#D8CFBF" />
      <Ellipse cx="50" cy="87" rx="16" ry="3" fill="#C5BCAE" />

      {/* Drooping wilted stub */}
      <Path
        d="M 48 88 C 47 78, 43 72, 38 67 C 36 65, 34 65, 33 67 C 32 69, 34 71, 37 73 C 41 76, 44 82, 45 88 Z"
        fill="url(#quietWiltedGrad)"
      />

      {/* Tiny broken dry twig */}
      <Path
        d="M 46 80 C 50 78, 54 79, 56 82"
        stroke="#8A7E73"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Fallen curled dry leaf */}
      <Path
        d="M 58 87 C 62 85, 66 87, 68 89 C 64 89, 60 89, 58 87 Z"
        fill="#A69B8E"
        opacity="0.85"
      />
    </G>
  );
}

/**
 * Stage 1-2: Seedling
 * Symmetrical, top-centered leaves anchored at the exact apex of the stem (50, 64)
 * with zero gap.
 */
function SeedlingStage({ streak, isBuddy }: { streak: number; isBuddy: boolean }) {
  const isTwo = streak >= 2;
  const leafScale = isTwo ? 1.12 : 0.95;
  const leafPrimary = isBuddy ? '#85748D' : '#5A7C5F';
  const leafSecondary = isBuddy ? '#6B5B73' : '#3E5C43';
  const leafCenter = isBuddy ? '#A392AB' : '#7DA183';
  const stemColor = isBuddy ? '#5D4F65' : '#45654B';

  return (
    <G>
      {/* Ground mound */}
      <Ellipse cx="50" cy="88" rx="20" ry="4" fill="#D8CFBF" />
      <Ellipse cx="50" cy="87" rx="14" ry="2.8" fill="#C5BCAE" />

      {/* Upright Sprouting Stem */}
      <Path
        d="M 50 88 Q 49.6 76 50 64"
        stroke={stemColor}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Top-Centered Symmetrical Leaves anchored at stem apex (50, 64) */}
      <G transform={`translate(50, 64) scale(${leafScale}) translate(-50, -64)`}>
        {/* Left Leaf - balanced arch outwards to top-left */}
        <Path
          d="M 50 64 C 42 63, 36 56, 38 49 C 45 50, 48 57, 50 64 Z"
          fill={leafPrimary}
        />

        {/* Right Leaf - balanced arch outwards to top-right */}
        <Path
          d="M 50 64 C 58 63, 64 56, 62 49 C 55 50, 52 57, 50 64 Z"
          fill={leafSecondary}
        />

        {/* Day 2: Upright center budding shoot crowning the apex */}
        {isTwo && (
          <>
            <Path
              d="M 50 64 C 48 57, 48 51, 50 45 C 52 51, 52 57, 50 64 Z"
              fill={leafCenter}
            />
            <Circle cx="50" cy="45" r="1.8" fill={isBuddy ? '#BCAEC3' : '#99BCA0'} />
          </>
        )}
      </G>
    </G>
  );
}

/**
 * Stage 3-6: Sapling
 * TRUNK AUDITED: Trunk extends up to (trunkTop - 3), cleanly penetrating
 * 8 units inside the center foliage cluster (bottom at trunkTop + 5). Zero gap.
 */
function SaplingStage({ streak, isBuddy }: { streak: number; isBuddy: boolean }) {
  const progress = Math.min(1, Math.max(0, (streak - 3) / 3));
  const trunkTop = 52 - progress * 4;
  const foliageScale = 0.92 + progress * 0.16;

  const cBase = isBuddy ? '#4A3D51' : '#2D4632';
  const cMid = isBuddy ? '#6B5B73' : '#3E5C43';
  const cTop = isBuddy ? '#85748D' : '#5A7C5F';
  const cHigh = isBuddy ? '#A392AB' : '#7DA183';

  return (
    <G>
      {/* Ground base */}
      <Ellipse cx="50" cy="89" rx="24" ry="4.8" fill="#D8CFBF" />
      <Ellipse cx="50" cy="88" rx="18" ry="3.2" fill="#C5BCAE" />

      {/* Trunk extending directly into foliage core */}
      <Path
        d={`M 47 88 L 48.5 ${trunkTop - 3} L 51.5 ${trunkTop - 3} L 53 88 Z`}
        fill="url(#quietTrunkGrad)"
      />

      {/* Left branch */}
      <Path
        d={`M 49 ${trunkTop + 14} Q 42 ${trunkTop + 10} 38 ${trunkTop + 6}`}
        stroke="#534035"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Right branch */}
      <Path
        d={`M 51 ${trunkTop + 8} Q 58 ${trunkTop + 4} 62 ${trunkTop}`}
        stroke="#534035"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Foliage Clusters overlapping trunk seamlessly */}
      <G transform={`translate(50, ${trunkTop}) scale(${foliageScale}) translate(-50, -${trunkTop})`}>
        <Circle cx="37" cy={trunkTop + 5} r="8" fill={cMid} />
        <Circle cx="36" cy={trunkTop + 3} r="6" fill={cTop} />

        <Circle cx="63" cy={trunkTop - 1} r="9" fill={cBase} />
        <Circle cx="64" cy={trunkTop - 3} r="7" fill={cMid} />

        <Circle cx="50" cy={trunkTop - 6} r="11" fill={cMid} />
        <Circle cx="49" cy={trunkTop - 9} r="8.5" fill={cHigh} />
      </G>
    </G>
  );
}

/**
 * Stage 7-13: Young Tree
 * TRUNK AUDITED: Trunk extends up to y=44, cleanly overlapping
 * the canopy bottom at y=50 by 6 full units. Zero gap.
 */
function YoungTreeStage({ streak, isBuddy }: { streak: number; isBuddy: boolean }) {
  const progress = Math.min(1, Math.max(0, (streak - 7) / 6));
  const canopyScale = 0.98 + progress * 0.12;

  const cDark = isBuddy ? '#3A3040' : '#233727';
  const cBase = isBuddy ? '#4A3D51' : '#304A35';
  const cMid = isBuddy ? '#6B5B73' : '#3E5C43';
  const cTop = isBuddy ? '#85748D' : '#5A7C5F';
  const cHigh = isBuddy ? '#A392AB' : '#7DA183';

  return (
    <G>
      {/* Grassy stone mound */}
      <Ellipse cx="50" cy="89" rx="27" ry="5" fill="#D8CFBF" />
      <Ellipse cx="50" cy="88" rx="21" ry="3.6" fill="#C5BCAE" />
      <Path d="M 33 87 Q 31 83 29 85 Q 31 87 33 87 Z" fill={cMid} />
      <Path d="M 68 87 Q 70 83 72 85 Q 70 87 68 87 Z" fill={cMid} />

      {/* Sturdy Trunk extending up to y=44 into canopy core (canopy base is at y=50) */}
      <Path d="M 46 88 L 47.5 44 L 52.5 44 L 54 88 Z" fill="url(#quietTrunkGrad)" />
      <Path
        d="M 48 60 Q 38 52 32 48"
        stroke="#4A3A31"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M 52 56 Q 62 48 68 44"
        stroke="#4A3A31"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Layered Canopy scaled from center (50, 38) */}
      <G transform={`translate(50, 38) scale(${canopyScale}) translate(-50, -38)`}>
        <Circle cx="35" cy="46" r="13" fill={cDark} />
        <Circle cx="65" cy="42" r="14" fill={cDark} />
        <Circle cx="50" cy="34" r="16" fill={cBase} />

        <Circle cx="38" cy="44" r="12" fill={cMid} />
        <Circle cx="62" cy="40" r="13" fill={cTop} />
        <Circle cx="50" cy="30" r="15" fill={cMid} />

        <Circle cx="44" cy="27" r="10" fill={cTop} />
        <Circle cx="55" cy="29" r="10" fill={cHigh} />
      </G>
    </G>
  );
}

/**
 * Stage 14-29: Established Tree (Includes Day 25 reference)
 * TRUNK AUDITED: Trunk extends up to y=38, penetrating 7 units
 * past the canopy base at y=45. Zero gap.
 */
function EstablishedTreeStage({ streak, isBuddy }: { streak: number; isBuddy: boolean }) {
  const progress = Math.min(1, Math.max(0, (streak - 14) / 15));
  const canopyScale = 1.0 + progress * 0.1;
  const flowerCount = Math.min(6, 2 + Math.floor(progress * 4.5));

  const cDark = isBuddy ? '#362C3C' : '#203324';
  const cBase = isBuddy ? '#4A3D51' : '#304A35';
  const cMid = isBuddy ? '#6B5B73' : '#3E5C43';
  const cTop = isBuddy ? '#85748D' : '#5A7C5F';
  const cHigh = isBuddy ? '#A392AB' : '#7DA183';
  const cLight = isBuddy ? '#BCAEC3' : '#99BCA0';

  return (
    <G>
      {/* Mound */}
      <Ellipse cx="50" cy="90" rx="30" ry="5.5" fill="#D8CFBF" />
      <Ellipse cx="50" cy="89" rx="23" ry="4" fill="#C5BCAE" />

      {/* Root Flares and Trunk extending to y=38 (canopy base at y=45) */}
      <Path
        d="M 43 89 C 45 84, 46 66, 47 38 L 53 38 C 54 66, 55 84, 57 89 Z"
        fill="url(#quietTrunkGrad)"
      />

      {/* Big Canopy scaled from center (50, 36) */}
      <G transform={`translate(50, 36) scale(${canopyScale}) translate(-50, -36)`}>
        <Circle cx="30" cy="44" r="15" fill={cDark} />
        <Circle cx="70" cy="42" r="16" fill={cDark} />
        <Circle cx="50" cy="26" r="19" fill={cBase} />

        <Circle cx="35" cy="40" r="15" fill={cBase} />
        <Circle cx="65" cy="38" r="15" fill={cMid} />
        <Circle cx="48" cy="24" r="17" fill={cMid} />

        <Circle cx="40" cy="20" r="12" fill={cTop} />
        <Circle cx="58" cy="22" r="13" fill={cHigh} />
        <Circle cx="50" cy="18" r="9" fill={cLight} />

        {/* Progressive Blossom Details */}
        {flowerCount >= 1 && <Blossom cx={32} cy={35} />}
        {flowerCount >= 2 && <Blossom cx={64} cy={32} />}
        {flowerCount >= 3 && <Blossom cx={46} cy={17} />}
        {flowerCount >= 4 && <Blossom cx={55} cy={27} />}
        {flowerCount >= 5 && <Blossom cx={38} cy={46} />}
        {flowerCount >= 6 && <Blossom cx={68} cy={44} />}
      </G>
    </G>
  );
}

/**
 * Stage 30-44: Flourishing Tree
 * TRUNK AUDITED: Trunk extends up to y=34, penetrating 9 units
 * past the canopy base at y=43. Zero gap.
 */
function FlourishingTreeStage({ streak, isBuddy }: { streak: number; isBuddy: boolean }) {
  const progress = Math.min(1, (streak - 30) / 14);
  const canopyScale = 1.02 + progress * 0.08;
  const fruitCount = Math.min(8, 4 + Math.floor(progress * 4));

  const cDark = isBuddy ? '#322838' : '#1D2E21';
  const cBase = isBuddy ? '#4A3D51' : '#2D4632';
  const cMid = isBuddy ? '#6B5B73' : '#3E5C43';
  const cTop = isBuddy ? '#85748D' : '#5A7C5F';
  const cHigh = isBuddy ? '#A392AB' : '#7DA183';
  const cLight = isBuddy ? '#BCAEC3' : '#99BCA0';

  return (
    <G>
      {/* Subtle Warm Radial Glow Aura */}
      <Circle cx="50" cy="34" r={36 + progress * 3} fill="url(#quietGlow)" />

      {/* Base */}
      <Ellipse cx="50" cy="90" rx="33" ry="5.8" fill="#D8CFBF" />
      <Ellipse cx="50" cy="89" rx="25" ry="4" fill="#C5BCAE" />

      {/* Tiny floral accents on mound */}
      <Circle cx="26" cy="88" r="1.4" fill="#D99B9B" />
      <Circle cx="74" cy="88" r="1.4" fill="#E6C587" />
      <Circle cx="35" cy="90" r="1.2" fill="#BCAEC3" />
      <Circle cx="65" cy="90" r="1.2" fill="#D99B9B" />

      {/* Mature trunk extending up to y=34 (canopy base at y=43) */}
      <Path
        d="M 42 89 C 44 82, 45 60, 46 34 L 54 34 C 55 60, 56 82, 58 89 Z"
        fill="url(#quietTrunkGrad)"
      />

      {/* Flourishing Canopy scaled from center (50, 32) */}
      <G transform={`translate(50, 32) scale(${canopyScale}) translate(-50, -32)`}>
        <Circle cx="28" cy="42" r="17" fill={cDark} />
        <Circle cx="72" cy="40" r="17" fill={cDark} />
        <Circle cx="50" cy="22" r="21" fill={cDark} />

        <Circle cx="32" cy="38" r="16" fill={cBase} />
        <Circle cx="68" cy="36" r="16" fill={cMid} />
        <Circle cx="50" cy="20" r="19" fill={cMid} />

        <Circle cx="38" cy="18" r="14" fill={cTop} />
        <Circle cx="60" cy="19" r="14" fill={cHigh} />
        <Circle cx="49" cy="13" r="11" fill={cLight} />

        {/* Warm Fruit details */}
        {fruitCount >= 1 && <Fruit cx={32} cy={34} color="#C46D54" />}
        {fruitCount >= 2 && <Fruit cx={65} cy={30} color="#D48B4E" />}
        {fruitCount >= 3 && <Fruit cx={46} cy={14} color="#C46D54" />}
        {fruitCount >= 4 && <Fruit cx={58} cy={24} color="#E0A352" />}
        {fruitCount >= 5 && <Fruit cx={38} cy={44} color="#D48B4E" />}
        {fruitCount >= 6 && <Fruit cx={68} cy={42} color="#C46D54" />}
        {fruitCount >= 7 && <Fruit cx={50} cy={29} color="#D48B4E" />}
        {fruitCount >= 8 && <Fruit cx={42} cy={22} color="#E0A352" />}

        {/* Delicate blossoms */}
        <Blossom cx={42} cy={27} />
        <Blossom cx={52} cy={32} />
      </G>

      {/* Subtle Warm Sparkles */}
      <QuietSparkle cx={16} cy={26} size={3.6} />
      <QuietSparkle cx={84} cy={22} size={4.0} />
      <QuietSparkle cx={50} cy={6} size={4.2} />
    </G>
  );
}

/**
 * Stage 45-59: Ancient Canopy Stage
 * TRUNK AUDITED: Trunk extends up to y=32, penetrating 11 units
 * into the canopy core (base at y=43). Zero gap.
 */
function AncientCanopyStage({ streak, isBuddy }: { streak: number; isBuddy: boolean }) {
  const progress = Math.min(1, (streak - 45) / 14);
  const canopyScale = 1.03 + progress * 0.06;

  const cDark = isBuddy ? '#2D2333' : '#17261A';
  const cBase = isBuddy ? '#44374A' : '#263C2A';
  const cMid = isBuddy ? '#6B5B73' : '#3E5C43';
  const cTop = isBuddy ? '#85748D' : '#5A7C5F';
  const cHigh = isBuddy ? '#A392AB' : '#7DA183';
  const cLight = isBuddy ? '#BCAEC3' : '#99BCA0';

  return (
    <G>
      {/* Soft Radial Ambient Glow */}
      <Circle cx="50" cy="32" r={38 + progress * 3} fill="url(#quietGlow)" />

      {/* Ground Base with root buttresses */}
      <Ellipse cx="50" cy="90" rx="35" ry="6" fill="#D8CFBF" />
      <Ellipse cx="50" cy="89" rx="27" ry="4.2" fill="#C5BCAE" />

      {/* Wide root buttresses and trunk extending up to y=32 (canopy base at y=43) */}
      <Path
        d="M 39 90 C 43 82, 44 58, 45 32 L 55 32 C 56 58, 57 82, 61 90 Z"
        fill="url(#quietTrunkGrad)"
      />
      <Path
        d="M 36 90 Q 42 86 44 78"
        stroke="#3E3027"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path
        d="M 64 90 Q 58 86 56 78"
        stroke="#3E3027"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Expansive Canopy scaled symmetrically from center (50, 30) */}
      <G transform={`translate(50, 30) scale(${canopyScale}) translate(-50, -30)`}>
        <Circle cx="24" cy="40" r="19" fill={cDark} />
        <Circle cx="76" cy="38" r="19" fill={cDark} />
        <Circle cx="50" cy="20" r="23" fill={cDark} />

        <Circle cx="30" cy="36" r="18" fill={cBase} />
        <Circle cx="70" cy="34" r="18" fill={cMid} />
        <Circle cx="50" cy="18" r="21" fill={cMid} />

        <Circle cx="38" cy="16" r="15" fill={cTop} />
        <Circle cx="62" cy="16" r="15" fill={cHigh} />
        <Circle cx="50" cy="11" r="12" fill={cLight} />

        {/* Botanical fruits */}
        <Fruit cx={28} cy={32} color="#C46D54" />
        <Fruit cx={72} cy={28} color="#D48B4E" />
        <Fruit cx={46} cy={12} color="#C46D54" />
        <Fruit cx={56} cy={22} color="#E0A352" />
        <Fruit cx={36} cy={42} color="#D48B4E" />
        <Fruit cx={66} cy={40} color="#C46D54" />
        <Fruit cx={50} cy={26} color="#E0A352" />

        <Blossom cx={38} cy={24} />
        <Blossom cx={62} cy={24} />
        <Blossom cx={50} cy={32} />
      </G>

      <QuietSparkle cx={14} cy={22} size={4.2} />
      <QuietSparkle cx={86} cy={20} size={4.4} />
      <QuietSparkle cx={50} cy={4} size={4.6} />
      <QuietSparkle cx={24} cy={8} size={3.4} />
      <QuietSparkle cx={76} cy={8} size={3.4} />
    </G>
  );
}

/**
 * Stage 60-89: Grand Elder Stage
 * TRUNK AUDITED: Trunk extends up to y=28, penetrating 13 units
 * into the crown (base at y=41). Zero gap.
 */
function GrandElderStage({ streak, isBuddy }: { streak: number; isBuddy: boolean }) {
  const progress = Math.min(1, (streak - 60) / 29);
  const canopyScale = 1.04 + progress * 0.06;

  const cDark = isBuddy ? '#281F2E' : '#142217';
  const cBase = isBuddy ? '#3F3244' : '#223626';
  const cMid = isBuddy ? '#6B5B73' : '#3E5C43';
  const cTop = isBuddy ? '#85748D' : '#5A7C5F';
  const cHigh = isBuddy ? '#A392AB' : '#7DA183';
  const cLight = isBuddy ? '#BCAEC3' : '#99BCA0';

  return (
    <G>
      {/* Broad Radiant Aura */}
      <Circle cx="50" cy="30" r={40 + progress * 3} fill="url(#celestialGlow)" />

      {/* Earth mound */}
      <Ellipse cx="50" cy="90" rx="36" ry="6.2" fill="#D8CFBF" />
      <Ellipse cx="50" cy="89" rx="28" ry="4.4" fill="#C5BCAE" />

      {/* Mighty Ancient Trunk extending up to y=28 (canopy base at y=41) */}
      <Path
        d="M 38 90 C 42 80, 43 54, 44 28 L 56 28 C 57 54, 58 80, 62 90 Z"
        fill="url(#quietTrunkGrad)"
      />
      <Path d="M 33 90 Q 40 85 43 74" stroke="#3E3027" strokeWidth="2.8" strokeLinecap="round" />
      <Path d="M 67 90 Q 60 85 57 74" stroke="#3E3027" strokeWidth="2.8" strokeLinecap="round" />

      {/* Towering Two-Tiered Canopy scaled symmetrically from center (50, 28) */}
      <G transform={`translate(50, 28) scale(${canopyScale}) translate(-50, -28)`}>
        {/* Tier 1 - Lower broad wings */}
        <Circle cx="22" cy="38" r="19" fill={cDark} />
        <Circle cx="78" cy="36" r="19" fill={cDark} />
        <Circle cx="28" cy="34" r="19" fill={cBase} />
        <Circle cx="72" cy="32" r="19" fill={cMid} />

        {/* Tier 2 - Upper crowning dome */}
        <Circle cx="50" cy="18" r="23" fill={cDark} />
        <Circle cx="50" cy="15" r="21" fill={cMid} />
        <Circle cx="38" cy="13" r="16" fill={cTop} />
        <Circle cx="62" cy="13" r="16" fill={cHigh} />
        <Circle cx="50" cy="8" r="13" fill={cLight} />

        {/* Harvest Details */}
        <Fruit cx={24} cy={30} color="#C46D54" />
        <Fruit cx={76} cy={26} color="#E0A352" />
        <Fruit cx={46} cy={10} color="#C46D54" />
        <Fruit cx={56} cy={18} color="#D48B4E" />
        <Fruit cx={36} cy={38} color="#E0A352" />
        <Fruit cx={66} cy={36} color="#C46D54" />
        <Fruit cx={50} cy={24} color="#E6C587" />

        {/* Cascading floral vine dots */}
        <Circle cx="22" cy="46" r="1.8" fill="#E2BCBC" />
        <Circle cx="24" cy="50" r="1.5" fill="#E2BCBC" />
        <Circle cx="78" cy="44" r="1.8" fill="#E2BCBC" />
        <Circle cx="76" cy="48" r="1.5" fill="#E2BCBC" />
      </G>

      {/* Sparkles */}
      <QuietSparkle cx={12} cy={18} size={4.4} />
      <QuietSparkle cx={88} cy={16} size={4.6} />
      <QuietSparkle cx={50} cy={3} size={5.0} />
      <QuietSparkle cx={22} cy={6} size={3.6} />
      <QuietSparkle cx={78} cy={6} size={3.6} />
    </G>
  );
}

/**
 * Stage 90-119: Celestial Stage
 * TRUNK AUDITED: Trunk extends up to y=24, penetrating 17 units
 * into the core canopy (base at y=41). Zero gap.
 */
function CelestialStage({ streak, isBuddy }: { streak: number; isBuddy: boolean }) {
  const progress = Math.min(1, (streak - 90) / 29);
  const canopyScale = 1.04 + progress * 0.05;

  const cDark = isBuddy ? '#241B29' : '#111D13';
  const cBase = isBuddy ? '#3A2E3F' : '#1F3122';
  const cMid = isBuddy ? '#6B5B73' : '#3E5C43';
  const cTop = isBuddy ? '#85748D' : '#5A7C5F';
  const cHigh = isBuddy ? '#A392AB' : '#7DA183';
  const cLight = isBuddy ? '#C5B7CB' : '#A3C4AA';

  return (
    <G>
      {/* Radiant Celestial Halo */}
      <Circle cx="50" cy="28" r={42 + progress * 3} fill="url(#celestialGlow)" />

      {/* Base */}
      <Ellipse cx="50" cy="90" rx="38" ry="6.5" fill="#D8CFBF" />
      <Ellipse cx="50" cy="89" rx="30" ry="4.6" fill="#C5BCAE" />

      {/* Ancient Sturdy Trunk extending to y=24 (canopy base at y=41) */}
      <Path
        d="M 36 90 C 40 78, 42 50, 43 24 L 57 24 C 58 50, 60 78, 64 90 Z"
        fill="url(#quietTrunkGrad)"
      />

      {/* Celestial Canopy scaled symmetrically from center (50, 26) */}
      <G transform={`translate(50, 26) scale(${canopyScale}) translate(-50, -26)`}>
        <Circle cx="20" cy="36" r="21" fill={cDark} />
        <Circle cx="80" cy="34" r="21" fill={cDark} />
        <Circle cx="50" cy="16" r="25" fill={cDark} />

        <Circle cx="26" cy="32" r="20" fill={cBase} />
        <Circle cx="74" cy="30" r="20" fill={cMid} />
        <Circle cx="50" cy="13" r="23" fill={cMid} />

        <Circle cx="36" cy="11" r="17" fill={cTop} />
        <Circle cx="64" cy="11" r="17" fill={cHigh} />
        <Circle cx="50" cy="6" r="14" fill={cLight} />

        {/* Luminous fruits */}
        <Fruit cx={22} cy={28} color="#E0A352" />
        <Fruit cx={78} cy={24} color="#E6C587" />
        <Fruit cx={45} cy={8} color="#C46D54" />
        <Fruit cx={55} cy={16} color="#E0A352" />
        <Fruit cx={34} cy={36} color="#E6C587" />
        <Fruit cx={66} cy={34} color="#C46D54" />
        <Fruit cx={50} cy={22} color="#F5E4BE" />

        <Blossom cx={34} cy={20} />
        <Blossom cx={66} cy={20} />
        <Blossom cx={50} cy={28} />
      </G>

      {/* Celestial Star Particles */}
      <QuietSparkle cx={10} cy={16} size={4.8} />
      <QuietSparkle cx={90} cy={14} size={5.0} />
      <QuietSparkle cx={50} cy={2} size={5.4} />
      <QuietSparkle cx={20} cy={5} size={4.0} />
      <QuietSparkle cx={80} cy={5} size={4.0} />
    </G>
  );
}

/**
 * Stage 120+: Eternal Living Tree (The Mythic Final Form)
 * AUDITED & FIXED:
 * 1. TRUNK: Extends up to y=22, penetrating 18 units into the canopy core (base at y=40). Zero gap.
 * 2. TOP CONTAINMENT: Highest element at y=-13 sits with 18.6 units of clearance
 *    below the viewBox top (y=-32). Zero top-clipping past Day 120.
 */
function EternalLivingStage({ streak, isBuddy }: { streak: number; isBuddy: boolean }) {
  const endlessBonus = Math.min(0.04, Math.log10(streak - 118) * 0.015);
  const canopyScale = 1.04 + endlessBonus;

  const cDark = isBuddy ? '#201726' : '#0E1910';
  const cBase = isBuddy ? '#36293B' : '#1C2E20';
  const cMid = isBuddy ? '#6B5B73' : '#3E5C43';
  const cTop = isBuddy ? '#85748D' : '#5A7C5F';
  const cHigh = isBuddy ? '#A392AB' : '#7DA183';
  const cLight = isBuddy ? '#CEBFD4' : '#ADD0B5';

  return (
    <G>
      {/* Monumental Ethereal Halo (fades to transparent before outer edge) */}
      <Circle cx="50" cy="28" r={42} fill="url(#celestialGlow)" />

      {/* Sprawling Sacred Earth Mound */}
      <Ellipse cx="50" cy="90" rx="38" ry="6.5" fill="#D8CFBF" />
      <Ellipse cx="50" cy="89" rx="30" ry="4.6" fill="#C5BCAE" />

      {/* Grand Roots and Ancient Trunk extending up to y=22 (canopy base at y=40) */}
      <Path
        d="M 34 90 C 39 76, 41 48, 42 22 L 58 22 C 59 48, 61 76, 66 90 Z"
        fill="url(#quietTrunkGrad)"
      />
      <Path d="M 30 90 Q 38 84 41 72" stroke="#3E3027" strokeWidth="3.2" strokeLinecap="round" />
      <Path d="M 70 90 Q 62 84 59 72" stroke="#3E3027" strokeWidth="3.2" strokeLinecap="round" />

      {/* Eternal Sprawling Canopy scaled symmetrically from center (50, 24) */}
      <G transform={`translate(50, 24) scale(${canopyScale}) translate(-50, -24)`}>
        <Circle cx="18" cy="34" r="22" fill={cDark} />
        <Circle cx="82" cy="32" r="22" fill={cDark} />
        <Circle cx="50" cy="16" r="24" fill={cDark} />

        <Circle cx="24" cy="30" r="21" fill={cBase} />
        <Circle cx="76" cy="28" r="21" fill={cMid} />
        <Circle cx="50" cy="12" r="23" fill={cMid} />

        <Circle cx="34" cy="10" r="17" fill={cTop} />
        <Circle cx="66" cy="10" r="17" fill={cHigh} />
        <Circle cx="50" cy="6" r="13" fill={cLight} />

        {/* Abundant Sacred Fruit & Golden Glow */}
        <Fruit cx={22} cy={26} color="#E0A352" />
        <Fruit cx={78} cy={22} color="#E6C587" />
        <Fruit cx={45} cy={8} color="#C46D54" />
        <Fruit cx={55} cy={14} color="#E0A352" />
        <Fruit cx={32} cy={34} color="#E6C587" />
        <Fruit cx={68} cy={32} color="#C46D54" />
        <Fruit cx={50} cy={20} color="#F5E4BE" />
        <Fruit cx={38} cy={18} color="#E0A352" />
        <Fruit cx={62} cy={18} color="#E6C587" />

        <Blossom cx={32} cy={18} />
        <Blossom cx={68} cy={18} />
        <Blossom cx={50} cy={26} />
      </G>

      {/* Constellation Sparkles */}
      <QuietSparkle cx={8} cy={16} size={4.8} />
      <QuietSparkle cx={92} cy={14} size={5.0} />
      <QuietSparkle cx={50} cy={1} size={4.6} />
      <QuietSparkle cx={18} cy={5} size={3.8} />
      <QuietSparkle cx={82} cy={5} size={3.8} />
      <QuietSparkle cx={28} cy={44} size={3.6} />
      <QuietSparkle cx={72} cy={42} size={3.6} />
    </G>
  );
}

// ---------------------------------------------------------------------------
// Botanical Detail Sub-components
// ---------------------------------------------------------------------------

function Blossom({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Circle cx={cx - 1.6} cy={cy} r="1.5" fill="#E2BCBC" opacity="0.9" />
      <Circle cx={cx + 1.6} cy={cy} r="1.5" fill="#E2BCBC" opacity="0.9" />
      <Circle cx={cx} cy={cy - 1.6} r="1.5" fill="#E2BCBC" opacity="0.9" />
      <Circle cx={cx} cy={cy + 1.6} r="1.5" fill="#E2BCBC" opacity="0.9" />
      <Circle cx={cx} cy={cy} r="1.1" fill="#F8EBEB" />
    </G>
  );
}

function Fruit({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r="2.5" fill={color} />
      <Circle cx={cx - 0.6} cy={cy - 0.6} r="0.8" fill="#F6F1E4" opacity="0.6" />
    </G>
  );
}

function QuietSparkle({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const half = size / 2;
  return (
    <G>
      <Path
        d={`M ${cx} ${cy - size} Q ${cx} ${cy} ${cx + size} ${cy} Q ${cx} ${cy} ${cx} ${cy + size} Q ${cx} ${cy} ${cx - size} ${cy} Q ${cx} ${cy} ${cx} ${cy - size} Z`}
        fill="#E6C587"
      />
      <Circle cx={cx} cy={cy} r={half * 0.35} fill="#FDFBF7" />
    </G>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
