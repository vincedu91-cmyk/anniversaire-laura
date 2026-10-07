import Link from "next/link";

export default function NotFound() {
  return (
    <section data-scene="intro" className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="mono">404</p>
        <h1 className="display mt-4 text-[clamp(4rem,16vw,14rem)]">PERDU</h1>
        <p className="mt-6">Ce souvenir n&apos;existe pas (encore).</p>
        <p className="mono mt-10">
          <Link href="/" className="inline-block border-b border-current py-1">
            RETOUR AU DÉBUT DE L&apos;HISTOIRE
          </Link>
        </p>
      </div>
    </section>
  );
}
