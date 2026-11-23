import { useLocalSearchParams } from "expo-router";

import { VerticalChapterReader } from "@/components/readers/vertical-chapter-reader";
import { getMangaChapter, getMangaDetails } from "./api";

export default function MangaReader() {
  const { id, series } = useLocalSearchParams<{ id: string; series?: string }>();
  return (
    <VerticalChapterReader
      kind="manga"
      seriesId={decodeURIComponent(series ?? "")}
      chapterId={decodeURIComponent(id ?? "")}
      loadChapter={getMangaChapter}
      loadDetails={getMangaDetails}
    />
  );
}
