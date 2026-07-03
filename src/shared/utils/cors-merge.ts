import {
  corsCredentialsEnabled,
  env,
  trustedFrontendOrigins,
} from "../../config/env";

/**
 * `auth.handler()` returns a fresh `Response`, so global `cors()` headers applied to `c.res`
 * earlier are not present on the wire. Without `Access-Control-Allow-Origin` + credentials on
 * that response, browsers may reject the response and skip storing `Set-Cookie`.
 */
export function mergeCorsIntoAuthResponse(
  req: Request,
  res: Response,
): Response {
  const origin = req.headers.get("origin");
  const headers = new Headers(res.headers);

  if (
    origin &&
    corsCredentialsEnabled &&
    trustedFrontendOrigins.includes(origin)
  ) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    const vary = headers.get("Vary");
    headers.set("Vary", vary ? `${vary}, Origin` : "Origin");
  } else if (
    origin &&
    env.CORS_ORIGIN.trim() === "*" &&
    !corsCredentialsEnabled
  ) {
    headers.set("Access-Control-Allow-Origin", "*");
  }

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
