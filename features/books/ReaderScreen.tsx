import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { PdfReader } from "@/components/readers/pdf-reader";
import { ErrorState, FullScreenLoading } from "@/components/section-ui";
import { itemKey } from "@/lib/core/types";
import { getBookDetails, type BookDetails } from "./api";

export default function BookReaderScreen() {
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = decodeURIComponent(raw ?? "");
  const [book, setBook] = useState<BookDetails | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      setBook(await getBookDetails(id));
    } catch {
      setError(true);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (error) return <View className="flex-1 bg-[#050505] px-5 pt-14"><ErrorState onRetry={load} /></View>;
  if (!book) return <FullScreenLoading label="نفتح الكتاب..." />;
  if (!book.downloadUrl) return <View className="flex-1 bg-[#050505] px-5 pt-14"><ErrorState onRetry={load} message="لا يوجد ملف PDF متاح لهذا الكتاب." /></View>;
  return <PdfReader resumeKey={itemKey("books", id)} title={book.title} url={book.downloadUrl} fallbackUrl={book.downloadPage} />;
}
