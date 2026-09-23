import {
  ArrowLeft,
  BriefcaseBusiness,
  Camera,
  Check,
  HeartHandshake,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { Link } from "wouter";
import { useCreateMembershipRequest } from "@workspace/api-client-react";
import { prepareProfilePhoto } from "@/lib/profile-photo";

const professions = [
  "Élève / Lycéen",
  "Étudiant",
  "Entrepreneur",
  "Agriculteur",
  "Artisan",
  "En recherche d’emploi",
  "Autre",
];

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

export default function JoinPage() {
  const createRequest = useCreateMembershipRequest();
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatarUrl: "",
    neighborhood: "",
    profession: "",
    otherProfession: "",
    bio: "",
    project: "",
    gender: "",
    maritalStatus: "",
    educationLevel: "",
    observations: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    fatherFirstNames: "",
    motherFullName: "",
  });
  const setField = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const selectPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
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

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!consent) return;
    createRequest.mutate(
      {
        data: {
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: form.email,
          phone: form.phone,
          avatarUrl: form.avatarUrl || null,
          neighborhood: form.neighborhood,
          profession:
            form.profession === "Autre"
              ? form.otherProfession.trim()
              : form.profession,
          bio: form.bio,
          project: form.project || null,
          gender: (form.gender || null) as "Masculin" | "Féminin" | null,
          maritalStatus: (form.maritalStatus || null) as
            | "Célibataire"
            | "Marié(e)"
            | "Divorcé(e)"
            | "Veuf / Veuve"
            | "Union libre"
            | "Pacsé(e)"
            | "Préfère ne pas répondre"
            | null,
          educationLevel: (form.educationLevel || null) as
            | "Aucun"
            | "Primaire"
            | "Collège"
            | "Lycée"
            | "Baccalauréat"
            | "Bac +2"
            | "Bac +3"
            | "Bac +4"
            | "Bac +5"
            | "Master"
            | "Doctorat"
            | "Formation professionnelle"
            | "Autre"
            | null,
          observations: form.observations || null,
          emergencyContactName: form.emergencyContactName || null,
          emergencyContactPhone: form.emergencyContactPhone || null,
          fatherFirstNames: form.fatherFirstNames || null,
          motherFullName: form.motherFullName || null,
        },
      },
      { onSuccess: () => setSubmitted(true) },
    );
  };

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-[22px] bg-secondary text-secondary-foreground shadow-[5px_5px_0_hsl(var(--accent))]">
          <Check className="h-8 w-8" />
        </div>
        <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-secondary">
          Demande bien enregistrée
        </p>
        <h1 className="vj-display mt-3 text-6xl leading-[.9]">Merci.</h1>
        <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
          Votre demande a bien été envoyée. Après sa validation, vous recevrez
          un email ou un message WhatsApp contenant votre code et le lien qui
          vous permettra de créer votre mot de passe et de vous connecter.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-xs font-bold text-background hover:-translate-y-0.5"
          data-testid="link-back-after-join"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à l’accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
      <aside className="vj-enter lg:sticky lg:top-28">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <HeartHandshake className="h-6 w-6" />
        </div>
        <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
          Rejoindre le recensement
        </p>
        <h1 className="vj-display mt-3 text-6xl leading-[.86] sm:text-7xl">
          Votre parcours
          <br />
          <em className="text-primary">compte ici.</em>
        </h1>
        <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
          Présentez-vous en quelques lignes. Aucun âge n’est demandé. Vos
          informations sensibles restent dans l’espace administratif et vous
          pourrez mettre votre profil à jour après validation.
        </p>
        <div className="mt-8 space-y-3 text-xs font-semibold text-foreground/75">
          <p className="flex items-start gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-extrabold">
              1
            </span>
            Vous envoyez votre demande.
          </p>
          <p className="flex items-start gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-extrabold">
              2
            </span>
            L’équipe vérifie les informations.
          </p>
          <p className="flex items-start gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-extrabold">
              3
            </span>
            Après approbation, l’administrateur vous envoie votre code de
            première connexion.
          </p>
        </div>
      </aside>

      <form
        onSubmit={submit}
        className="vj-enter vj-enter-delay-1 rounded-[28px] border border-border bg-card p-6 shadow-md sm:p-9"
      >
        <div className="mb-8">
          <h2 className="text-xl font-extrabold tracking-[-.04em]">
            Formulaire d’inscription
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Seules les informations essentielles sont obligatoires. Les autres
            champs sont clairement indiqués comme facultatifs.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-4 sm:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[28%] bg-muted text-primary ring-4 ring-card">
                {form.avatarUrl ? (
                  <img
                    src={form.avatarUrl}
                    alt="Aperçu de votre photo"
                    className="h-full w-full object-cover"
                    data-testid="img-join-photo-preview"
                  />
                ) : (
                  <Camera className="h-8 w-8" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold">Photo de profil</p>
                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  Facultative · JPG, PNG ou WebP · recadrée automatiquement au
                  format carré.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-background hover:-translate-y-0.5">
                    <Camera className="h-4 w-4" />
                    {processingPhoto
                      ? "Préparation…"
                      : form.avatarUrl
                        ? "Changer la photo"
                        : "Choisir une photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={processingPhoto}
                      onChange={selectPhoto}
                      className="sr-only"
                      data-testid="input-join-photo"
                    />
                  </label>
                  {form.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setField("avatarUrl", "")}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:border-destructive hover:text-destructive"
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
          </div>

          <label className="block space-y-2 text-xs font-bold">
            <span className="flex items-center gap-2">
              <UserRound className="h-3.5 w-3.5 text-primary" />
              Prénom
            </span>
            <input
              required
              minLength={2}
              maxLength={60}
              value={form.firstName}
              onChange={(event) => setField("firstName", event.target.value)}
              className="field"
              placeholder="Votre prénom"
              data-testid="input-join-first-name"
            />
          </label>
          <label className="block space-y-2 text-xs font-bold">
            Nom
            <input
              required
              minLength={2}
              maxLength={60}
              value={form.lastName}
              onChange={(event) => setField("lastName", event.target.value)}
              className="field"
              placeholder="Votre nom de famille"
              data-testid="input-join-last-name"
            />
          </label>
          <label className="block space-y-2 text-xs font-bold">
            Sexe <OptionalLabel />
            <select
              value={form.gender}
              onChange={(event) => setField("gender", event.target.value)}
              className="field"
              data-testid="select-join-gender"
            >
              <option value="">Choisir</option>
              <option>Masculin</option>
              <option>Féminin</option>
            </select>
          </label>
          <label className="block space-y-2 text-xs font-bold">
            Situation matrimoniale <OptionalLabel />
            <select
              value={form.maritalStatus}
              onChange={(event) =>
                setField("maritalStatus", event.target.value)
              }
              className="field"
              data-testid="select-join-marital-status"
            >
              <option value="">Choisir une situation</option>
              {maritalStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-xs font-bold">
            <span className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Email
            </span>
            <input
              required
              type="email"
              maxLength={254}
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
              className="field"
              placeholder="vous@exemple.com"
              data-testid="input-join-email"
            />
          </label>
          <label className="block space-y-2 text-xs font-bold">
            <span className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-primary" />
              Numéro WhatsApp
            </span>
            <input
              required
              type="tel"
              minLength={6}
              maxLength={40}
              value={form.phone}
              onChange={(event) => setField("phone", event.target.value)}
              className="field"
              placeholder="+224…"
              data-testid="input-join-phone"
            />
          </label>
          <label className="block space-y-2 text-xs font-bold">
            <span className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Ville ou pays de résidence
            </span>
            <input
              required
              minLength={2}
              maxLength={120}
              value={form.neighborhood}
              onChange={(event) => setField("neighborhood", event.target.value)}
              className="field"
              placeholder="Conakry, Kindia, France…"
              data-testid="input-join-neighborhood"
            />
          </label>
          <label className="block space-y-2 text-xs font-bold">
            <span className="flex items-center gap-2">
              <BriefcaseBusiness className="h-3.5 w-3.5 text-primary" />
              Profession ou situation
            </span>
            <select
              required
              value={form.profession}
              onChange={(event) => setField("profession", event.target.value)}
              className="field"
              data-testid="select-join-profession"
            >
              <option value="">Choisir une situation</option>
              {professions.map((profession) => (
                <option key={profession}>{profession}</option>
              ))}
            </select>
          </label>
          {form.profession === "Autre" && (
            <label className="block space-y-2 text-xs font-bold sm:col-span-2">
              Précisez votre profession ou votre situation
              <input
                required
                autoFocus
                minLength={2}
                maxLength={80}
                value={form.otherProfession}
                onChange={(event) =>
                  setField("otherProfession", event.target.value)
                }
                className="field"
                placeholder="Écrivez votre situation…"
                data-testid="input-join-other-profession"
              />
            </label>
          )}
          <label className="block space-y-2 text-xs font-bold sm:col-span-2">
            Niveau d’études / qualification <OptionalLabel />
            <select
              value={form.educationLevel}
              onChange={(event) =>
                setField("educationLevel", event.target.value)
              }
              className="field"
              data-testid="select-join-education-level"
            >
              <option value="">Choisir un niveau</option>
              {educationLevels.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-xs font-bold sm:col-span-2">
            Présentez-vous en quelques mots
            <textarea
              required
              minLength={10}
              maxLength={500}
              rows={4}
              value={form.bio}
              onChange={(event) => setField("bio", event.target.value)}
              className="field resize-none"
              placeholder="Exemple : Je m’appelle Gbadé Koivogui, je vis à Conakry. Présentez ensuite votre activité, vos compétences, vos centres d’intérêt et ce que vous souhaitez apporter à Zoboroma."
              data-testid="input-join-bio"
            />
            <span className="block text-[10px] font-normal leading-5 text-muted-foreground">
              Comme dans l’exemple de Gbadé Koivogui, indiquez simplement qui
              vous êtes, où vous vivez, ce que vous faites et comment vous
              aimeriez participer à la communauté.
            </span>
            <span className="block text-right text-[10px] font-normal text-muted-foreground">
              {form.bio.length}/500
            </span>
          </label>
          <label className="block space-y-2 text-xs font-bold sm:col-span-2">
            Projet ou envie du moment{" "}
            <span className="font-normal text-muted-foreground">
              (facultatif)
            </span>
            <textarea
              maxLength={500}
              rows={3}
              value={form.project}
              onChange={(event) => setField("project", event.target.value)}
              className="field resize-none"
              placeholder="Une idée, un projet, une compétence que vous souhaitez partager…"
              data-testid="input-join-project"
            />
          </label>
          <div className="sm:col-span-2 mt-2 rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <p className="text-xs font-extrabold text-primary">Filiation</p>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
              Ces informations restent uniquement visibles par l’administrateur.
            </p>
          </div>
          <label className="block space-y-2 text-xs font-bold">
            Prénoms du père <OptionalLabel />
            <input
              minLength={2}
              maxLength={120}
              value={form.fatherFirstNames}
              onChange={(event) =>
                setField("fatherFirstNames", event.target.value)
              }
              className="field"
              data-testid="input-join-father-first-names"
            />
          </label>
          <label className="block space-y-2 text-xs font-bold">
            Prénom et nom de la mère <OptionalLabel />
            <input
              minLength={2}
              maxLength={120}
              value={form.motherFullName}
              onChange={(event) =>
                setField("motherFullName", event.target.value)
              }
              className="field"
              data-testid="input-join-mother-full-name"
            />
          </label>
          <div className="sm:col-span-2 mt-2 rounded-2xl border border-secondary/15 bg-secondary/5 p-4">
            <p className="text-xs font-extrabold text-secondary">
              Contact en cas d’urgence
            </p>
            <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
              Réservé à l’administrateur et jamais affiché dans l’annuaire.
            </p>
          </div>
          <label className="block space-y-2 text-xs font-bold">
            Personne à contacter en cas d’urgence <OptionalLabel />
            <input
              minLength={2}
              maxLength={120}
              value={form.emergencyContactName}
              onChange={(event) =>
                setField("emergencyContactName", event.target.value)
              }
              className="field"
              placeholder="Prénom et nom"
              data-testid="input-join-emergency-contact-name"
            />
          </label>
          <label className="block space-y-2 text-xs font-bold">
            Téléphone du contact d’urgence <OptionalLabel />
            <input
              type="tel"
              minLength={6}
              maxLength={40}
              value={form.emergencyContactPhone}
              onChange={(event) =>
                setField("emergencyContactPhone", event.target.value)
              }
              className="field"
              placeholder="+224…"
              data-testid="input-join-emergency-contact-phone"
            />
          </label>
          <label className="block space-y-2 text-xs font-bold sm:col-span-2">
            Observations et recommandations
            <textarea
              maxLength={1500}
              rows={5}
              value={form.observations}
              onChange={(event) => setField("observations", event.target.value)}
              className="field resize-y"
              placeholder="Formulez toute observation ou recommandation susceptible d’améliorer l’organisation, la cohésion, l’efficacité des activités et le bon fonctionnement de l’association."
              data-testid="input-join-observations"
            />
            <span className="block text-[10px] font-normal leading-5 text-muted-foreground">
              Cette réponse est réservée à l’administration.
            </span>
          </label>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4 text-xs leading-5 text-muted-foreground">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1 h-4 w-4 accent-primary"
          />
          <span>
            <strong className="text-foreground">
              J’accepte que l’équipe de Zoboroma examine ces informations.
            </strong>{" "}
            L’email, le numéro WhatsApp et la photo pourront apparaître dans
            l’annuaire. Le sexe, la situation matrimoniale et le niveau d’études
            sont privés par défaut et ne pourront être publiés que par
            l’administrateur. La filiation, le contact d’urgence et les
            observations restent strictement administratifs.
          </span>
        </label>

        {createRequest.isError && (
          <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive">
            La demande n’a pas pu être envoyée. Vérifiez votre connexion puis
            réessayez.
          </p>
        )}

        <button
          type="submit"
          disabled={createRequest.isPending || processingPhoto || !consent}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-xs font-extrabold text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="button-submit-join"
        >
          <Send className="h-4 w-4" />
          {createRequest.isPending ? "Envoi en cours…" : "Envoyer ma demande"}
        </button>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] font-semibold text-muted-foreground">
          <LockKeyhole className="h-3 w-3" /> Données sensibles protégées ·
          profil modifiable après connexion
        </p>
      </form>
    </div>
  );
}

function OptionalLabel() {
  return (
    <span className="font-normal text-muted-foreground">(facultatif)</span>
  );
}
