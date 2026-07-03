import type { ContentfulStatusCode } from "hono/utils/http-status";

type ErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
  };
  requestId: string;
};

export function buildErrorResponse(
  requestId: string,
  code: string,
  message: string,
  status: ContentfulStatusCode,
): { body: ErrorBody; status: ContentfulStatusCode } {
  return {
    body: {
      success: false,
      error: { code, message },
      requestId,
    },
    status,
  };
}

export function notFoundError(requestId: string) {
  return buildErrorResponse(requestId, "NOT_FOUND", "Route not found", 404);
}

export function unauthorizedError(requestId: string) {
  return buildErrorResponse(
    requestId,
    "UNAUTHORIZED",
    "Authentication required",
    401,
  );
}

export function internalError(requestId: string, message: string) {
  return buildErrorResponse(
    requestId,
    "INTERNAL_SERVER_ERROR",
    message,
    500,
  );
}

export function httpExceptionError(requestId: string, message: string) {
  return buildErrorResponse(requestId, "HTTP_EXCEPTION", message, 500);
}
