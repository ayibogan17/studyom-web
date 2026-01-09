import Image from "next/image";
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
      <div className="grid items-center gap-10 md:grid-cols-12">
        <div className="md:col-span-7 space-y-6">
          <Badge variant="muted" className="bg-white/10 text-white">
            Yeni: Studyom tasarım sistemi
          </Badge>
          <h1 className="font-[var(--font-display)] text-4xl font-semibold leading-tight md:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-lg text-gray-200">{subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/studyo">Stüdyo Bul</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/hocalar">Hoca Bul</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/uretim">Üretici Bul</Link>
            </Button>
          </div>
        </div>
        <div className="md:col-span-5">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-accent)]/20 via-transparent to-white/10 pointer-events-none" />
            <Image
              src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80"
              alt="Stüdyo görseli"
              width={800}
              height={600}
              className="relative z-10 h-full w-full rounded-xl object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
