import { AccountSettings } from "@/components/dashboard/views/AccountSettings";
import { DriverOfflineSection } from "@/components/offline/DriverOfflineSection";

export default function Page() {
  return (
    <>
      <DriverOfflineSection />
      <AccountSettings />
    </>
  );
}
