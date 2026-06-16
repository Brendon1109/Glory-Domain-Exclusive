import { NextResponse, type NextRequest } from "next/server";
import { getMemberSession } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { verifyPasscode } from "@/lib/auth";

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin) return true; // same-site form posts may omit Origin
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
  let passcode = "";
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { passcode?: string };
    passcode = String(body.passcode ?? "");
  } else {
    const form = await req.formData();
    passcode = String(form.get("passcode") ?? "");
  }

  const settings = await getSettings();
  if (!verifyPasscode(passcode.trim(), settings.memberPasscodeHash)) {
    return NextResponse.json(
      { error: "That passcode is not correct." },
      { status: 401 },
    );
  }

  const session = await getMemberSession();
  session.member = true;
  await session.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getMemberSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
