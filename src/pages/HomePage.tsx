import ProfileCard from "@/components/ProfileCard";
import WelcomeSection from "@/components/WelcomeSection";
import BottomNav from "@/components/BottomNav";

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col pb-24">
      <ProfileCard />
      <WelcomeSection />
      <BottomNav />
    </div>
  );
};

export default HomePage;
