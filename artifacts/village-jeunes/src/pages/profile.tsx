import {
  Check,
  Eye,
  ImagePlus,
  LockKeyhole,
  Save,
  UserRound,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useGetProfile, useUpdateMyProfile } from "@workspace/api-client-react";
import { Avatar } from "@/components/village-shell";
import { demoProfiles } from "@/lib/demo-data";

const currentFallback =
  demoProfiles.find((profile) => profile.id === "beavogui-barre-france") ??
  demoProfiles[0];

export default function ProfilePage() {
  const profileQuery = useGetProfile("beavogui-barre-france");
  const updateProfile = useUpdateMyProfile();
  const profile =
    profileQuery.data && typeof profileQuery.data.name === "string"
      ? profileQuery.data
      : currentFallback;
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl ?? "");
  const [form, setForm] = useState({
    name: profile.name,
    neighborhood: profile.neighborhood,
    bio: profile.bio,
    activities: profile.activities.join(", "),
    project: profile.project ?? "",
    contact: profile.contact ?? "",
    instagram: profile.instagram ?? "",
    privacy: profile.privacy,
  });

  useEffect(() => {
    if (profileQuery.data) {
      setForm({
        name: profileQuery.data.name,
        neighborhood: profileQuery.data.neighborhood,
        bio: profileQuery.data.bio,
        activities: profileQuery.data.activities.join(", "),
        project: profileQuery.data.project ?? "",
        contact: profileQuery.data.contact ?? "",
        instagram: profileQuery.data.instagram ?? "",
        privacy: profileQuery.data.privacy,
      });
    }
  }, [profileQuery.data]);

  const setField = (field: string, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const chooseAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  };
  const save = (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    updateProfile.mutate(
      {
        data: {
          name: form.name,
          neighborhood: form.neighborhood,
          bio: form.bio,
          activities: form.activities
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          project: form.project || null,
          contact: form.contact || null,
          instagram: form.instagram || null,
          privacy: form.privacy as "community" | "private",
        },
      },
      { onSuccess: () => setSaved(true), onError: () => setSaved(false) },
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="vj-enter flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
            Mon coin à moi
          </p>
          <h1 className="vj-display mt-2 text-5xl leading-[.9] sm:text-6xl">
            Faire connaissance.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            Quelques mots suffisent pour que quelqu’un reconnaisse une passion
            commune.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <Avatar profile={profile} size="sm" />
          <div>
            <p className="text-xs font-bold">{profile.name}</p>
            <p className="text-[10px] text-secondary">Profil membre</p>
          </div>
        </div>
      </div>

      <form onSubmit={save} className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-border pb-5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/50 text-primary">
              <UserRound className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-extrabold">Les infos de base</h2>
              <p className="text-xs text-muted-foreground">
                Ce que les voisins voient en premier.
              </p>
            </div>
          </div>
          <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-border bg-background/60 p-4">
            <Avatar
              profile={{ ...profile, avatarUrl: avatarPreview || null }}
              size="lg"
            />
            <div className="flex-1">
              <p className="text-xs font-bold">Photo de profil</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Une image claire aide les voisins à vous reconnaître.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-extrabold hover:border-primary">
              <ImagePlus className="h-4 w-4 text-primary" /> Choisir une photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={chooseAvatar}
                data-testid="input-profile-avatar"
              />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-xs font-bold sm:col-span-2">
              Prénom et nom
              <input
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                required
                minLength={2}
                className="field"
                data-testid="input-profile-name"
              />
            </label>
            <label className="space-y-2 text-xs font-bold sm:col-span-2">
              Quartier ou lieu-dit
              <input
                value={form.neighborhood}
                onChange={(event) =>
                  setField("neighborhood", event.target.value)
                }
                required
                className="field"
                data-testid="input-profile-neighborhood"
              />
            </label>
            <label className="space-y-2 text-xs font-bold sm:col-span-2">
              Une phrase qui vous ressemble
              <textarea
                value={form.bio}
                onChange={(event) => setField("bio", event.target.value)}
                maxLength={500}
                rows={3}
                required
                className="field resize-none"
                data-testid="input-profile-bio"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-border pb-5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary/15 text-secondary">
              <span className="text-lg font-bold">+</span>
            </span>
            <div>
              <h2 className="font-extrabold">Ce qui vous anime</h2>
              <p className="text-xs text-muted-foreground">
                Séparez les activités par une virgule.
              </p>
            </div>
          </div>
          <div className="space-y-5">
            <label className="block space-y-2 text-xs font-bold">
              Passions et activités
              <input
                value={form.activities}
                onChange={(event) => setField("activities", event.target.value)}
                placeholder="Photo, skate, jardin…"
                className="field"
                data-testid="input-profile-activities"
              />
            </label>
            <label className="block space-y-2 text-xs font-bold">
              Projet du moment
              <textarea
                value={form.project}
                onChange={(event) => setField("project", event.target.value)}
                rows={3}
                placeholder="Une idée qui cherche peut-être des complices…"
                className="field resize-none"
                data-testid="input-profile-project"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-border pb-5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <LockKeyhole className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-extrabold">Comment vous joindre</h2>
              <p className="text-xs text-muted-foreground">
                Vous gardez la main, toujours.
              </p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-xs font-bold">
              Téléphone / WhatsApp
              <input
                type="tel"
                value={form.contact}
                onChange={(event) => setField("contact", event.target.value)}
                placeholder="+224 6XX XX XX XX"
                className="field"
                data-testid="input-profile-contact"
              />
            </label>
            <label className="space-y-2 text-xs font-bold">
              Instagram
              <input
                value={form.instagram}
                onChange={(event) => setField("instagram", event.target.value)}
                placeholder="@moncompte"
                className="field"
                data-testid="input-profile-instagram"
              />
            </label>
            <div className="sm:col-span-2">
              <p className="mb-3 text-xs font-bold">Visibilité du contact</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setField("privacy", "community")}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left ${form.privacy === "community" ? "border-secondary bg-secondary/10" : "border-border hover:border-secondary/40"}`}
                  data-testid="button-privacy-community"
                >
                  <Eye className="mt-0.5 h-4 w-4 text-secondary" />
                  <span>
                    <strong className="block text-xs">Pour les membres</strong>
                    <small className="mt-1 block text-[11px] leading-4 text-muted-foreground">
                      Les membres approuvés peuvent vous contacter.
                    </small>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setField("privacy", "private")}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left ${form.privacy === "private" ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                  data-testid="button-privacy-private"
                >
                  <LockKeyhole className="mt-0.5 h-4 w-4 text-primary" />
                  <span>
                    <strong className="block text-xs">Privé</strong>
                    <small className="mt-1 block text-[11px] leading-4 text-muted-foreground">
                      Votre contact reste invisible dans le village.
                    </small>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p
            className="text-xs text-muted-foreground"
            data-testid="status-profile-save"
          >
            {saved ? (
              <span className="flex items-center gap-1.5 font-bold text-secondary">
                <Check className="h-4 w-4" /> Profil enregistré
              </span>
            ) : profileQuery.isError ? (
              "Mode aperçu : vos changements resteront le temps de la session."
            ) : (
              "Vos informations sont visibles uniquement par la communauté approuvée."
            )}
          </p>
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-extrabold text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-wait disabled:opacity-60"
            data-testid="button-save-profile"
          >
            <Save className="h-4 w-4" />
            {updateProfile.isPending
              ? "Enregistrement…"
              : "Enregistrer mon profil"}
          </button>
        </div>
      </form>
    </div>
  );
}
