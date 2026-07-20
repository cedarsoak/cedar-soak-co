"use client";

import { useEffect, useRef } from "react";
import EmberLine from "./EmberLine";

type Particle = {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  phase: number;
  alpha: number;
};

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const hero = heroRef.current;
    if (!video || !hero) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      video.removeAttribute("autoplay");
      video.pause();
      return;
    }

    if (window.innerWidth < 768) {
      const mp4Source = video.querySelector('source[type="video/mp4"]') as HTMLSourceElement | null;
      if (mp4Source) {
        mp4Source.src = "/hero-trailer-mobile.mp4";
        video.load();
        video.play().catch(() => {});
      }
    }

    // Rising embers particle field
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let animId = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function sizeCanvas() {
      const rect = hero!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      canvas!.style.width = `${rect.width}px`;
      canvas!.style.height = `${rect.height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticle(rect: DOMRect, startAtBottom: boolean): Particle {
      return {
        x: Math.random() * rect.width,
        y: startAtBottom ? rect.height + Math.random() * 60 : Math.random() * rect.height,
        r: 1 + Math.random() * 2.4,
        speed: 0.35 + Math.random() * 0.7,
        drift: (Math.random() - 0.5) * 0.6,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.25 + Math.random() * 0.55,
      };
    }

    function initParticles() {
      const rect = hero!.getBoundingClientRect();
      const count = rect.width < 640 ? 22 : 40;
      particles = Array.from({ length: count }, () => makeParticle(rect, false));
    }

    function tick() {
      const rect = hero!.getBoundingClientRect();
      ctx!.clearRect(0, 0, rect.width, rect.height);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += Math.sin(p.y * 0.02 + p.phase) * p.drift * 0.4;
        if (p.y < -10) Object.assign(p, makeParticle(rect, true));
        const flicker = 0.7 + Math.sin(Date.now() * 0.004 + p.phase) * 0.3;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(224,164,104,${(p.alpha * flicker).toFixed(3)})`;
        ctx!.shadowColor = "rgba(201,124,61,0.8)";
        ctx!.shadowBlur = 6;
        ctx!.fill();
      });
      animId = requestAnimationFrame(tick);
    }

    sizeCanvas();
    initParticles();
    tick();

    const onResize = () => {
      sizeCanvas();
      initParticles();
    };
    window.addEventListener("resize", onResize, { passive: true });

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <section className="hero" id="top" ref={heroRef}>
      <div className="hero-media">
        <video
          ref={videoRef}
          poster="/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/hero-trailer.webm" type="video/webm" />
          <source src="/hero-trailer.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="hero-overlay"></div>
      <canvas className="hero-embers" ref={canvasRef}></canvas>
      <div className="wrap">
        <div className="hero-content">
          <span className="eyebrow">Dayton, Ohio &middot; Mobile Delivery</span>
          <h1>
            Escape without
            <br />
            leaving home<span style={{ color: "var(--ember-light)" }}>.</span>
          </h1>
          <EmberLine className="hero-ember-line" />
          <p className="sub">
            A handcrafted cedar hot tub, delivered, filled, and fired up in your own backyard.
            Professionally set up, personally walked through, gone before Monday.
          </p>

          <div className="price-chip">
            <span className="amt">$747</span>
            <span className="lbl">for a 3-night escape</span>
          </div>

          <div className="cta-row">
            <a href="#book" className="btn btn-primary">
              Request to book
            </a>
            <a href="#how-it-works" className="btn btn-ghost">
              See how it works
            </a>
          </div>

          <div className="trust-strip">
            <span>Veteran owned</span>
            <span>Professionally maintained</span>
            <span>Serving Dayton &amp; surrounding communities</span>
          </div>
        </div>
      </div>
      <a href="#how-it-works" className="scroll-cue" aria-label="Scroll to learn how it works">
        <span>Scroll</span>
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="14" height="22" rx="7" stroke="#CFC6B7" strokeWidth="1.2" />
          <circle cx="8" cy="7" r="2" fill="#E0A468" />
        </svg>
      </a>
    </section>
  );
}
