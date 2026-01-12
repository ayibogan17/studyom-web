import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Section } from "./section";
import { Badge } from "../../components/ui/badge";

type HeroProps = {
  title: string;
  subtitle: string;
};

export function Hero({ title, subtitle }: HeroProps) {
  return (
    <Section className="bg-gradient-to-br from-[var(--color-primary)] via-[#111827] to-[var(--color-primary)] text-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        <h1 className="font-[var(--font-display)] text-4xl font-semibold leading-tight md:text-5xl">
          {title}
        </h1>
        <p className="max-w-2xl text-lg text-gray-200">{subtitle}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/studyo">Stüdyo Bul</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/hocalar">Hoca Bul</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/uretim">Üretici Bul</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="border-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white hover:from-fuchsia-400 hover:via-purple-400 hover:to-indigo-400"
          >
            <Link href="/openjam">OpenJam</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
