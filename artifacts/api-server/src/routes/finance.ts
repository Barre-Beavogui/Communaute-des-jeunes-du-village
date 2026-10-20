import { Router, type IRouter, type Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db/schema";
import {
  GetAdminFinanceDashboardQueryParams,
  GetAdminFinanceDashboardResponse,
  GetFinanceDashboardQueryParams,
  GetFinanceDashboardResponse,
  UpdateAdminFinanceContributionBody,
  UpdateAdminFinanceContributionParams,
  UpdateAdminFinanceContributionResponse,
  UpdateAdminFinanceMonthBody,
  UpdateAdminFinanceMonthParams,
  UpdateAdminFinanceMonthResponse,
  UpdateFinanceContributionBody,
  UpdateFinanceContributionParams,
  UpdateFinanceContributionResponse,
  UpdateFinanceMonthBody,
  UpdateFinanceMonthParams,
  UpdateFinanceMonthResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/admin-auth.js";
import {
  loadFinanceDashboard,
  upsertFinanceContribution,
  upsertFinanceMonth,
} from "../lib/finance-data.js";
import { requireMember } from "../lib/member-auth.js";
import { FINANCE_PERMISSION, memberHasPermission } from "../lib/role-data.js";

const router: IRouter = Router();

async function ensureFinanceManager(profileId: string, res: Response) {
  if (await memberHasPermission(profileId, FINANCE_PERMISSION)) return true;
  res.status(403).json({ error: "Accès réservé au responsable financier." });
  return false;
}

async function approvedMember(profileId: string) {
  const [profile] = await db
    .select({ id: profilesTable.id })
    .from(profilesTable)
    .where(
      and(
        eq(profilesTable.id, profileId),
        eq(profilesTable.status, "approved"),
      ),
    );
  return Boolean(profile);
}

router.get("/finance/dashboard", requireMember, async (req, res) => {
  const query = GetFinanceDashboardQueryParams.parse(req.query);
  const profileId = res.locals["memberProfileId"] as string;
  res.json(
    GetFinanceDashboardResponse.parse(
      await loadFinanceDashboard(query.month, { viewerProfileId: profileId }),
    ),
  );
});

router.patch("/finance/months/:monthKey", requireMember, async (req, res) => {
  const params = UpdateFinanceMonthParams.parse(req.params);
  const body = UpdateFinanceMonthBody.parse(req.body);
  const profileId = res.locals["memberProfileId"] as string;
  if (!(await ensureFinanceManager(profileId, res))) return;
  await upsertFinanceMonth(params.monthKey, body, profileId);
  res.json(
    UpdateFinanceMonthResponse.parse(
      await loadFinanceDashboard(params.monthKey, {
        viewerProfileId: profileId,
      }),
    ),
  );
});

router.put(
  "/finance/months/:monthKey/contributions/:profileId",
  requireMember,
  async (req, res) => {
    const params = UpdateFinanceContributionParams.parse(req.params);
    const body = UpdateFinanceContributionBody.parse(req.body);
    const profileId = res.locals["memberProfileId"] as string;
    if (!(await ensureFinanceManager(profileId, res))) return;
    if (!(await approvedMember(params.profileId))) {
      res.status(404).json({ error: "Membre introuvable." });
      return;
    }
    await upsertFinanceContribution(
      params.monthKey,
      params.profileId,
      body,
      profileId,
    );
    res.json(
      UpdateFinanceContributionResponse.parse(
        await loadFinanceDashboard(params.monthKey, {
          viewerProfileId: profileId,
        }),
      ),
    );
  },
);

router.get("/moderation/finance/dashboard", requireAdmin, async (req, res) => {
  const query = GetAdminFinanceDashboardQueryParams.parse(req.query);
  res.json(
    GetAdminFinanceDashboardResponse.parse(
      await loadFinanceDashboard(query.month, { admin: true }),
    ),
  );
});

router.patch(
  "/moderation/finance/months/:monthKey",
  requireAdmin,
  async (req, res) => {
    const params = UpdateAdminFinanceMonthParams.parse(req.params);
    const body = UpdateAdminFinanceMonthBody.parse(req.body);
    await upsertFinanceMonth(params.monthKey, body, "admin");
    res.json(
      UpdateAdminFinanceMonthResponse.parse(
        await loadFinanceDashboard(params.monthKey, { admin: true }),
      ),
    );
  },
);

router.put(
  "/moderation/finance/months/:monthKey/contributions/:profileId",
  requireAdmin,
  async (req, res) => {
    const params = UpdateAdminFinanceContributionParams.parse(req.params);
    const body = UpdateAdminFinanceContributionBody.parse(req.body);
    if (!(await approvedMember(params.profileId))) {
      res.status(404).json({ error: "Membre introuvable." });
      return;
    }
    await upsertFinanceContribution(
      params.monthKey,
      params.profileId,
      body,
      "admin",
    );
    res.json(
      UpdateAdminFinanceContributionResponse.parse(
        await loadFinanceDashboard(params.monthKey, { admin: true }),
      ),
    );
  },
);

export default router;
