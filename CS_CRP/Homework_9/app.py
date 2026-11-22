"""
CS CRP HOMEWORK 9 — FLASK WEB SERVER
Author: Amna Binte Atta
Description: Production-ready Flask server serving Home, Game, Portfolio, and PokeAPI.
Deployment Target: Render (Free Web Service tier) with Gunicorn.
"""
import os
from pathlib import Path
from flask import Flask, send_from_directory, redirect, abort, render_template_string
# Base directory for Homework_9
BASE_DIR = Path(__file__).resolve().parent
# Initialize Flask application
app = Flask(__name__)
# ============================================================================
# 1. HOME ROUTE ('/')
# ============================================================================
@app.route('/')
def home():
    """Main landing page featuring navigation to /game, /portfolio, and /api."""
    return send_from_directory(BASE_DIR / 'home', 'index.html')
@app.route('/home/<path:filename>')
def home_static(filename):
    """Serves static assets (CSS, JS) for the home page."""
    return send_from_directory(BASE_DIR / 'home', filename)
# ============================================================================
# 2. GAME ROUTE ('/game' & '/game/')
# ============================================================================
@app.route('/game')
def game_redirect():
    """Redirects /game to /game/ ensuring relative asset resolution."""
    return redirect('/game/')
@app.route('/game/')
def game():
    """Serves the Homework 6 Neon Sequence game."""
    return send_from_directory(BASE_DIR / 'game', 'index.html')
@app.route('/game/<path:filename>')
def game_static(filename):
