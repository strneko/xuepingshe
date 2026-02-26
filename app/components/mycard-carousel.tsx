"use client";
import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { MyCard } from "@/components/mycard";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export function MyCardCarousel({ className }: { className?: string }) {
  const autoplay = React.useRef(Autoplay({ delay: 4000, stopOnInteraction: false }));

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      orientation="vertical"
      plugins={[autoplay.current]}
      className={cn("w-full h-[calc(100vh-200px)] mt-[58px]", className)}
      onMouseEnter={autoplay.current.stop}
      onMouseLeave={autoplay.current.reset}
    >
      <CarouselContent className="mt-1 h-[calc(100vh-200px)] ">
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index} className="basis-1/2 ">
            <div className="p-1">
              <MyCard />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
