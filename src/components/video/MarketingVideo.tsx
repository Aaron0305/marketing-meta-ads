import {
  AbsoluteFill,
  Img,
  useVideoConfig,
  useCurrentFrame,
  spring,
  Sequence,
  interpolate,
  Audio,
} from "remotion";
import { SceneBackground } from "./SceneBackgrounds";
import { AnimatedCharacter, getCharacterConfig } from "./AnimatedCharacters";
import { AcademyDynamicBackground } from "./AcademyScene";
import type { VideoScriptPart } from "@/types/content";

export type MarketingVideoProps = {
  imageSrc: string;
  script: VideoScriptPart[];
};

const EMOTION_COLORS: Record<string, { primary: string; secondary: string; accent: string; dark: string }> = {
  curiosidad: { primary: "#6366F1", secondary: "#8B5CF6", accent: "#A78BFA", dark: "#1E1B4B" },
  urgencia: { primary: "#DC2626", secondary: "#EF4444", accent: "#F87171", dark: "#450A0A" },
  deseo: { primary: "#EC4899", secondary: "#F472B6", accent: "#F9A8D4", dark: "#500724" },
  confianza: { primary: "#2563EB", secondary: "#3B82F6", accent: "#60A5FA", dark: "#0F172A" },
  felicidad: { primary: "#F59E0B", secondary: "#FBBF24", accent: "#FCD34D", dark: "#451A03" },
  sorpresa: { primary: "#8B5CF6", secondary: "#A78BFA", accent: "#C4B5FD", dark: "#2D1B69" },
  miedo: { primary: "#6B7280", secondary: "#9CA3AF", accent: "#D1D5DB", dark: "#111827" },
  esperanza: { primary: "#10B981", secondary: "#34D399", accent: "#6EE7B7", dark: "#064E3B" },
};

const DEFAULT_COLORS = { primary: "#6366F1", secondary: "#8B5CF6", accent: "#A78BFA", dark: "#1E1B4B" };

const SCENE_EMOJIS: Record<string, string> = {
  hook: "🔥",
  intro: "👋",
  problem: "😫",
  solution: "💡",
  benefit: "✨",
  testimonial: "⭐",
  highlight: "🎯",
  "social-proof": "📈",
  urgency: "⏰",
  cta: "🚀",
  content: "📖",
};

export const MarketingVideo: React.FC<MarketingVideoProps> = ({ imageSrc, script }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  let startFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* Background music */}
      <Audio src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" volume={0.12} />

      {/* Dynamic academy scene from the uploaded image */}
      {imageSrc && (
        <AcademyDynamicBackground
          imageSrc={imageSrc}
          durationInFrames={durationInFrames}
        />
      )}

      {/* Dynamic overlay gradient */}
      <OverlayGradient script={script} durationInFrames={durationInFrames} />

      {/* Decorative frame */}
      <AbsoluteFill style={{ padding: "24px" }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            border: "1.5px solid rgba(255,255,255,0.08)",
            borderRadius: "36px",
            position: "relative",
            boxShadow: "inset 0 0 60px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(12px)",
              padding: "6px 20px",
              borderRadius: "24px",
              color: "rgba(255,255,255,0.8)",
              fontSize: "18px",
              fontWeight: "600",
              letterSpacing: "3px",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            WTII IDIOMAS
          </div>
        </div>
      </AbsoluteFill>

      {/* Scene sequences */}
      {script.map((part, index) => {
        const sequenceStart = startFrame;
        startFrame += part.durationInFrames;

        const colors = EMOTION_COLORS[part.emotion] || DEFAULT_COLORS;

        return (
          <Sequence
            key={index}
            from={sequenceStart}
            durationInFrames={part.durationInFrames}
          >
            {part.audioUrl && <Audio src={part.audioUrl} volume={1} />}

            {/* Per-scene AI generated background */}
            {part.sceneImageUrl && (
              <SceneBackgroundImage
                imageUrl={part.sceneImageUrl}
                durationInFrames={part.durationInFrames}
              />
            )}

            {/* Scene-specific animated background effects */}
            <SceneBackground
              sceneType={part.sceneType}
              colors={colors}
              partDuration={part.durationInFrames}
            />

            {/* Animated character based on scene type */}
            <SceneCharacter
              sceneType={part.sceneType}
              pose={part.characterPose}
              position={part.characterPosition}
              colors={colors}
            />

            {/* Animated text for this scene */}
            <SceneText
              text={part.text}
              fps={fps}
              isLast={index === script.length - 1}
              sceneType={part.sceneType}
              emotion={part.emotion}
              colors={colors}
            />

            {/* Scene indicator dots at bottom */}
            <SceneDots
              total={script.length}
              current={index}
              colors={colors}
            />
          </Sequence>
        );
      })}

      {/* Brand watermark at end */}
      <EndBranding frame={frame} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};

/* ─── Scene Background Image ──────────────────────────────────── */

const SceneBackgroundImage: React.FC<{ imageUrl: string; durationInFrames: number }> = ({
  imageUrl,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const progress = frame / durationInFrames;

  const scale = interpolate(progress, [0, 0.5, 1], [1, 1.12, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const panX = interpolate(progress, [0, 1], [0, -15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const panY = interpolate(progress, [0, 1], [0, -8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
      }}
    >
      <Img
        src={imageUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </AbsoluteFill>
  );
};

/* ─── Scene Character ──────────────────────────────────────────── */

const SceneCharacter: React.FC<{
  sceneType: string;
  pose: string;
  position: string;
  colors: { primary: string; secondary: string; accent: string };
}> = ({ sceneType, pose, position, colors }) => {
  const frame = useCurrentFrame();
  const config = getCharacterConfig(sceneType as any);

  const entranceProgress = spring({
    fps: 30,
    frame,
    config: { damping: 15, mass: 1 },
  });

  return (
    <AnimatedCharacter
      role={config.role}
      pose={pose as any}
      position={position as any}
      frame={frame}
      entranceProgress={entranceProgress}
      sceneColors={{ accent: colors.accent, primary: colors.primary }}
    />
  );
};

/* ─── Scene Text ──────────────────────────────────────────────── */

const SceneText: React.FC<{
  text: string;
  fps: number;
  isLast: boolean;
  sceneType: string;
  emotion: string;
  colors: { primary: string; secondary: string; accent: string };
}> = ({ text, fps, isLast, sceneType, colors }) => {
  const frame = useCurrentFrame();

  const entranceProgress = spring({
    fps,
    frame,
    config: { damping: 12, mass: 0.8 },
  });

  const boxY = interpolate(entranceProgress, [0, 1], [120, 0]);
  const boxOpacity = interpolate(entranceProgress, [0, 0.3, 1], [0, 0.5, 1]);
  const boxScale = interpolate(entranceProgress, [0, 1], [0.85, 1]);

  const isUrgency = sceneType === "urgency";
  const isCta = sceneType === "cta";

  const emoji = SCENE_EMOJIS[sceneType] || "✨";

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "50px" }}>
      <div
        style={{
          transform: `translateY(${boxY}px) scale(${boxScale})`,
          opacity: boxOpacity,
          width: "100%",
          maxWidth: "90%",
          textAlign: "center",
        }}
      >
        {/* Emoji for scene */}
        <div
          style={{
            fontSize: isCta ? 70 : 50,
            marginBottom: isCta ? 20 : 12,
            display: "inline-block",
            opacity: interpolate(entranceProgress, [0, 0.5, 1], [0, 0.3, 1]),
            transform: isCta
              ? `scale(${1 + Math.sin(frame * 0.08) * 0.15})`
              : "none",
          }}
        >
          {emoji}
        </div>

        <div
          style={{
            background: isCta
              ? `linear-gradient(135deg, ${colors.primary}CC, ${colors.secondary}CC)`
              : isUrgency
              ? `linear-gradient(135deg, rgba(220,38,38,0.7), rgba(239,68,68,0.5))`
              : "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(20px)",
            borderRadius: isCta ? "40px" : sceneType === "hook" ? "24px" : "28px",
            padding: isCta ? "40px 36px" : sceneType === "hook" ? "32px 28px" : "36px 32px",
            border: isCta
              ? `2px solid ${colors.accent}80`
              : isUrgency
              ? "2px solid rgba(239,68,68,0.4)"
              : "1px solid rgba(255,255,255,0.1)",
            boxShadow: isCta
              ? `0 0 40px ${colors.primary}40, 0 20px 60px rgba(0,0,0,0.4)`
              : "0 20px 40px rgba(0,0,0,0.3)",
            display: "inline-block",
          }}
        >
          <AnimatedWords
            text={text}
            fps={fps}
            frame={frame}
            colors={colors}
            isCta={isCta}
            isUrgency={isUrgency}
          />
        </div>

        {/* CTA subtext or urgency indicator */}
        {isCta && (
          <div
            style={{
              marginTop: 24,
              fontSize: 24,
              fontWeight: 500,
              color: "rgba(255,255,255,0.7)",
              opacity: interpolate(entranceProgress, [0.5, 1], [0, 1]),
            }}
          >
            ¡Habla con nosotros hoy!
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/* ─── Animated Words ──────────────────────────────────────────── */

const AnimatedWords: React.FC<{
  text: string;
  fps: number;
  frame: number;
  colors: { primary: string; secondary: string; accent: string };
  isCta: boolean;
  isUrgency: boolean;
}> = ({ text, fps, frame, colors, isCta, isUrgency }) => {
  const words = text.split(" ");

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "12px",
        alignItems: "center",
      }}
    >
      {words.map((word, i) => {
        const delay = i * 4 + 5;
        const wordFrame = Math.max(0, frame - delay);

        const wordProgress = spring({
          fps,
          frame: wordFrame,
          config: { damping: 11, stiffness: isCta ? 150 : 100 },
        });

        const wordY = interpolate(wordProgress, [0, 1], [isCta ? 60 : 40, 0]);
        const wordOpacity = interpolate(wordProgress, [0, 0.5, 1], [0, 0.3, 1]);
        const wordScale = interpolate(wordProgress, [0, 0.7, 1], [0.5, 1.1, 1]);

        const isKeyword = word.length > 4 || word === "inglés" || word === "gratis" || word === "ahora";

        return (
          <span
            key={i}
            style={{
              fontFamily: "'Inter', 'Geist', sans-serif",
              fontSize: isCta ? 58 : isUrgency ? 62 : 56,
              fontWeight: isCta ? 900 : isKeyword ? 800 : 700,
              color: isCta
                ? "#FFFFFF"
                : isUrgency
                ? "#FCA5A5"
                : "#FFFFFF",
              transform: `translateY(${wordY}px) scale(${wordScale})`,
              opacity: wordOpacity,
              display: "inline-block",
              textShadow:
                isCta
                  ? `0 4px 20px ${colors.primary}60, 0px 4px 12px rgba(0,0,0,0.3)`
                  : "0px 4px 12px rgba(0,0,0,0.3)",
              lineHeight: "1.15",
              letterSpacing: isCta ? "-0.5px" : "0px",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

/* ─── Scene Dots Indicator ────────────────────────────────────── */

const SceneDots: React.FC<{
  total: number;
  current: number;
  colors: { primary: string; secondary: string; accent: string };
}> = ({ total, current, colors }) => {
  const frame = useCurrentFrame();
  const dotOpacity = interpolate(frame, [0, 10, 40], [0, 0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 120,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          opacity: dotOpacity,
        }}
      >
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            style={{
              width: i === current ? 28 : 8,
              height: 8,
              borderRadius: 4,
              background:
                i === current
                  ? `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`
                  : "rgba(255,255,255,0.2)",
              transition: "width 0.3s ease",
              boxShadow: i === current ? `0 0 10px ${colors.primary}50` : "none",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ─── End Branding ────────────────────────────────────────────── */

const EndBranding: React.FC<{
  frame: number;
  durationInFrames: number;
}> = ({ frame, durationInFrames }) => {
  const showFrame = durationInFrames - 30;
  const opacity = interpolate(frame, [showFrame, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(frame, [showFrame, durationInFrames], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 60,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: 4,
          fontWeight: 400,
        }}
      >
        What Time Is It? Idiomas
      </div>
    </AbsoluteFill>
  );
};

/* ─── Overlay Gradient ────────────────────────────────────────── */

const OverlayGradient: React.FC<{
  script: VideoScriptPart[];
  durationInFrames: number;
}> = ({ script, durationInFrames }) => {
  const frame = useCurrentFrame();
  const progress = frame / durationInFrames;

  let cumulativeProgress = 0;
  let currentColors = DEFAULT_COLORS;

  for (const part of script) {
    const sceneEnd = cumulativeProgress + part.durationInFrames / durationInFrames;
    if (progress >= cumulativeProgress && progress <= sceneEnd) {
      currentColors = EMOTION_COLORS[part.emotion] || DEFAULT_COLORS;
      break;
    }
    cumulativeProgress = sceneEnd;
  }

  const pulse = interpolate(Math.sin(frame * 0.03), [-1, 1], [0.3, 0.6]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(to top, ${currentColors.dark}E0 0%, ${currentColors.dark}40 40%, transparent 60%, ${currentColors.dark}60 100%)`,
        opacity: pulse,
      }}
    />
  );
};


