import LandingPage from "@/app/(public)/landing";
import { Redirect } from "expo-router";
export default function Index() {
  return <Redirect href="/landing" />;
}
