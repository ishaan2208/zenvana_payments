import Image from "next/image";
import clsx from "clsx";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <Image
        src="/Zenvana%20logo/icon.svg"
        alt="Zenvana"
        width={48}
        height={48}
        className="size-10 object-contain sm:size-11"
        priority
      />
    </div>
  );
}
