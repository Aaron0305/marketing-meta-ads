import { useCurrentFrame, interpolate } from "remotion";
import { useMemo } from "react";
import type { SceneType } from "@/types/content";

type Colors = {
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
};

type SceneBackgroundProps = {
  sceneType: SceneType;
  colors: Colors;
  partDuration: number;
};

/* ─── LANGUAGE ACADEMY THEME ─────────────────────────────────── */

const ACADEMY_SYMBOLS = ["A", "B", "C", "Hello", "Hi", "!", "★", "♪", "✓", "～"];
const LANG_ICONS = ["📚", "🎓", "🌍", "💬", "✏️", "⭐", "🔤", "💡", "🗣️", "👋"];

type LangParticle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  delay: number;
  opacity: number;
  symbol: string;
  isIcon: boolean;
  drift: number;
};

function generateLangParticles(count: number): LangParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    x: 50 + Math.random() * 980,
    y: 100 + Math.random() * 1700,
    size: 14 + Math.random() * 22,
    speed: 0.15 + Math.random() * 0.4,
    delay: Math.random() * 120,
    opacity: 0.06 + Math.random() * 0.14,
    symbol: i % 3 === 0
      ? ACADEMY_SYMBOLS[Math.floor(Math.random() * ACADEMY_SYMBOLS.length)]
      : LANG_ICONS[Math.floor(Math.random() * LANG_ICONS.length)],
    isIcon: i % 3 !== 0,
    drift: (Math.random() - 0.5) * 40,
  }));
}

/* ─── FLOATING ENGLISH LETTERS ────────────────────────────────── */

const FloatingLetters: React.FC<{
  count: number;
  color: string;
  frame: number;
  words?: boolean;
}> = ({ count, color, frame, words }) => {
  const items = useMemo(() => generateLangParticles(count), [count]);

  return (
    <svg
      width="1080"
      height="1920"
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      {items.map((p, i) => {
        const floatY = Math.sin((frame + p.delay) * 0.015 * p.speed) * 25;
        const floatX = Math.cos((frame + p.delay) * 0.012 * p.speed) * 18 + p.drift;
        const twinkle = 0.5 + Math.sin((frame + p.delay) * 0.04) * 0.5;

        return (
          <text
            key={i}
            x={p.x + floatX}
            y={p.y + floatY}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize={p.size}
            opacity={p.opacity * twinkle}
            fontFamily={p.isIcon ? "sans-serif" : "'Georgia', serif"}
            fontWeight={p.isIcon ? "normal" : "bold"}
          >
            {p.symbol}
          </text>
        );
      })}
    </svg>
  );
};

/* ─── GRADUATION CAPS / STARS ────────────────────────────────── */

const GraduationRain: React.FC<{
  color: string;
  frame: number;
}> = ({ color, frame }) => {
  return (
    <svg
      width="1080"
      height="1920"
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      {Array.from({ length: 6 }, (_, i) => {
        const y = ((frame * 1.5 + i * 200) % 2200) - 200;
        const x = 120 + i * 160;
        const sway = Math.sin((frame + i * 30) * 0.02) * 30;
        return (
          <text
            key={i}
            x={x + sway}
            y={y}
            textAnchor="middle"
            fill={color}
            fontSize="30"
            opacity={0.08 + Math.sin(frame * 0.04 + i) * 0.04}
          >
            🎓
          </text>
        );
      })}
    </svg>
  );
};

/* ─── SPEECH BUBBLES ─────────────────────────────────────────── */

const SpeechBubbles: React.FC<{
  color: string;
  frame: number;
}> = ({ color, frame }) => {
  const phrases = [
    { text: "Hello!", x: 200, y: 400, delay: 0 },
    { text: "English", x: 850, y: 600, delay: 20 },
    { text: "Hi!", x: 300, y: 1200, delay: 40 },
    { text: "Learn", x: 750, y: 1400, delay: 60 },
    { text: "Speak", x: 500, y: 800, delay: 80 },
  ];

  return (
    <svg
      width="1080"
      height="1920"
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      {phrases.map((p, i) => {
        const floatY = Math.sin((frame + p.delay) * 0.02) * 15;
        const opacity = 0.04 + Math.sin((frame + p.delay) * 0.03) * 0.03;
        return (
          <g
            key={i}
            transform={`translate(${p.x}, ${p.y + floatY})`}
            opacity={opacity}
          >
            <rect
              x="-30"
              y="-15"
              width="70"
              height="30"
              rx="15"
              fill="none"
              stroke={color}
              strokeWidth="1"
            />
            <text
              x="5"
              y="4"
              textAnchor="middle"
              fill={color}
              fontSize="12"
              fontFamily="'Inter', sans-serif"
              fontWeight="600"
            >
              {p.text}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ─── SPARKLE BURST ──────────────────────────────────────────── */

const SparkleBurst: React.FC<{
  color: string;
  frame: number;
  partDuration: number;
}> = ({ color, frame, partDuration }) => {
  const burstProgress = interpolate(frame, [0, Math.min(partDuration, 40)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const distance = burstProgress * 350;
    return { angle, distance };
  });

  return (
    <svg
      width="1080"
      height="1920"
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      <g transform="translate(540, 960)">
        {particles.map((p, i) => (
          <line
            key={i}
            x1={0}
            y1={0}
            x2={Math.cos(p.angle) * p.distance}
            y2={Math.sin(p.angle) * p.distance}
            stroke={color}
            strokeWidth={2}
            opacity={interpolate(burstProgress, [0, 1], [0.5, 0])}
            strokeLinecap="round"
          />
        ))}
      </g>
    </svg>
  );
};

/* ─── GLOW RINGS ─────────────────────────────────────────────── */

const GlowRings: React.FC<{
  color: string;
  frame: number;
  count?: number;
}> = ({ color, frame, count = 3 }) => {
  return (
    <svg
      width="1080"
      height="1920"
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      {Array.from({ length: count }, (_, i) => {
        const progress = ((frame + i * 50) % 150) / 150;
        const scale = interpolate(progress, [0, 1], [0.2, 2]);
        const opacity = interpolate(progress, [0, 0.4, 1], [0.5, 0.15, 0]);
        const cx = [200, 540, 880][i];
        const cy = [350, 550, 850][i];

        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={60 * scale} fill="none" stroke={color} strokeWidth="1.5" opacity={opacity} />
            <circle cx={cx} cy={cy} r={40 * scale} fill="none" stroke={color} strokeWidth="0.5" opacity={opacity * 0.5} />
          </g>
        );
      })}
    </svg>
  );
};

/* ─── URGENCY LINES ──────────────────────────────────────────── */

const UrgencyLines: React.FC<{
  frame: number;
}> = ({ frame }) => {
  return (
    <svg
      width="1080"
      height="1920"
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const progress = ((frame + i * 25) % 80) / 80;
        const y = interpolate(progress, [0, 1], [-200, 2120]);
        const x = 150 + i * 180;
        return (
          <line
            key={i}
            x1={x - 50}
            y1={y}
            x2={x + 80}
            y2={y - 120}
            stroke="rgba(239, 68, 68, 0.12)"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
};

/* ─── MAIN EXPORT ────────────────────────────────────────────── */

export const SceneBackground: React.FC<SceneBackgroundProps> = ({
  sceneType,
  colors,
  partDuration,
}) => {
  const frame = useCurrentFrame();

  switch (sceneType) {
    case "hook": {
      const burstFade = interpolate(frame, [0, 50], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return (
        <>
          <FloatingLetters count={25} color={colors.accent} frame={frame} />
          <SparkleBurst color={colors.primary} frame={frame} partDuration={partDuration} />
          <SpeechBubbles color={colors.accent} frame={frame} />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `radial-gradient(circle at 50% 30%, ${colors.primary}20 0%, transparent 70%)`,
              opacity: burstFade,
            }}
          />
        </>
      );
    }

    case "intro":
      return (
        <>
          <FloatingLetters count={20} color={colors.primary} frame={frame} />
          <SpeechBubbles color={colors.accent} frame={frame} />
        </>
      );

    case "problem":
      return (
        <>
          <FloatingLetters count={15} color={colors.accent} frame={frame} />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `radial-gradient(ellipse at 50% 60%, rgba(239,68,68,0.06) 0%, transparent 60%)`,
            }}
          />
          {/* Question marks */}
          <svg
            width="1080"
            height="1920"
            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
          >
            {[
              { x: 250, y: 500, delay: 0 },
              { x: 800, y: 700, delay: 15 },
              { x: 400, y: 1300, delay: 30 },
              { x: 700, y: 1500, delay: 45 },
            ].map((q, i) => {
              const floatY = Math.sin((frame + q.delay) * 0.025) * 15;
              const opacity = 0.08 + Math.sin((frame + q.delay) * 0.035) * 0.06;
              return (
                <text
                  key={i}
                  x={q.x}
                  y={q.y + floatY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="rgba(239, 68, 68, 0.3)"
                  fontSize="55"
                  fontWeight="bold"
                  fontFamily="Georgia, serif"
                  opacity={opacity}
                >
                  ?
                </text>
              );
            })}
          </svg>
        </>
      );

    case "solution":
    case "benefit":
      return (
        <>
          <FloatingLetters count={30} color={colors.accent} frame={frame} />
          <SparkleBurst color={colors.accent} frame={frame} partDuration={partDuration} />
          <GlowRings color={colors.primary} frame={frame} count={2} />
          <GraduationRain color={colors.primary} frame={frame} />
        </>
      );

    case "testimonial":
      return (
        <>
          <FloatingLetters count={20} color={colors.accent} frame={frame} words />
          <SpeechBubbles color={colors.accent} frame={frame} />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `radial-gradient(ellipse at 30% 40%, ${colors.accent}10 0%, transparent 50%)`,
            }}
          />
        </>
      );

    case "highlight":
      return (
        <>
          <GlowRings color={colors.accent} frame={frame} count={3} />
          <FloatingLetters count={25} color={colors.accent} frame={frame} />
          <GraduationRain color={colors.primary} frame={frame} />
        </>
      );

    case "social-proof":
      return (
        <>
          <GraduationRain color={colors.accent} frame={frame} />
          <FloatingLetters count={25} color={colors.primary} frame={frame} />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `linear-gradient(180deg, ${colors.primary}08 0%, transparent 30%, transparent 70%, ${colors.primary}08 100%)`,
            }}
          />
        </>
      );

    case "urgency":
      return (
        <>
          <GlowRings color="#DC2626" frame={frame} count={3} />
          <UrgencyLines frame={frame} />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `radial-gradient(ellipse at 50% 50%, rgba(220,38,38,0.08) 0%, transparent 60%)`,
            }}
          />
        </>
      );

    case "cta":
      return (
        <>
          <FloatingLetters count={35} color={colors.primary} frame={frame} />
          <SparkleBurst color={colors.accent} frame={frame} partDuration={partDuration} />
          <GlowRings color={colors.accent} frame={frame} count={2} />
          <GraduationRain color={colors.accent} frame={frame} />
          <SpeechBubbles color={colors.accent} frame={frame} />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: `radial-gradient(circle at 50% 50%, ${colors.primary}20 0%, transparent 60%)`,
            }}
          />
        </>
      );

    case "content":
    default:
      return (
        <>
          <FloatingLetters count={18} color={colors.primary} frame={frame} />
          <SpeechBubbles color={colors.accent} frame={frame} />
        </>
      );
  }
};
