import { SectionHome } from "@/components/section-home";
import { booksService } from "./api";

export default function BooksHome() {
  return <SectionHome service={booksService} />;
}
