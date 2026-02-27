import JSZip from "jszip";
import { saveAs } from "file-saver";

export interface ZipEntry {
  name: string;
  blob: Blob;
}

export async function downloadAsZip(
  entries: ZipEntry[],
  zipName: string = "minikyu-images.zip"
): Promise<void> {
  const zip = new JSZip();

  for (const entry of entries) {
    zip.file(entry.name, entry.blob);
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, zipName);
}

export function downloadSingle(blob: Blob, name: string): void {
  saveAs(blob, name);
}
