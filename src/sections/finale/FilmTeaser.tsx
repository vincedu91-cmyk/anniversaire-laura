"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { MagneticWrap } from "@/components/motion/MagneticWrap";
import { KineticTitle } from "@/components/typography/KineticTitle";
import { fadeUp, scaleReveal } from "@/motion/presets";
import { stagger, viewport } from "@/motion/tokens";

interface FilmTeaserProps {
  title: string;
  stats: readonly [string, string, string];
  poster: string | null;
  href: string;
}

/** Accès évident au film: titre monumental, 10 minutes / 18 ans / 1 histoire, affiche qui déborde. */
export function FilmTeaser({ title, stats, poster, href }: FilmTeaserProps) {
  return (
    <section
      id="film"
      data-scene="film"
      data-universe="finale"
      aria-label="Le film"
      className="relative min-h-dvh overflow-hidden bg-finale-background px-4 py-[16dvh] text-finale-ink md:pl-44"
    >
      <h2 aria-label="Regarder le film" className="relative z-10 max-w-[58rem]">
        <KineticTitle as="span" text="REGARDER" className="display block text-[clamp(4rem,15vw,15rem)] text-finale-gold" />
        <KineticTitle as="span" text="LE FILM" delay={0.25} className="display block text-[clamp(4rem,15vw,15rem)]" />
      </h2>

      <motion.ul
        data-m
        className="relative z-10 mt-[8dvh] flex flex-col gap-1"
        initial="hidden"
        whileInView="visible"
        viewport={viewport.early}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger.loose } } }}
      >
        {stats.map((line) => (
          <motion.li key={line} data-m variants={fadeUp} className="mono text-base text-finale-ink/90 md:text-lg">
            {line}
          </motion.li>
        ))}
      </motion.ul>

      <motion.div
        data-m
        variants={scaleReveal}
        initial="hidden"
        whileInView="visible"
        viewport={viewport.early}
        className="relative mt-[10dvh] md:absolute md:-right-[8vw] md:bottom-[12dvh] md:mt-0 md:w-[58vw]"
      >
        <Link href={href} data-cursor aria-label={`Regarder le film : ${title}`} className="group relative block aspect-video overflow-hidden border border-finale-gold/60 bg-[color-mix(in_srgb,var(--color-finale-gold)_12%,var(--color-finale-background))]">
          {poster ? (
            <Image src={poster} alt={`Affiche du film ${title}`} fill sizes="(min-width: 768px) 58vw, 100vw" className="object-cover transition-transform duration-(--motion-slow) ease-(--ease-out) group-hover:scale-[1.04] motion-reduce:transition-none" />
          ) : (
            <p className="mono absolute left-4 top-4 text-finale-gold">[AFFICHE DU FILM À AJOUTER]</p>
          )}
          <span className="absolute inset-0 grid place-items-center">
            <MagneticWrap strength={0.4}>
              <span className="flex items-center gap-3 bg-finale-gold px-6 py-4 font-semibold text-finale-background transition-transform duration-(--motion-fast) group-active:scale-[0.97]">
                <Play size={24} weight="fill" aria-hidden="true" />
                <span className="mono text-sm">LANCER LE FILM</span>
                <ArrowRight size={20} weight="bold" aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
              </span>
            </MagneticWrap>
          </span>
        </Link>
      </motion.div>
    </section>
  );
}
