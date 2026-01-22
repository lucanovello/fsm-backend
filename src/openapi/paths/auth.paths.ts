import {
  LoginSchema,
  RefreshSchema,
  RegisterSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
} from "../../modules/auth/dto/auth.dto.js";
import {
  RegisterResponseSchema,
  RequestAcceptedSchema,
  SessionsResponseSchema,
  TokenPairSchema,
} from "../components/auth.schemas.js";
import {
  emailTakenResponse,
  ErrorResponseSchema,
  invalidCredentialsResponse,
  refreshRequiredResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "../components/errors.js";
import { Tags } from "../tags.js";

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export function registerAuthPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "post",
    path: "/auth/register",
    summary: "Register a new user",
    description:
      "Creates a user account. Depending on configuration, tokens may be returned immediately or after email verification.",
    tags: [Tags.Auth],
    operationId: "registerUser",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: RegisterSchema,
            example: {
              email: "new.user@example.com",
              password: "Sup3rSecure!1",
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "User created.",
        content: {
          "application/json": {
            schema: RegisterResponseSchema,
          },
        },
      },
      400: validationErrorResponse,
      409: emailTakenResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/login",
    summary: "Login with credentials",
    description:
      "Validates user credentials and returns a fresh access/refresh token pair. Login attempts are rate limited and tracked per IP and email.",
    tags: [Tags.Auth],
    operationId: "loginUser",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: LoginSchema,
            example: {
              email: "new.user@example.com",
              password: "Sup3rSecure!1",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Authentication succeeded.",
        content: {
          "application/json": {
            schema: TokenPairSchema,
          },
        },
      },
      400: validationErrorResponse,
      401: invalidCredentialsResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/refresh",
    summary: "Rotate refresh token",
    description:
      "Exchanges a valid refresh token for a new access/refresh token pair. Reuses invalidate the entire session family.",
    tags: [Tags.Auth],
    operationId: "refreshTokens",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: RefreshSchema,
            example: {
              refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token-placeholder",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "New tokens issued.",
        content: {
          "application/json": {
            schema: TokenPairSchema,
          },
        },
      },
      400: refreshRequiredResponse,
      401: {
        description: "Refresh token invalid, expired, or reused.",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
            examples: {
              sessionInvalid: {
                summary: "Session no longer valid",
                value: { error: { message: "Invalid session", code: "SESSION_INVALID" } },
              },
              refreshReuse: {
                summary: "Refresh token reuse detected",
                value: { error: { message: "Invalid token", code: "REFRESH_REUSE" } },
              },
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/logout",
    summary: "Invalidate refresh token",
    description:
      "Accepts the current refresh token and revokes the backing session. The operation is idempotent.",
    tags: [Tags.Auth],
    operationId: "logoutSession",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: RefreshSchema,
            example: {
              refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token-placeholder",
            },
          },
        },
      },
    },
    responses: {
      204: {
        description: "Session revoked (or token already invalid).",
      },
      400: validationErrorResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/verify-email",
    summary: "Confirm email address",
    description:
      "Marks the user as verified using the token sent via email. Existing sessions remain valid after verification.",
    tags: [Tags.Auth],
    operationId: "verifyEmail",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: VerifyEmailSchema,
            example: {
              token: "verify-token-placeholder",
            },
          },
        },
      },
    },
    responses: {
      204: {
        description: "Email verified.",
      },
      400: {
        description: "Invalid payload or verification token.",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
            examples: {
              validation: {
                summary: "Payload validation failure",
                value: validationErrorResponse.content["application/json"].example,
              },
              invalidToken: {
                summary: "Token not found or already used",
                value: {
                  error: {
                    message: "Invalid verification token",
                    code: "EMAIL_VERIFICATION_INVALID",
                  },
                },
              },
              expiredToken: {
                summary: "Token expired",
                value: {
                  error: {
                    message: "Verification token expired",
                    code: "EMAIL_VERIFICATION_EXPIRED",
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/request-password-reset",
    summary: "Request password reset",
    description:
      "Queues an email with password reset instructions. Always returns 202 to avoid leaking account existence.",
    tags: [Tags.Auth],
    operationId: "requestPasswordReset",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: RequestPasswordResetSchema,
            example: {
              email: "user@example.com",
            },
          },
        },
      },
    },
    responses: {
      202: {
        description: "Reset link queued (or request ignored).",
        content: {
          "application/json": {
            schema: RequestAcceptedSchema,
          },
        },
      },
      400: validationErrorResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/reset-password",
    summary: "Reset password",
    description:
      "Uses a password reset token to set a new password. All sessions are revoked once the password is changed.",
    tags: [Tags.Auth],
    operationId: "resetPassword",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: ResetPasswordSchema,
            example: {
              token: "reset-token-placeholder",
              password: "NewSup3rSecure!1",
            },
          },
        },
      },
    },
    responses: {
      204: {
        description: "Password updated.",
      },
      400: {
        description: "Invalid payload or reset token.",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
            examples: {
              validation: {
                summary: "Payload validation failure",
                value: validationErrorResponse.content["application/json"].example,
              },
              invalidToken: {
                summary: "Reset token invalid or already used",
                value: {
                  error: { message: "Invalid reset token", code: "PASSWORD_RESET_INVALID" },
                },
              },
              expiredToken: {
                summary: "Reset token expired",
                value: {
                  error: { message: "Reset token expired", code: "PASSWORD_RESET_EXPIRED" },
                },
              },
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/auth/sessions",
    summary: "List sessions",
    description:
      "Lists active and historical sessions for the authenticated user. The current session is flagged for easier UX.",
    tags: [Tags.Sessions],
    operationId: "listSessions",
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: "Session listing.",
        content: {
          "application/json": {
            schema: SessionsResponseSchema,
          },
        },
      },
      401: unauthorizedResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/auth/logout-all",
    summary: "Logout all sessions",
    description: "Revokes every session for the authenticated user.",
    tags: [Tags.Sessions],
    operationId: "logoutAllSessions",
    security: [{ BearerAuth: [] }],
    responses: {
      204: { description: "All sessions revoked." },
      401: unauthorizedResponse,
    },
  });
}
