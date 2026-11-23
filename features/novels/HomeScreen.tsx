import { SectionHome } from "@/components/section-home";
import { novelsService } from "./api";

export default function NovelsHome() {
  return <SectionHome service={novelsService} />;
}
