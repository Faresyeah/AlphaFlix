import { SectionHome } from "@/components/section-home";
import { manhwaService } from "./api";

export default function ManhwaHome() {
  return <SectionHome service={manhwaService} />;
}
