import { Composition } from "remotion";
import { MarketingVideo, type MarketingVideoProps } from "../components/video/MarketingVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MarketingVideo"
        component={MarketingVideo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          imageSrc: "",
          script: []
        } as MarketingVideoProps}
      />
    </>
  );
};
