/**
 * ============================================================================
 * CS CRP HOMEWORK 9 — CENTRAL DIGITAL HUB JAVASCRIPT
 * Author: Amna Binte Atta
 * Description: Interactive particle canvas and card animations for the home page.
 * ============================================================================
 */
(function () {
  'use strict';
  // --- Ambient Canvas Setup ---
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  const particles = [];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const particleCount = prefersReducedMotion ? 10 : (window.innerWidth < 768 ? 25 : 50);
  const colors = ['#9B5DE5', '#00F0FF', '#D4FF4F', '#C8B6FF'];
  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 2 + 0.8;
      this.alpha = Math.random() * 0.4 + 0.2;
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
