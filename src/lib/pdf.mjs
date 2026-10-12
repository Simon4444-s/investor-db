// Textové položky z PDF i s pozicí na stránce (x, y v bodech, y roste nahoru).
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export async function polozkyPdf(data) {
  const dokument = await getDocument({ data: new Uint8Array(data), verbosity: 0 }).promise;
  const stranky = [];
  for (let c = 1; c <= dokument.numPages; c++) {
    const obsah = await (await dokument.getPage(c)).getTextContent();
    stranky.push(
      obsah.items
        .filter((i) => i.str.trim())
        .map((i) => ({ text: i.str.trim(), x: i.transform[4], y: i.transform[5] }))
    );
  }
  return stranky;
}
