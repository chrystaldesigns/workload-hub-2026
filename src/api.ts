import { auth } from "./firebaseAuth";

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must sign in before accessing Workload Hub data.");
  }

  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, {
    ...init,
    headers,
  });
}

