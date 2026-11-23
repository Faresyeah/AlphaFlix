import { SectionHome } from "@/components/section-home";
import { mangaService } from "./api";

export default function MangaHome() {
  return <SectionHome service={mangaService} />;
}
