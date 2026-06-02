"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";

import { normalizeImageSrc } from "@/lib/image";

type SafeImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
};

export function SafeImage({
  src,
  fallbackSrc = "/placeholder.jpg",
  onError,
  ...props
}: SafeImageProps) {
  const normalizedSrc = normalizeImageSrc(src, fallbackSrc);
  const [currentSrc, setCurrentSrc] = useState(normalizedSrc);

  useEffect(() => {
    setCurrentSrc(normalizedSrc);
  }, [normalizedSrc]);

  return (
    <Image
      {...props}
      src={currentSrc}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }

        onError?.(event);
      }}
    />
  );
}