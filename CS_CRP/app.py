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
    """Serves static assets (CSS, JS) for the game."""
    return send_from_directory(BASE_DIR / 'game', filename)

# ============================================================================
# 3. PORTFOLIO ROUTE ('/portfolio' & '/portfolio/')
# ============================================================================
@app.route('/portfolio')
def portfolio_redirect():
    """Redirects /portfolio to /portfolio/ ensuring relative asset resolution."""
    return redirect('/portfolio/')

@app.route('/portfolio/')
def portfolio():
    """Serves the Homework 8 The Creative Lab portfolio."""
    return send_from_directory(BASE_DIR / 'portfolio', 'index.html')

@app.route('/portfolio/<path:filename>')
def portfolio_static(filename):
    """Serves static assets (CSS, JS, assets/amna.jpg) for the portfolio."""
    return send_from_directory(BASE_DIR / 'portfolio', filename)

# ============================================================================
# 4. POKEAPI ROUTE ('/api' & '/api/')
# ============================================================================
@app.route('/api')
def api_redirect():
    """Redirects /api to /api/ ensuring relative asset resolution."""
    return redirect('/api/')

@app.route('/api/')
def api_page():
    """Serves the Pokémon Creature Discovery Lab page."""
    return send_from_directory(BASE_DIR / 'api', 'index.html')

@app.route('/api/<path:filename>')
def api_static(filename):
    """Serves static assets (CSS, JS) for the API page."""
    return send_from_directory(BASE_DIR / 'api', filename)

# ============================================================================
# 5. CUSTOM 404 ERROR HANDLER
# ============================================================================
@app.errorhandler(404)
def page_not_found(error):
    """
    Friendly, custom 404 error page displayed when a visitor enters an invalid URL.
    Includes a direct return button back to the main home page.
    """
    html_404 = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 — Chamber Not Found</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #17151F;
      color: #f6f4fb;
      font-family: 'Space Grotesk', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
      background-image: radial-gradient(circle at 50% 50%, rgba(155, 93, 229, 0.15) 0%, transparent 70%);
    }
    .card-404 {
      background: rgba(30, 27, 43, 0.85);
      border: 1px solid rgba(200, 182, 255, 0.2);
      border-radius: 20px;
      padding: 50px 40px;
      max-width: 540px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    }
    .code-404 {
      font-family: 'Syne', sans-serif;
      font-size: 5rem;
      font-weight: 800;
      line-height: 1;
      color: #D4FF4F;
      margin-bottom: 12px;
      text-shadow: 0 0 25px rgba(212, 255, 79, 0.35);
    }
    .title-404 {
      font-family: 'Syne', sans-serif;
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 14px;
    }
    .desc-404 {
      color: #C8B6FF;
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .btn-home {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #D4FF4F;
      color: #17151F;
      font-weight: 700;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 999px;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px rgba(212, 255, 79, 0.25);
    }
    .btn-home:hover {
      background: #e2ff85;
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(212, 255, 79, 0.45);
    }
    .tag-mono {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: #8b80a6;
      margin-top: 24px;
      display: block;
    }
  </style>
</head>
<body>
  <div class="card-404">
    <div class="code-404">404</div>
    <h1 class="title-404">COORDINATES UNKNOWN</h1>
    <p class="desc-404">The chamber or resource you are trying to reach does not exist in this laboratory sector. Check your route or return to the main hub.</p>
    <a href="/" class="btn-home">&larr; Return to Home Hub</a>
    <span class="tag-mono">[ SYSTEM: FLASK_ROUTER // ROUTE_NOT_FOUND ]</span>
  </div>
</body>
</html>"""
    return html_404, 404





# ============================================================================
# SERVER ENTRY POINT (LOCAL DEVELOPMENT & RENDER)
# ============================================================================
if __name__ == '__main__':
    # Render provides the port in the PORT environment variable
    # For local testing, we default to 5000
    port = int(os.environ.get('PORT', 5000))
    # 0.0.0.0 makes the server accessible across the local network and on Render
    app.run(host='0.0.0.0', port=port, debug=False)
