import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/session";
import { verifyAdminPassword } from "@/lib/auth";

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
  let password = "";
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { password?: string };
    password = String(body.password ?? "");
  } else {
    const form = await req.formData();
    password = String(form.get("password") ?? "");
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json(
      { error: "That password is not correct." },
      { status: 401 },
    );
  }

  const session = await getAdminSession();
  session.admin = true;
  await session.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getAdminSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
