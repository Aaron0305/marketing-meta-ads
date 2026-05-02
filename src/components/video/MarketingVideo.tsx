import { 
  AbsoluteFill, 
  Img, 
  useVideoConfig, 
  useCurrentFrame, 
  spring, 
  Sequence,
  interpolate,
  Audio
} from "remotion";

export type VideoScriptPart = {
  text: string;
  durationInFrames: number;
  audioUrl?: string;
};

export type MarketingVideoProps = {
  imageSrc: string;
  script: VideoScriptPart[];
};

export const MarketingVideo: React.FC<MarketingVideoProps> = ({ imageSrc, script }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // Efecto Ken Burns (Zoom lento) para el fondo
  const bgScale = interpolate(frame, [0, durationInFrames], [1, 1.2], {
    extrapolateRight: "clamp",
  });

  let startFrame = 0;
  
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* Música de fondo (Placeholder moderno) */}
      <Audio 
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" 
        volume={0.15} 
      />

      {/* Imagen de Fondo con Zoom Lento */}
      {imageSrc && (
        <AbsoluteFill style={{ transform: `scale(${bgScale})` }}>
          <Img 
            src={imageSrc} 
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "cover", 
            }} 
          />
        </AbsoluteFill>
      )}

      {/* Overlay oscuro para que el texto resalte */}
      <AbsoluteFill 
        style={{ 
          background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)" 
        }} 
      />

      {/* Elemento de UI: Bordes decorativos */}
      <AbsoluteFill style={{ padding: "30px" }}>
        <div style={{
          width: "100%",
          height: "100%",
          border: "2px solid rgba(255,255,255,0.1)",
          borderRadius: "40px",
          position: "relative"
        }}>
          {/* Badge superior */}
          <div style={{
            position: "absolute",
            top: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            padding: "8px 24px",
            borderRadius: "30px",
            color: "white",
            fontSize: "24px",
            fontWeight: "600",
            letterSpacing: "2px",
            border: "1px solid rgba(255,255,255,0.2)"
          }}>
            WTII IDIOMAS
          </div>
        </div>
      </AbsoluteFill>

      {/* Secuencias de Guion */}
      {script.map((part, index) => {
        const sequenceStart = startFrame;
        startFrame += part.durationInFrames;

        return (
          <Sequence key={index} from={sequenceStart} durationInFrames={part.durationInFrames}>
            {part.audioUrl && <Audio src={part.audioUrl} volume={1} />}
            <AnimatedScene text={part.text} fps={fps} isLast={index === script.length - 1} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const AnimatedScene: React.FC<{ text: string; fps: number; isLast: boolean }> = ({ text, fps, isLast }) => {
  const frame = useCurrentFrame();

  // Animación de entrada de la caja de cristal
  const boxProgress = spring({
    fps,
    frame,
    config: { damping: 14, mass: 1.2 },
  });

  const boxY = interpolate(boxProgress, [0, 1], [200, 0]);
  const boxOpacity = interpolate(boxProgress, [0, 1], [0, 1]);

  const words = text.split(" ");

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "60px" }}>
      <div
        style={{
          background: isLast 
            ? "linear-gradient(135deg, rgba(236, 72, 153, 0.8), rgba(168, 85, 247, 0.8))" 
            : "rgba(20, 20, 20, 0.65)",
          backdropFilter: "blur(16px)",
          borderRadius: "32px",
          padding: "50px 40px",
          border: isLast ? "2px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
          transform: `translateY(${boxY}px)`,
          opacity: boxOpacity,
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          width: "100%",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        {words.map((word, i) => {
          // Cada palabra se anima con un retraso
          const delay = i * 3;
          const wordFrame = Math.max(0, frame - delay - 10); // Empieza un poco después de que la caja aparece
          
          const wordProgress = spring({
            fps,
            frame: wordFrame,
            config: { damping: 12, stiffness: 100 },
          });

          const wordY = interpolate(wordProgress, [0, 1], [40, 0]);
          const wordOpacity = interpolate(wordProgress, [0, 1], [0, 1]);

          return (
            <span
              key={i}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 65,
                fontWeight: 800,
                color: "white",
                transform: `translateY(${wordY}px)`,
                opacity: wordOpacity,
                display: "inline-block",
                textShadow: "0px 4px 12px rgba(0,0,0,0.3)",
                lineHeight: "1.2",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
