import type { UserRole } from "@/lib/types";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  photoUrl?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

/** Payload auth (contenu de `data` si enveloppe ApiResponse). */
export type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    roles: string[];
    photoUrl?: string;
  };
};

/**
 * Réponse brute du backend `POST /api/v1/auth/login`.
 * Peut être le payload direct ou enveloppée dans `{ success, data, message, timestamp }`.
 */
export type AuthApiResponse = AuthPayload | {
  success: boolean;
  message?: string | null;
  data: AuthPayload;
  timestamp?: string;
};
