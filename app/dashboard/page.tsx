/**
 * Hotel Management System - Muraka
 * 
 * @student Aminath Yaula Yaarid - S2400576
 * @student Hawwa Saha Nasih - S2400566
 * @student Milyaaf Abdul Sattar - S2300565
 * @student Mohamed Raslaan Najeeb - S2400578
 * 
 * Module: UFCF8S-30-2 Advanced Software Development
 * Institution: UWE Bristol
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "guest";

  // Redirect to appropriate dashboard based on role
  switch (role) {
    case "admin":
      redirect("/dashboard/admin");
    case "manager":
      redirect("/dashboard/manager");
    case "staff":
      redirect("/dashboard/staff");
    default:
      redirect("/dashboard/guest");
  }
}
//test
