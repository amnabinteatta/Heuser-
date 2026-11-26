/**
 * ============================================================================
 * CS CRP HOMEWORK 9 — POKÉMON CREATURE DISCOVERY LAB JAVASCRIPT
 * Author: Amna Binte Atta
 * Data Provider: PokeAPI (Official Public REST API — https://pokeapi.co/)
 * ============================================================================
 */
(function () {
  'use strict';
  // --- Configuration & Constants ---
  const API_BASE_URL = 'https://pokeapi.co/api/v2';
  const BATCH_LIMIT = 20;
  // Type Color Mapping for Badges and Card Highlights
  const TYPE_COLORS = {
    normal: '#A8A878',
    fire: '#FF5722',
    water: '#2196F3',
    electric: '#FFD600',
    grass: '#4CAF50',
    ice: '#00E5FF',
    fighting: '#FF5252',
    poison: '#AB47BC',
    ground: '#8D6E63',
    flying: '#80D8FF',
    psychic: '#E91E63',
    bug: '#8BC34A',
    rock: '#78909C',
    ghost: '#7E57C2',
    dragon: '#7C4DFF',
    steel: '#90A4AE',
    fairy: '#F48FB1',
    dark: '#424242'
  };
  // State Management
  const state = {
    offset: 0,
    pokemonList: [],         // Array of detailed pokemon objects
    pokemonMap: new Map(),   // Map for quick lookup by ID or name
    currentFilter: 'all',    // Current elemental type filter
    searchQuery: '',
    isLoading: false
  };
