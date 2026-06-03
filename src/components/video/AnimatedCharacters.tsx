import { interpolate, useCurrentFrame, spring } from "remotion";
import type { SceneType } from "@/types/content";

export type CharacterRole = "student" | "teacher";
export type CharacterPose = "idle" | "talking" | "pointing" | "celebrating" | "waving" | "thinking";
export type CharacterPos = "left" | "right" | "center";

export type CharacterConfig = {
  role: CharacterRole;
  pose: CharacterPose;
  position: CharacterPos;
};

const SKIN = "#F5D0B8";
const DARK_HAIR = "#2C1810";
const BROWN_HAIR = "#5C3A28";

const SPEECH_BUBBLES: Record<string, string> = {
  hook: "Hello! 👋",
  intro: "Hi! 😊",
  problem: "Oh no... 😅",
  solution: "¡Yes! 💡",
  benefit: "Wow! ✨",
  testimonial: "I love it! ⭐",
  highlight: "Look! 👀",
  "social-proof": "Let's go! 🎉",
  urgency: "Hurry! ⏰",
  cta: "¡Ahora! 🚀",
  content: "Learn 📖",
};

type PoseAnimations = {
  bodyAngle: number;
  bodyOffsetY: number;
  leftArmAngle: number;
  rightArmAngle: number;
  leftArmBend: number;
  rightArmBend: number;
  leftArmRotate: number;
  rightArmRotate: number;
  mouthOpen: number;
  eyeOffsetY: number;
  headTilt: number;
  eyebrowRaise: number;
  bounce: number;
};

function getPoseAnimation(pose: CharacterPose, frame: number): PoseAnimations {
  const breathe = Math.sin(frame * 0.05) * 1.2;

  switch (pose) {
    case "idle":
      return {
        bodyAngle: breathe * 0.3,
        bodyOffsetY: breathe * 0.5,
        leftArmAngle: -15 + breathe,
        rightArmAngle: 15 - breathe,
        leftArmBend: 0,
        rightArmBend: 0,
        leftArmRotate: 0,
        rightArmRotate: 0,
        mouthOpen: 0,
        eyeOffsetY: 0,
        headTilt: breathe * 0.5,
        eyebrowRaise: 0,
        bounce: 0,
      };
    case "talking": {
      const talk = Math.sin(frame * 0.35) * 0.6 + 0.4;
      const headNod = Math.sin(frame * 0.15) * 2;
      return {
        bodyAngle: headNod * 0.2,
        bodyOffsetY: 0,
        leftArmAngle: -10 + Math.sin(frame * 0.2) * 3,
        rightArmAngle: 10 + Math.sin(frame * 0.25) * 3,
        leftArmBend: 0,
        rightArmBend: 0,
        leftArmRotate: 0,
        rightArmRotate: 0,
        mouthOpen: Math.max(0, talk),
        eyeOffsetY: 0,
        headTilt: headNod,
        eyebrowRaise: 0.2,
        bounce: 0,
      };
    }
    case "pointing": {
      const pointBob = Math.sin(frame * 0.1) * 1.5;
      return {
        bodyAngle: pointBob * 0.3 + 3,
        bodyOffsetY: pointBob * 0.5,
        leftArmAngle: -75 + pointBob,
        rightArmAngle: 35 + pointBob * 0.3,
        leftArmBend: 15 + Math.sin(frame * 0.08) * 5,
        rightArmBend: 0,
        leftArmRotate: -10,
        rightArmRotate: 0,
        mouthOpen: 0.15 + Math.sin(frame * 0.3) * 0.15,
        eyeOffsetY: 0,
        headTilt: 4 + pointBob * 0.5,
        eyebrowRaise: 0.6,
        bounce: 0,
      };
    }
    case "celebrating": {
      const cheer = Math.sin(frame * 0.35) * 20;
      const jump = Math.abs(Math.sin(frame * 0.2)) * 8;
      return {
        bodyAngle: cheer * 0.15,
        bodyOffsetY: -jump,
        leftArmAngle: -130 + cheer,
        rightArmAngle: 130 - cheer,
        leftArmBend: 20 + Math.sin(frame * 0.3) * 10,
        rightArmBend: 20 + Math.sin(frame * 0.3) * 10,
        leftArmRotate: Math.sin(frame * 0.2) * 10,
        rightArmRotate: Math.sin(frame * 0.2 + Math.PI) * 10,
        mouthOpen: 0.3 + Math.sin(frame * 0.3) * 0.2,
        eyeOffsetY: -2,
        headTilt: cheer * 0.15,
        eyebrowRaise: 0.8,
        bounce: jump,
      };
    }
    case "waving": {
      const wave = Math.sin(frame * 0.22) * 25;
      const bodySway = Math.sin(frame * 0.12) * 2;
      return {
        bodyAngle: bodySway,
        bodyOffsetY: 0,
        leftArmAngle: -25 + bodySway,
        rightArmAngle: 70 + wave,
        leftArmBend: 0,
        rightArmBend: 20 + Math.sin(frame * 0.15) * 5,
        leftArmRotate: 0,
        rightArmRotate: wave * 0.3,
        mouthOpen: 0.15 + Math.sin(frame * 0.2) * 0.15,
        eyeOffsetY: 0,
        headTilt: 3 + bodySway * 0.3,
        eyebrowRaise: 0.4,
        bounce: 0,
      };
    }
    case "thinking": {
      const tap = Math.sin(frame * 0.15) * 2;
      return {
        bodyAngle: -3,
        bodyOffsetY: 0,
        leftArmAngle: -50,
        rightArmAngle: -50 - tap,
        leftArmBend: 40,
        rightArmBend: 40,
        leftArmRotate: 0,
        rightArmRotate: tap,
        mouthOpen: 0.05,
        eyeOffsetY: -1,
        headTilt: -5 + Math.sin(frame * 0.08) * 2,
        eyebrowRaise: 0.7,
        bounce: 0,
      };
    }
  }
}

export function getCharacterConfig(sceneType: SceneType): CharacterConfig {
  switch (sceneType) {
    case "hook":
      return { role: "student", pose: "waving", position: "right" };
    case "intro":
      return { role: "teacher", pose: "waving", position: "left" };
    case "problem":
      return { role: "student", pose: "thinking", position: "right" };
    case "solution":
      return { role: "teacher", pose: "pointing", position: "left" };
    case "benefit":
      return { role: "student", pose: "celebrating", position: "right" };
    case "testimonial":
      return { role: "student", pose: "talking", position: "left" };
    case "content":
      return { role: "teacher", pose: "talking", position: "left" };
    case "highlight":
      return { role: "teacher", pose: "pointing", position: "right" };
    case "social-proof":
      return { role: "student", pose: "celebrating", position: "right" };
    case "urgency":
      return { role: "student", pose: "waving", position: "left" };
    case "cta":
      return { role: "teacher", pose: "pointing", position: "right" };
    default:
      return { role: "student", pose: "idle", position: "right" };
  }
}

type CharacterProps = {
  role: CharacterRole;
  pose: CharacterPose;
  position: CharacterPos;
  frame: number;
  entranceProgress: number;
  sceneColors: { accent: string; primary: string };
  sceneType?: string;
};

export const AnimatedCharacter: React.FC<CharacterProps> = ({
  role,
  pose,
  position,
  frame,
  entranceProgress,
  sceneColors,
  sceneType,
}) => {
  const anim = getPoseAnimation(pose, frame);

  const entryX = interpolate(entranceProgress, [0, 0.3, 1], [position === "left" ? -400 : 400, -30, 0]);
  const entryOpacity = interpolate(entranceProgress, [0, 0.3, 1], [0, 0.4, 1]);
  const entryScale = spring({
    fps: 30,
    frame: frame,
    config: { damping: 12, mass: 0.8 },
  });

  const baseX = position === "left" ? 140 : position === "right" ? 940 : 540;
  const baseY = 1050;

  const hairColor = role === "teacher" ? DARK_HAIR : BROWN_HAIR;
  const shirtColor = role === "teacher" ? "#4A6FA5" : "#10B981";
  const shirtAccent = role === "teacher" ? "#3A5A8A" : "#0D9668";
  const displayScale = 1.15;

  const speechBubble = sceneType ? SPEECH_BUBBLES[sceneType] : "";

  return (
    <svg
      width="320"
      height="520"
      viewBox="0 0 320 520"
      style={{
        position: "absolute",
        left: baseX - 160,
        top: baseY - 520,
        transform: `translateX(${entryX}px) scale(${entryScale * displayScale})`,
        opacity: entryOpacity,
        overflow: "visible",
        filter: "drop-shadow(0 15px 40px rgba(0,0,0,0.4))",
      }}
    >
      <g transform={`rotate(${anim.bodyAngle}, 160, 350)`}>
        {/* Shadow */}
        <ellipse cx="160" cy="500" rx="80" ry="14" fill="rgba(0,0,0,0.15)" />

        {/* Body bounce for jumping */}
        <g transform={`translate(0, ${anim.bounce * -1.5})`}>
          {/* ─── Body / Torso ─── */}
          <rect x="115" y="220" width="90" height="170" rx="20" fill={shirtColor} />

          {/* Teacher collar */}
          {role === "teacher" && (
            <>
              <path
                d="M135 220 L160 255 L185 220"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M135 220 L160 255 L185 220"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Shirt detail */}
          <path
            d={`M160 255 L160 ${220 + 170}`}
            stroke={shirtAccent}
            strokeWidth="2"
            opacity="0.3"
          />

          {/* Pocket for student */}
          {role === "student" && (
            <rect x="170" y="280" width="22" height="18" rx="3" fill="none" stroke={shirtAccent} strokeWidth="1.5" opacity="0.4" />
          )}

          {/* ─── Neck ─── */}
          <rect x="148" y="185" width="24" height="40" rx="8" fill={SKIN} />

          {/* ─── Head ─── */}
          <g
            transform={`translate(0, ${anim.bodyOffsetY * 1.5}) rotate(${anim.headTilt}, 160, 125)`}
          >
            <ellipse cx="160" cy="125" rx="58" ry="65" fill={SKIN} />

            {/* Hair */}
            {role === "student" ? (
              <g>
                <ellipse cx="160" cy="75" rx="62" ry="45" fill={hairColor} />
                <ellipse cx="160" cy="70" rx="53" ry="32" fill={hairColor} />
                <path
                  d="M105 90 Q110 115 120 125"
                  stroke={hairColor}
                  strokeWidth="9"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M215 90 Q210 115 200 125"
                  stroke={hairColor}
                  strokeWidth="9"
                  fill="none"
                  strokeLinecap="round"
                />
                <ellipse cx="140" cy="62" rx="22" ry="10" fill="rgba(255,255,255,0.12)" />
              </g>
            ) : (
              <g>
                <ellipse cx="160" cy="78" rx="60" ry="40" fill={hairColor} />
                <rect x="103" y="75" width="114" height="22" rx="5" fill={hairColor} />
                <path
                  d="M107 82 Q112 102 122 114"
                  stroke={hairColor}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M213 82 Q208 102 198 114"
                  stroke={hairColor}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Glasses */}
                <circle cx="136" cy="122" r="15" fill="none" stroke="#555" strokeWidth="2.5" />
                <circle cx="184" cy="122" r="15" fill="none" stroke="#555" strokeWidth="2.5" />
                <path d="M151 122 L169 122" stroke="#555" strokeWidth="2.5" />
                <path d="M121 122 Q110 120 106 127" stroke="#555" strokeWidth="2.5" fill="none" />
              </g>
            )}

            {/* Eyebrows */}
            <g transform={`translate(0, ${anim.eyebrowRaise * -3})`}>
              <path
                d="M128 113 Q140 108 152 113"
                stroke="#333"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M168 113 Q180 108 192 113"
                stroke="#333"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </g>

            {/* Eyes */}
            <g transform={`translate(0, ${anim.eyeOffsetY * 2})`}>
              <ellipse cx="138" cy="125" rx="4.5" ry="5.5" fill="#333" />
              <ellipse cx="182" cy="125" rx="4.5" ry="5.5" fill="#333" />
              <ellipse cx="139" cy="123" rx="2" ry="2.5" fill="white" />
              <ellipse cx="183" cy="123" rx="2" ry="2.5" fill="white" />
            </g>

            {/* Blush */}
            <ellipse cx="118" cy="142" rx="10" ry="6" fill="#FFB5B5" opacity="0.3" />
            <ellipse cx="202" cy="142" rx="10" ry="6" fill="#FFB5B5" opacity="0.3" />

            {/* Mouth */}
            {anim.mouthOpen > 0.3 ? (
              <ellipse cx="160" cy="155" rx="10" ry={6 + anim.mouthOpen * 6} fill="#C0392B" />
            ) : (
              <path
                d={`M150 155 Q160 ${pose === "celebrating" ? 163 : pose === "thinking" ? 153 : 158} 170 155`}
                stroke="#C0392B"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            )}
          </g>

          {/* ─── Arms ──────────────────────────────────────────── */}
          {/* Left arm */}
          <g transform={`rotate(${anim.leftArmAngle}, 120, 230)`}>
            <g transform={`rotate(${anim.leftArmRotate}, 80, 280)`}>
              <path
                d="M120 230 Q90 ${250 + anim.leftArmBend} 80 ${300 + anim.leftArmBend * 0.5}"
                stroke={SKIN}
                strokeWidth="20"
                fill="none"
                strokeLinecap="round"
              />
              {/* Sleeve */}
              <path
                d="M120 230 Q110 240 105 255"
                stroke={shirtColor}
                strokeWidth="22"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          </g>

          {/* Right arm */}
          <g transform={`rotate(${anim.rightArmAngle}, 200, 230)`}>
            <g transform={`rotate(${anim.rightArmRotate}, 240, 280)`}>
              <path
                d="M200 230 Q230 ${250 + anim.rightArmBend} 240 ${300 + anim.rightArmBend * 0.5}"
                stroke={SKIN}
                strokeWidth="20"
                fill="none"
                strokeLinecap="round"
              />
              {/* Sleeve */}
              <path
                d="M200 230 Q210 240 215 255"
                stroke={shirtColor}
                strokeWidth="22"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          </g>

          {/* ─── English-themed floating elements ──────────────── */}
          {pose === "celebrating" && (
            <>
              <text x="40" y={180 + Math.sin(frame * 0.15) * 15} fontSize="28" opacity="0.6" fill={sceneColors.accent}>
                ★
              </text>
              <text x="260" y={160 + Math.sin(frame * 0.18 + 1) * 12} fontSize="24" opacity="0.5" fill={sceneColors.accent}>
                ✦
              </text>
              <text x="70" y={150 + Math.sin(frame * 0.12 + 2) * 18} fontSize="20" opacity="0.4" fill={sceneColors.primary}>
                ✧
              </text>
            </>
          )}

          {pose === "pointing" && (
            <text
              x={position === "left" ? 280 : 20}
              y={180 + Math.sin(frame * 0.1) * 10}
              fontSize="40"
              opacity={0.4 + Math.sin(frame * 0.12) * 0.15}
              fill={sceneColors.accent}
            >
              →
            </text>
          )}

          {/* ─── Accent glow ring ──────────────────────────────── */}
          {(pose === "celebrating" || pose === "pointing") && (
            <circle
              cx="160"
              cy="240"
              r={90 + Math.sin(frame * 0.08) * 12}
              fill="none"
              stroke={sceneColors.accent}
              strokeWidth="2"
              opacity={0.08 + Math.sin(frame * 0.08) * 0.06}
            />
          )}
        </g>
      </g>
    </svg>
  );
};

export const StudentCharacter: React.FC<{
  pose: CharacterPose;
  position: CharacterPos;
  entranceProgress: number;
  sceneColors: { accent: string; primary: string };
  sceneType?: string;
}> = (props) => {
  const frame = useCurrentFrame();
  return (
    <AnimatedCharacter
      role="student"
      pose={props.pose}
      position={props.position}
      frame={frame}
      entranceProgress={props.entranceProgress}
      sceneColors={props.sceneColors}
      sceneType={props.sceneType}
    />
  );
};
