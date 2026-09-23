import {
  BriefcaseBusiness,
  Check,
  Clock3,
  Copy,
  Download,
  FileSpreadsheet,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetMembersSummaryQueryKey,
  getListAnnouncementsQueryKey,
  getListModerationRequestsQueryKey,
  getListPasswordResetRequestsQueryKey,
  getListPollsQueryKey,
  getListProfilesQueryKey,
  useAdminLogin,
  useCreatePasswordResetCode,
  useDeleteModerationProfile,
  useGenerateMemberCode,
  useListModerationRequests,
  useListPasswordResetRequests,
  useListProfiles,
  useReviewModerationRequest,
  useUpdateProfileVisibility,
} from "@workspace/api-client-react";
import { AdminCommunity } from "@/components/admin-community";
import { buildMemberInvitation } from "@/lib/member-invitation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TOKEN_KEY = "zoboroma_admin_token";

function normalizeSearchValue(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(() =>
    Boolean(sessionStorage.getItem(TOKEN_KEY)),
  );
  const [loginError, setLoginError] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [generatingCodeId, setGeneratingCodeId] = useState<string | null>(null);
  const [resettingRequestId, setResettingRequestId] = useState<string | null>(
    null,
  );
  const [codeError, setCodeError] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [generatedCode, setGeneratedCode] = useState<{
    memberName: string;
    code: string;
    email: string;
    phone: string;
  } | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberNeighborhood, setMemberNeighborhood] = useState("all");
  const [memberActivity, setMemberActivity] = useState("all");
  const [memberProject, setMemberProject] = useState<
    "all" | "with" | "without"
  >("all");
  const [exportingMembers, setExportingMembers] = useState(false);
  const [exportError, setExportError] = useState("");
  const [visibilityUpdatingId, setVisibilityUpdatingId] = useState<
    string | null
  >(null);
  const [visibilityError, setVisibilityError] = useState("");
  const login = useAdminLogin();
  const requestsQuery = useListModerationRequests({
    query: {
      enabled: authenticated,
      retry: false,
      queryKey: getListModerationRequestsQueryKey(),
    },
  });
  const membersQuery = useListProfiles({
    query: {
      enabled: authenticated,
      retry: false,
      queryKey: getListProfilesQueryKey(),
    },
  });
  const passwordResetRequestsQuery = useListPasswordResetRequests({
    query: {
      enabled: authenticated,
      retry: false,
      queryKey: getListPasswordResetRequestsQueryKey(),
    },
  });
  const reviewRequest = useReviewModerationRequest();
  const deleteProfile = useDeleteModerationProfile();
  const generateCode = useGenerateMemberCode();
  const createResetCode = useCreatePasswordResetCode();
  const updateVisibility = useUpdateProfileVisibility();
  const requests = requestsQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const passwordResetRequests = passwordResetRequestsQuery.data ?? [];
  const invitation = generatedCode
    ? buildMemberInvitation(generatedCode)
    : null;
  const neighborhoodOptions = useMemo(
    () =>
      [
        ...new Set(
          members.map((member) => member.neighborhood).filter(Boolean),
        ),
      ].sort((first, second) => first.localeCompare(second, "fr")),
    [members],
  );
  const activityOptions = useMemo(
    () =>
      [...new Set(members.flatMap((member) => member.activities))].sort(
        (first, second) => first.localeCompare(second, "fr"),
      ),
    [members],
  );
  const filteredMembers = useMemo(() => {
    const search = normalizeSearchValue(memberSearch);
    return members.filter((member) => {
      const matchesSearch =
        !search ||
        [
          member.name,
          member.email,
          member.phone,
          member.contact,
          member.neighborhood,
          member.activities.join(" "),
          member.bio,
          member.project,
          member.gender,
          member.maritalStatus,
          member.educationLevel,
          member.fatherFirstNames,
          member.motherFullName,
          member.emergencyContactName,
          member.emergencyContactPhone,
          member.observations,
        ].some((value) => normalizeSearchValue(value).includes(search));
      const matchesNeighborhood =
        memberNeighborhood === "all" ||
        member.neighborhood === memberNeighborhood;
      const matchesActivity =
        memberActivity === "all" || member.activities.includes(memberActivity);
      const matchesProject =
        memberProject === "all" ||
        (memberProject === "with"
          ? Boolean(member.project?.trim())
          : !member.project?.trim());
      return (
        matchesSearch &&
        matchesNeighborhood &&
        matchesActivity &&
        matchesProject
      );
    });
  }, [
    memberActivity,
    memberNeighborhood,
    memberProject,
    memberSearch,
    members,
  ]);
  const filtersAreActive = Boolean(
    memberSearch.trim() ||
    memberNeighborhood !== "all" ||
    memberActivity !== "all" ||
    memberProject !== "all",
  );

  const openSession = (event: FormEvent) => {
    event.preventDefault();
    setLoginError("");
    login.mutate(
      { data: { password } },
      {
        onSuccess: async (session) => {
          sessionStorage.setItem(TOKEN_KEY, session.token);
          setPassword("");
          setAuthenticated(true);
          await queryClient.invalidateQueries({
            queryKey: getListModerationRequestsQueryKey(),
          });
          await queryClient.invalidateQueries({
            queryKey: getListProfilesQueryKey(),
          });
          await queryClient.invalidateQueries({
            queryKey: getListPasswordResetRequestsQueryKey(),
          });
        },
        onError: () =>
          setLoginError(
            "Mot de passe incorrect ou accès temporairement indisponible.",
          ),
      },
    );
  };

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthenticated(false);
    queryClient.removeQueries({
      queryKey: getListModerationRequestsQueryKey(),
    });
    queryClient.removeQueries({ queryKey: getListProfilesQueryKey() });
    queryClient.removeQueries({
      queryKey: getListPasswordResetRequestsQueryKey(),
    });
    queryClient.removeQueries({ queryKey: getListAnnouncementsQueryKey() });
    queryClient.removeQueries({ queryKey: getListPollsQueryKey() });
  };

  const createMemberCode = (id: string, memberName: string) => {
    setGeneratingCodeId(id);
    setCodeError("");
    generateCode.mutate(
      {
        id,
        data: {
          email: manualEmail.trim() || null,
          phone: manualPhone.trim() || null,
        },
      },
      {
        onSuccess: (result) => {
          setGeneratedCode({
            memberName,
            code: result.code,
            email: manualEmail.trim(),
            phone: manualPhone.trim(),
          });
          setManualEmail("");
          setManualPhone("");
        },
        onError: () =>
          setCodeError(
            "Le code n’a pas pu être créé. Reconnectez-vous puis réessayez.",
          ),
        onSettled: () => setGeneratingCodeId(null),
      },
    );
  };

  const review = (id: string, status: "approved" | "rejected") => {
    setReviewingId(id);
    reviewRequest.mutate(
      { id, data: { status } },
      {
        onSuccess: async (result) => {
          if (status === "approved" && result.memberCode) {
            setGeneratedCode({
              memberName: result.name,
              code: result.memberCode,
              email: result.email,
              phone: result.phone ?? "",
            });
          }
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getListModerationRequestsQueryKey(),
            }),
            queryClient.invalidateQueries({
              queryKey: getListProfilesQueryKey(),
            }),
          ]);
        },
        onSettled: () => setReviewingId(null),
      },
    );
  };

  const preparePasswordReset = (id: string) => {
    setResettingRequestId(id);
    setCodeError("");
    createResetCode.mutate(
      { id },
      {
        onSuccess: async (result) => {
          setGeneratedCode({
            memberName: result.memberName,
            code: result.code,
            email: result.email ?? "",
            phone: result.phone ?? "",
          });
          await queryClient.invalidateQueries({
            queryKey: getListPasswordResetRequestsQueryKey(),
          });
        },
        onError: () =>
          setCodeError(
            "Le nouveau code n’a pas pu être créé. Reconnectez-vous puis réessayez.",
          ),
        onSettled: () => setResettingRequestId(null),
      },
    );
  };

  const removeMember = (id: string) => {
    setDeletingId(id);
    setDeleteError("");
    deleteProfile.mutate(
      { id },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getListProfilesQueryKey(),
            }),
            queryClient.invalidateQueries({
              queryKey: getGetMembersSummaryQueryKey(),
            }),
          ]);
        },
        onError: () =>
          setDeleteError(
            "La suppression n’a pas abouti. Reconnectez-vous puis réessayez.",
          ),
        onSettled: () => setDeletingId(null),
      },
    );
  };

  const changeProfileVisibility = (
    id: string,
    values: {
      showGender: boolean;
      showMaritalStatus: boolean;
      showEducationLevel: boolean;
    },
  ) => {
    setVisibilityUpdatingId(id);
    setVisibilityError("");
    updateVisibility.mutate(
      { id, data: values },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: getListProfilesQueryKey(),
          });
        },
        onError: () =>
          setVisibilityError(
            "La visibilité n’a pas pu être modifiée. Reconnectez-vous puis réessayez.",
          ),
        onSettled: () => setVisibilityUpdatingId(null),
      },
    );
  };

  const resetMemberFilters = () => {
    setMemberSearch("");
    setMemberNeighborhood("all");
    setMemberActivity("all");
    setMemberProject("all");
  };

  const exportMembersToExcel = async () => {
    if (!filteredMembers.length || exportingMembers) return;
    setExportError("");
    setExportingMembers(true);
    try {
      const { Workbook } = await import("exceljs");
      const workbook = new Workbook();
      workbook.creator = "Zoboroma Jeunes";
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.subject = "Base de données des membres de Zoboroma";

      const worksheet = workbook.addWorksheet("Membres", {
        properties: { defaultRowHeight: 20 },
        views: [{ state: "frozen", ySplit: 5 }],
      });
      worksheet.pageSetup = {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        paperSize: 9,
      };

      worksheet.mergeCells("A1:V1");
      worksheet.getCell("A1").value = "Base de données des membres de Zoboroma";
      worksheet.getCell("A1").font = {
        name: "Arial",
        size: 16,
        bold: true,
        color: { argb: "FF3B253B" },
      };
      worksheet.getCell("A1").alignment = { vertical: "middle" };
      worksheet.getRow(1).height = 30;

      worksheet.mergeCells("A2:V2");
      worksheet.getCell("A2").value =
        `${filteredMembers.length} membre${filteredMembers.length > 1 ? "s" : ""} exporté${filteredMembers.length > 1 ? "s" : ""} le ${new Date().toLocaleDateString("fr-FR")}`;
      worksheet.getCell("A2").font = {
        name: "Arial",
        size: 10,
        italic: true,
        color: { argb: "FF756A75" },
      };

      const appliedFilters = [
        memberSearch.trim() ? `Recherche : ${memberSearch.trim()}` : null,
        memberNeighborhood !== "all" ? `Zone : ${memberNeighborhood}` : null,
        memberActivity !== "all" ? `Activité : ${memberActivity}` : null,
        memberProject === "with"
          ? "Projet : renseigné"
          : memberProject === "without"
            ? "Projet : non renseigné"
            : null,
      ].filter(Boolean);
      worksheet.mergeCells("A3:V3");
      worksheet.getCell("A3").value = appliedFilters.length
        ? `Filtres appliqués : ${appliedFilters.join(" · ")}`
        : "Filtres appliqués : aucun";
      worksheet.getCell("A3").font = {
        name: "Arial",
        size: 10,
        color: { argb: "FF756A75" },
      };

      worksheet.addTable({
        name: "MembresZoboroma",
        ref: "A5",
        headerRow: true,
        totalsRow: false,
        style: {
          theme: "TableStyleMedium4",
          showRowStripes: true,
          showFirstColumn: false,
          showLastColumn: false,
        },
        columns: [
          { name: "Identifiant", filterButton: true },
          { name: "Nom complet", filterButton: true },
          { name: "Email", filterButton: true },
          { name: "Téléphone / WhatsApp", filterButton: true },
          { name: "Zone / Quartier", filterButton: true },
          { name: "Situation / Activités", filterButton: true },
          { name: "Présentation", filterButton: true },
          { name: "Projet / Envie", filterButton: true },
          { name: "Photo (URL)", filterButton: true },
          { name: "Visibilité du profil", filterButton: true },
          { name: "Statut", filterButton: true },
          { name: "Sexe", filterButton: true },
          { name: "Situation matrimoniale", filterButton: true },
          { name: "Niveau d’études", filterButton: true },
          { name: "Prénoms du père", filterButton: true },
          { name: "Prénom et nom de la mère", filterButton: true },
          { name: "Contact d’urgence", filterButton: true },
          { name: "Téléphone d’urgence", filterButton: true },
          { name: "Observations / recommandations", filterButton: true },
          { name: "Sexe publié", filterButton: true },
          { name: "Situation familiale publiée", filterButton: true },
          { name: "Niveau d’études publié", filterButton: true },
        ],
        rows: filteredMembers.map((member) => [
          member.id,
          member.name,
          member.email ?? "",
          member.phone ?? member.contact ?? "",
          member.neighborhood,
          member.activities.join(", "),
          member.bio,
          member.project ?? "",
          member.avatarUrl ?? "",
          member.privacy === "community" ? "Communauté" : "Privé",
          "Approuvé",
          member.gender ?? "",
          member.maritalStatus ?? "",
          member.educationLevel ?? "",
          member.fatherFirstNames ?? "",
          member.motherFullName ?? "",
          member.emergencyContactName ?? "",
          member.emergencyContactPhone ?? "",
          member.observations ?? "",
          member.showGender ? "Oui" : "Non",
          member.showMaritalStatus ? "Oui" : "Non",
          member.showEducationLevel ? "Oui" : "Non",
        ]),
      });

      const columnWidths = [
        24, 28, 32, 24, 22, 32, 48, 44, 42, 20, 14, 14, 24, 24, 26, 30, 28, 24,
        48, 16, 22, 20,
      ];
      columnWidths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
      });
      worksheet.getRow(5).height = 28;
      worksheet.getRow(5).font = {
        name: "Arial",
        size: 10,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      worksheet.getRow(5).alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      filteredMembers.forEach((member, index) => {
        const rowNumber = index + 6;
        const row = worksheet.getRow(rowNumber);
        row.font = { name: "Arial", size: 10 };
        row.alignment = { vertical: "top", wrapText: true };
        const estimatedLines = Math.max(
          1,
          Math.ceil(member.bio.length / 48),
          Math.ceil((member.project?.length ?? 0) / 44),
          Math.ceil((member.avatarUrl?.length ?? 0) / 42),
        );
        row.height = Math.min(90, Math.max(24, estimatedLines * 15));
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `base-donnees-membres-zoboroma-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (error) {
      console.error(error);
      setExportError(
        "Le fichier Excel n’a pas pu être créé. Actualisez la page puis réessayez.",
      );
    } finally {
      setExportingMembers(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="mx-auto grid min-h-[68vh] max-w-5xl items-center gap-10 lg:grid-cols-[1fr_.85fr]">
        <section className="vj-enter">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-foreground text-accent shadow-[5px_5px_0_hsl(var(--primary))]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
            Accès réservé
          </p>
          <h1 className="vj-display mt-3 text-6xl leading-[.88] sm:text-7xl">
            La maison
            <br />
            <em className="text-primary">de l’équipe.</em>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
            Cet espace permet de relire les nouvelles inscriptions, de valider
            les profils et de gérer les membres déjà publiés.
          </p>
        </section>

        <form
          onSubmit={openSession}
          className="vj-enter vj-enter-delay-1 rounded-[28px] border border-border bg-card p-7 shadow-md sm:p-9"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-[-.04em]">
                Connexion administrateur
              </h2>
              <p className="text-xs text-muted-foreground">
                La session reste ouverte pendant huit heures.
              </p>
            </div>
          </div>
          <label className="mt-7 block space-y-2 text-xs font-bold">
            Mot de passe
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field"
              placeholder="Votre mot de passe administrateur"
              data-testid="input-admin-password"
            />
          </label>
          {loginError && (
            <p className="mt-3 text-xs font-semibold text-destructive">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={login.isPending}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-xs font-extrabold text-background hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
            data-testid="button-admin-login"
          >
            <ShieldCheck className="h-4 w-4" />
            {login.isPending ? "Vérification…" : "Ouvrir l’administration"}
          </button>
          <p className="mt-4 text-center text-[10px] font-semibold leading-4 text-muted-foreground">
            Les informations des candidats ne sont jamais affichées dans
            l’annuaire public avant validation.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="vj-enter flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
            Administration Zoboroma
          </p>
          <h1 className="vj-display mt-2 text-5xl leading-[.9] sm:text-6xl">
            Contenus, inscriptions et membres.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            Publiez les informations, organisez les votes, validez les nouvelles
            inscriptions et gérez les profils.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold shadow-sm">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/60 text-primary">
              {requests.length}
            </span>
            en attente
          </div>
          <button
            type="button"
            onClick={logout}
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mr-2 inline h-4 w-4 text-primary" />
        Chaque membre choisit si son email et son téléphone sont visibles. À
        chaque approbation, un code de première connexion est créé
        automatiquement pour que vous puissiez le transmettre.
      </div>

      <AdminCommunity />

      <section className="vj-enter overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/50 text-primary">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-[-.03em]">
                Mots de passe oubliés
              </h2>
              <p className="text-xs text-muted-foreground">
                {passwordResetRequests.length} demande
                {passwordResetRequests.length > 1 ? "s" : ""} en attente
              </p>
            </div>
          </div>
          <p className="max-w-sm text-xs leading-5 text-muted-foreground">
            Créez un nouveau code, puis utilisez le message préparé pour
            l’envoyer par email ou WhatsApp.
          </p>
        </div>
        {passwordResetRequestsQuery.isLoading ? (
          <div className="h-24 animate-pulse bg-muted" />
        ) : passwordResetRequests.length ? (
          <div className="divide-y divide-border">
            {passwordResetRequests.map((resetRequest) => (
              <article
                key={resetRequest.id}
                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-6"
              >
                <div>
                  <p className="text-sm font-extrabold">
                    {resetRequest.memberName}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {resetRequest.email || resetRequest.phone} · demandée le{" "}
                    {new Date(resetRequest.requestedAt).toLocaleDateString(
                      "fr-FR",
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={resettingRequestId === resetRequest.id}
                  onClick={() => preparePasswordReset(resetRequest.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" />
                  {resettingRequestId === resetRequest.id
                    ? "Création…"
                    : "Créer le nouveau code"}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="px-6 py-8 text-center text-xs text-muted-foreground">
            Aucune demande de réinitialisation.
          </p>
        )}
      </section>

      {requestsQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              className="h-48 animate-pulse rounded-2xl bg-muted"
              key={item}
            />
          ))}
        </div>
      ) : requestsQuery.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
          <p className="font-bold text-destructive">
            La session a peut-être expiré.
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-4 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-background"
          >
            Se reconnecter
          </button>
        </div>
      ) : requests.length ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="vj-enter rounded-[24px] border border-border bg-card p-5 shadow-sm sm:p-6"
              data-testid={`row-request-${request.id}`}
            >
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="flex min-w-0 items-start gap-4">
                  {request.avatarUrl ? (
                    <img
                      src={request.avatarUrl}
                      alt={`Photo proposée par ${request.name}`}
                      className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-2 ring-background"
                      data-testid={`img-request-avatar-${request.id}`}
                    />
                  ) : (
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted text-sm font-extrabold text-secondary">
                      {request.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold tracking-[-.03em]">
                      {request.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {request.email}
                      </span>
                      {request.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {request.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {request.neighborhood}
                      </span>
                      <span className="flex items-center gap-1">
                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                        {request.profession}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {new Date(request.submittedAt).toLocaleDateString(
                          "fr-FR",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => review(request.id, "rejected")}
                    disabled={reviewingId === request.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Refuser
                  </button>
                  <button
                    type="button"
                    onClick={() => review(request.id, "approved")}
                    disabled={reviewingId === request.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-xs font-bold text-secondary-foreground hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Accepter
                  </button>
                </div>
              </div>
              <div className="mt-5 grid gap-3 border-t border-border pt-5 md:grid-cols-2">
                <div className="rounded-xl bg-background p-4">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-primary">
                    Présentation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/80">
                    {request.bio}
                  </p>
                </div>
                <div className="rounded-xl bg-background p-4">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-secondary">
                    Projet ou envie
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/80">
                    {request.project || "Aucun projet indiqué pour le moment."}
                  </p>
                </div>
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-primary">
                      Informations administratives
                    </p>
                  </div>
                  <dl className="mt-4 grid gap-x-6 gap-y-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="font-bold text-muted-foreground">Sexe</dt>
                      <dd className="mt-1">
                        {request.gender || "Non renseigné"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-muted-foreground">
                        Situation matrimoniale
                      </dt>
                      <dd className="mt-1">
                        {request.maritalStatus || "Non renseignée"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-muted-foreground">
                        Niveau d’études
                      </dt>
                      <dd className="mt-1">
                        {request.educationLevel || "Non renseigné"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-muted-foreground">
                        Prénoms du père
                      </dt>
                      <dd className="mt-1">
                        {request.fatherFirstNames || "Non renseigné"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-muted-foreground">Mère</dt>
                      <dd className="mt-1">
                        {request.motherFullName || "Non renseignée"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-muted-foreground">
                        Contact d’urgence
                      </dt>
                      <dd className="mt-1">
                        {request.emergencyContactName || "Non renseigné"}
                        {request.emergencyContactPhone
                          ? ` · ${request.emergencyContactPhone}`
                          : ""}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 border-t border-primary/10 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                      Observations et recommandations
                    </p>
                    <p className="mt-2 text-xs leading-6 text-foreground/80">
                      {request.observations || "Aucune observation transmise."}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div
          className="rounded-[28px] border border-dashed border-border bg-card px-6 py-20 text-center"
          data-testid="empty-moderation"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/50 text-primary">
            <UserRound className="h-6 w-6" />
          </div>
          <h2 className="vj-display mt-5 text-4xl">Tout est à jour.</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Aucune demande n’attend votre validation.
          </p>
        </div>
      )}

      <section className="vj-enter overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/10 text-secondary">
              <UsersRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-[-.03em]">
                Membres publiés
              </h2>
              <p className="text-xs text-muted-foreground">
                {filteredMembers.length} sur {members.length} profil
                {members.length === 1 ? "" : "s"} affiché
                {filteredMembers.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={exportMembersToExcel}
            disabled={!filteredMembers.length || exportingMembers}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-xs font-extrabold text-secondary-foreground transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="button-export-members"
          >
            {exportingMembers ? (
              <FileSpreadsheet className="h-4 w-4 animate-pulse" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exportingMembers
              ? "Création du fichier…"
              : `Télécharger Excel (${filteredMembers.length})`}
          </button>
        </div>

        {deleteError && (
          <p className="border-b border-destructive/20 bg-destructive/5 px-5 py-3 text-xs font-semibold text-destructive sm:px-6">
            {deleteError}
          </p>
        )}

        {codeError && (
          <p className="border-b border-destructive/20 bg-destructive/5 px-5 py-3 text-xs font-semibold text-destructive sm:px-6">
            {codeError}
          </p>
        )}

        {exportError && (
          <p className="border-b border-destructive/20 bg-destructive/5 px-5 py-3 text-xs font-semibold text-destructive sm:px-6">
            {exportError}
          </p>
        )}

        {visibilityError && (
          <p className="border-b border-destructive/20 bg-destructive/5 px-5 py-3 text-xs font-semibold text-destructive sm:px-6">
            {visibilityError}
          </p>
        )}

        <div className="border-b border-border bg-muted/25 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground lg:col-span-2">
              Rechercher un membre
              <span className="relative mt-2 block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Nom, email, téléphone, activité…"
                  className="field mt-0 pl-10"
                  data-testid="input-member-search"
                />
              </span>
            </label>
            <label className="text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground">
              Zone / Quartier
              <select
                value={memberNeighborhood}
                onChange={(event) => setMemberNeighborhood(event.target.value)}
                className="field mt-2"
                data-testid="select-member-neighborhood"
              >
                <option value="all">Toutes les zones</option>
                {neighborhoodOptions.map((neighborhood) => (
                  <option key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground">
              Situation / Activité
              <select
                value={memberActivity}
                onChange={(event) => setMemberActivity(event.target.value)}
                className="field mt-2"
                data-testid="select-member-activity"
              >
                <option value="all">Toutes les activités</option>
                {activityOptions.map((activity) => (
                  <option key={activity} value={activity}>
                    {activity}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <label className="w-full text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground sm:max-w-xs">
              Projet renseigné
              <select
                value={memberProject}
                onChange={(event) =>
                  setMemberProject(
                    event.target.value as "all" | "with" | "without",
                  )
                }
                className="field mt-2"
                data-testid="select-member-project"
              >
                <option value="all">Tous les membres</option>
                <option value="with">Avec un projet</option>
                <option value="without">Sans projet</option>
              </select>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Le fichier Excel contiendra les {filteredMembers.length}{" "}
                résultat
                {filteredMembers.length === 1 ? "" : "s"} affiché
                {filteredMembers.length === 1 ? "" : "s"}.
              </p>
              {filtersAreActive && (
                <button
                  type="button"
                  onClick={resetMemberFilters}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Effacer les filtres
                </button>
              )}
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-secondary/15 bg-secondary/5 px-4 py-3 text-[10px] font-semibold leading-5 text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
            Cet export administratif contient toutes les informations, y compris
            celles qui sont masquées dans l’annuaire.
          </p>
        </div>

        {generatedCode && invitation && (
          <div className="border-b border-secondary/20 bg-secondary/8 px-5 py-5 sm:px-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-extrabold text-secondary">
                  Invitation de {generatedCode.memberName}
                </p>
                <p className="mt-2 font-mono text-xl font-bold tracking-[.12em]">
                  {generatedCode.code}
                </p>
                <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                  Le code et le lien sont déjà insérés dans le message
                  ci-dessous.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGeneratedCode(null)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
                aria-label="Fermer l’invitation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block space-y-2 text-[10px] font-bold">
                Adresse email du membre
                <input
                  type="email"
                  value={generatedCode.email}
                  onChange={(event) =>
                    setGeneratedCode((current) =>
                      current
                        ? { ...current, email: event.target.value }
                        : current,
                    )
                  }
                  className="field"
                  placeholder="membre@exemple.com"
                />
              </label>
              <label className="block space-y-2 text-[10px] font-bold">
                Numéro WhatsApp
                <input
                  type="tel"
                  value={generatedCode.phone}
                  onChange={(event) =>
                    setGeneratedCode((current) =>
                      current
                        ? { ...current, phone: event.target.value }
                        : current,
                    )
                  }
                  className="field"
                  placeholder="+224…"
                />
              </label>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                Objet : {invitation.subject}
              </p>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-6 text-foreground/75">
                {invitation.message}
              </pre>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {invitation.emailHref ? (
                <a
                  href={invitation.emailHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
                >
                  <Mail className="h-4 w-4" /> Envoyer par email
                </a>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-xs font-bold text-muted-foreground">
                  <Mail className="h-4 w-4" /> Email manquant
                </span>
              )}
              {invitation.whatsappHref ? (
                <a
                  href={invitation.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-xs font-bold text-secondary-foreground"
                >
                  <MessageCircle className="h-4 w-4" /> Envoyer sur WhatsApp
                </a>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-xs font-bold text-muted-foreground">
                  <MessageCircle className="h-4 w-4" /> WhatsApp manquant
                </span>
              )}
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(invitation.message)
                }
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold text-muted-foreground"
              >
                <Copy className="h-4 w-4" /> Copier le message
              </button>
            </div>
          </div>
        )}

        {membersQuery.isLoading ? (
          <div className="space-y-3 p-5 sm:p-6">
            {[1, 2, 3].map((item) => (
              <div
                className="h-16 animate-pulse rounded-2xl bg-muted"
                key={item}
              />
            ))}
          </div>
        ) : membersQuery.isError ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Impossible de charger les membres. Reconnectez-vous puis réessayez.
          </div>
        ) : filteredMembers.length ? (
          <div className="divide-y divide-border">
            {filteredMembers.map((member) => (
              <article
                key={member.id}
                className="grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-start sm:px-6"
                data-testid={`row-member-admin-${member.id}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={`Photo de ${member.name}`}
                      className="h-11 w-11 shrink-0 rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-xs font-extrabold text-secondary">
                      {member.initials}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold">
                      {member.name}
                    </h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {member.neighborhood}
                      </span>
                      {member.activities.length > 0 && (
                        <span>• {member.activities.join(", ")}</span>
                      )}
                    </p>
                    {(member.email || member.phone || member.contact) && (
                      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-muted-foreground">
                        {member.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {member.email}
                          </span>
                        )}
                        {(member.phone || member.contact) && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone ?? member.contact}
                          </span>
                        )}
                      </p>
                    )}
                    {(member.gender ||
                      member.maritalStatus ||
                      member.educationLevel) && (
                      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-muted-foreground">
                        {member.gender && <span>{member.gender}</span>}
                        {member.maritalStatus && (
                          <span>• {member.maritalStatus}</span>
                        )}
                        {member.educationLevel && (
                          <span>• {member.educationLevel}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          setManualEmail("");
                          setManualPhone("");
                        }}
                        disabled={generatingCodeId === member.id}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-secondary/30 px-4 py-2.5 text-xs font-bold text-secondary hover:bg-secondary hover:text-secondary-foreground disabled:opacity-50"
                        data-testid={`button-member-code-${member.id}`}
                      >
                        <KeyRound className="h-4 w-4" />
                        {generatingCodeId === member.id
                          ? "Création…"
                          : "Code membre"}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Créer un code pour {member.name} ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Un nouveau code personnel sera créé. L’ancien code et
                          l’ancien mot de passe cesseront immédiatement de
                          fonctionner. Le membre devra refaire sa première
                          connexion et choisir un nouveau mot de passe.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-2 text-xs font-bold">
                          Email de connexion
                          <input
                            type="email"
                            value={manualEmail}
                            onChange={(event) =>
                              setManualEmail(event.target.value)
                            }
                            className="field"
                            placeholder="membre@exemple.com"
                          />
                        </label>
                        <label className="space-y-2 text-xs font-bold">
                          Téléphone / WhatsApp
                          <input
                            type="tel"
                            value={manualPhone}
                            onChange={(event) =>
                              setManualPhone(event.target.value)
                            }
                            className="field"
                            placeholder="+224…"
                          />
                        </label>
                        <p className="text-[10px] leading-4 text-muted-foreground sm:col-span-2">
                          Indiquez au moins l’email ou le téléphone. Le membre
                          utilisera cet identifiant après avoir créé son mot de
                          passe.
                        </p>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={!manualEmail.trim() && !manualPhone.trim()}
                          onClick={() =>
                            createMemberCode(member.id, member.name)
                          }
                          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        >
                          Créer le code
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        disabled={deletingId === member.id}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-destructive/30 px-4 py-2.5 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                        data-testid={`button-delete-member-${member.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === member.id
                          ? "Suppression…"
                          : "Supprimer"}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Supprimer ce membre ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Le profil de {member.name} disparaîtra immédiatement
                          de l’annuaire. Ses réactions et ses votes seront
                          également supprimés. Cette action est définitive.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeMember(member.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Supprimer définitivement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="rounded-2xl border border-border bg-background p-4 sm:col-span-2">
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div>
                      <p className="text-xs font-extrabold">
                        Informations privées du membre
                      </p>
                      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                        Le contact d’urgence, la filiation et les observations
                        restent toujours réservés à l’administration.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={
                          !member.gender || visibilityUpdatingId === member.id
                        }
                        onClick={() =>
                          changeProfileVisibility(member.id, {
                            showGender: !member.showGender,
                            showMaritalStatus: member.showMaritalStatus,
                            showEducationLevel: member.showEducationLevel,
                          })
                        }
                        className={`rounded-full border px-3 py-2 text-[10px] font-bold disabled:opacity-40 ${
                          member.showGender
                            ? "border-secondary bg-secondary text-secondary-foreground"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        Sexe : {member.showGender ? "visible" : "privé"}
                      </button>
                      <button
                        type="button"
                        disabled={
                          !member.maritalStatus ||
                          visibilityUpdatingId === member.id
                        }
                        onClick={() =>
                          changeProfileVisibility(member.id, {
                            showGender: member.showGender,
                            showMaritalStatus: !member.showMaritalStatus,
                            showEducationLevel: member.showEducationLevel,
                          })
                        }
                        className={`rounded-full border px-3 py-2 text-[10px] font-bold disabled:opacity-40 ${
                          member.showMaritalStatus
                            ? "border-secondary bg-secondary text-secondary-foreground"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        Situation :{" "}
                        {member.showMaritalStatus ? "visible" : "privée"}
                      </button>
                      <button
                        type="button"
                        disabled={
                          !member.educationLevel ||
                          visibilityUpdatingId === member.id
                        }
                        onClick={() =>
                          changeProfileVisibility(member.id, {
                            showGender: member.showGender,
                            showMaritalStatus: member.showMaritalStatus,
                            showEducationLevel: !member.showEducationLevel,
                          })
                        }
                        className={`rounded-full border px-3 py-2 text-[10px] font-bold disabled:opacity-40 ${
                          member.showEducationLevel
                            ? "border-secondary bg-secondary text-secondary-foreground"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        Études :{" "}
                        {member.showEducationLevel ? "visibles" : "privées"}
                      </button>
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-border pt-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="font-bold text-muted-foreground">Père</dt>
                      <dd className="mt-1">
                        {member.fatherFirstNames || "Non renseigné"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-muted-foreground">Mère</dt>
                      <dd className="mt-1">
                        {member.motherFullName || "Non renseignée"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-muted-foreground">
                        Contact d’urgence
                      </dt>
                      <dd className="mt-1">
                        {member.emergencyContactName || "Non renseigné"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-muted-foreground">
                        Téléphone d’urgence
                      </dt>
                      <dd className="mt-1">
                        {member.emergencyContactPhone || "Non renseigné"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                      Observations et recommandations
                    </p>
                    <p className="mt-2 text-xs leading-6 text-foreground/80">
                      {member.observations || "Aucune observation renseignée."}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : members.length ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Aucun membre ne correspond à ces filtres.
            <button
              type="button"
              onClick={resetMemberFilters}
              className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold text-primary"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Afficher tous les membres
            </button>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Aucun membre publié pour le moment.
          </div>
        )}
      </section>
    </div>
  );
}
