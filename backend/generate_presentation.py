import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

def create_deck(output_path="CineMind_Project_Presentation.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # -------------------------------------------------------------
    # Palette definition (Tailwind Slate / Indigo / Amber / Emerald)
    # -------------------------------------------------------------
    BG_DARK = RGBColor(15, 23, 42)        # Slate 900
    BG_CARD = RGBColor(30, 41, 59)        # Slate 800
    BG_CONTAINER = RGBColor(20, 27, 45)   # Slate 850
    ACCENT_INDIGO = RGBColor(99, 102, 241)# Indigo 500
    ACCENT_AMBER = RGBColor(245, 158, 11) # Amber 500
    ACCENT_CYAN = RGBColor(6, 182, 212)   # Cyan 500
    ACCENT_EMERALD = RGBColor(16, 185, 129) # Emerald 500
    TEXT_LIGHT = RGBColor(248, 250, 252)  # Slate 50
    TEXT_MUTED = RGBColor(148, 163, 184)  # Slate 400
    TEXT_ACCENT = RGBColor(129, 140, 248) # Indigo 400
    BORDER_COLOR = RGBColor(51, 65, 85)   # Slate 700

    # Path to screenshots
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    screenshots_dir = os.path.join(base_dir, "docs", "presentation_screenshots")

    blank_layout = prs.slide_layouts[6]

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), prs.slide_width, prs.slide_height
        )
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text="CINEMIND • MOVIE DECISION INTELLIGENCE", slide_num=None):
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(11), Inches(0.35))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        tf_cat.margin_left = Inches(0)
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT_INDIGO

        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.65), Inches(11.5), Inches(0.65))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = Inches(0)
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_LIGHT

        if slide_num:
            num_box = slide.shapes.add_textbox(Inches(11.8), Inches(0.4), Inches(0.8), Inches(0.4))
            tf_num = num_box.text_frame
            p_num = tf_num.paragraphs[0]
            p_num.text = f"{slide_num:02d}"
            p_num.font.size = Pt(12)
            p_num.font.bold = True
            p_num.font.color.rgb = TEXT_MUTED
            p_num.alignment = PP_ALIGN.RIGHT

    def add_image_card(slide, img_filename, box_left, box_top, box_w, box_h, caption=None):
        img_path = os.path.join(screenshots_dir, img_filename)
        
        # Outer Card Container
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, box_left, box_top, box_w, box_h)
        card.fill.solid()
        card.fill.fore_color.rgb = BG_CONTAINER
        card.line.color.rgb = BORDER_COLOR
        card.line.width = Pt(1.5)

        if not os.path.exists(img_path):
            tf = card.text_frame
            p = tf.paragraphs[0]
            p.text = f"[Image not found: {img_filename}]"
            p.font.size = Pt(12)
            p.font.color.rgb = ACCENT_AMBER
            return card

        # Calculate exact aspect ratio to prevent stretching
        with Image.open(img_path) as im:
            iw, ih = im.size
            aspect = iw / ih

        pad = Inches(0.12)
        caption_space = Inches(0.38) if caption else Inches(0)
        avail_w = box_w - (pad * 2)
        avail_h = box_h - (pad * 2) - caption_space

        target_w = avail_w
        target_h = int(avail_w / aspect)
        if target_h > avail_h:
            target_h = avail_h
            target_w = int(avail_h * aspect)

        img_left = int(box_left + (box_w - target_w) / 2)
        img_top = int(box_top + pad + ((avail_h - target_h) / 2))

        slide.shapes.add_picture(img_path, img_left, img_top, width=target_w, height=target_h)

        if caption:
            cbox = slide.shapes.add_textbox(box_left + pad, box_top + box_h - caption_space, box_w - (pad * 2), caption_space)
            ctf = cbox.text_frame
            ctf.margin_top = Inches(0)
            ctf.margin_bottom = Inches(0)
            cp = ctf.paragraphs[0]
            cp.text = f"📷 {caption}"
            cp.font.size = Pt(10)
            cp.font.bold = True
            cp.font.color.rgb = ACCENT_AMBER
            cp.alignment = PP_ALIGN.CENTER

        return card

    # =============================================================
    # SLIDE 1: Title Slide
    # =============================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    tbox = s1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.3), Inches(4.8))
    tf1 = tbox.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "🎬 CINEMIND"
    p0.font.size = Pt(46)
    p0.font.bold = True
    p0.font.color.rgb = ACCENT_INDIGO

    p1 = tf1.add_paragraph()
    p1.text = "Personalised Movie Recommendation & Decision Intelligence Platform"
    p1.font.size = Pt(22)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_LIGHT
    p1.space_before = Pt(8)

    p2 = tf1.add_paragraph()
    p2.text = "An evidence-based movie platform featuring Bayesian rating trust analysis, regional Indian cinema discovery (Telugu, Tamil, Malayalam, Kannada, Hindi), personal Taste DNA vectors, and AI conversational search."
    p2.font.size = Pt(13)
    p2.font.color.rgb = TEXT_MUTED
    p2.space_before = Pt(14)

    p3 = tf1.add_paragraph()
    p3.text = "Designed & Implemented by: Navaneeth"
    p3.font.size = Pt(15)
    p3.font.bold = True
    p3.font.color.rgb = ACCENT_AMBER
    p3.space_before = Pt(24)

    p4 = tf1.add_paragraph()
    p4.text = "Technology Stack: React 19 • Python 3 (Flask REST API) • MySQL 8.0 • Tailwind CSS • Bcrypt • PyJWT"
    p4.font.size = Pt(12)
    p4.font.color.rgb = TEXT_ACCENT
    p4.space_before = Pt(6)

    # =============================================================
    # SLIDE 2: Problem Statement & Project Objectives
    # =============================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "Problem Statement & Project Objectives", "PROJECT FOUNDATION", 2)

    cards_data_s2 = [
        ("The Core Problems in Modern Movie Discovery", [
            "• Rating Bias & Fake Hype: Obscure films with a single 5-star review artificially top charts; popular films suffer from review-bombing.",
            "• Regional Cinema Neglect: Rich South Asian industries (Telugu, Tamil, Malayalam, Kannada) are buried under generic global algorithms.",
            "• Lack of Explainability: Mainstream platforms act as black boxes with zero transparency into WHY a movie was recommended.",
            "• Social Decision Paralysis: Groups and families waste 30-45 minutes arguing over what to watch due to taste misalignment."
        ], ACCENT_AMBER),
        ("The CineMind Solution & Approach", [
            "• Bayesian Evidence Scoring: Mathematically smooths raw ratings against a verified MovieLens prior benchmark (C = 3.65★, m = 25).",
            "• 1-Click Multi-Language Discovery: Native first-class filters for Telugu, Tamil, Malayalam, Kannada, Hindi, and English cinema.",
            "• Transparent Taste DNA: Mathematical affinity vectors calculated from user ratings to show precise % match and confidence bounds.",
            "• Social Watch Decision Rooms: Egalitarian consensus algorithms that minimize misery so every participant enjoys the movie."
        ], ACCENT_INDIGO)
    ]

    for i, (title, points, color) in enumerate(cards_data_s2):
        card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + i * 5.9), Inches(1.5), Inches(5.6), Inches(5.2))
        card.fill.solid()
        card.fill.fore_color.rgb = BG_CARD
        card.line.color.rgb = BORDER_COLOR
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.word_wrap = True
        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(16)
        p_t.font.bold = True
        p_t.font.color.rgb = color

        for pt in points:
            p = tf.add_paragraph()
            p.text = pt
            p.font.size = Pt(12)
            p.font.color.rgb = TEXT_LIGHT
            p.space_before = Pt(12)

    # =============================================================
    # SLIDE 3: System Architecture (3-Tier)
    # =============================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "Three-Tier Enterprise System Architecture", "SYSTEM ENGINEERING", 3)

    tiers = [
        ("1. Presentation Tier", "React 19 + Tailwind CSS", [
            "• Single Page Application (SPA) architecture.",
            "• Responsive UI with custom Dark Slate palette.",
            "• Instant 1-click language filter bar & search autocomplete.",
            "• Visual analytics rendered with Chart.js.",
            "• Lucide modern vector icons & micro-interactions."
        ], Inches(0.8), ACCENT_INDIGO),
        ("2. Application Tier", "Python 3 + Flask REST API", [
            "• 9 Modular Blueprints (auth, movies, taste_dna, compare, etc.).",
            "• Bayesian Rating Shrinkage mathematical engine.",
            "• Natural Language Processing entity parser for Assistant.",
            "• PyJWT token generation & stateless authentication.",
            "• Bcrypt salted password hashing security."
        ], Inches(4.75), ACCENT_AMBER),
        ("3. Data Tier", "MySQL 8.0 Server (Port 3306)", [
            "• Relational schema with 12 normalized tables.",
            "• 25 Benchmark films with verified TMDB posters.",
            "• 1,890 Authentic rating records & user accounts.",
            "• SQLAlchemy ORM + PyMySQL driver with connection pooling.",
            "• Foreign key constraints with CASCADE rules."
        ], Inches(8.7), ACCENT_CYAN)
    ]

    for title, subtitle, bullets, left_pos, color in tiers:
        box = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_pos, Inches(1.5), Inches(3.75), Inches(5.2))
        box.fill.solid()
        box.fill.fore_color.rgb = BG_CARD
        box.line.color.rgb = color
        box.line.width = Pt(1.5)

        tf = box.text_frame
        tf.word_wrap = True
        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(15)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_LIGHT

        p_sub = tf.add_paragraph()
        p_sub.text = subtitle
        p_sub.font.size = Pt(11)
        p_sub.font.bold = True
        p_sub.font.color.rgb = color
        p_sub.space_before = Pt(4)

        for b in bullets:
            p_b = tf.add_paragraph()
            p_b.text = b
            p_b.font.size = Pt(11)
            p_b.font.color.rgb = TEXT_MUTED
            p_b.space_before = Pt(8)

    # =============================================================
    # SLIDE 4: User Authentication & Security (Screenshot: 01_auth_modal.png)
    # =============================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "Security & User Authentication", "IDENTITY & ACCESS MANAGEMENT", 4)

    left_box_s4 = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.4), Inches(5.2))
    left_box_s4.fill.solid()
    left_box_s4.fill.fore_color.rgb = BG_CARD
    left_box_s4.line.color.rgb = BORDER_COLOR
    tf4 = left_box_s4.text_frame
    tf4.word_wrap = True

    p = tf4.paragraphs[0]
    p.text = "Authentication Capabilities:"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER

    points_s4 = [
        "• Dual Mode Modal: Single streamlined interface supporting both registration and sign-in with full validation.",
        "• Bcrypt Password Security: Passwords hashed with secure 12-round salt before saving in MySQL. Plaintext passwords never stored.",
        "• Stateless JWT Tokens: Returns encrypted PyJWT bearer token upon login, ensuring fast stateless REST requests.",
        "• Role-Based Access: Supports 'Viewer' and 'Admin' privileges (Admin can add movies and refresh ratings).",
        "• Quick-Fill Test Buttons: 1-click test accounts (Demo Viewer & Admin) for fast, seamless teacher evaluation."
    ]
    for pt in points_s4:
        p = tf4.add_paragraph()
        p.text = pt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_LIGHT
        p.space_before = Pt(10)

    add_image_card(s4, "01_auth_modal.png", Inches(6.5), Inches(1.5), Inches(6.0), Inches(5.2), "Live CineMind Registration & Sign-In Dialog")

    # =============================================================
    # SLIDE 5: Movie Discovery & Regional Filters (Screenshot: 02_discover_hero.png)
    # =============================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Feature 1: Movie Discovery Dashboard & Regional Filters", "CORE FEATURE PRESENTATION", 5)

    left_box_s5 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.4), Inches(5.2))
    left_box_s5.fill.solid()
    left_box_s5.fill.fore_color.rgb = BG_CARD
    left_box_s5.line.color.rgb = BORDER_COLOR
    tf5 = left_box_s5.text_frame
    tf5.word_wrap = True

    p = tf5.paragraphs[0]
    p.text = "Discovery Engine Features:"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER

    points_s5 = [
        "• 1-Click Language Buttons: Instant filter chips for All Cinema, Telugu, Tamil, Malayalam, Kannada, Hindi, and English.",
        "• Recommended Movies Carousel: Dynamic horizontal spotlight highlighting benchmark regional masterpieces (Drishyam, Parasite, RRR, Dangal, Charlie 777).",
        "• Real-Time Search Bar: Sub-millisecond title and director fuzzy matching directly querying MySQL index.",
        "• Verified TMDB Posters: Clean, cinematic artwork cards displaying verified release years and regional origins."
    ]
    for pt in points_s5:
        p = tf5.add_paragraph()
        p.text = pt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_LIGHT
        p.space_before = Pt(10)

    add_image_card(s5, "02_discover_hero.png", Inches(6.5), Inches(1.5), Inches(6.0), Inches(5.2), "Discover Page Hero: Language Bar & Carousel")

    # =============================================================
    # SLIDE 6: Movie Catalogue & Multi-Metric Sorting (Screenshot: 03_catalogue_filters.png)
    # =============================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Feature 2: Movie Catalogue Grid & Sorting Controls", "CATALOGUE EXPLORATION", 6)

    left_box_s6 = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.4), Inches(5.2))
    left_box_s6.fill.solid()
    left_box_s6.fill.fore_color.rgb = BG_CARD
    left_box_s6.line.color.rgb = BORDER_COLOR
    tf6 = left_box_s6.text_frame
    tf6.word_wrap = True

    p = tf6.paragraphs[0]
    p.text = "Catalogue Controls & Cards:"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER

    points_s6 = [
        "• Multi-Metric Sorting Dropdown: Sort films by Bayesian Evidence Score, General Rating Mean, Most Reviewed Count, Release Year, or A-Z.",
        "• Interactive Sliders: Filter films using Min Star Rating slider (1.0★ to 5.0★) and Max Runtime limit slider.",
        "• Rich Movie Cards: Highlights language badges, genre tags, exact runtime, Bayesian star rating, and review counts.",
        "• 'Movie Details' Action: 1-click modal revealing full mathematical formulas, director credits, overview, and cast info."
    ]
    for pt in points_s6:
        p = tf6.add_paragraph()
        p.text = pt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_LIGHT
        p.space_before = Pt(10)

    add_image_card(s6, "03_catalogue_filters.png", Inches(6.5), Inches(1.5), Inches(6.0), Inches(5.2), "Catalogue Filters with Bayesian Sort Dropdown")

    # =============================================================
    # SLIDE 7: Rating Trust Analyzer (Mathematical Bayesian Model)
    # =============================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Feature 3: Rating Trust Analyzer (Bayesian Model)", "MATHEMATICAL FORMULATION", 7)

    box7_left = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.6), Inches(5.2))
    box7_left.fill.solid()
    box7_left.fill.fore_color.rgb = BG_CARD
    box7_left.line.color.rgb = BORDER_COLOR
    tf7_l = box7_left.text_frame
    tf7_l.word_wrap = True

    p = tf7_l.paragraphs[0]
    p.text = "Mathematical Formulation:"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER

    formula_p = tf7_l.add_paragraph()
    formula_p.text = "S = (v • R + m • C) / (v + m)"
    formula_p.font.size = Pt(22)
    formula_p.font.bold = True
    formula_p.font.color.rgb = TEXT_ACCENT
    formula_p.space_before = Pt(12)

    terms = [
        "• v = Recorded user review sample count for the film",
        "• R = Raw average rating from viewers (1.0★ to 5.0★)",
        "• m = Prior confidence weight constant (m = 25 reviews)",
        "• C = Global benchmark mean (C = 3.65★ from MovieLens)",
        "• 95% Confidence Interval: ±1.96 • (σ / √v)"
    ]
    for t in terms:
        p_t = tf7_l.add_paragraph()
        p_t.text = t
        p_t.font.size = Pt(11.5)
        p_t.font.color.rgb = TEXT_LIGHT
        p_t.space_before = Pt(8)

    box7_right = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.7), Inches(1.5), Inches(5.8), Inches(5.2))
    box7_right.fill.solid()
    box7_right.fill.fore_color.rgb = BG_CARD
    box7_right.line.color.rgb = BORDER_COLOR
    tf7_r = box7_right.text_frame
    tf7_r.word_wrap = True

    p_r0 = tf7_r.paragraphs[0]
    p_r0.text = "Why This Eliminates Rating Distortion:"
    p_r0.font.size = Pt(16)
    p_r0.font.bold = True
    p_r0.font.color.rgb = ACCENT_INDIGO

    benefits = [
        "1. Solves the 1-Review Flaw: A new film with a single 5.0★ review will NOT top the recommendations; its score shrinks mathematically toward prior C (3.70★).",
        "2. Evidence Certainty: Blockbusters with large review samples (e.g. RRR with 85 reviews, Kantara with 65 reviews) retain high certainty (4.69★).",
        "3. Confidence Tiers:",
        "    • High Evidence (v ≥ 50 reviews) — Narrow error margin (±0.08★)",
        "    • Moderate Evidence (20 ≤ v < 50 reviews) — Standard confidence",
        "    • Limited Evidence (v < 20 reviews) — Broad error margin",
        "4. 100% Transparent: Students and teachers can view exact math in the UI."
    ]
    for b in benefits:
        p_b = tf7_r.add_paragraph()
        p_b.text = b
        p_b.font.size = Pt(11)
        p_b.font.color.rgb = TEXT_LIGHT
        p_b.space_before = Pt(8)

    # =============================================================
    # SLIDE 8: Head-to-Head Comparison (Screenshot: 05_movie_comparison.png)
    # =============================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "Feature 4: Head-to-Head Film Comparison Engine", "DECISION SUPPORT SYSTEM", 8)

    left_box_s8 = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.4), Inches(5.2))
    left_box_s8.fill.solid()
    left_box_s8.fill.fore_color.rgb = BG_CARD
    left_box_s8.line.color.rgb = BORDER_COLOR
    tf8 = left_box_s8.text_frame
    tf8.word_wrap = True

    p = tf8.paragraphs[0]
    p.text = "Comparative Analytics:"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER

    points_s8 = [
        "• Side-by-Side Showdown: Directly compares any two movies (e.g. Telugu 'RRR' vs Tamil 'Vikram').",
        "• Empirical Metrics: Compares Bayesian weighted rating, raw review count, runtime, and genre overlap.",
        "• 95% Confidence Bands: Graphically displays uncertainty intervals to identify which rating is mathematically more trustworthy.",
        "• Personal Compatibility: Cross-references logged-in user's Taste DNA to calculate personalized % fit for both films.",
        "• Automated Verdict: Synthesizes scores into a plain-English recommendation verdict for the viewer."
    ]
    for pt in points_s8:
        p = tf8.add_paragraph()
        p.text = pt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_LIGHT
        p.space_before = Pt(8)

    add_image_card(s8, "05_movie_comparison.png", Inches(6.5), Inches(1.5), Inches(6.0), Inches(5.2), "Head-to-Head Comparison: RRR vs Vikram")

    # =============================================================
    # SLIDE 9: Personal Taste DNA Profile (Screenshot: 06_taste_dna.png)
    # =============================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "Feature 5: Personal Taste DNA & Preference Vectors", "PERSONALIZATION ENGINE", 9)

    left_box_s9 = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.4), Inches(5.2))
    left_box_s9.fill.solid()
    left_box_s9.fill.fore_color.rgb = BG_CARD
    left_box_s9.line.color.rgb = BORDER_COLOR
    tf9 = left_box_s9.text_frame
    tf9.word_wrap = True

    p = tf9.paragraphs[0]
    p.text = "How Taste DNA Works:"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER

    points_s9 = [
        "• Preference Vector Generation: Analyzes all user ratings (>= 4.0★) to dynamically construct an n-dimensional genre & language affinity vector.",
        "• Affinity Spectrum: Visually charts positive vs negative genre leanings (e.g. +0.84 Action, +0.65 Drama, -0.40 Horror).",
        "• Watch Risk Constraints: Enforces user-configured hard filters like maximum runtime limits (e.g. 150 mins) and excluded genres.",
        "• Cosine Similarity Scoring: Computes real-time cosine distance between film feature vectors and user DNA for tailored ranking."
    ]
    for pt in points_s9:
        p = tf9.add_paragraph()
        p.text = pt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_LIGHT
        p.space_before = Pt(10)

    add_image_card(s9, "06_taste_dna.png", Inches(6.5), Inches(1.5), Inches(6.0), Inches(5.2), "Movie Taste DNA Profile for User 'Navaneeth'")

    # =============================================================
    # SLIDE 10: Group Decision Rooms (Screenshot: 07_group_room.png)
    # =============================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "Feature 6: Group Movie Decision Rooms (Watch Parties)", "COLLABORATIVE INTELLIGENCE", 10)

    left_box_s10 = s10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.4), Inches(5.2))
    left_box_s10.fill.solid()
    left_box_s10.fill.fore_color.rgb = BG_CARD
    left_box_s10.line.color.rgb = BORDER_COLOR
    tf10 = left_box_s10.text_frame
    tf10.word_wrap = True

    p = tf10.paragraphs[0]
    p.text = "Social Decision Features:"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER

    points_s10 = [
        "• 6-Character Room Codes: Host generates a unique code (e.g. CM8942) that friends can join from their own laptops or phones.",
        "• Egalitarian Fairness Strategy: Uses a 'Consensus First / Avoid Strong Mismatch' algorithm that heavily penalizes movies where even one participant has a low score.",
        "• Shared Constraint Negotiation: Synchronizes max runtime limits and permitted language preferences across all party members.",
        "• Multi-User Voting: Room members cast votes (+1 like, -1 veto) to reach unanimous agreement without arguments."
    ]
    for pt in points_s10:
        p = tf10.add_paragraph()
        p.text = pt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_LIGHT
        p.space_before = Pt(10)

    add_image_card(s10, "07_group_room.png", Inches(6.5), Inches(1.5), Inches(6.0), Inches(5.2), "Group Movie Decision Maker & Room Joiner")

    # =============================================================
    # SLIDE 11: Regional Cinema Analytics (Screenshot: 08_analytics_dashboard.png)
    # =============================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    add_header(s11, "Feature 7: Regional Cinema Analytics & Industry Benchmarks", "DATABASE INSIGHTS", 11)

    left_box_s11 = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.4), Inches(5.2))
    left_box_s11.fill.solid()
    left_box_s11.fill.fore_color.rgb = BG_CARD
    left_box_s11.line.color.rgb = BORDER_COLOR
    tf11 = left_box_s11.text_frame
    tf11.word_wrap = True

    p = tf11.paragraphs[0]
    p.text = "Empirical Database KPIs:"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER

    points_s11 = [
        "• High-Level Metrics: 25 Titles (Verified Metadata), 1,890 Total Ratings Sample, 4.66★ Global Mean, and 6 Regional Industries.",
        "• Telugu Cinema: 5 films, 320 ratings, 162 mins avg runtime, 4.60★ Bayesian score (RRR, Baahubali 2, C/o Kancharapalem).",
        "• Tamil Cinema: 4 films, 235 ratings, 168 mins avg runtime, 4.61★ Bayesian score (Vikram, Kaithi, Super Deluxe).",
        "• Malayalam Cinema: 4 films, 4.67★ Bayesian score (Drishyam, Bramayugam, Kumbalangi Nights, Manjummel Boys).",
        "• Cross-Industry Insights: Verifies rating distribution parity across regional and global cinema."
    ]
    for pt in points_s11:
        p = tf11.add_paragraph()
        p.text = pt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_LIGHT
        p.space_before = Pt(8)

    add_image_card(s11, "08_analytics_dashboard.png", Inches(6.5), Inches(1.5), Inches(6.0), Inches(5.2), "Regional Cinema Analytics & Industry Benchmarks")

    # =============================================================
    # SLIDE 12: Smart Conversational Assistant (Screenshot: 09_smart_assistant.png)
    # =============================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12)
    add_header(s12, "Feature 8: Smart Conversational Movie Assistant", "NATURAL LANGUAGE UNDERSTANDING", 12)

    left_box_s12 = s12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.4), Inches(5.2))
    left_box_s12.fill.solid()
    left_box_s12.fill.fore_color.rgb = BG_CARD
    left_box_s12.line.color.rgb = BORDER_COLOR
    tf12 = left_box_s12.text_frame
    tf12.word_wrap = True

    p = tf12.paragraphs[0]
    p.text = "Assistant Architecture:"
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_AMBER

    points_s12 = [
        "• Natural Language Intent Parser: Identifies languages (Telugu, Tamil, Malayalam, Hindi, Kannada), genres, and duration constraints from plain text.",
        "• Database-Grounded Responses: Queries MySQL directly to eliminate hallucinations; only recommends films actually present with verified ratings.",
        "• Relaxed Constraint Fallback: If a user asks for 'Malayalam mystery under 2 hours', it recommends top films (Drishyam, Bramayugam) while explaining they slightly exceed 120 mins.",
        "• Built-in Knowledge Base: Explains Bayesian math and Taste DNA without requiring paid third-party AI API keys."
    ]
    for pt in points_s12:
        p = tf12.add_paragraph()
        p.text = pt
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_LIGHT
        p.space_before = Pt(10)

    add_image_card(s12, "09_smart_assistant.png", Inches(6.5), Inches(1.5), Inches(6.0), Inches(5.2), "Smart Movie Assistant Chat Interface")

    # =============================================================
    # SLIDE 13: Database Design: Normalized MySQL Schema
    # =============================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_background(s13)
    add_header(s13, "Database Architecture & Normalized Relational Schema", "MYSQL 8.0 & SQLALCHEMY ORM", 13)

    schema_tables = [
        ("movies (Primary Entity)", "id (PK), title, release_year, language, runtime_minutes, poster_url, bayesian_score, rating_mean, rating_count, director, overview"),
        ("genres & movie_genres (M:N)", "genres (id PK, name) | movie_genres (movie_id FK, genre_id FK) [Normalized junction table eliminating redundancy]"),
        ("users (Account Management)", "id (PK), name, email (UNIQUE), password_hash (Bcrypt), role, runtime_limit, excluded_genres, created_at"),
        ("ratings (User Feedback)", "id (PK), user_id (FK), movie_id (FK), rating (1.0-5.0), source, rated_at [Composite UNIQUE constraint on (user_id, movie_id)]"),
        ("watchlists & user_preferences", "watchlists (user_id, movie_id, added_at) | user_preferences (user_id, preference_type, preference_key, weight)"),
        ("group_sessions, members & votes", "group_sessions (id, code UNIQUE, objective, host_user_id) | group_members | group_votes (member_id, movie_id, vote_score)")
    ]

    for i, (tbl, cols) in enumerate(schema_tables):
        col = i % 2
        row = i // 2
        l = Inches(0.8 + col * 5.9)
        t = Inches(1.5 + row * 1.7)

        sbox = s13.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, Inches(5.6), Inches(1.5))
        sbox.fill.solid()
        sbox.fill.fore_color.rgb = BG_CARD
        sbox.line.color.rgb = ACCENT_INDIGO
        sbox.line.width = Pt(1)

        stf = sbox.text_frame
        stf.word_wrap = True
        p0 = stf.paragraphs[0]
        p0.text = f"TABLE: {tbl.upper()}"
        p0.font.size = Pt(12.5)
        p0.font.bold = True
        p0.font.color.rgb = ACCENT_AMBER

        p1 = stf.add_paragraph()
        p1.text = cols
        p1.font.size = Pt(10)
        p1.font.color.rgb = TEXT_LIGHT
        p1.space_before = Pt(4)

    # =============================================================
    # SLIDE 14: Testing, Quality Assurance & Verification
    # =============================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_background(s14)
    add_header(s14, "Testing, Quality Assurance & Verification", "RELIABILITY & STABILITY", 14)

    test_cards = [
        ("Automated Test Suites (100% Pass Rate)", [
            "✔ test_auth.py: Registration, Bcrypt password verification, duplicate email rejections, and JWT token expiry.",
            "✔ test_bayesian.py: Bayesian rating mathematical shrinkage bounds, zero review handling, and confidence intervals.",
            "✔ test_taste_dna.py: Cosine distance calculation, genre affinity vector normalization, and runtime constraint checking.",
            "✔ test_group_fairness.py: Multi-member room creation, unique 6-character room codes, and egalitarian vote aggregation.",
            "✔ test_assistant.py: Entity recognition accuracy for Telugu, Tamil, Malayalam, Hindi, Kannada, and fallback responses.",
            "✔ test_integration.py: Complete end-to-end user journeys from registration to recommendation and comparison."
        ], ACCENT_EMERALD),
        ("Performance, Security & Robustness", [
            "• Sub-50ms API Latency: MySQL indexing on language, release_year, and user_id ensures instant responses.",
            "• SQL Injection Prevention: Parameterized SQLAlchemy queries eliminate SQL injection vulnerabilities.",
            "• Port Conflict Resilience: Frontend Vite config set with strictPort: false and intelligent backend failover.",
            "• Beginner-Friendly Architecture: Clean separation of concerns between React SPA, Flask blueprints, and MySQL tables."
        ], ACCENT_CYAN)
    ]

    for i, (title, points, color) in enumerate(test_cards):
        card = s14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + i * 5.9), Inches(1.5), Inches(5.6), Inches(5.2))
        card.fill.solid()
        card.fill.fore_color.rgb = BG_CARD
        card.line.color.rgb = BORDER_COLOR
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.word_wrap = True
        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(15)
        p_t.font.bold = True
        p_t.font.color.rgb = color

        for pt in points:
            p = tf.add_paragraph()
            p.text = pt
            p.font.size = Pt(11)
            p.font.color.rgb = TEXT_LIGHT
            p.space_before = Pt(8)

    # =============================================================
    # SLIDE 15: Conclusion & Summary
    # =============================================================
    s15 = prs.slides.add_slide(blank_layout)
    set_slide_background(s15)
    add_header(s15, "Project Conclusion & Technical Summary", "FINAL EVALUATION", 15)

    cbox = s15.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.7), Inches(5.2))
    cbox.fill.solid()
    cbox.fill.fore_color.rgb = BG_CARD
    cbox.line.color.rgb = ACCENT_INDIGO
    cbox.line.width = Pt(1.5)
    ctf = cbox.text_frame
    ctf.word_wrap = True

    p0 = ctf.paragraphs[0]
    p0.text = "Key Project Achievements & Deliverables:"
    p0.font.size = Pt(18)
    p0.font.bold = True
    p0.font.color.rgb = ACCENT_AMBER

    achievements = [
        "1. Complete Full-Stack Implementation: Successfully developed using React 19 (SPA frontend), Python Flask (REST API), and MySQL 8.0 (Relational database).",
        "2. Authentic Indian & Global Cinema: Curated 25 benchmark films with 1,890 verified rating records across 6 major languages.",
        "3. Mathematical Rigor: Eliminated fake rating hype using empirical Bayesian Evidence Shrinkage and 95% Confidence Bounds.",
        "4. Personal & Social Decision Support: Taste DNA profile vectors for individual users, plus Egalitarian Consensus Rooms for watch parties.",
        "5. Conversational Search: Natural language assistant grounded in MySQL without expensive third-party API dependencies.",
        "6. Industry-Standard Engineering: Modular blueprint architecture, Bcrypt encryption, JWT stateless auth, and 100% passing automated test suites."
    ]
    for a in achievements:
        p = ctf.add_paragraph()
        p.text = a
        p.font.size = Pt(12)
        p.font.color.rgb = TEXT_LIGHT
        p.space_before = Pt(10)

    p_end = ctf.add_paragraph()
    p_end.text = "🎬 Thank You! Questions & Live Demonstration."
    p_end.font.size = Pt(16)
    p_end.font.bold = True
    p_end.font.color.rgb = ACCENT_CYAN
    p_end.space_before = Pt(16)
    p_end.alignment = PP_ALIGN.CENTER

    prs.save(output_path)
    print(f"[SUCCESS] High-impact presentation generated successfully: {output_path}")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "CineMind_Project_Presentation.pptx"
    create_deck(out_file)
