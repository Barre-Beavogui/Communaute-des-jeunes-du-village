import type { Request, RequestHandler } from "express";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db/schema";
import { isValidAdminToken } from "./admin-auth.js";
import { authorizationToken, optionalMemberSession } from "./member-auth.js";

// A member token stays valid only while the profile is approved and its
// password has not been reset since the token was issued. Removing a member,
// or giving them a new member code from the admin page, therefore signs out
// every device they were connected on.
async function activeMemberProfileId(req: Request) {
  const session = optionalMemberSession(req);
  if (!session) return null;

  const [profile] = await db
    .select({
      id: profilesTable.id,
      passwordSetAt: profilesTable.memberPasswordSetAt,
    })
    .from(profilesTable)
    .where(
      and(
        eq(profilesTable.id, session.profileId),
        eq(profilesTable.status, "approved"),
        isNotNull(profilesTable.memberPasswordHash),
      ),
    );

  if (!profile) return null;
  if (
    profile.passwordSetAt &&
    profile.passwordSetAt.getTime() > session.issuedAt
  ) {
    return null;
  }
  return profile.id;
}

export const requireMember: RequestHandler = async (req, res, next) => {
  try {
    const profileId = await activeMemberProfileId(req);
    if (!profileId) {
      res.status(401).json({ error: "Connexion membre requise." });
      return;
    }

    res.locals["memberProfileId"] = profileId;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireCommunityAccess: RequestHandler = async (
  req,
  res,
  next,
) => {
  if (isValidAdminToken(authorizationToken(req))) {
    next();
    return;
  }

  try {
    const profileId = await activeMemberProfileId(req);
    if (!profileId) {
      res.status(401).json({ error: "Connexion membre requise." });
      return;
    }

    res.locals["memberProfileId"] = profileId;
    next();
  } catch (error) {
    next(error);
  }
};
