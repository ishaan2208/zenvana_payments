import Image from "next/image";
import clsx from "clsx";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <Image
        src="/Zenvana%20logo/Zenvana%20logo%20(1).svg"
        alt="Zenvana"
        width={150}
        height={54}
        className="h-10 w-auto object-contain sm:h-11"
        priority
      />
    </div>
  );
}
