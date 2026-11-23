import { useLocalSearchParams } from "expo-router";

import { SwatDetailsView } from "@/components/swat-details-view";
import { getMangaDetails } from "./api";

export default function MangaDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SwatDetailsView kind="manga" id={decodeURIComponent(id ?? "")} load={getMangaDetails} />;
}
