import { useLocalSearchParams } from "expo-router";

import { VerticalChapterReader } from "@/components/readers/vertical-chapter-reader";
import { getManhwaChapter, getManhwaDetails } from "./api";

export default function ManhwaReader() {
  const { id, series } = useLocalSearchParams<{ id: string; series?: string }>();
  return (
    <VerticalChapterReader
      kind="manhwa"
      seriesId={decodeURIComponent(series ?? "")}
      chapterId={decodeURIComponent(id ?? "")}
      loadChapter={getManhwaChapter}
      loadDetails={getManhwaDetails}
    />
  );
}
