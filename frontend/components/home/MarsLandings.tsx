import Image from "next/image";
import { marsLandings } from "@/lib/constants/home";

export function MarsLandings() {
  return (
    <section id="landing" className="scroll-mt-24 bg-home">
      <h2 className="sr-only">Mars landings</h2>
      <div className="flex justify-center px-4">
        <Image
          src={marsLandings.image.src}
          alt={marsLandings.image.alt}
          width={marsLandings.image.width}
          height={marsLandings.image.height}
          sizes="(max-width: 768px) 90vw, 700px"
          className="block h-auto w-full max-w-[700px]"
        />
      </div>
    </section>
  );
}
