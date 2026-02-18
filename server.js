import express from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const execFileAsync = promisify(execFile);

const app = express();
app.use(express.json({ limit: "25mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/ocr", async (req, res) => {
  try {
    const { imageBase64, filename } = req.body ?? {};
    if (!imageBase64) {
      return res.status(400).json({ text: "", error: "Missing imageBase64" });
    }

    const cleaned = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
    const buffer = Buffer.from(cleaned, "base64");

    const ext = filename?.split(".").pop() || "png";

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ocr-"));
    const imgPath = path.join(tmpDir, `input.${ext}`);
    const outBase = path.join(tmpDir, "output");

    await fs.writeFile(imgPath, buffer);

    await execFileAsync("tesseract", [imgPath, outBase, "-l", "eng"], {
      timeout: 20000
    });

    const text = await fs.readFile(`${outBase}.txt`, "utf8");

    await fs.rm(tmpDir, { recursive: true, force: true });

    res.json({ text });
  } catch (e) {
    res.status(500).json({ text: "", error: String(e.message) });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log("OCR running on port", port);
});
