import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarGradient } from "@/lib/gradientAvatar";

export function GradientAvatar({
  src,
  seed,
  initials,
  alt,
  size = "default",
  className,
}: {
  src?: string | null;
  seed: string;
  initials: string;
  alt?: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      <AvatarImage src={src ?? undefined} alt={alt ?? initials} />
      <AvatarFallback
        style={{ background: getAvatarGradient(seed), color: "#fff" }}
        className="font-semibold"
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
