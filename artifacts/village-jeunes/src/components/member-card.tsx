import { ArrowUpRight, FolderKanban, Mail, MapPin, Phone } from "lucide-react";
import type { Profile } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Avatar } from "@/components/village-shell";

export function MemberCard({
  profile,
  featured = false,
  presenceActivity,
}: {
  profile: Profile;
  featured?: boolean;
  presenceActivity?: "online" | "typing" | "recording";
}) {
  return (
    <Link
      href={`/membre/${profile.id}`}
      className={`group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm hover:-translate-y-1 hover:border-primary/40 hover:shadow-md ${featured ? "sm:col-span-2" : ""}`}
      data-testid={`card-member-${profile.id}`}
    >
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent/20 transition-transform duration-500 group-hover:scale-125" />
      <div className="relative flex items-start justify-between">
        <div className="relative">
          <Avatar profile={profile} size={featured ? "lg" : "md"} />
          {presenceActivity && (
            <span
              className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-card bg-emerald-500"
              aria-label="En ligne"
            />
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
          {presenceActivity && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-extrabold text-emerald-700">
              {presenceActivity === "typing"
                ? "écrit…"
                : presenceActivity === "recording"
                  ? "enregistre…"
                  : "En ligne"}
            </span>
          )}
        </div>
      </div>
      <div className="relative mt-5 flex flex-1 flex-col">
        <h3
          className={`${featured ? "text-2xl" : "text-lg"} font-extrabold tracking-[-.04em]`}
          data-testid={`text-member-name-${profile.id}`}
        >
          {profile.name}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {profile.neighborhood}
        </p>
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {profile.bio}
        </p>
        {(profile.email || profile.phone) && (
          <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-[11px] font-semibold text-muted-foreground">
            {profile.email && (
              <p className="flex min-w-0 items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{profile.email}</span>
              </p>
            )}
            {profile.phone && (
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{profile.phone}</span>
              </p>
            )}
          </div>
        )}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {profile.activities.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {profile.project && (
            <span className="flex items-center gap-1 rounded-full bg-secondary/12 px-2.5 py-1 text-[10px] font-bold text-secondary">
              <FolderKanban className="h-3 w-3" /> Projet
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
