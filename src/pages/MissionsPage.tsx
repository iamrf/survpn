import { Target } from "lucide-react";
import PlaceholderPage from "@/components/PlaceholderPage";
import BottomNav from "@/components/BottomNav";

const MissionsPage = () => {
  return (
    <div className="min-h-screen flex flex-col pb-24">
      <PlaceholderPage title="ماموریت‌ها" icon={Target} />
      <BottomNav />
    </div>
  );
};

export default MissionsPage;
