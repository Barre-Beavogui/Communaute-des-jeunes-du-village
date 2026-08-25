import type { RequestHandler } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db/schema";
import { isValidAdminToken } from "./admin-auth";
import { authorizationToken, optionalMemberProfileId } from "./member-auth";

export const requireCommunityAccess: RequestHandler = async (
  req,
  res,
  next,
) => {
  if (isValidAdminToken(authorizationToken(req))) {
    next();
    return;
  }

  const profileId = optionalMemberProfileId(req);
  if (!profileId) {
    res.status(401).json({ error: "Connexion membre requise." });
    return;
  }

  try {
    const [profile] = await db
      .select({ id: profilesTable.id })
      .from(profilesTable)
      .where(
        and(
          eq(profilesTable.id, profileId),
          eq(profilesTable.status, "approved"),
        ),
      );

    if (!profile) {
      res.status(401).json({ error: "Ce compte membre n’est plus actif." });
      return;
    }

    res.locals["memberProfileId"] = profileId;
    next();
  } catch (error) {
    next(error);
  }
};
