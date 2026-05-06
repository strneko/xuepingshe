"use client";
import { useRef, useEffect, useCallback, useState, Suspense } from "react";
import SearchInput from "@/components/search-input";
import { Skeleton } from "@/components/ui/skeleton";

const TITLE = "欢迎来到学评社";
const SUBTITLE = "发现好老师，分享真评价";
const PLACEHOLDER = "搜索教师姓名、课程名或院系...";
const TYPING_SPEED = 120;
const PLACEHOLDER_SPEED = 100;

// ─── Doodle SVG elements ───

function DoodleStar({ className, size = 40 }: { className?: string; size?: number }) {
  const path = `M${size / 2} ${size * 0.08} L${size * 0.62} ${size * 0.35} L${size * 0.94} ${size * 0.38} L${size * 0.7} ${size * 0.6} L${size * 0.76} ${size * 0.92} L${size / 2} ${size * 0.78} L${size * 0.24} ${size * 0.92} L${size * 0.3} ${size * 0.6} L${size * 0.06} ${size * 0.38} L${size * 0.38} ${size * 0.35} Z`;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} style={{ width: size, height: size }} aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function DoodleCircle({ className, size = 30 }: { className?: string; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} style={{ width: size, height: size }} aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function DoodleSquiggle({ className, width = 60, height = 12 }: { className?: string; width?: number; height?: number }) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} style={{ width, height }} aria-hidden="true" preserveAspectRatio="none">
      <path d={`M0 ${height / 2} Q${width * 0.25} ${height * 0.1} ${width * 0.5} ${height / 2} Q${width * 0.75} ${height * 0.9} ${width} ${height / 2}`} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

function DoodlePencil({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={{ width: size, height: size }} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      <line x1="15" y1="5" x2="19" y2="9" />
    </svg>
  );
}

function DoodleBook({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={{ width: size, height: size }} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

// ─── Typewriter ───

function TypewriterText({ text, speed, className, onComplete }: { text: string; speed: number; className?: string; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayed("");
    setShowCursor(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i <= text.length) { setDisplayed(text.slice(0, i)); }
      else { clearInterval(interval); setShowCursor(false); onComplete?.(); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {showCursor && <span className="inline-block w-0.5 h-[0.85em] bg-foreground/70 align-middle ml-0.5 animate-pulse" />}
    </span>
  );
}

// ─── Search with typewriter placeholder ───

function SearchWithTypewriter({ visible }: { visible: boolean }) {
  const [placeholderText, setPlaceholderText] = useState("");

  useEffect(() => {
    if (!visible) return;
    setPlaceholderText("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i <= PLACEHOLDER.length) { setPlaceholderText(PLACEHOLDER.slice(0, i)); }
      else { clearInterval(interval); }
    }, PLACEHOLDER_SPEED);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <div className={`relative z-10 w-full max-w-lg mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"}`}>
      <Suspense fallback={<Skeleton className="h-14 w-full rounded-lg" />}>
        <SearchInput inputClassName="h-14 placeholder:text-base text-base" placeholder={placeholderText || " "} />
      </Suspense>
    </div>
  );
}

// ─── Floating decoration configs ───

const DECORATIONS = [
  { kind: "star", top: "12%", left: "8%", color: "text-amber-400/30", size: 32, depth: 0.06, animDelay: "0s" },
  { kind: "circle", top: "20%", right: "10%", color: "text-orange-300/25", size: 28, depth: 0.09, animDelay: "0.4s" },
  { kind: "star", top: "60%", left: "6%", color: "text-yellow-400/20", size: 24, depth: 0.04, animDelay: "0.8s" },
  { kind: "circle", top: "15%", left: "85%", color: "text-amber-300/20", size: 36, depth: 0.07, animDelay: "0.2s" },
  { kind: "pencil", top: "75%", right: "6%", color: "text-orange-300/20", size: 26, depth: 0.05, animDelay: "1s" },
  { kind: "book", top: "45%", left: "3%", color: "text-amber-400/15", size: 24, depth: 0.03, animDelay: "0.6s" },
  { kind: "star", top: "35%", right: "4%", color: "text-yellow-300/15", size: 18, depth: 0.08, animDelay: "1.4s" },
  { kind: "circle", top: "50%", left: "92%", color: "text-amber-400/12", size: 16, depth: 0.05, animDelay: "0.3s" },
  { kind: "star", top: "85%", left: "22%", color: "text-orange-300/15", size: 20, depth: 0.06, animDelay: "1.8s" },
] as const;

// ─── Sparkle particle ───

function SparkleCursor({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Create a tiny sparkle
      const sparkle = document.createElement("div");
      sparkle.className = "absolute pointer-events-none rounded-full";
      sparkle.style.cssText = `
        left: ${x}px; top: ${y}px;
        width: 4px; height: 4px;
        background: oklch(0.85 0.12 80 / 0.7);
        transform: translate(-50%, -50%);
        animation: sparkle-fade 0.6s ease-out forwards;
      `;
      container.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 600);
    };

    container.addEventListener("mousemove", handleMove, { passive: true });
    return () => container.removeEventListener("mousemove", handleMove);
  }, [containerRef]);

  return null;
}

// ─── Main Hero ───

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const decorationRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [titleDone, setTitleDone] = useState(false);
  const [showSquiggle, setShowSquiggle] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  // Track mouse for gradient + tilt
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });

    // Multi-depth parallax on decorations
    const decorations = decorationRef.current?.children;
    if (!decorations) return;
    const relX = x - 0.5;
    const relY = y - 0.5;
    Array.from(decorations).forEach((el, i) => {
      const depth = 0.03 + (i % 4) * 0.02;
      const rotDepth = 3 + i * 2;
      const htmlEl = el as HTMLElement;
      htmlEl.style.transform = `translate(${relX * -depth * 160}px, ${relY * -depth * 160}px) rotate(${relX * rotDepth}deg)`;
      htmlEl.style.transition = "transform 0.3s ease-out";
    });

    // Tilt the title
    if (titleRef.current) {
      titleRef.current.style.transform = `perspective(600px) rotateX(${relY * 2}deg) rotateY(${relX * -3}deg)`;
    }
  }, []);

  // Reset decorations on mouse leave
  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: 0.5, y: 0.5 });
    const decorations = decorationRef.current?.children;
    if (!decorations) return;
    Array.from(decorations).forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.transform = "translate(0, 0) rotate(0deg)";
    });
    if (titleRef.current) {
      titleRef.current.style.transform = "perspective(600px) rotateX(0) rotateY(0)";
    }
  }, []);

  const handleTitleComplete = useCallback(() => {
    setTitleDone(true);
    setTimeout(() => setShowSquiggle(true), SUBTITLE.length * TYPING_SPEED + 200);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero-search"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-col items-center justify-center min-h-[60vh] px-4 py-16 overflow-hidden"
      style={{
        background: `radial-gradient(ellipse 80% 60% at ${mousePos.x * 100}% ${mousePos.y * 100}%, oklch(0.97 0.015 85 / 0.35) 0%, oklch(0.985 0.005 80 / 0) 60%)`,
        transition: "background 0.8s ease-out",
      }}
    >
      <SparkleCursor containerRef={sectionRef} />

      {/* Washi tape decorations — wiggle on hover */}
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-3 opacity-60 cursor-default"
        style={{
          background: "repeating-linear-gradient(-40deg, oklch(0.85 0.08 80 / 0.55), oklch(0.85 0.08 80 / 0.55) 4px, transparent 4px, transparent 8px)",
          borderRadius: "2px",
          transform: "translateX(-50%) rotate(-2deg)",
          transition: "transform 0.3s ease, opacity 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateX(-50%) rotate(1deg) scale(1.05)";
          e.currentTarget.style.opacity = "0.8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateX(-50%) rotate(-2deg)";
          e.currentTarget.style.opacity = "0.6";
        }}
      />
      <div
        className="absolute top-8 left-[15%] w-14 h-3 opacity-50 cursor-default"
        style={{
          background: "repeating-linear-gradient(35deg, oklch(0.8 0.06 200 / 0.5), oklch(0.8 0.06 200 / 0.5) 4px, transparent 4px, transparent 8px)",
          borderRadius: "2px", transform: "rotate(3deg)",
          transition: "transform 0.3s ease, opacity 0.3s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "rotate(-1deg) scale(1.05)"; e.currentTarget.style.opacity = "0.7"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "rotate(3deg)"; e.currentTarget.style.opacity = "0.5"; }}
      />
      <div
        className="absolute top-10 right-[20%] w-12 h-3 opacity-50 cursor-default"
        style={{
          background: "repeating-linear-gradient(-25deg, oklch(0.8 0.08 0 / 0.45), oklch(0.8 0.08 0 / 0.45) 4px, transparent 4px, transparent 8px)",
          borderRadius: "2px", transform: "rotate(-1.5deg)",
          transition: "transform 0.3s ease, opacity 0.3s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "rotate(2deg) scale(1.05)"; e.currentTarget.style.opacity = "0.7"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "rotate(-1.5deg)"; e.currentTarget.style.opacity = "0.5"; }}
      />

      {/* Floating doodle decorations */}
      <div ref={decorationRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {DECORATIONS.map((d, i) => {
          const Comp = d.kind === "star" ? DoodleStar : d.kind === "circle" ? DoodleCircle : d.kind === "pencil" ? DoodlePencil : DoodleBook;
          const posStyle: Record<string, string> = {};
          if ("left" in d) posStyle.left = d.left;
          if ("right" in d) posStyle.right = d.right;
          if ("top" in d) posStyle.top = d.top;
          return (
            <div key={i} className="absolute" style={{ ...posStyle, animation: `doodle-float ${3 + i * 0.5}s ease-in-out ${d.animDelay} infinite` }}>
              <Comp size={d.size} className={d.color} />
            </div>
          );
        })}
      </div>

      {/* Title with 3D tilt */}
      <div
        ref={titleRef}
        className="relative z-10 text-center mb-6"
        style={{ transition: "transform 0.3s ease-out", willChange: "transform" }}
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-3 tracking-wide" style={{ fontFamily: "var(--font-heading)" }}>
          <TypewriterText text={TITLE} speed={TYPING_SPEED} onComplete={handleTitleComplete} />
        </h1>
        <div className={`transition-all duration-700 ${showSquiggle ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`}>
          <DoodleSquiggle className="mx-auto text-amber-500/60" width={220} height={12} />
        </div>
      </div>

      {/* Subtitle with glow */}
      <p className="relative z-10 text-lg md:text-xl text-muted-foreground mb-10">
        {titleDone && (
          <span className="highlight-marker px-1">
            <TypewriterText text={SUBTITLE} speed={TYPING_SPEED} />
          </span>
        )}
      </p>

      {/* Search */}
      <SearchWithTypewriter visible={showSquiggle} />

      {/* Bottom doodle divider */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg viewBox="0 0 1200 30" preserveAspectRatio="none" className="w-full h-8" aria-hidden="true">
          <path
            d="M0 15 Q40 2 80 15 Q120 28 160 15 Q200 2 240 15 Q280 28 320 15 Q360 2 400 15 Q440 28 480 15 Q520 2 560 15 Q600 28 640 15 Q680 2 720 15 Q760 28 800 15 Q840 2 880 15 Q920 28 960 15 Q1000 2 1040 15 Q1080 28 1120 15 Q1160 2 1200 15"
            fill="none" stroke="oklch(0.85 0.01 60)" strokeWidth="1.5" opacity="0.6"
          />
        </svg>
      </div>

    </section>
  );
}
