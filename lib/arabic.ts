// Arabic support for the PDF renderer. pdf-lib's standard fonts have no Arabic
// glyphs and do no shaping, so for Arabic we embed Amiri (via fontkit) and run
// every string through arabic-reshaper, which returns correctly-joined glyphs
// in visual (RTL) order — exactly what pdf-lib then draws left-to-right.
import fs from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, StandardFonts } from "pdf-lib";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const reshaper = require("arabic-reshaper");

let amiriReg: Buffer | null = null;
let amiriBold: Buffer | null = null;

function loadFonts() {
  if (amiriReg && amiriBold) return;
  const dir = path.join(process.cwd(), "lib", "fonts");
  amiriReg = fs.readFileSync(path.join(dir, "Amiri-Regular.ttf"));
  amiriBold = fs.readFileSync(path.join(dir, "Amiri-Bold.ttf"));
}

export type DocFonts = {
  serif: PDFFont;
  serifB: PDFFont;
  serifI: PDFFont;
  sans: PDFFont;
  sansB: PDFFont;
};

// One font set per document. For Arabic, every role maps to an Amiri weight.
export async function embedDocFonts(doc: PDFDocument, lang?: string): Promise<DocFonts> {
  if (lang === "ar") {
    loadFonts();
    doc.registerFontkit(fontkit);
    // No subsetting: the subsetter drops the reshaped presentation-form glyphs.
    const reg = await doc.embedFont(amiriReg!);
    const bold = await doc.embedFont(amiriBold!);
    return { serif: reg, serifB: bold, serifI: reg, sans: reg, sansB: bold };
  }
  return {
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    serifB: await doc.embedFont(StandardFonts.TimesRomanBold),
    serifI: await doc.embedFont(StandardFonts.TimesRomanItalic),
    sans: await doc.embedFont(StandardFonts.Helvetica),
    sansB: await doc.embedFont(StandardFonts.HelveticaBold),
  };
}

const ARABIC = /[؀-ۿ]/;

// Reshape Arabic text for PDF drawing. Leaves non-Arabic strings untouched.
export function shape(text: string, lang?: string): string {
  if (lang !== "ar" || !text || !ARABIC.test(text)) return text;
  try {
    // convertArabic reshapes AND reverses to visual order — which also reverses
    // any embedded LTR runs (Latin / Western digits). Flip those runs back so
    // numbers and dates read correctly inside Arabic text.
    const out = reshaper.convertArabic(text) as string;
    return out.replace(/[0-9A-Za-z][0-9A-Za-z/.,:%\-]*/g, (m) =>
      m.split("").reverse().join("")
    );
  } catch {
    return text;
  }
}
