"use server";

import { redirect } from "next/navigation";
import { checkPassword, endAdminSession, isAdminConfigured, startAdminSession } from "@/lib/admin-auth";

export async function login(formData: FormData): Promise<void> {
  if (!isAdminConfigured()) redirect("/admin/login?e=setup");
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    redirect("/admin/login?e=1");
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}
