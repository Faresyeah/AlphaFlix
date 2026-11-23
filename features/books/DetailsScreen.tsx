import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Linking, Text, View } from "react-native";

import { ContentCard } from "@/components/content-card";
import { DetailsShell, PrimaryButton } from "@/components/details-shell";
import { ErrorState, FullScreenLoading } from "@/components/section-ui";
import { detailsRoute } from "@/lib/core/routes";
import { itemKey } from "@/lib/core/types";
import { useLibrary } from "@/lib/library-context";
import { getBookDetails, type BookDetails } from "./api";

export default function BookDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const { resume, addDownload } = useLibrary();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setBook(await getBookDetails(id));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (loading && !book) return <FullScreenLoading label="نحضر الكتاب..." />;
  if (error || !book) return <View className="flex-1 bg-[#050505] px-5 pt-14"><ErrorState onRetry={load} /></View>;

  const lastPage = parseInt(resume[itemKey("books", id)] ?? "", 10);
  const canRead = Boolean(book.downloadUrl);

  const download = async () => {
    const url = book.downloadUrl ?? book.downloadPage;
    if (!url) return;
    await addDownload({ id: `books:${id}`, title: book.title, episode: book.fileType || "PDF", quality: book.size || "—", url, createdAt: Date.now() });
    setSaved(true);
    void Linking.openURL(url);
  };

  return (
    <DetailsShell
      item={book}
      laterLabel="قراءة لاحقاً"
      chips={[book.fileType, book.size, book.language, book.readingTime ? `⏱ ${book.readingTime}` : ""]}
      actions={
        <View style={{ gap: 8 }}>
          <PrimaryButton
            disabled={!canRead}
            label={lastPage > 1 ? `📖 تابع القراءة (صفحة ${lastPage})` : "📖 اقرأ داخل التطبيق"}
            onPress={() => router.push(`/books/read/${encodeURIComponent(id)}` as never)}
          />
          <PrimaryButton tone="ghost" disabled={!book.downloadUrl && !book.downloadPage} label={saved ? "✓ حُفظ في التنزيلات" : "↓ تنزيل الكتاب"} onPress={download} />
        </View>
      }
    >
      {book.related.length ? (
        <View>
          <Text className="mb-3 text-lg font-black text-[#FFFFFF]">كتب مشابهة</Text>
          <FlatList
            data={book.related}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={{ marginRight: 12 }}>
                <ContentCard item={item} width={124} onPress={() => router.push(detailsRoute("books", item.id) as never)} />
              </View>
            )}
          />
        </View>
      ) : null}
    </DetailsShell>
  );
}
