import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetMembersSummaryQueryKey,
  getGetProfileQueryKey,
  getListProfilesQueryKey,
  type AdminProfileUpdate,
  type Profile,
  useUpdateModerationProfile,
} from "@workspace/api-client-react";
import {
  BriefcaseBusiness,
  Camera,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Trash2,
} from "lucide-react";
import { prepareProfilePhoto } from "@/lib/profile-photo";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ProfileForm = {
  name: string;
  avatarUrl: string;
  neighborhood: string;
  bio: string;
  profession: string;
  project: string;
  email: string;
  phone: string;
  showEmail: boolean;
  showPhone: boolean;
  gender: string;
  maritalStatus: string;
  educationLevel: string;
  observations: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  fatherFirstNames: string;
  motherFullName: string;
  showGender: boolean;
  showMaritalStatus: boolean;
  showEducationLevel: boolean;
};

const maritalStatuses = [
  "Célibataire",
  "Marié(e)",
  "Divorcé(e)",
  "Veuf / Veuve",
  "Union libre",
  "Pacsé(e)",
  "Préfère ne pas répondre",
];

const educationLevels = [
  "Aucun",
  "Primaire",
  "Collège",
  "Lycée",
  "Baccalauréat",
  "Bac +2",
  "Bac +3",
  "Bac +4",
  "Bac +5",
  "Master",
  "Doctorat",
  "Formation professionnelle",
  "Autre",
];

function formFromProfile(profile: Profile): ProfileForm {
  return {
    name: profile.name,
    avatarUrl: profile.avatarUrl ?? "",
    neighborhood: profile.neighborhood,
    bio: profile.bio,
    profession: profile.activities[0] ?? "Autre",
    project: profile.project ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? profile.contact ?? "",
    showEmail: profile.showEmail,
    showPhone: profile.showPhone,
    gender: profile.gender ?? "",
    maritalStatus: profile.maritalStatus ?? "",
    educationLevel: profile.educationLevel ?? "",
    observations: profile.observations ?? "",
    emergencyContactName: profile.emergencyContactName ?? "",
    emergencyContactPhone: profile.emergencyContactPhone ?? "",
    fatherFirstNames: profile.fatherFirstNames ?? "",
    motherFullName: profile.motherFullName ?? "",
    showGender: profile.showGender,
    showMaritalStatus: profile.showMaritalStatus,
    showEducationLevel: profile.showEducationLevel,
  };
}

export function AdminProfileEditor({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const updateProfile = useUpdateModerationProfile();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => formFromProfile(profile));
  const [formError, setFormError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [processingPhoto, setProcessingPhoto] = useState(false);

  useEffect(() => {
    if (!open) setForm(formFromProfile(profile));
  }, [open, profile]);

  const setField = <Key extends keyof ProfileForm>(
    key: Key,
    value: ProfileForm[Key],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const choosePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoError("");
    setProcessingPhoto(true);
    try {
      setField("avatarUrl", await prepareProfilePhoto(file));
    } catch (error) {
      setPhotoError(
        error instanceof Error
          ? error.message
          : "La photo n’a pas pu être préparée.",
      );
    } finally {
      setProcessingPhoto(false);
    }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    const data: AdminProfileUpdate = {
      name: form.name.trim(),
      avatarUrl: form.avatarUrl || null,
      neighborhood: form.neighborhood.trim(),
      bio: form.bio.trim(),
      profession: form.profession.trim(),
      project: form.project.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      showEmail: form.showEmail,
      showPhone: form.showPhone,
      gender: (form.gender || null) as AdminProfileUpdate["gender"],
      maritalStatus: (form.maritalStatus ||
        null) as AdminProfileUpdate["maritalStatus"],
      educationLevel: (form.educationLevel ||
        null) as AdminProfileUpdate["educationLevel"],
      observations: form.observations.trim() || null,
      emergencyContactName: form.emergencyContactName.trim() || null,
      emergencyContactPhone: form.emergencyContactPhone.trim() || null,
      fatherFirstNames: form.fatherFirstNames.trim() || null,
      motherFullName: form.motherFullName.trim() || null,
      showGender: form.showGender,
      showMaritalStatus: form.showMaritalStatus,
      showEducationLevel: form.showEducationLevel,
    };

    updateProfile.mutate(
      { id: profile.id, data },
      {
        onSuccess: async (updated) => {
          setOpen(false);
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getListProfilesQueryKey(),
            }),
            queryClient.invalidateQueries({
              queryKey: getGetProfileQueryKey(updated.id),
            }),
            queryClient.invalidateQueries({
              queryKey: getGetMembersSummaryQueryKey(),
            }),
          ]);
        },
        onError: () =>
          setFormError(
            "La modification a échoué. Vérifiez les champs ainsi que l’unicité de l’email et du numéro.",
          ),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground"
          data-testid={`button-edit-member-${profile.id}`}
        >
          <Pencil className="h-4 w-4" /> Modifier
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="h-full w-full overflow-y-auto p-0 sm:max-w-3xl"
      >
        <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background/95 px-6 py-5 pr-14 backdrop-blur">
          <SheetTitle>Modifier le profil</SheetTitle>
          <SheetDescription>
            Toutes les informations de {profile.name} peuvent être mises à jour
            ici.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={save} className="space-y-7 px-6 py-6">
          <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-muted text-primary">
              {form.avatarUrl ? (
                <img
                  src={form.avatarUrl}
                  alt={`Photo de ${form.name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Camera className="h-8 w-8" />
              )}
            </div>
            <div>
              <p className="text-sm font-extrabold">Photo du profil</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-background">
                  <Camera className="h-4 w-4" />
                  {processingPhoto ? "Préparation…" : "Choisir une photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={processingPhoto}
                    onChange={choosePhoto}
                    className="sr-only"
                  />
                </label>
                {form.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setField("avatarUrl", "")}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" /> Retirer
                  </button>
                )}
              </div>
              {photoError && (
                <p className="mt-2 text-xs font-semibold text-destructive">
                  {photoError}
                </p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-extrabold">Profil public</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Prénom et nom" className="sm:col-span-2">
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  className="field"
                />
              </Field>
              <Field label="Ville ou pays de résidence" icon={MapPin}>
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.neighborhood}
                  onChange={(event) =>
                    setField("neighborhood", event.target.value)
                  }
                  className="field"
                />
              </Field>
              <Field label="Profession ou situation" icon={BriefcaseBusiness}>
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.profession}
                  onChange={(event) =>
                    setField("profession", event.target.value)
                  }
                  className="field"
                />
              </Field>
              <Field label="Présentation" className="sm:col-span-2">
                <textarea
                  required
                  minLength={10}
                  maxLength={500}
                  rows={4}
                  value={form.bio}
                  onChange={(event) => setField("bio", event.target.value)}
                  className="field resize-y"
                />
              </Field>
              <Field label="Projet ou initiative" className="sm:col-span-2">
                <textarea
                  maxLength={500}
                  rows={3}
                  value={form.project}
                  onChange={(event) => setField("project", event.target.value)}
                  className="field resize-y"
                />
              </Field>
            </div>
          </section>

          <section className="border-t border-border pt-6">
            <h3 className="text-sm font-extrabold">Coordonnées et situation</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Email" icon={Mail}>
                <input
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={(event) => setField("email", event.target.value)}
                  className="field"
                />
              </Field>
              <Field label="Numéro WhatsApp" icon={Phone}>
                <input
                  type="tel"
                  maxLength={40}
                  value={form.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  className="field"
                />
              </Field>
              <Field label="Sexe">
                <select
                  value={form.gender}
                  onChange={(event) => setField("gender", event.target.value)}
                  className="field"
                >
                  <option value="">Non renseigné</option>
                  <option>Masculin</option>
                  <option>Féminin</option>
                </select>
              </Field>
              <Field label="Situation matrimoniale">
                <select
                  value={form.maritalStatus}
                  onChange={(event) =>
                    setField("maritalStatus", event.target.value)
                  }
                  className="field"
                >
                  <option value="">Non renseignée</option>
                  {maritalStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </Field>
              <Field
                label="Niveau d’études / qualification"
                className="sm:col-span-2"
              >
                <select
                  value={form.educationLevel}
                  onChange={(event) =>
                    setField("educationLevel", event.target.value)
                  }
                  className="field"
                >
                  <option value="">Non renseigné</option>
                  {educationLevels.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <VisibilityToggle
                checked={form.showEmail}
                disabled={!form.email.trim()}
                label="Afficher l’email dans l’annuaire"
                onChange={(checked) => setField("showEmail", checked)}
              />
              <VisibilityToggle
                checked={form.showPhone}
                disabled={!form.phone.trim()}
                label="Afficher le numéro dans l’annuaire"
                onChange={(checked) => setField("showPhone", checked)}
              />
              <VisibilityToggle
                checked={form.showGender}
                disabled={!form.gender}
                label="Afficher le sexe"
                onChange={(checked) => setField("showGender", checked)}
              />
              <VisibilityToggle
                checked={form.showMaritalStatus}
                disabled={!form.maritalStatus}
                label="Afficher la situation matrimoniale"
                onChange={(checked) => setField("showMaritalStatus", checked)}
              />
              <VisibilityToggle
                checked={form.showEducationLevel}
                disabled={!form.educationLevel}
                label="Afficher le niveau d’études"
                onChange={(checked) => setField("showEducationLevel", checked)}
              />
            </div>
          </section>

          <section className="border-t border-border pt-6">
            <h3 className="text-sm font-extrabold">
              Informations administratives
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ces informations ne sont pas publiées dans l’annuaire.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Prénoms du père">
                <input
                  maxLength={120}
                  value={form.fatherFirstNames}
                  onChange={(event) =>
                    setField("fatherFirstNames", event.target.value)
                  }
                  className="field"
                />
              </Field>
              <Field label="Prénom et nom de la mère">
                <input
                  maxLength={120}
                  value={form.motherFullName}
                  onChange={(event) =>
                    setField("motherFullName", event.target.value)
                  }
                  className="field"
                />
              </Field>
              <Field label="Contact d’urgence">
                <input
                  maxLength={120}
                  value={form.emergencyContactName}
                  onChange={(event) =>
                    setField("emergencyContactName", event.target.value)
                  }
                  className="field"
                />
              </Field>
              <Field label="Téléphone du contact d’urgence">
                <input
                  type="tel"
                  maxLength={40}
                  value={form.emergencyContactPhone}
                  onChange={(event) =>
                    setField("emergencyContactPhone", event.target.value)
                  }
                  className="field"
                />
              </Field>
              <Field
                label="Observations et recommandations"
                className="sm:col-span-2"
              >
                <textarea
                  maxLength={1500}
                  rows={5}
                  value={form.observations}
                  onChange={(event) =>
                    setField("observations", event.target.value)
                  }
                  className="field resize-y"
                />
              </Field>
            </div>
          </section>

          {formError && (
            <p className="rounded-xl bg-destructive/10 p-4 text-xs font-semibold text-destructive">
              {formError}
            </p>
          )}
          <div className="sticky bottom-0 -mx-6 border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
            <button
              type="submit"
              disabled={updateProfile.isPending || processingPhoto}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-xs font-extrabold text-primary-foreground disabled:opacity-50"
              data-testid={`button-save-member-${profile.id}`}
            >
              <Save className="h-4 w-4" />
              {updateProfile.isPending
                ? "Enregistrement…"
                : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  icon: Icon,
  className = "",
  children,
}: {
  label: string;
  icon?: typeof MapPin;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block space-y-2 text-xs font-bold ${className}`}>
      <span className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
        {label}
      </span>
      {children}
    </label>
  );
}

function VisibilityToggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-xl border border-border p-3 text-xs font-semibold ${disabled ? "opacity-45" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-primary"
      />
      {label}
    </label>
  );
}
