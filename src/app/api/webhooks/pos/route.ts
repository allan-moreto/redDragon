import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PosSyncError, syncPosPayload } from "@/services/posSync";

export async function GET() {
  const settings = await prisma.appSetting.findUnique({ where: { id: "app" } });
  return NextResponse.json({
    ok: true,
    posSyncEnabled: settings?.posSyncEnabled ?? false,
    message: settings?.posSyncEnabled
      ? "This address is listening for register sales. Opening it in a browser does not change stock."
      : "This address is paused. Turn on the register connection in Settings before sending sales.",
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Send a JSON body with the product SKU and quantity sold." },
      { status: 400 },
    );
  }

  try {
    const result = await syncPosPayload(body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PosSyncError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong while recording this sale." },
      { status: 500 },
    );
  }
}
