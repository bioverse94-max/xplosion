"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "./countdown-timer";
import { NoiseOverlay, BrushStroke } from "@/components/effects/visual-engine";
import {
  ArrowRight,
  Compass,
  Calendar,
  MapPin,
  Clock,
  ArrowUpRight,
  ChevronDown,
  Sparkles,
  Volume2,
} from "lucide-react";
import { EventDetailDTO } from "@/types";

export interface CinematicHeroSectionProps {
  event: EventDetailDTO | null;
}

const TOTAL_FRAMES = 130;

// Path generator using optimized high-performance frames with fallback
const getFrameUrl = (index: number, useJpg: boolean = true) => {
  const pad = String(index + 1).padStart(3, "0");
  return useJpg
    ? `/frames_optimized/frame_${pad}.jpg`
    : `/frames/frame_${pad}.png`;
};

export const CinematicHeroSection: React.FC<CinematicHeroSectionProps> = ({ event }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animation and progress refs (avoiding React state re-renders on every scroll tick)
  const currentProgressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const lastDrawnFrameRef = useRef<number>(-1);
  const rafIdRef = useRef<number | null>(null);

  // Cached decoded images
  const frameCacheRef = useRef<(HTMLImageElement | null)[]>(
    new Array(TOTAL_FRAMES).fill(null)
  );

  // UI state for staged text and corner HUD
  const [mounted, setMounted] = useState(false);
  const [initialFrameLoaded, setInitialFrameLoaded] = useState(false);
  const [loadPercentage, setLoadPercentage] = useState(0);
  const [activeStage, setActiveStage] = useState(1);
  const [smoothProgressDisplay, setSmoothProgressDisplay] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Authoritative event details with fallbacks
  const eventDate = event?.date || "2026-09-26T12:00:00.000Z";
  const venue = event?.venueName || "REBORN CLUB & KITCHEN";
  const doors = event?.doorsOpenTime || "12 PM ONWARDS";
  const tagline = event?.tagline || "THE ULTIMATE COLLEGE AFTERPARTY";

  /**
   * Draw specific frame index onto canvas with cover-fit math
   */
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Find requested frame, or closest available frame to prevent any black flicker
    let img = frameCacheRef.current[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) {
      // Search backwards
      for (let i = frameIndex; i >= 0; i--) {
        const candidate = frameCacheRef.current[i];
        if (candidate && candidate.complete && candidate.naturalWidth > 0) {
          img = candidate;
          break;
        }
      }
      // Search forwards if needed
      if (!img) {
        for (let i = frameIndex; i < TOTAL_FRAMES; i++) {
          const candidate = frameCacheRef.current[i];
          if (candidate && candidate.complete && candidate.naturalWidth > 0) {
            img = candidate;
            break;
          }
        }
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Responsive Object-Fit Cover Calculation (Preserves central focal lighting)
    const hRatio = cw / iw;
    const vRatio = ch / ih;
    const ratio = Math.max(hRatio, vRatio);

    const renderW = iw * ratio;
    const renderH = ih * ratio;
    const offsetX = (cw - renderW) / 2;
    const offsetY = (ch - renderH) / 2;

    ctx.drawImage(img, 0, 0, iw, ih, offsetX, offsetY, renderW, renderH);
    lastDrawnFrameRef.current = frameIndex;
  }, []);

  /**
   * Handle canvas sizing with device pixel ratio
   */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;

    if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
      canvas.width = displayW * dpr;
      canvas.height = displayH * dpr;

      // Redraw current frame at new resolution
      if (lastDrawnFrameRef.current >= 0) {
        drawFrame(lastDrawnFrameRef.current);
      }
    }
  }, [drawFrame]);

  /**
   * Initialize and progressively preload frame sequence
   */
  useEffect(() => {
    setMounted(true);

    // Check for reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      setPrefersReducedMotion(true);
    }

    let isCancelled = false;
    let loadedCount = 0;

    const loadSingleImage = (index: number): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        if (frameCacheRef.current[index]) {
          return resolve(frameCacheRef.current[index]!);
        }

        const img = new Image();
        img.src = getFrameUrl(index, true);

        img.onload = () => {
          if (isCancelled) return;
          frameCacheRef.current[index] = img;
          loadedCount++;
          setLoadPercentage(Math.round((loadedCount / TOTAL_FRAMES) * 100));
          resolve(img);
        };

        img.onerror = () => {
          // Fallback to PNG if JPG fails for any reason
          const fallbackImg = new Image();
          fallbackImg.src = getFrameUrl(index, false);
          fallbackImg.onload = () => {
            if (isCancelled) return;
            frameCacheRef.current[index] = fallbackImg;
            loadedCount++;
            setLoadPercentage(Math.round((loadedCount / TOTAL_FRAMES) * 100));
            resolve(fallbackImg);
          };
          fallbackImg.onerror = () => {
            reject(new Error(`Failed to load frame ${index}`));
          };
        };
      });
    };

    // Priority 1: Load Frame 1 immediately
    loadSingleImage(0)
      .then(() => {
        if (isCancelled) return;
        setInitialFrameLoaded(true);
        resizeCanvas();
        drawFrame(0);

        // If reduced motion is requested, load dramatic mid frame
        if (motionQuery.matches) {
          loadSingleImage(60)
            .then(() => {
              if (!isCancelled) drawFrame(60);
            })
            .catch(() => {});
          return;
        }

        // Priority 2: Preload initial burst (frames 1..15)
        const initialBurst = Array.from({ length: 15 }, (_, i) => i + 1);
        Promise.all(initialBurst.map((idx) => loadSingleImage(idx)))
          .then(() => {
            if (isCancelled) return;

            // Priority 3: Preload keyframes across the sequence (every 4th frame)
            const keyframes: number[] = [];
            for (let i = 16; i < TOTAL_FRAMES; i += 4) {
              keyframes.push(i);
            }

            Promise.all(keyframes.map((k) => loadSingleImage(k)))
              .then(() => {
                if (isCancelled) return;

                // Priority 4: Background progressive loader for all remaining frames
                const remaining: number[] = [];
                for (let i = 0; i < TOTAL_FRAMES; i++) {
                  if (!frameCacheRef.current[i]) remaining.push(i);
                }

                let currentIndex = 0;
                const loadNextChunk = () => {
                  if (isCancelled || currentIndex >= remaining.length) return;
                  const chunk = remaining.slice(currentIndex, currentIndex + 4);
                  currentIndex += 4;
                  Promise.all(chunk.map((idx) => loadSingleImage(idx)))
                    .catch(() => {})
                    .finally(() => {
                      if (!isCancelled && currentIndex < remaining.length) {
                        if ("requestIdleCallback" in window) {
                          window.requestIdleCallback(loadNextChunk);
                        } else {
                          setTimeout(loadNextChunk, 35);
                        }
                      }
                    });
                };

                loadNextChunk();
              })
              .catch(() => {});
          })
          .catch(() => {});
      })
      .catch(() => {
        // Fallback: unlock UI if initial frame fails
        if (!isCancelled) setInitialFrameLoaded(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [drawFrame, resizeCanvas]);

  /**
   * Resize listener
   */
  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  /**
   * Scroll listener and 60fps lerp render loop
   */
  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const maxScroll = rect.height - window.innerHeight;
      if (maxScroll <= 0) return;

      // Compute normalized progress 0 -> 1
      const progress = Math.max(0, Math.min(1, -rect.top / maxScroll));
      targetProgressRef.current = progress;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // 60FPS RAF animation loop with lerping and idle stabilization
    let lastUiUpdate = 0;
    let lastReportedProgress = -1;

    const animate = (time: number) => {
      const target = targetProgressRef.current;
      const current = currentProgressRef.current;
      const delta = target - current;

      if (Math.abs(delta) < 0.0004) {
        currentProgressRef.current = target;
      } else {
        const lerp = Math.abs(delta) > 0.08 ? 0.16 : 0.1;
        currentProgressRef.current = current + delta * lerp;
      }

      const nextProgress = currentProgressRef.current;

      // Compute frame index
      const targetFrame = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(nextProgress * (TOTAL_FRAMES - 1)))
      );

      if (targetFrame !== lastDrawnFrameRef.current) {
        drawFrame(targetFrame);
      }

      // Throttled UI state updates (~20fps for HUD indicators to save React cycles)
      if (
        time - lastUiUpdate > 45 &&
        Math.abs(nextProgress - lastReportedProgress) > 0.003
      ) {
        lastUiUpdate = time;
        lastReportedProgress = nextProgress;
        setSmoothProgressDisplay(nextProgress);

        // Derive active stage (1 to 5)
        if (nextProgress < 0.22) {
          setActiveStage(1);
        } else if (nextProgress < 0.48) {
          setActiveStage(2);
        } else if (nextProgress < 0.72) {
          setActiveStage(3);
        } else if (nextProgress < 0.9) {
          setActiveStage(4);
        } else {
          setActiveStage(5);
        }
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [drawFrame, prefersReducedMotion]);

  // Interpolated progress shortcuts for choreography
  const p = prefersReducedMotion ? 0.8 : smoothProgressDisplay;

  // Staged Opacities & Translates
  // Stage 1: 0.0 -> 0.22 (Intro)
  const stage1Opacity = p < 0.2 ? 1 - p / 0.2 : 0;
  const stage1Translate = p * -30;

  // Stage 2: 0.2 -> 0.50 (XPLOSION Reveal)
  const stage2Opacity =
    p >= 0.18 && p <= 0.52
      ? p < 0.32
        ? (p - 0.18) / 0.14
        : 1 - (p - 0.4) / 0.12
      : 0;

  // Stage 3: 0.48 -> 0.74 (Event Dossier)
  const stage3Opacity =
    p >= 0.48 && p <= 0.76
      ? p < 0.58
        ? (p - 0.48) / 0.1
        : 1 - (p - 0.68) / 0.08
      : 0;

  // Stage 4: 0.72 -> 1.0 (Pass Callout & High Climax)
  const stage4Opacity = p >= 0.72 ? Math.min(1, (p - 0.72) / 0.15) : 0;

  return (
    <section
      ref={containerRef}
      className={`relative w-full ${
        prefersReducedMotion ? "h-auto min-h-screen" : "h-[320vh] sm:h-[390vh]"
      } bg-[#030303]`}
    >
      {/* ── Sticky Fullscreen Viewport ── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        {/* 1. Hardware Accelerated Frame Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0"
        />

        {/* 2. Layered Cinematic Dark Overlays & Atmosphere */}
        {/* Top Vignette (Protects Navbar legibility) */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#030303]/95 via-[#030303]/60 to-transparent pointer-events-none z-10" />

        {/* Center Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(3,3,3,0.25)_0%,rgba(3,3,3,0.75)_100%)] pointer-events-none z-10" />

        {/* Dynamic Subtle Red Atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,0,0,0.14)_0%,transparent_70%)] pointer-events-none z-10" />

        {/* Bottom Fade (Transitions into Event Identity) */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#030303] via-[#030303]/80 to-transparent pointer-events-none z-10" />

        {/* Fine Grain / Noise */}
        <NoiseOverlay opacity={0.035} />

        {/* 3. Initial Minimalist Loading Indicator */}
        {!initialFrameLoaded && (
          <div className="absolute inset-0 z-50 bg-[#030303] flex flex-col items-center justify-center p-6 text-center select-none transition-opacity duration-500">
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-full border-2 border-[#FF0000]/20 border-t-[#FF0000] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="h-3 w-3 rounded-full bg-[#FF0000] shadow-[0_0_15px_#FF0000]" />
              </div>
            </div>
            <p className="text-2xl font-black font-display text-white uppercase tracking-wider mb-2">
              XPLOSION 2K26
            </p>
            <p className="text-xs font-mono font-bold text-[#A0A0A0] uppercase tracking-widest">
              {"//"} INITIALIZING CINEMATIC ENGINE
            </p>
          </div>
        )}

        {/* 4. Synchronized HTML Typography Overlays */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full text-center pointer-events-none">
          {/* ── STAGE 1: INTRO & COUNTDOWN (0% -> 22%) ── */}
          <div
            className="absolute inset-x-0 mx-auto max-w-4xl px-4 flex flex-col items-center transition-all duration-150"
            style={{
              opacity: stage1Opacity,
              transform: `translateY(${stage1Translate}px)`,
              pointerEvents: stage1Opacity > 0.4 ? "auto" : "none",
              display: stage1Opacity <= 0 ? "none" : "flex",
            }}
          >
            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#080808]/90 border border-[#FF0000]/40 shadow-[0_0_20px_rgba(255,0,0,0.3)] mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF0000] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF0000]" />
              </span>
              <span className="text-[11px] font-mono font-bold tracking-widest text-white uppercase">
                OFFICIAL TICKETING OPEN &bull; PASSES RESERVED LIVE
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-display tracking-tight text-white uppercase leading-none">
              XPLOSION 2K26
            </h1>
            <p className="text-xs sm:text-sm md:text-base font-extrabold uppercase tracking-widest text-[#E5E5E5] mt-2 mb-6 font-sans">
              {tagline}
            </p>

            {/* Doors Countdown */}
            <div className="mb-6">
              <p className="text-[10px] sm:text-xs font-mono font-bold text-[#A0A0A0] tracking-widest uppercase mb-2">
                {"//"} DOORS UNLOCK IN
              </p>
              <CountdownTimer targetDate={eventDate} />
            </div>

            {/* Subtle Scroll Cue */}
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#A0A0A0] tracking-widest uppercase animate-bounce pt-2">
              <ChevronDown className="h-4 w-4 text-[#FF0000]" />
              <span>SCROLL TO ENTER THE EXPERIENCE</span>
              <ChevronDown className="h-4 w-4 text-[#FF0000]" />
            </div>
          </div>

          {/* ── STAGE 2: MASSIVE XPLOSION SLAM (22% -> 50%) ── */}
          <div
            className="absolute inset-x-0 mx-auto max-w-5xl px-4 flex flex-col items-center transition-all duration-150"
            style={{
              opacity: stage2Opacity,
              transform: `scale(${0.92 + p * 0.15}) translateY(${
                (0.35 - p) * 60
              }px)`,
              pointerEvents: stage2Opacity > 0.4 ? "auto" : "none",
              display: stage2Opacity <= 0 ? "none" : "flex",
            }}
          >
            <div className="relative select-none">
              {/* Backlight Halo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[160px] bg-[#FF0000]/30 blur-[80px] pointer-events-none -z-10" />

              <span className="text-[11px] sm:text-xs font-mono font-black text-[#FF0000] tracking-widest uppercase block mb-1">
                {"//"} CHAPTER 01: THE SOUNDTRACK OF CAMPUS
              </span>

              <h2 className="text-6xl sm:text-8xl md:text-9xl lg:text-[10.5rem] font-black font-display tracking-tight text-white uppercase leading-[0.85] drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
                XPLOSION
              </h2>

              <div className="max-w-md sm:max-w-lg mx-auto mt-2">
                <BrushStroke color="#FF0000" className="opacity-90" />
              </div>
            </div>

            <p className="text-sm sm:text-xl font-black font-display uppercase tracking-widest text-[#F5F5F5] mt-5 max-w-xl">
              ONE NIGHT. ONE CAMPUS. ONE VIBE.
            </p>
          </div>

          {/* ── STAGE 3: 2K26 ILLUMINATION & EVENT DOSSIER (48% -> 76%) ── */}
          <div
            className="absolute inset-x-0 mx-auto max-w-4xl px-4 flex flex-col items-center transition-all duration-150"
            style={{
              opacity: stage3Opacity,
              transform: `scale(${0.94 + p * 0.08}) translateY(${
                (0.62 - p) * 50
              }px)`,
              pointerEvents: stage3Opacity > 0.4 ? "auto" : "none",
              display: stage3Opacity <= 0 ? "none" : "flex",
            }}
          >
            <div className="flex items-center justify-center gap-3 sm:gap-6 mb-4">
              <div className="h-[2px] w-12 sm:w-20 bg-[#FF0000] shadow-[0_0_10px_#FF0000]" />
              <span className="text-5xl sm:text-7xl md:text-8xl font-black font-display text-[#FF0000] tracking-wider glow-red-lg leading-none">
                2K26
              </span>
              <div className="h-[2px] w-12 sm:w-20 bg-[#FF0000] shadow-[0_0_10px_#FF0000]" />
            </div>

            {/* Editorial Trio Dossier Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full p-4 rounded-2xl bg-[#080808]/92 border border-[#222222] shadow-[0_15px_40px_rgba(0,0,0,0.9)] text-left">
              {/* Date */}
              <div className="flex items-center gap-3 p-1.5">
                <div className="h-10 w-10 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/30 flex items-center justify-center text-[#FF0000] shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#A0A0A0]">
                    DATE
                  </p>
                  <p className="text-xs sm:text-sm font-extrabold text-white uppercase font-display tracking-wide">
                    26.09.26 &bull; SATURDAY
                  </p>
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-center gap-3 p-1.5 sm:border-l sm:border-[#222222]">
                <div className="h-10 w-10 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/30 flex items-center justify-center text-[#FF0000] shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#A0A0A0]">
                    VENUE
                  </p>
                  <p className="text-xs sm:text-sm font-extrabold text-white uppercase font-display tracking-wide truncate max-w-[190px]">
                    {venue}
                  </p>
                </div>
              </div>

              {/* Doors */}
              <div className="flex items-center gap-3 p-1.5 sm:border-l sm:border-[#222222]">
                <div className="h-10 w-10 rounded-xl bg-[#FF0000]/10 border border-[#FF0000]/30 flex items-center justify-center text-[#FF0000] shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#A0A0A0]">
                    TIMING
                  </p>
                  <p className="text-xs sm:text-sm font-extrabold text-white uppercase font-display tracking-wide">
                    {doors}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── STAGE 4: CLIMAX & CONVERSION CTAs (74% -> 100%) ── */}
          <div
            className="absolute inset-x-0 mx-auto max-w-4xl px-4 flex flex-col items-center transition-all duration-150"
            style={{
              opacity: stage4Opacity,
              transform: `translateY(${(1 - p) * 40}px)`,
              pointerEvents: stage4Opacity > 0.4 ? "auto" : "none",
              display: stage4Opacity <= 0 ? "none" : "flex",
            }}
          >
            <span className="text-[11px] font-mono font-bold text-[#FF0000] tracking-widest uppercase bg-[#FF0000]/10 border border-[#FF0000]/30 px-3 py-1 rounded-full mb-3 shadow-[0_0_15px_rgba(255,0,0,0.3)]">
              {"//"} WRISTBANDS RESERVED LIVE
            </span>

            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black font-display uppercase tracking-tight text-white mb-3">
              YOUR NIGHT STARTS HERE
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-[#D4D4D4] max-w-lg mb-8 font-sans">
              Limited club capacity strictly enforced. Choose your admission tier
              before allocation concludes.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link href="/tickets" className="w-full sm:w-auto">
                <Button
                  size="xl"
                  variant="neon"
                  className="w-full sm:w-auto min-w-[230px]"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  GET YOUR PASS
                </Button>
              </Link>
              <Link href="/event" className="w-full sm:w-auto">
                <Button
                  size="xl"
                  variant="outline"
                  className="w-full sm:w-auto min-w-[190px]"
                  leftIcon={<Compass className="h-5 w-5 text-[#FF0000]" />}
                >
                  EXPLORE EVENT
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── 5. RIGHT-CORNER FLOATING EVENT HUD (COVERS/REPLACES ANY CORNER ARTIFACT) ── */}
        <div className="fixed bottom-6 right-6 z-40 select-none">
          <div className="flex flex-col gap-2.5 p-3 sm:p-3.5 rounded-xl bg-[#080808]/95 border border-[#2E2E2E] hover:border-[#FF0000]/70 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.92)] transition-all min-w-[210px]">
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono font-bold tracking-widest text-white uppercase">
                XPLOSION 2K26
              </span>
              <span className="text-[9px] font-mono font-black text-[#FF0000] bg-[#FF0000]/10 px-1.5 py-0.5 rounded border border-[#FF0000]/30">
                0{activeStage} / 05
              </span>
            </div>

            <div className="h-px w-full bg-[#1F1F1F]" />

            {/* Instant Ticket Action */}
            <Link
              href="/tickets"
              className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-[#FF0000] text-black font-black font-display text-xs tracking-wider uppercase hover:bg-[#E60000] hover:shadow-[0_0_15px_rgba(255,0,0,0.6)] transition-all"
            >
              <span>GET YOUR PASS</span>
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[3]" />
            </Link>

            {/* Scrub Progress Bar */}
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex-1 h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF0000] shadow-[0_0_8px_#FF0000] transition-all duration-75"
                  style={{ width: `${Math.max(4, Math.round(p * 100))}%` }}
                />
              </div>
              <span className="text-[9px] font-mono font-bold text-[#A0A0A0]">
                {Math.round(p * 100)}%
              </span>
            </div>

            {/* Bottom Status / Navigation Cue */}
            <div className="text-[9px] font-mono text-[#6F6F6F] flex items-center justify-between">
              <span>{"//"} CINEMATIC CAM</span>
              <span className="text-[#E5E5E5] font-bold flex items-center gap-0.5">
                {p > 0.9 ? "PASSES BELOW ↓" : "SCROLL ↓"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
