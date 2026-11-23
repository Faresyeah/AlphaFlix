import { SectionHome } from "@/components/section-home";
import { animeService } from "./api";

export default function AnimeHome() {
  return <SectionHome service={animeService} />;
}
