import { createRemoteJWKSet, jwtVerify } from "jose";

const DEFAULT_WORKOS_CLIENT_ID = "client_01M4DPNE5HCJZV57ZAKTQH79WR";

export const workosClientId =
  process.env["WORKOS_CLIENT_ID"]?.trim() || DEFAULT_WORKOS_CLIENT_ID;

const workosJwks = createRemoteJWKSet(
  new URL(`https://api.workos.com/sso/jwks/${workosClientId}`),
);

export async function verifyWorkosAccessToken(token: string) {
  const { payload } = await jwtVerify(token, workosJwks, {
    algorithms: ["RS256"],
    audience: workosClientId,
    issuer: ["https://api.workos.com", "https://api.workos.com/"],
  });

  if (typeof payload.sub !== "string" || !payload.sub.startsWith("user_")) {
    throw new Error("Invalid WorkOS user subject");
  }

  return { userId: payload.sub };
}
