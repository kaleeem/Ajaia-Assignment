import { redirect } from "next/navigation";

/**
 * Root page — redirects immediately to the document dashboard.
 */
export default function RootPage() {
  redirect("/dashboard");
}
