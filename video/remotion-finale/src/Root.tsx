import { Composition } from "remotion";
import { Finale, FinaleProps } from "./Finale";
import generated from "./photos.generated.json";

// Photos réellement déposées dans photos/ (écrit par video/film-laura/scripts/build_film.py).
const defaultProps: FinaleProps = { photos: generated.photos };

export const RemotionRoot = () => {
  return (
    <Composition
      id="Finale"
      component={Finale}
      durationInFrames={750}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={defaultProps}
    />
  );
};
