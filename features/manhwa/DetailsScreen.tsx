import { useLocalSearchParams } from "expo-router";

import { SwatDetailsView } from "@/components/swat-details-view";
import { getManhwaDetails } from "./api";

export default function ManhwaDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SwatDetailsView kind="manhwa" id={decodeURIComponent(id ?? "")} load={getManhwaDetails} />;
}
