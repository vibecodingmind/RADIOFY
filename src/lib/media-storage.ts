import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import * as mm from "music-metadata";

export interface ParsedAudioMetadata {
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  year?: number;
  duration: number;
  bpm?: number;
  lufs: number;
  fileSize: number;
  mimeType: string;
  storageKey: string;
}

const STORAGE_BASE = process.env.STORAGE_LOCAL_PATH || "./storage";

export class MediaStorageService {
  /**
   * Saves a buffer to storage and parses its audio metadata and ID3 tags
   */
  static async saveAndParseAudio(
    buffer: Buffer,
    originalFilename: string,
    stationId: string
  ): Promise<ParsedAudioMetadata> {
    const ext = path.extname(originalFilename).toLowerCase() || ".mp3";
    const fileHash = crypto.randomBytes(16).toString("hex");
    const filename = `${fileHash}${ext}`;
    const storageKey = `media/${stationId}/${filename}`;
    const fullDirPath = path.join(STORAGE_BASE, "media", stationId);
    const fullFilePath = path.join(STORAGE_BASE, storageKey);

    await fs.mkdir(fullDirPath, { recursive: true });
    await fs.writeFile(fullFilePath, buffer);

    let parsedMeta: mm.IAudioMetadata | null = null;
    try {
      parsedMeta = await mm.parseBuffer(buffer, { mimeType: "audio/mpeg" });
    } catch (e) {
      console.warn("Could not parse ID3 tags with music-metadata, falling back:", e);
    }

    const title =
      parsedMeta?.common.title ||
      path.basename(originalFilename, ext).replace(/[_-]+/g, " ");
    const artist = parsedMeta?.common.artist || "Unknown Artist";
    const album = parsedMeta?.common.album || undefined;
    const genre = parsedMeta?.common.genre?.[0] || undefined;
    const year = parsedMeta?.common.year || undefined;
    const duration = parsedMeta?.format.duration || 180.0;
    const bpm = parsedMeta?.common.bpm || undefined;

    // Simulate Broadcast EBU R128 Loudness measurement (-14.0 LUFS target)
    const lufs = -14.0 + (Math.random() * 1.6 - 0.8);

    return {
      title,
      artist,
      album,
      genre,
      year,
      duration,
      bpm,
      lufs: parseFloat(lufs.toFixed(1)),
      fileSize: buffer.length,
      mimeType: ext === ".flac" ? "audio/flac" : ext === ".opus" ? "audio/opus" : "audio/mpeg",
      storageKey,
    };
  }

  /**
   * Deletes a file from the disk storage
   */
  static async deleteAudioFile(storageKey: string): Promise<boolean> {
    try {
      const fullFilePath = path.join(STORAGE_BASE, storageKey);
      await fs.unlink(fullFilePath);
      return true;
    } catch {
      return false;
    }
  }
}
