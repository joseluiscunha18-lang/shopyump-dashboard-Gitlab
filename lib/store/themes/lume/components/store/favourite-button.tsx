'use client';

import { Heart } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

type FavouriteButtonProps = {
  productName: string;
  liked: boolean;
  onToggle: () => void;
  className?: string;
};

export function FavouriteButton({ productName, liked, onToggle, className }: FavouriteButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={liked ? `Remover ${productName} dos favoritos` : `Adicionar ${productName} aos favoritos`}
      aria-pressed={liked}
      onClick={onToggle}
      className={cn(
        "heart-pop size-8 shrink-0 rounded-full border border-border/70 bg-background/85 text-foreground shadow-control backdrop-blur-sm hover:bg-background",
        liked && "is-liked",
        className,
      )}
    >
      <Heart className={cn("size-3.5", liked && "fill-current")} />
    </Button>
  );
}