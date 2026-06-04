export type UserRole =
  | "FLEET_SUPER_ADMIN"
  | "FLEET_ADMIN"
  | "FLEET_MANAGER"
  | "FLEET_DRIVER";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
};
