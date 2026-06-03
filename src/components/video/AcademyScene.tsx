import { AbsoluteFill, Img, useCurrentFrame, interpolate, spring } from "remotion";

type AcademySceneProps = {
  imageSrc: string;
  durationInFrames: number;
  sceneType?: string;
};

const ACADEMY_ICONS = [
  { emoji: "📚", label: "books" },
  { emoji: "🎓", label: "graduation" },
  { emoji: "🌍", label: "globe" },
  { emoji: "💬", label: "speech" },
  { emoji: "✏️", label: "pencil" },
  { emoji: "⭐", label: "star" },
  { emoji: "🔤", label: "abc" },
  { emoji: "🎯", label: "target" },
  { emoji: "💡", label: "idea" },
  { emoji: "🌟", label: "sparkle" },
];

type FloatingElement = {
  emoji: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  delay: number;
  amplitude: number;
  driftX: number;
  opacity: number;
};

function generateFloatingElements(count: number, academy: boolean): FloatingElement[] {
  const items = academy ? ACADEMY_ICONS : ACADEMY_ICONS.slice(0, 6);
  return Array.from({ length: count }, (_, i) => {
    const icon = items[i % items.length];
    return {
      emoji: icon.emoji,
      x: 50 + Math.random() * 900,
      y: 200 + Math.random() * 1400,
      size: 24 + Math.random() * 36,
      speed: 0.3 + Math.random() * 0.5,
      delay: Math.random() * 100,
      amplitude: 15 + Math.random() * 35,
      driftX: (Math.random() - 0.5) * 60,
      opacity: 0.15 + Math.random() * 0.25,
    };
  });
}

export const AcademyDynamicBackground: React.FC<AcademySceneProps> = ({
  imageSrc,
  durationInFrames,
  sceneType,
}) => {
  const frame = useCurrentFrame();
  const elements = generateFloatingElements(12, true);

  const isUrgency = sceneType === "urgency";
  const isCta = sceneType === "cta";
  const isHook = sceneType === "hook";

  const easeProgress = spring({
    fps: 30,
    frame,
    config: { damping: 30, mass: 0.8 },
  });

  const zoom = interpolate(easeProgress, [0, 0.5, 1], [1, 1.08, 1.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const panX = interpolate(frame, [0, durationInFrames], [0, isCta ? -20 : isHook ? 15 : -10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const panY = interpolate(frame, [0, durationInFrames], [0, isUrgency ? 15 : -12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const vignetteIntensity = interpolate(
    Math.sin(frame * 0.02),
    [-1, 1],
    [0.3, 0.5]
  );

  return (
    <AbsoluteFill>
      {/* Background image with smooth cinematic camera movement */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          filter: isUrgency
            ? `brightness(0.7) saturate(1.2)`
            : isCta
            ? `brightness(0.8) saturate(1.1)`
            : `brightness(0.75) saturate(1.05)`,
        }}
      >
        <Img
          src={imageSrc}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      {/* Floating academy-themed elements */}
      <svg
        width="1080"
        height="1920"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      >
        {elements.map((el, i) => {
          const floatY = Math.sin((frame * 0.02 + el.delay) * el.speed) * el.amplitude;
          const floatX = Math.cos((frame * 0.015 + el.delay) * el.speed * 0.7) * el.amplitude * 0.5 + el.driftX;
          const twinkle = 0.6 + Math.sin(frame * 0.05 + el.delay) * 0.4;

          return (
            <text
              key={i}
              x={el.x + floatX}
              y={el.y + floatY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={el.size}
              opacity={el.opacity * twinkle}
              filter={
                el.emoji === "💡" || el.emoji === "🌟" || el.emoji === "⭐"
                  ? `url(#glow-${i})`
                  : undefined
              }
            >
              {el.emoji}
            </text>
          );
        })}
      </svg>

      {/* Animated light rays */}
      <LightRays frame={frame} durationInFrames={durationInFrames} />

      {/* Dynamic vignette overlay */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(
            ellipse at 50% 50%,
            transparent 40%,
            rgba(0,0,0,${vignetteIntensity}) 100%
          )`,
        }}
      />

      {/* Academy themed gradient rim light */}
      <AbsoluteFill
        style={{
          background: isCta
            ? `linear-gradient(135deg, transparent 60%, rgba(236,72,153,0.08) 100%)`
            : isUrgency
            ? `linear-gradient(0deg, transparent 60%, rgba(220,38,38,0.06) 100%)`
            : `linear-gradient(180deg, transparent 60%, rgba(99,102,241,0.05) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const LightRays: React.FC<{ frame: number; durationInFrames: number }> = ({
  frame,
  durationInFrames,
}) => {
  const rotation = interpolate(frame, [0, durationInFrames], [0, 5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = 0.03 + Math.sin(frame * 0.01) * 0.015;

  return (
    <AbsoluteFill
      style={{
        transform: `rotate(${rotation}deg)`,
        opacity,
      }}
    >
      {[0, 45, 90, 135].map((angle, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            width: 2,
            height: "100%",
            background: `linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.3) 20%, transparent 80%)`,
            transform: `translateX(-50%) rotate(${angle}deg)`,
            transformOrigin: "50% 0%",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

export const AcademyFloatingElement: React.FC<{
  emoji: string;
  x: number;
  y: number;
  size: number;
  frame: number;
  delay: number;
}> = ({ emoji, x, y, size, frame, delay }) => {
  const floatY = Math.sin((frame + delay) * 0.03) * 20;
  const floatX = Math.cos((frame + delay) * 0.025) * 10;
  const scale = 1 + Math.sin((frame + delay) * 0.04) * 0.1;

  return (
    <div
      style={{
        position: "absolute",
        left: x + floatX,
        top: y + floatY,
        fontSize: size,
        transform: `scale(${scale})`,
        opacity: 0.3,
        transition: "none",
        pointerEvents: "none",
      }}
    >
      {emoji}
    </div>
  );
};
