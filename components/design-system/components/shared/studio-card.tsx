import Image from "next/image";
import { MapPin, Music, Star } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import { cn } from "../../lib/cn";

export type StudioCardProps = {
  name: string;
  city?: string;
  district?: string;
  price?: string;
  imageUrl?: string;
  rating?: number;
  badges?: string[];
  href?: string;
};

export function StudioCard({
  name,
  city,
  district,
  price,
  imageUrl,
  rating,
  badges = [],
  href = "#",
}: StudioCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl p-0">
      <div className="relative h-48 w-full bg-[var(--color-secondary)]">
        <Image
          src={
            imageUrl ||
            "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=800&q=80"
          }
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          priority={false}
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-primary)]">{name}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-[var(--color-muted)]">
              <MapPin size={16} />
              <span>
                {city || "Şehir"} {district ? `• ${district}` : ""}
              </span>
            </div>
          </div>
          {rating ? (
            <div className="flex items-center gap-1 rounded-full bg-[var(--color-secondary)] px-2 py-1 text-xs font-semibold text-[var(--color-primary)]">
              <Star size={14} className="text-[var(--color-accent)]" />
              {rating.toFixed(1)}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.length
            ? badges.map((badge) => (
                <Badge key={badge} variant="muted" className="bg-[var(--color-secondary)] text-[var(--color-primary)]">
                  {badge}
                </Badge>
              ))
            : (
                <Badge variant="muted">
                  <Music size={14} className="mr-1" />
                  Ekipman hazır
                </Badge>
              )}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="text-sm text-[var(--color-primary)]">
            {price ? <span className="font-semibold">{price}</span> : <span className="text-[var(--color-muted)]">Ücret sorunuz</span>}
          </div>
          <Button asChild size="sm" variant="secondary" className={cn("shadow-sm")}>
            <Link href={href}>Detay</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
