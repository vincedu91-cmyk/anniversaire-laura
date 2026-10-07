import { getFilmAssets } from "@/data/film";
import { TransitionScene } from "@/components/motion/TransitionScene";
import { AdolescenceSection } from "@/sections/adolescence/AdolescenceSection";
import { ChildhoodSection } from "@/sections/childhood/ChildhoodSection";
import { BirthdayMessage } from "@/sections/finale/BirthdayMessage";
import { FilmTeaser } from "@/sections/finale/FilmTeaser";
import { FinalMosaic } from "@/sections/finale/FinalMosaic";
import { HeroIntro } from "@/sections/home/HeroIntro";
import { MischiefSection } from "@/sections/mischief/MischiefSection";

/** Parcours complet: intro, enfance, adolescence, bêtises, finale, film. */
export default function Home() {
  const film = getFilmAssets();
  return (
    <>
      <HeroIntro />
      <ChildhoodSection />
      <TransitionScene kind="childhood-adolescence" />
      <AdolescenceSection />
      <TransitionScene kind="adolescence-mischief" />
      <MischiefSection />
      <TransitionScene kind="mischief-finale" />
      <FinalMosaic />
      <BirthdayMessage />
      <FilmTeaser title={film.title} stats={film.stats} poster={film.poster} href="/le-film" />
    </>
  );
}
