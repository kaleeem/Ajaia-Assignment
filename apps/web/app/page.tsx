import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CURRENT_USER_STORAGE_KEY, MOCK_USERS } from "@/lib/users";

/**
 * Root page — redirects to /dashboard if a valid user is selected,
 * otherwise to /welcome (demo account selection).
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const storedId = cookieStore.get(CURRENT_USER_STORAGE_KEY)?.value;
  const isValid = storedId && MOCK_USERS.some((u) => u.id === storedId);
  redirect(isValid ? "/dashboard" : "/welcome");
}
