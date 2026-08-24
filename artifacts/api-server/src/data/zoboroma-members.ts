import type { profilesTable } from "@workspace/db/schema";

type ProfileInsert = typeof profilesTable.$inferInsert;

const member = (
  id: string,
  name: string,
  initials: string,
  neighborhood: string,
  profession: string,
): ProfileInsert => ({
  id,
  name,
  initials,
  age: null,
  neighborhood,
  avatarUrl: null,
  bio: `Profession ou statut : ${profession}.`,
  activities: [profession],
  project: null,
  contact: null,
  instagram: null,
  privacy: "private",
  status: "approved",
});

// Consolidated from the 21 unique Jotform submissions in the supplied workbook.
// Contact details are deliberately excluded because this repository is public.
export const zoboromaMembers: ProfileInsert[] = [
  member(
    "grovogui-pokpa-zeze",
    "Pokpa zézé Grovogui",
    "PG",
    "Liberia",
    "Salarié",
  ),
  member(
    "bea-ibrahim-sefouou",
    "Ibrahim Sefouou Béa",
    "IB",
    "Labé",
    "Étudiant",
  ),
  member("koivogui-emile", "Emile Koivogui", "EK", "Kindia", "Étudiant"),
  member(
    "beavogui-joseph-zeze",
    "Joseph zeze Beavogui",
    "JB",
    "Mamou",
    "Salarié",
  ),
  member(
    "koivogui-barre-moise",
    "Barre Moise koivogui",
    "BK",
    "Beyla",
    "En recherche d’emploi",
  ),
  member("beavogui-foromo", "Foromo Béavogui", "FB", "Beyla", "Élève/Lycéen"),
  member(
    "kalivogui-kaba",
    "Kaba Kalivogui",
    "KK",
    "Conakry",
    "En recherche d’emploi",
  ),
  member(
    "koivogui-sema-gouo",
    "Sèma gouo Koïvogui",
    "SK",
    "Kankan",
    "Étudiant",
  ),
  member("kalivogui-nette", "Nette Kalivogui", "NK", "Conakry", "Étudiant"),
  member(
    "koivogui-daniel-koly",
    "Daniel Koly KOIVOGUI",
    "DK",
    "Kindia",
    "Salarié",
  ),
  member("koivogui-eddy", "Eddy Koivogui", "EK", "Macenta", "Autre"),
  member("kalivogui-barre", "Barre Kalivogui", "BK", "Dubreka", "Autre"),
  member("koivogui-peve", "Pévé KOÏVOGUI", "PK", "Conakry", "Autre"),
  member("kalivogui-jacques", "Jacques Kalivogui", "JK", "Mamou", "Salarié"),
  member(
    "koivogui-justin-kekoura",
    "Justin kékoura Koïvogui",
    "JK",
    "Conakry",
    "Autre",
  ),
  member(
    "koivogui-simon-pierre",
    "Simon pierre Koivogui",
    "SK",
    "Conakry",
    "Salarié",
  ),
  member("koivogui-bernard", "Bernard Koïvogui", "BK", "Kindia", "Étudiant"),
  member("koivogui-barres", "Barrès Koïvogui", "BK", "Kindia", "Étudiant"),
  member("guilavogui-barre", "Barrè Guilavogui", "BG", "Mamou", "Agriculteur"),
  member("beavogui-gbade", "GBADE BEAVOGUI", "GB", "Conakry", "Salarié"),
  member("beavogui-barre-france", "Barre BEAVOGUI", "BB", "France", "Étudiant"),
];

export const previousDemoProfileIds = ["mina", "sami", "ines"];
