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

/** Réponse brute du backend `POST /api/v1/auth/login`. */
export type AuthApiResponse = {
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
