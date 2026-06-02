"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { getInitials } from "@artverse/utils";

interface UserAvatarProps {
  name: string;
  avatar?: string | null;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
}

export function UserAvatar({
  name,
  avatar,
  className = "h-10 w-10",
  imageClassName = "object-cover",
  textClassName = "text-sm font-semibold",
}: UserAvatarProps) {
  const safeAvatar = typeof avatar === "string" ? avatar.trim() : "";
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [safeAvatar]);

  const shouldRenderImage = Boolean(safeAvatar) && !imageFailed;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-teal)] text-white ${className}`}
    >
      {shouldRenderImage ? (
        <Image
          src={safeAvatar}
          alt={name}
          fill
          sizes="96px"
          className={imageClassName}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={textClassName}>{getInitials(name)}</span>
      )}
    </div>
  );
}