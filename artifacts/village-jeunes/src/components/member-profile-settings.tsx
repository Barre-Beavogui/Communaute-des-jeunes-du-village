import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetMemberProfileSettingsQueryKey,
  getGetMembersSummaryQueryKey,
  getGetProfileQueryKey,
  getListProfilesQueryKey,
  useGetMemberProfileSettings,
  useUpdateMemberProfile,
} from "@workspace/api-client-react";
import {
  BriefcaseBusiness,
  Camera,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
} from "lucide-react";
import { prepareProfilePhoto } from "@/lib/profile-photo";
import {
  updateMemberIdentity,
  type MemberIdentity,
} from "@/lib/member-session";

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
};

const emptyForm: ProfileForm = {
  name: "",
  avatarUrl: "",
  neighborhood: "",
  bio: "",
  profession: "",
  project: "",
  email: "",
  phone: "",
  showEmail: true,
  showPhone: true,
};

export function MemberProfileSettings({
  member,
  onUpdated,
}: {
  member: MemberIdentity;
  onUpdated: (profile: MemberIdentity) => void;
}) {
  const queryClient = useQueryClient();
  const settingsQuery = useGetMemberProfileSettings({
    query: {
      retry: false,
      queryKey: getGetMemberProfileSettingsQueryKey(),
    },
  });
  const updateProfile = useUpdateMemberProfile();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [photoError, setPhotoError] = useState("");
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);

  useEffect(() => {
    if (!settingsQuery.data) return;
    setForm({
      name: settingsQuery.data.name,
      avatarUrl: settingsQuery.data.avatarUrl ?? "",
      neighborhood: settingsQuery.data.neighborhood,
      bio: settingsQuery.data.bio,
      profession: settingsQuery.data.profession,
      project: settingsQuery.data.project ?? "",
      email: settingsQuery.data.email ?? "",
      phone: settingsQuery.data.phone ?? "",
      showEmail: settingsQuery.data.showEmail,
      showPhone: settingsQuery.data.showPhone,
    });
  }, [settingsQuery.data]);

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
    setSaved(false);
    updateProfile.mutate(
      {
        data: {
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
        },
      },
      {
        onSuccess: async (updated) => {
          const identity = {
            id: updated.id,
            name: updated.name,
            initials: updated.initials,
            avatarUrl: updated.avatarUrl,
          };
          updateMemberIdentity(identity);
          onUpdated(identity);
          setSaved(true);
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getGetMemberProfileSettingsQueryKey(),
            }),
            queryClient.invalidateQueries({
              queryKey: getGetProfileQueryKey(updated.id),
            }),
            queryClient.invalidateQueries({
              queryKey: getListProfilesQueryKey(),
            }),
            queryClient.invalidateQueries({
              queryKey: getGetMembersSummaryQueryKey(),
            }),
          ]);
        },
        onError: () =>
          setFormError(
            "La modification a échoué. Vérifiez que l’email ou le téléphone n’est pas déjà utilisé.",
          ),
      },
    );
  };

  if (settingsQuery.isLoading) {
    return <div className="h-96 animate-pulse rounded-[28px] bg-muted" />;
  }

  if (settingsQuery.isError) {
    return (
      <p className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
        Votre profil n’a pas pu être chargé. Reconnectez-vous puis réessayez.
      </p>
    );
  }

  return (
    <form
      onSubmit={save}
      className="rounded-[28px] border border-border bg-card p-6 text-left shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[28%] bg-muted text-primary ring-4 ring-background">
          {form.avatarUrl ? (
            <img
              src={form.avatarUrl}
              alt={`Photo de ${form.name || member.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Camera className="h-8 w-8" />
          )}
        </div>
        <div>
          <p className="text-sm font-extrabold">Photo du profil</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Utilisez une photo nette et reconnaissable.
          </p>
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
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
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
            onChange={(event) => setField("neighborhood", event.target.value)}
            className="field"
          />
        </Field>
        <Field label="Profession ou situation" icon={BriefcaseBusiness}>
          <input
            required
            minLength={2}
            maxLength={80}
            value={form.profession}
            onChange={(event) => setField("profession", event.target.value)}
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
        <Field label="Projet ou envie du moment" className="sm:col-span-2">
          <textarea
            maxLength={500}
            rows={3}
            value={form.project}
            onChange={(event) => setField("project", event.target.value)}
            className="field resize-y"
          />
        </Field>
        <Field label="Email de connexion" icon={Mail}>
          <input
            type="email"
            maxLength={254}
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            className="field"
          />
        </Field>
        <Field label="Téléphone / WhatsApp" icon={Phone}>
          <input
            type="tel"
            maxLength={40}
            value={form.phone}
            onChange={(event) => setField("phone", event.target.value)}
            className="field"
          />
        </Field>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <VisibilityToggle
          checked={form.showEmail}
          disabled={!form.email.trim()}
          label="Afficher mon email dans l’annuaire"
          onChange={(checked) => setField("showEmail", checked)}
        />
        <VisibilityToggle
          checked={form.showPhone}
          disabled={!form.phone.trim()}
          label="Afficher mon téléphone dans l’annuaire"
          onChange={(checked) => setField("showPhone", checked)}
        />
      </div>

      {formError && (
        <p className="mt-4 text-xs font-semibold text-destructive">
          {formError}
        </p>
      )}
      {saved && (
        <p className="mt-4 text-xs font-semibold text-secondary">
          Votre profil a bien été mis à jour.
        </p>
      )}
      <button
        type="submit"
        disabled={updateProfile.isPending || processingPhoto}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-xs font-extrabold text-primary-foreground disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {updateProfile.isPending
          ? "Enregistrement…"
          : "Enregistrer mes modifications"}
      </button>
    </form>
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
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-background p-4 text-xs font-bold disabled:opacity-50">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-primary"
      />
      {checked ? (
        <Eye className="h-4 w-4 text-secondary" />
      ) : (
        <EyeOff className="h-4 w-4 text-muted-foreground" />
      )}
      {label}
    </label>
  );
}
