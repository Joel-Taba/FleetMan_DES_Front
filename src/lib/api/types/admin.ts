export type AdminUserDetail = {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  service: string | null;
  roles: string[];
  permissions: string[];
  photoUrl: string | null;
  companyName: string | null;
  licenceNumber: string | null;
  vehicleId: string | null;
  isActive?: boolean;
  active?: boolean;
  lastLoginAt: string | null;
};

export type PublicStatsResponse = {
  activeManagers: number;
  activeAdmins: number;
  totalFleets: number;
  managedVehicles: number;
  totalDrivers: number;
  serviceStatus: string;
};

export type ResourceItem = {
  id: string;
  code: string;
  label: string;
  description?: string | null;
};

export type VehicleTypeItem = ResourceItem;

export type ResourceRequest = {
  code: string;
  label: string;
  description?: string;
};

export type VehicleTypeRequest = ResourceRequest;
