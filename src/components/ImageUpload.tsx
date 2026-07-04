"use client";

import { useRef, useState } from "react";

const MAX_IMAGES = 6;
const MAX_EDGE = 1280; // longest side, px — keeps stored images reasonably small
const JPEG_QUALITY = 0.72;

/**
 * Resize + compress an image file entirely in the browser and return a JPEG
 * data URL. Photos get scaled so their longest edge is <= MAX_EDGE, which
 * keeps each stored image to a few hundred KB instead of multiple MB.
 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      // White background so transparent PNGs don't turn black as JPEG.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

export function ImageUpload({
  value,
  onChange,
}: {
  value: string[];
  onChange: (images: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function addFiles(files: FileList | File[]) {
    setError("");
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      setError("Please choose image files.");
      return;
    }

    const room = MAX_IMAGES - value.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_IMAGES} photos.`);
      return;
    }

    setBusy(true);
    const next: string[] = [];
    for (const file of list.slice(0, room)) {
      try {
        next.push(await compressImage(file));
      } catch {
        setError("One of those images couldn't be processed. Try a JPG or PNG.");
      }
    }
    if (next.length) onChange([...value, ...next]);
    if (list.length > room) {
      setError(`Only ${MAX_IMAGES} photos allowed — some were skipped.`);
    }
    setBusy(false);
  }

  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragOver
            ? "border-emerald-500 bg-emerald-50"
            : "border-zinc-300 hover:border-emerald-400 hover:bg-zinc-50"
        }`}
      >
        <svg className="mb-2 h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5V18a3 3 0 003 3h12a3 3 0 003-3v-1.5M16.5 7.5 12 3m0 0L7.5 7.5M12 3v13.5" />
        </svg>
        <p className="text-sm font-medium text-zinc-700">
          {busy ? "Processing photos…" : "Click to upload or drag photos here"}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          JPG or PNG · up to {MAX_IMAGES} photos
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((src, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                aria-label="Remove photo"
              >
                ×
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
