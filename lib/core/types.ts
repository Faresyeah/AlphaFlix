/** أنواع مشتركة وخفيفة (بدون حالة) تستخدمها كل الأقسام. */
export type SectionKind = "anime" | "manga" | "manhwa" | "books" | "novels" | "cinema";

export const SECTION_KINDS: SectionKind[] = ["anime", "manhwa", "manga", "novels", "books"];

export type MediaItem = {
  /** المعرّف الخام داخل القسم (قد يكون اسماً أو رقماً أو رابطاً). */
  id: string;
  kind: SectionKind;
  title: string;
  poster: string | null;
  /** نوع العمل كما يعرضه المصدر (مانهوا كوري، مسلسل، روايات عربية ...). */
  type: string;
  tags: string[];
  rating: number;
  status: string;
  year: string;
  /** عدد الحلقات/الفصول/الصفحات كنص جاهز للعرض. */
  count: string;
  story?: string;
  author?: string;
  dubbed?: boolean;
};

export type Shelf = { key: string; title: string; items: MediaItem[] };

/** مفتاح تخزين فريد لكل قسم حتى لا تتداخل المعرّفات بين الأقسام. */
export function itemKey(kind: SectionKind, id: string): string {
  return `${kind}:${id}`;
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

export function asNumber(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(asString(value));
  return Number.isFinite(n) ? n : 0;
}

/** واجهة موحّدة يقدّمها كل قسم لشاشة الصفحة الرئيسية العامة. */
export interface SectionService {
  kind: SectionKind;
  searchPlaceholder: string;
  getCachedHome(): Promise<Shelf[] | null>;
  getHome(): Promise<Shelf[]>;
  search(query: string): Promise<MediaItem[]>;
}
