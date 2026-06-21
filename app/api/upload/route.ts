import { NextRequest, NextResponse } from "next/server";
import { parseSpreadsheet } from "@/lib/parse";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File is larger than 5 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { columns, rows } = parseSpreadsheet(buffer);

    return NextResponse.json({
      filename: file.name,
      columns,
      rows,
      rowCount: rows.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not read that file.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
