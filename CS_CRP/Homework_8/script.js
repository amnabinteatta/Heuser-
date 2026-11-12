/**
 * ============================================================================
 * THE CREATIVE LAB — UNCONVENTIONAL PERSONAL PORTFOLIO
 * Author: Amna Binte Atta
 * Architecture: Vanilla JavaScript (ES6+)
 * Compatibility: Static GitHub Pages (No build tools or backends needed)
 * ============================================================================
 */
(function () {
  'use strict';
  /* ==========================================================================
     1. CONSTANTS & SYSTEM CONFIGURATION
     ========================================================================== */
  
  // PRIMARY EXTERNAL PROJECT LINK (HOMEWORK 7 / HOMEWORK 6 REPOSITORY)
  const EXTERNAL_PROJECT_URL = 'https://github.com/amnabinteatta/Heuser-/tree/main/CS_CRP/Homework_6';
  const GITHUB_PAGES_URL = 'https://amnabinteatta.github.io/Heuser-/CS_CRP/Homework_6/';
  // CHAMBER IDENTIFIERS MAPPING
  const CHAMBERS = {
    '1': 'chamber-identity',
    '2': 'chamber-workshop',
    '3': 'chamber-trophy',
    '4': 'chamber-future',
    '5': 'chamber-transmit'
  };
  // PALETTE FOR DYNAMIC ACCENTS & PARTICLE BURSTS
  const COLORS = {
    purple: '#9B5DE5',
    lime: '#D4FF4F',
    coral: '#FF6B4A',
    lavender: '#C8B6FF',
    charcoal: '#17151F'
  };
  /* ==========================================================================
     2. STATE MANAGEMENT
     ========================================================================== */
