import { deleteSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  await deleteSession();
  return NextResponse.redirect(new URL("/dev", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"));
}
