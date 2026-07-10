"use server";

import { cookies } from "next/headers";

export async function loginAction(username: string, password: string) {
  if (username === "admin" && password === "Harshg123$") {
    const cookieStore = await cookies();
    cookieStore.set("auth_token", "admin-logged-in-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });
    return { success: true };
  }

  return { success: false, error: "Invalid username or password" };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  return { success: true };
}
