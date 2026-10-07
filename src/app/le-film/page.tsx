import type { Metadata } from "next";
import Link from "next/link";
import { getFilmAssets } from "@/data/film";
import { FilmPlayer } from "@/components/media/FilmPlayer";

export const metadata: Metadata = {
  title: "Le film",
  description: "10 minutes, 18 ans, 1 histoire : le film d'anniversaire de Laura.",
  alternates: { canonical: "/le-film" },
};

export default function FilmPage() {
  const film = getFilmAssets();
  return (
    <section data-scene="film" data-universe="finale" className="min-h-dvh bg-finale-background px-4 pb-[12dvh] pt-[16dvh] text-finale-ink md:pl-44 md:pr-8">
      <p className="mono text-finale-gold">LE FILM</p>
      <h1 className="display mt-3 max-w-[18ch] text-[clamp(2.5rem,8vw,8rem)]">{film.title}</h1>
      <div className="mt-[6dvh]">
        <FilmPlayer title={film.title} src={film.video} poster={film.poster} tracks={film.tracks} directory={film.directory} />
      </div>
      <ul className="mono mt-8 flex flex-wrap gap-x-10 gap-y-2 text-finale-ink/90">
        {film.stats.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mono mt-[10dvh]">
        <Link href="/" className="inline-block border-b border-finale-gold py-1 text-finale-gold">
          RETOUR AU PARCOURS
        </Link>
      </p>
    </section>
  );
}
