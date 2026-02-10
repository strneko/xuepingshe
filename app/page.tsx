import Image from "next/image";
import HeroSection from "./components/hero-section";
import Recommendations from "./components/recommendations";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <Recommendations className="h-[1000px]" />
    </div>
  );
}
