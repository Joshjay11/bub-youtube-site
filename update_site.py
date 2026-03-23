"""
BUB YouTube Writer - Site Update Script
Run from C:\Dev\bub-youtube-site\
Fetches current site, applies all tier changes, saves as index.html
"""
import urllib.request
import re

print("Fetching current site...")
urllib.request.urlretrieve('https://bub-youtube-site.vercel.app', 'index_backup.html')

with open('index_backup.html', 'r', encoding='utf-8') as f:
    html = f.read()

print(f"Current size: {len(html)} chars")

# ============================================================
# REPLACEMENT 1: Home page subtitle
# ============================================================
html = html.replace(
    'From a single script to full video production.',
    'From research packs to full creative packages.'
)
html = html.replace(
    'Retention-engineered voiceover scripts with fact-check reports and argument analysis.',
    'Retention-engineered voiceover scripts with fact-check reports, strategic briefs, and broadcast-quality AI voiceovers.'
)

# ============================================================
# REPLACEMENT 2: Solution card text
# ============================================================
html = html.replace(
    'You get a fact-check report, argument analysis, and a retention-engineered script - ready to shoot or ready to upload.',
    'You get a fact-check report, strategic brief, and a retention-engineered script. Add a broadcast-quality voiceover and your editor has everything they need.'
)

# ============================================================
# REPLACEMENT 3: Feature grid - Full Production -> Voiceover Engineering
# ============================================================
html = html.replace(
    '<h4 class="feature-title">Full Production</h4><p class="feature-desc">From voiceover script to finished video - visuals, music, AI voiceover, everything. Or just the script. You choose your depth.</p>',
    '<h4 class="feature-title">Voiceover Engineering</h4><p class="feature-desc">Broadcast-quality AI voiceovers via ElevenLabs. Custom voice selection, natural pacing, emotional variation. Drop the audio into your editor and go.</p>'
)

# ============================================================
# REPLACEMENT 4: Home page pricing subtitle
# ============================================================
html = html.replace(
    'From DIY templates to turnkey video production.',
    'From DIY tools to done-for-you scripts and voiceovers.'
)

# ============================================================
# REPLACEMENT 5: Home page tier cards (find and replace the grid)
# ============================================================
old_tier_grid = '''<div class="grid-5">
      <div class="reveal"><div class="tier-card" onclick="goTo(5)"><div class="tier-price">$79</div><div class="tier-sub">one-time</div><div class="tier-name">Template</div><p class="tier-desc">Notion-based script system. Hook formulas, AI prompts, retention checklist.</p></div></div>
      <div class="reveal reveal-d1"><div class="tier-card" onclick="goTo(4)"><div class="tier-price">$250</div><div class="tier-sub">per project</div><div class="tier-name">Research</div><p class="tier-desc">7-model synthesis, fact-check report, argument analysis. No script.</p></div></div>
      <div class="reveal reveal-d2"><div class="tier-card featured" onclick="goTo(4)"><span class="tier-tag">Popular</span><div class="tier-price">$500</div><div class="tier-sub">per project</div><div class="tier-name">The Script</div><p class="tier-desc">Full voiceover script + fact-check + argument analysis. 2 revision rounds.</p></div></div>
      <div class="reveal reveal-d3"><div class="tier-card" onclick="goTo(4)"><div class="tier-price">$1,750</div><div class="tier-sub">per project</div><div class="tier-name">Script + Assets</div><p class="tier-desc">Everything in The Script plus production-ready beats, slides, and prompts.</p></div></div>
      <div class="reveal reveal-d4"><div class="tier-card" onclick="goTo(4)"><div class="tier-price">$2,500+</div><div class="tier-sub">per project</div><div class="tier-name">Full Video</div><p class="tier-desc">Topic in, finished video out. Voiceover, visuals, music - ready to upload.</p></div></div>
    </div>'''

new_tier_grid = '''<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px;">
      <div class="reveal"><div class="tier-card" onclick="goTo(5)"><div class="tier-price">$79</div><div class="tier-sub">one-time</div><div class="tier-name">Script System</div><p class="tier-desc">Interactive web app. Hook formulas, AI prompts, retention tools, pacing calculator.</p></div></div>
      <div class="reveal reveal-d1"><div class="tier-card" onclick="goTo(4)"><div class="tier-price">$149</div><div class="tier-sub">per project</div><div class="tier-name">Research Pack</div><p class="tier-desc">7-model synthesis, fact-check report, argument analysis, angle recommendations.</p></div></div>
      <div class="reveal reveal-d2"><div class="tier-card featured" onclick="goTo(4)"><span class="tier-tag">Popular</span><div class="tier-price">$500</div><div class="tier-sub">per project</div><div class="tier-name">The Script</div><p class="tier-desc">Voice-matched, retention-engineered script + research + strategic brief. 2 revisions.</p></div></div>
      <div class="reveal reveal-d3"><div class="tier-card" onclick="goTo(4)"><div class="tier-price">$750</div><div class="tier-sub">per project</div><div class="tier-name">Script + Voice</div><p class="tier-desc">Everything in The Script plus broadcast-quality ElevenLabs voiceover + music cues.</p></div></div>
      <div class="reveal reveal-d4"><div class="tier-card" onclick="goTo(4)"><div class="tier-price">$1,200</div><div class="tier-sub">per project</div><div class="tier-name">Creative Package</div><p class="tier-desc">Script, voiceover, beat sheet, B-roll list, image prompts, thumbnail concepts.</p></div></div>
      <div class="reveal reveal-d4"><div class="tier-card" onclick="goTo(4)"><div class="tier-price">$1,600</div><div class="tier-sub">per month</div><div class="tier-name">Retainer</div><p class="tier-desc">4 scripts + voiceovers/month. Channel strategy. Niche exclusivity. 47% savings.</p></div></div>
    </div>'''

html = html.replace(old_tier_grid, new_tier_grid)

# ============================================================
# REPLACEMENT 6: FAQ - video production -> voiceover
# ============================================================
html = html.replace(
    '<h4 class="faq-q">Can you produce the video?</h4><p class="faq-a">Yes. Our Full Video tier delivers a ready-to-upload video with AI voiceover, visuals, and music. Starting at $2,500.</p>',
    '<h4 class="faq-q">Can you do the voiceover?</h4><p class="faq-a">Yes. Our Script + Voiceover tier ($750) includes a broadcast-quality ElevenLabs voiceover with custom voice selection, WAV + MP3 delivery, and music cue sheets. Or add a standalone voiceover to any project for $150.</p>'
)

# ============================================================
# REPLACEMENT 7: Intake form dropdown
# ============================================================
html = html.replace(
    '''<option>DIY Template - $79</option>
          <option>Research Pack - $250</option>
          <option>The Script - $500</option>
          <option>Script + Assets - $1,750</option>
          <option>Full Video - $2,500+</option>
          <option>Monthly Retainer</option>''',
    '''<option>Script System (Web App) - $79</option>
          <option>Research Pack - $149</option>
          <option>The Script - $500</option>
          <option>Script + Voiceover - $750</option>
          <option>Full Creative Package - $1,200</option>
          <option>Monthly Retainer - $1,600/mo</option>
          <option>Standalone Voiceover - $150</option>'''
)

# ============================================================
# REPLACEMENT 8: Template page - Notion -> web app
# ============================================================
html = html.replace('DIY Script Template', 'Script System')
html = html.replace(
    'A Notion-based scriptwriting system with research frameworks, hook formulas, AI prompt templates, and the retention checklist we use on every client project.',
    'An interactive web app with research frameworks, hook formulas, AI-powered prompts, retention tools, a pacing calculator, and the script canvas we use on every client project.'
)
html = html.replace('Get the Template - $79', 'Get the Script System - $79')
html = html.replace('Instant Notion access', 'Instant access. Updates forever.')
html = html.replace(
    'Instant access via Notion. No subscription. Use it forever.',
    'Instant access. No subscription. Updates included forever.'
)

# ============================================================
# WRITE THE RESULT
# ============================================================
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Updated size: {len(html)} chars")
print("index.html updated successfully!")
print("")
print("Next steps:")
print("  git pull --rebase")
print("  git add .")
print('  git commit -m "Updated tiers: voiceover focus, removed video production, new pricing"')
print("  git push")