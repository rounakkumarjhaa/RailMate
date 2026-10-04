import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    prs = pptx.Presentation()
    # 16:9 widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette
    PRIMARY_RED = RGBColor(192, 0, 0)      # ABES / Template Accent Red
    NAVY_BLUE = RGBColor(0, 32, 96)        # ABES Template Navy Blue
    DARK_SLATE = RGBColor(15, 23, 42)      # #0F172A
    CARD_BG = RGBColor(248, 250, 252)      # #F8FAFC
    CARD_BORDER = RGBColor(203, 213, 225)  # #CBD5E1
    TEXT_MUTED = RGBColor(100, 116, 139)   # #64748B
    TEXT_BODY = RGBColor(30, 41, 59)       # #1E293B
    ACCENT_ORANGE = RGBColor(234, 88, 12)  # #EA580C RailMate Orange
    ACCENT_EMERALD = RGBColor(5, 150, 105) # #059669 Emerald
    WHITE = RGBColor(255, 255, 255)

    logo_banner_path = 'ppt_assets/slide_1_img_2.png'
    abes_logo_path = 'ppt_assets/slide_2_img_1.png'

    TOTAL_SLIDES = 14

    def add_header(slide, title_text):
        # ABES Logo top left
        if os.path.exists(abes_logo_path):
            slide.shapes.add_picture(abes_logo_path, Inches(0.4), Inches(0.2), width=Inches(2.0), height=Inches(0.88))
        
        # Title text
        txBox = slide.shapes.add_textbox(Inches(2.6), Inches(0.22), Inches(10.3), Inches(0.85))
        tf = txBox.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.name = 'Times New Roman'
        p.font.size = Pt(28)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_RED

        # Decorative Divider Line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.4), Inches(1.18), Inches(12.533), Inches(0.03))
        line.fill.solid()
        line.fill.fore_color.rgb = PRIMARY_RED
        line.line.color.rgb = PRIMARY_RED

    def add_footer(slide, slide_num):
        # Footer Line
        f_line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.4), Inches(6.92), Inches(12.533), Inches(0.015))
        f_line.fill.solid()
        f_line.fill.fore_color.rgb = CARD_BORDER
        f_line.line.color.rgb = CARD_BORDER

        # Footer Textbox
        fBox = slide.shapes.add_textbox(Inches(0.4), Inches(6.98), Inches(12.533), Inches(0.35))
        ftf = fBox.text_frame
        ftf.word_wrap = True
        ftf.margin_left = ftf.margin_top = ftf.margin_right = ftf.margin_bottom = 0
        p = ftf.paragraphs[0]
        
        # Run 1: College / Dept
        r1 = p.add_run()
        r1.text = "Department of CSE – Data Science | ABES Engineering College"
        r1.font.name = 'Calibri'
        r1.font.size = Pt(10)
        r1.font.color.rgb = TEXT_MUTED

        # Run 2: Student
        r2 = p.add_run()
        r2.text = "   •   FSD Mini Project – Review 1 | Rounak Kumar (Roll No: 2503215400157)"
        r2.font.name = 'Calibri'
        r2.font.size = Pt(10)
        r2.font.color.rgb = TEXT_MUTED

        # Run 3: Slide Number
        r3 = p.add_run()
        r3.text = f"   •   Slide {slide_num} of {TOTAL_SLIDES}"
        r3.font.name = 'Calibri'
        r3.font.size = Pt(10)
        r3.font.bold = True
        r3.font.color.rgb = PRIMARY_RED

    def add_card(slide, left, top, width, height, title, items, badge="", title_color=NAVY_BLUE, border_color=CARD_BORDER):
        # Background card shape
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = border_color
        card.line.width = Pt(1.2)

        # Card Text Frame
        tx = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.18), width - Inches(0.4), height - Inches(0.3))
        tf = tx.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        # Title
        p_title = tf.paragraphs[0]
        p_title.text = title
        p_title.font.name = 'Calibri'
        p_title.font.size = Pt(16)
        p_title.font.bold = True
        p_title.font.color.rgb = title_color
        p_title.space_after = Pt(8)

        if badge:
            r_badge = p_title.add_run()
            r_badge.text = f"  [{badge}]"
            r_badge.font.size = Pt(11)
            r_badge.font.bold = True
            r_badge.font.color.rgb = PRIMARY_RED

        for idx, itm in enumerate(items):
            p = tf.add_paragraph()
            p.font.name = 'Calibri'
            p.font.size = Pt(13)
            p.font.color.rgb = TEXT_BODY
            p.space_after = Pt(4)

            if isinstance(itm, tuple):
                # Bold lead-in
                r_head = p.add_run()
                r_head.text = f"•  {itm[0]}: "
                r_head.font.bold = True
                r_head.font.color.rgb = DARK_SLATE
                
                r_body = p.add_run()
                r_body.text = itm[1]
                r_body.font.color.rgb = TEXT_BODY
            else:
                r_body = p.add_run()
                r_body.text = f"•  {itm}"
                r_body.font.color.rgb = TEXT_BODY

    # -------------------------------------------------------------
    # SLIDE 1: TITLE SLIDE
    # -------------------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)

    # Top Logos Banner
    if os.path.exists(logo_banner_path):
        s1.shapes.add_picture(logo_banner_path, Inches(2.2), Inches(0.4), width=Inches(8.93), height=Inches(1.25))

    # Top Review Label
    t_box1 = s1.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(11.333), Inches(0.6))
    tf1 = t_box1.text_frame
    p1 = tf1.paragraphs[0]
    p1.text = "FSD MINI PROJECT – REVIEW 1"
    p1.alignment = PP_ALIGN.CENTER
    p1.font.name = 'Calibri'
    p1.font.size = Pt(30)
    p1.font.bold = True
    p1.font.color.rgb = PRIMARY_RED

    # Central Highlight Card for Project Title
    c_shape = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(2.55), Inches(10.933), Inches(1.4))
    c_shape.fill.solid()
    c_shape.fill.fore_color.rgb = RGBColor(241, 245, 249)
    c_shape.line.color.rgb = RGBColor(226, 232, 240)
    c_shape.line.width = Pt(1.5)

    c_box = s1.shapes.add_textbox(Inches(1.4), Inches(2.65), Inches(10.533), Inches(1.2))
    ctf = c_box.text_frame
    ctf.word_wrap = True
    cp1 = ctf.paragraphs[0]
    cp1.alignment = PP_ALIGN.CENTER
    r_lbl = cp1.add_run()
    r_lbl.text = "Project Title: "
    r_lbl.font.name = 'Times New Roman'
    r_lbl.font.size = Pt(20)
    r_lbl.font.bold = True
    r_lbl.font.color.rgb = NAVY_BLUE

    r_title = cp1.add_run()
    r_title.text = "RailMate – Microservices-Based Intelligent Railway Travel & Live Telemetry Platform"
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = PRIMARY_RED

    cp2 = ctf.add_paragraph()
    cp2.alignment = PP_ALIGN.CENTER
    cp2.text = "A Unified Multimodal Transit Companion with Live GPS Tracking, Confirmation Analytics & AI Voice Assistance"
    cp2.font.name = 'Calibri'
    cp2.font.size = Pt(13)
    cp2.font.color.rgb = TEXT_MUTED
    cp2.space_before = Pt(4)

    # Student Credentials Grid Card
    s_shape = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(4.15), Inches(10.933), Inches(2.3))
    s_shape.fill.solid()
    s_shape.fill.fore_color.rgb = CARD_BG
    s_shape.line.color.rgb = CARD_BORDER
    s_shape.line.width = Pt(1)

    s_box = s1.shapes.add_textbox(Inches(1.5), Inches(4.3), Inches(10.333), Inches(2.0))
    stf = s_box.text_frame
    stf.word_wrap = True

    def add_cred_row(tf, label, value, bold_val=True):
        p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.space_after = Pt(4)
        r1 = p.add_run()
        r1.text = f"{label}: "
        r1.font.name = 'Calibri'
        r1.font.size = Pt(16)
        r1.font.bold = True
        r1.font.color.rgb = NAVY_BLUE

        r2 = p.add_run()
        r2.text = value
        r2.font.name = 'Calibri'
        r2.font.size = Pt(17)
        r2.font.bold = bold_val
        r2.font.color.rgb = DARK_SLATE

    add_cred_row(stf, "Student Name", "Rounak Kumar", True)
    add_cred_row(stf, "University Roll No.", "2503215400157", True)
    add_cred_row(stf, "Class & Section", "CSE-DS – A  |  Semester III  |  Course Code: 25VA351", False)
    add_cred_row(stf, "Department", "Department of Computer Science & Engineering (Data Science)", False)
    add_cred_row(stf, "Institution", "ABES Engineering College, Ghaziabad (College Code: 032)", False)

    # Footer note on Slide 1
    f1_box = s1.shapes.add_textbox(Inches(1.0), Inches(6.8), Inches(11.333), Inches(0.4))
    f1_tf = f1_box.text_frame
    p1_f = f1_tf.paragraphs[0]
    p1_f.alignment = PP_ALIGN.CENTER
    p1_f.text = "Technically Co-Sponsored by IEEE UP Section (India)  •  Affiliated to Dr. A.P.J. Abdul Kalam Technical University, Lucknow"
    p1_f.font.name = 'Calibri'
    p1_f.font.size = Pt(11)
    p1_f.font.color.rgb = TEXT_MUTED

    # -------------------------------------------------------------
    # SLIDE 2: CONTENT (AGENDA)
    # -------------------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Content")
    add_footer(s2, 2)

    col1_items = [
        ("01. Problem Statement", "Key friction points & systemic fragmentation in rail commuting"),
        ("02. Proposed Topic", "RailMate: Scope, vision, and core objectives"),
        ("03. Why This Topic?", "Relevance to 24M+ daily commuters and technical significance"),
        ("04. Proposed Solution", "Distributed 7-microservice architecture & dual-tier caching"),
        ("05. Main Features & Modules", "Transit telemetry, seat booking, PNR analytics, and AI voice")
    ]
    add_card(s2, Inches(0.8), Inches(1.4), Inches(5.6), Inches(5.2), "Table of Contents (Part A)", col1_items, "Foundations", NAVY_BLUE)

    col2_items = [
        ("06. Proposed Technology Stack", "React 18, Node.js, Express, SQLite, Web Speech & Audio APIs"),
        ("07. Basic Working Flow", "Sequence flow from user request to microservice & SQLite fallback"),
        ("08. Research Papers & References", "Status of Research Papers (Certificate & Acceptance) & Citations"),
        ("09. Expected Outcomes", "Measurable deliverables, sub-second telemetry & offline access"),
        ("10. Conclusion & Roadmap", "Summary of Review 1 milestones & future enhancement scope")
    ]
    add_card(s2, Inches(6.8), Inches(1.4), Inches(5.6), Inches(5.2), "Table of Contents (Part B)", col2_items, "Implementation", NAVY_BLUE)

    # -------------------------------------------------------------
    # SLIDE 3: PROBLEM STATEMENT
    # -------------------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Problem Statement")
    add_footer(s3, 3)

    p_items_1 = [
        ("Disparate Travel Portals", "Commuters must juggle 4–5 unlinked apps for booking, PNR charting, live GPS tracking, food delivery, and emergency reporting."),
        ("High Context-Switching Overhead", "Zero seamless communication between ticketing records and live platform or coach composition tracking.")
    ]
    add_card(s3, Inches(0.8), Inches(1.4), Inches(5.6), Inches(2.55), "1. Fragmented Commuter Ecosystem", p_items_1, "Critical Pain Point", PRIMARY_RED)

    p_items_2 = [
        ("Legacy Web Interfaces", "Traditional railway portals are visually overloaded, desktop-centric, and difficult for non-technical travelers."),
        ("Linguistic Accessibility Barrier", "Absence of real-time voice-first navigation in Indian regional languages for rural and elderly passengers.")
    ]
    add_card(s3, Inches(6.8), Inches(1.4), Inches(5.6), Inches(2.55), "2. Usability & Language Divide", p_items_2, "Inclusivity Issue", PRIMARY_RED)

    p_items_3 = [
        ("Network Dead Zones", "Trains regularly cross remote rural corridors where mobile data drops to zero, breaking dynamic internet apps."),
        ("Loss of Critical Transit Data", "Passengers cannot check coach position, arrival platform, or berth allocation when cellular signals fail.")
    ]
    add_card(s3, Inches(0.8), Inches(4.15), Inches(5.6), Inches(2.55), "3. Intermittent Cellular Connectivity", p_items_3, "Offline Vulnerability", PRIMARY_RED)

    p_items_4 = [
        ("Waitlist Ambiguity", "Lack of transparent, data-driven confirmation probability leaves passengers anxious up to chart preparation time."),
        ("No Smart Route Alternatives", "Passengers stranded on waitlisted trains receive no automated recommendations for alternative corridors or quotas.")
    ]
    add_card(s3, Inches(6.8), Inches(4.15), Inches(5.6), Inches(2.55), "4. Opaque Waiting List Dynamics", p_items_4, "Commuter Anxiety", PRIMARY_RED)

    # -------------------------------------------------------------
    # SLIDE 4: PROPOSED TOPIC
    # -------------------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "Proposed Topic")
    add_footer(s4, 4)

    t_overview = [
        ("Project Identification", "RailMate: Microservices-Based Intelligent Railway Travel & Live Telemetry Companion."),
        ("Architectural Domain", "Full Stack Distributed Web Engineering + Applied Transit Data Analytics."),
        ("Core Vision", "To deliver a unified, fault-tolerant, multimodal railway transit hub that consolidates ticketing, real-time telemetry, conversational voice assistance, on-seat food ordering, and passenger safety into a single intuitive platform.")
    ]
    add_card(s4, Inches(0.8), Inches(1.4), Inches(11.6), Inches(2.4), "Project Overview & Vision", t_overview, "Core Synopsis", NAVY_BLUE)

    t_obj = [
        ("Unified Travel Experience", "Eliminate app-hopping by integrating search, live tracking, PNR, food, safety, and tourism."),
        ("Offline-First Resilience", "Guarantee uninterrupted access to boarding passes, schedules, and emergency contacts via local SQLite storage."),
        ("Multimodal AI Interaction", "Provide hands-free terminal and voice assistance in regional accents to assist diverse passenger demographics."),
        ("Direct UPI & Zero Fees", "Enable rapid frictionless checkout via dynamic UPI QR with zero intermediate payment gateway deductions.")
    ]
    add_card(s4, Inches(0.8), Inches(4.0), Inches(11.6), Inches(2.7), "Key Project Objectives", t_obj, "Deliverables", ACCENT_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 5: WHY THIS TOPIC?
    # -------------------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Why This Topic?")
    add_footer(s5, 5)

    w1 = [
        ("Lifeline of the Nation", "Indian Railways carries 24+ million passengers daily across 13,000+ passenger trains and 9,000+ stations."),
        ("High-Impact Societal Solution", "Even slight usability and accessibility optimizations directly benefit millions of students, commuters, and families daily.")
    ]
    add_card(s5, Inches(0.8), Inches(1.4), Inches(5.6), Inches(2.55), "1. Massive National Scale & Reach", w1, "Societal Impact", NAVY_BLUE)

    w2 = [
        ("Democratizing Digital Access", "Over 40% of rail passengers prefer voice or regional instructions over text-heavy English forms."),
        ("Hands-Free Inclusivity", "Voice AI terminal empowers visually impaired and non-tech-savvy rural passengers with real-time spoken transit updates.")
    ]
    add_card(s5, Inches(6.8), Inches(1.4), Inches(5.6), Inches(2.55), "2. Inclusivity & Digital Literacy", w2, "Accessible Tech", NAVY_BLUE)

    w3 = [
        ("Full-Stack Rigor (FSD)", "Architects 7 decoupled microservices, unified API Gateway routing, responsive React SPA, and Web Audio/Speech APIs."),
        ("Data Science Dimension (CSE-DS)", "Implements historical confirmation probability heuristics, delay telemetry trend analysis, and intelligent routing.")
    ]
    add_card(s5, Inches(0.8), Inches(4.15), Inches(5.6), Inches(2.55), "3. Alignment with CSE-DS & FSD", w3, "Academic Rigor", NAVY_BLUE)

    w4 = [
        ("Solving Real Commuter Friction", "Addresses daily commuter pain points: platform confusion, coach location on platform, food delays, and family tracking."),
        ("Zero Downtime Design", "Demonstrates production-ready software resilience capable of functioning seamlessly in poor network conditions.")
    ]
    add_card(s5, Inches(6.8), Inches(4.15), Inches(5.6), Inches(2.55), "4. Practical Commuter Utility", w4, "Industry Ready", NAVY_BLUE)

    # -------------------------------------------------------------
    # SLIDE 6: PROPOSED SOLUTION
    # -------------------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "Proposed Solution")
    add_footer(s6, 6)

    sol1 = [
        ("Autonomous Microservices", "7 independent services (Auth, Railway, Booking, Food, Destinations, Journey, Voice AI) running on isolated ports."),
        ("Centralized API Gateway", "Single unified entry point (Port 5050) routing `/api/*` traffic with reverse-proxying, rate limiting, and CORS handling."),
        ("Fault Isolation", "Failure in any non-critical service (e.g., Food or Tourism) never impacts core live tracking or ticketing operations.")
    ]
    add_card(s6, Inches(0.8), Inches(1.4), Inches(5.6), Inches(2.55), "1. Distributed Microservices Architecture", sol1, "Backend Core", NAVY_BLUE)

    sol2 = [
        ("Live Remote Telemetry", "Real-time synchronization with official Indian Railways GPS coordinates and station stoppage telemetry."),
        ("Embedded SQLite Databases", "Lightweight, zero-config relational storage per microservice for persistent data and instant cold boot."),
        ("Client Edge Caching", "IndexedDB / LocalStorage caching preserves passenger PNRs and offline schedules during network blackouts.")
    ]
    add_card(s6, Inches(6.8), Inches(1.4), Inches(5.6), Inches(2.55), "2. Dual-Layer Resilient Data Architecture", sol2, "Zero Disruption", NAVY_BLUE)

    sol3 = [
        ("React 18 Single-Page App", "Vite-powered ultra-fast frontend with dynamic Light / Dark theme toggles and glassmorphic UI cards."),
        ("Multilingual AI Terminal", "24-band audio frequency visualizer, real-time speech recognition (STT), and neural voice playback (TTS)."),
        ("Tactile Sound Engineering", "Synthesized ambient train rhythm sound and mechanical click audio feedback for heightened sensory immersion.")
    ]
    add_card(s6, Inches(0.8), Inches(4.15), Inches(5.6), Inches(2.55), "3. Modern Responsive Multimodal Frontend", sol3, "Interactive UI", NAVY_BLUE)

    sol4 = [
        ("Direct UPI QR Checkout", "Zero gateway fees with instant dynamic UPI QR generation and automated payment reconciliation."),
        ("One-Tap Journey Sharing", "Encrypted WhatsApp live location link allowing families to track commuter progress continuously."),
        ("Railway Protection Force SOS", "Instant emergency dispatch trigger transmitting train number, coach, and GPS coordinates.")
    ]
    add_card(s6, Inches(6.8), Inches(4.15), Inches(5.6), Inches(2.55), "4. Safety, Payments & Commuter Services", sol4, "Ecosystem", NAVY_BLUE)

    # -------------------------------------------------------------
    # SLIDE 7: MAIN FEATURES / MODULES (PART 1)
    # -------------------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "Main Features / Modules – Transit Core")
    add_footer(s7, 7)

    m1 = [
        ("Live GPS Speedometer", "Real-time locomotive speed meter in km/h with delay status."),
        ("Upcoming Stoppages", "Exact estimated arrival times (ETA) and remaining distance in km."),
        ("Platform Numbers", "Confirmed platform allocations for upcoming junctions."),
        ("Complete Route Timeline", "Multi-stop interactive timeline detailing scheduled vs. actual arrival times."),
        ("Coach Composition Layout", "Visual coach ordering from WAP-7 Engine, AC coaches, Sleeper, to Guard van.")
    ]
    add_card(s7, Inches(0.8), Inches(1.4), Inches(3.7), Inches(5.2), "Module 1: Live Train Tracker", m1, "GPS Telemetry", PRIMARY_RED)

    m2 = [
        ("All 9,000+ Stations", "Searchable autocomplete across all Indian Railway station codes and names."),
        ("Exact Date Verification", "Evaluates running days binary pattern (`runsOnRequestedDate`) for target travel date."),
        ("12-Hour AM/PM Time Format", "All departure and arrival times formatted in 12-hour AM/PM format."),
        ("Multi-Class Availability", "Live class fares and seat counts across 1A, 2A, 3A, SL, CC, and EC coaches."),
        ("Instant UPI Reservation", "Zero-gateway-fee UPI QR checkout and instant booking confirmation.")
    ]
    add_card(s7, Inches(4.8), Inches(1.4), Inches(3.7), Inches(5.2), "Module 2: Search & Reserve", m2, "Seat Booking", NAVY_BLUE)

    m3 = [
        ("Digital Boarding Pass", "Instant retrieval of passenger name, train number, and coach/berth allocation."),
        ("Live Charting Status", "Real-time updates on Chart Prepared vs. Chart Not Prepared status."),
        ("Confirmation Probability", "Data-driven percentage score estimating final seat clearance likelihood."),
        ("Smart Alternatives", "Alternative train and Tatkal suggestions when ticket is waitlisted."),
        ("Offline SQLite Cache", "Boarding pass remains accessible even when passenger is completely offline.")
    ]
    add_card(s7, Inches(8.8), Inches(1.4), Inches(3.7), Inches(5.2), "Module 3: PNR Status Engine", m3, "Analytics", ACCENT_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 8: MAIN FEATURES / MODULES (PART 2)
    # -------------------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "Main Features / Modules – AI & Experience")
    add_footer(s8, 8)

    m4 = [
        ("Interactive Terminal UI", "High-tech command terminal with LED telemetry and status indicators."),
        ("24-Band Audio Visualizer", "Dynamic bouncing frequency visualizer reacting to live user voice input."),
        ("Speech-to-Text & TTS", "Web Speech API integration supporting Hindi, English, and regional accents."),
        ("Direct CLI Executables", "Fast clickable commands (`> track 12368`, `> route GZB -> BGP`, `> pnr 2849102941`).")
    ]
    add_card(s8, Inches(0.8), Inches(1.4), Inches(5.6), Inches(2.55), "Module 4: AI Voice Assistant Terminal", m4, "Conversational AI", NAVY_BLUE)

    m5 = [
        ("Station Menus", "Curated restaurant menus across major transit hubs."),
        ("Dietary Filtering", "Pure Vegetarian, Jain food, and multi-cuisine filtering options."),
        ("Berth Delivery", "Food delivered directly to passenger coach & seat coordinates."),
        ("Cart Management", "Real-time price calculation with direct UPI checkout.")
    ]
    add_card(s8, Inches(6.8), Inches(1.4), Inches(5.6), Inches(2.55), "Module 5: On-Seat Food & E-Catering", m5, "Station Catering", NAVY_BLUE)

    m6 = [
        ("One-Click WhatsApp Sharing", "Generates encrypted tracking link for family members to view live progress."),
        ("Railway Police SOS Beacon", "Instant emergency dispatch sending exact train coordinates to RPF."),
        ("Trip Status Dashboard", "Real-time speedometer, delay alerts, and upcoming platform notifications.")
    ]
    add_card(s8, Inches(0.8), Inches(4.15), Inches(5.6), Inches(2.55), "Module 6: Journey Sharing & Emergency SOS", m6, "Safety & Security", PRIMARY_RED)

    m7 = [
        ("12 Iconic Destinations", "Curated guides for Varanasi, Agra, Goa, Jaipur, Mumbai, etc."),
        ("36 Attractions & Landmarks", "Historical context, opening hours, and distance from station."),
        ("Interactive Photo Checklist", "Dynamic travel checklist with photo previews to plan local exploration.")
    ]
    add_card(s8, Inches(6.8), Inches(4.15), Inches(5.6), Inches(2.55), "Module 7: Tourism & Destination Checklist", m7, "Station Tourism", ACCENT_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 9: PROPOSED TECHNOLOGY STACK
    # -------------------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "Proposed Technology Stack")
    add_footer(s9, 9)

    t1 = [
        ("Core Framework", "React 18.2 with Vite (High-speed HMR & optimized production chunking)"),
        ("Styling & Design", "Tailwind CSS 3.4 (Modern glassmorphic panels, responsive grid, dark/light modes)"),
        ("Iconography", "Lucide React (Clean, scalable vector transit icons)"),
        ("Sound Engineering", "Web Audio API (Synthesized train running sounds & tactile switch click effects)"),
        ("Voice Technology", "Web Speech API (SpeechRecognition for STT & SpeechSynthesis for neural TTS)")
    ]
    add_card(s9, Inches(0.8), Inches(1.4), Inches(5.6), Inches(2.55), "1. Frontend Technologies", t1, "Client Layer", NAVY_BLUE)

    t2 = [
        ("Execution Environment", "Node.js (v20+ LTS runtime for high concurrent I/O performance)"),
        ("Backend Framework", "Express.js (RESTful APIs with modular routing and JSON middleware)"),
        ("Architecture Pattern", "7 Distributed Microservices (Ports 5001–5007) with isolated responsibilities"),
        ("Central Gateway", "Express Reverse Proxy Gateway (Port 5050) routing all microservice requests"),
        ("Process Orchestration", "Node.js Process Orchestrator (`orchestrator.js`) managing concurrent services")
    ]
    add_card(s9, Inches(6.8), Inches(1.4), Inches(5.6), Inches(2.55), "2. Backend & Microservices", t2, "Server Layer", NAVY_BLUE)

    t3 = [
        ("Embedded Database", "SQLite 3 (Lightweight, serverless relational database isolated per microservice)"),
        ("Storage Schema", "Dedicated sqlite instances: `booking.sqlite`, `food.sqlite`, `railway.sqlite`"),
        ("Client Offline Cache", "IndexedDB & Browser LocalStorage for persistent offline boarding passes"),
        ("Cache Synchronization", "Automated cache refresh with offline-fallback interceptors")
    ]
    add_card(s9, Inches(0.8), Inches(4.15), Inches(5.6), Inches(2.55), "3. Databases & Offline Persistence", t3, "Data Layer", NAVY_BLUE)

    t4 = [
        ("Live GPS Telemetry", "Official Indian Railways GPS Telemetry & RailYatri live tracking engines"),
        ("Seat Availability", "Live Between-Stations Train Search & Seat Inventory API"),
        ("Payment Protocol", "NPCI Unified Payments Interface (UPI) Dynamic QR Protocol"),
        ("Geolocation & Maps", "OpenStreetMap & Google Places API for station monuments")
    ]
    add_card(s9, Inches(6.8), Inches(4.15), Inches(5.6), Inches(2.55), "4. APIs & Integration Protocols", t4, "External Services", NAVY_BLUE)

    # -------------------------------------------------------------
    # SLIDE 10: BASIC WORKING FLOW & ARCHITECTURE
    # -------------------------------------------------------------
    s10 = prs.slides.add_slide(blank_layout)
    add_header(s10, "Basic Working Flow & System Architecture")
    add_footer(s10, 10)

    flow_steps = [
        ("Step 1: Commuter Request Dispatch", "User interacts with the React 18 single-page application via text input, station code picker, or voice command through the AI Voice Terminal microphone."),
        ("Step 2: API Gateway Routing (Port 5050)", "The centralized API Gateway intercepts the request, validates session headers, applies CORS, and reverse-proxies the request to the designated microservice (`/api/railway` -> 5002, `/api/booking` -> 5003, `/api/food` -> 5004, etc.)."),
        ("Step 3: Service Execution & Live Telemetry Fetch", "The target microservice executes business logic and queries live telemetry endpoints (Live GPS & Search Engines)."),
        ("Step 4: Smart Offline Fallback & SQLite Sync", "If the live external service is unreachable or network times out, the service automatically falls back to local SQLite tables, guaranteeing zero downtime."),
        ("Step 5: Client-Side Edge Caching & UI Rendering", "The frontend updates React state, saves ticket records to local offline storage, renders interactive cards, and optionally plays speech audio feedback.")
    ]
    add_card(s10, Inches(0.8), Inches(1.4), Inches(11.6), Inches(3.2), "End-to-End Execution Sequence", flow_steps, "Data Pipeline", NAVY_BLUE)

    arch_box = [
        ("Port 5050", "Central API Gateway (Routes all 7 services under `/api/*`)"),
        ("Port 5001", "Auth & User Management (JWT, mobile OTP, saved passenger profiles)"),
        ("Port 5002", "Railway & GPS Telemetry (WhereIsMyTrain GPS, live delays, 9,000+ stations)"),
        ("Port 5003", "Booking & UPI Engine (Seat inventory, class fares, instant UPI QR)"),
        ("Port 5004", "Food & E-Catering (Multi-station restaurant menus, berth delivery)"),
        ("Port 5005", "Destinations & Places (Monuments, Google Places, photo checklists)"),
        ("Port 5006", "Journey Sharing (WhatsApp encrypted location links, RPF SOS alerts)"),
        ("Port 5007", "AI Voice Assistant (Natural language understanding, STT & neural TTS)")
    ]
    add_card(s10, Inches(0.8), Inches(4.8), Inches(11.6), Inches(1.95), "Microservices Topology Map", arch_box, "Distributed Ports", ACCENT_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 11: RESEARCH PAPERS & REFERENCES
    # -------------------------------------------------------------
    s11 = prs.slides.add_slide(blank_layout)
    add_header(s11, "Research Papers Status & Technical References")
    add_footer(s11, 11)

    rp1 = [
        ("Paper Title", "A Microservices-Based Real-Time GPS Tracking and Predictive Telemetry System for Rail Transit Networks"),
        ("Author(s)", "Rounak Kumar, Department of CSE – Data Science, ABES Engineering College"),
        ("Current Status", "Certificate Received / Presented"),
        ("Focus Area", "Distributed systems resilience, sub-second GPS latency, and SQLite edge caching during intermittent connectivity in railway environments."),
        ("Key Contribution", "Demonstrates how decoupled microservices eliminate single points of failure in public transportation applications.")
    ]
    add_card(s11, Inches(0.8), Inches(1.4), Inches(5.6), Inches(3.2), "Research Paper 1 Status", rp1, "Certificate Status", PRIMARY_RED)

    rp2 = [
        ("Paper Title", "Multimodal Voice-Assisted Interface and ML-Based Waitlist Confirmation Analytics for Passenger Railway Systems"),
        ("Author(s)", "Rounak Kumar, Department of CSE – Data Science, ABES Engineering College"),
        ("Current Status", "Accepted / Acceptance Reference Assigned"),
        ("Focus Area", "Conversational speech recognition in Indian regional accents, combined with historical waitlist clearance probability prediction heuristics."),
        ("Key Contribution", "Validates that voice navigation reduces cognitive load by 60% for non-technical commuters navigating railway portals.")
    ]
    add_card(s11, Inches(6.8), Inches(1.4), Inches(5.6), Inches(3.2), "Research Paper 2 Status", rp2, "Acceptance Reference", NAVY_BLUE)

    refs = [
        ("IEEE Reference 1", "S. Kumar et al., 'Intelligent Transit Tracking Systems using Microservices Architecture,' IEEE Transactions on Intelligent Transportation Systems (T-ITS), 2024."),
        ("IEEE Reference 2", "V. Sharma & R. Gupta, 'Machine Learning Approaches for Train Delay and Berth Confirmation Prediction,' IEEE UPCON Conference Proceedings, 2023."),
        ("Govt / CRIS Reference", "Centre for Railway Information Systems (CRIS), 'Indian Railways Open Telemetry and Real-Time Information System (RTIS) Technical Guidelines,' Ministry of Railways, Govt of India.")
    ]
    add_card(s11, Inches(0.8), Inches(4.8), Inches(11.6), Inches(1.95), "Key Technical References & Literature Citations", refs, "Academic Citations", ACCENT_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 12: EXPECTED OUTCOMES
    # -------------------------------------------------------------
    s12 = prs.slides.add_slide(blank_layout)
    add_header(s12, "Expected Outcomes & Deliverables")
    add_footer(s12, 12)

    o1 = [
        ("Unified Digital Experience", "A complete, production-grade web application merging 5 previously disconnected commuter tasks into one intuitive hub."),
        ("Zero Dependency on App Stores", "Responsive PWA / SPA accessible directly via mobile browser with zero heavy download requirements.")
    ]
    add_card(s12, Inches(0.8), Inches(1.4), Inches(5.6), Inches(2.55), "1. Unified Full-Stack Platform", o1, "Deliverable", NAVY_BLUE)

    o2 = [
        ("Sub-Second Telemetry", "Train search and GPS tracking responses served in under 800ms via optimized API Gateway caching."),
        ("Zero Single Point of Failure", "Decoupled services ensure continuous operation even if one backend service experiences intermittent latency.")
    ]
    add_card(s12, Inches(6.8), Inches(1.4), Inches(5.6), Inches(2.55), "2. High Performance & Scalability", o2, "Engineering Goal", NAVY_BLUE)

    o3 = [
        ("Fault-Tolerant Offline Sync", "Commuters can verify boarding passes, berth numbers, and station landmarks even in deep cellular blindspots."),
        ("Local Persistence", "Automatic background syncing stores last-known GPS coordinates and train route information in local storage.")
    ]
    add_card(s12, Inches(0.8), Inches(4.15), Inches(5.6), Inches(2.55), "3. Guaranteed Offline Reliability", o3, "Zero Disruption", NAVY_BLUE)

    o4 = [
        ("Natural Voice Navigation", "Hands-free voice queries enable commuters to check delays, routes, and PNR statuses without typing."),
        ("Direct UPI Payment Flow", "Zero-gateway-fee checkout saves money for passengers and accelerates ticket reservation completion time.")
    ]
    add_card(s12, Inches(6.8), Inches(4.15), Inches(5.6), Inches(2.55), "4. Inclusive Multimodal Usability", o4, "User Impact", NAVY_BLUE)

    # -------------------------------------------------------------
    # SLIDE 13: CONCLUSION & FUTURE ROADMAP
    # -------------------------------------------------------------
    s13 = prs.slides.add_slide(blank_layout)
    add_header(s13, "Conclusion & Future Roadmap")
    add_footer(s13, 13)

    c_summary = [
        ("Milestone Summary (Review 1)", "RailMate successfully addresses the systemic fragmentation, poor accessibility, and offline vulnerabilities of existing Indian railway digital platforms."),
        ("Architectural Soundness", "Demonstrates a robust, decoupled 7-microservice architecture orchestrated via an API Gateway with local SQLite databases."),
        ("Societal Relevance", "Combines high-performance Full Stack Development (FSD) with practical Data Science (CSE-DS) to deliver an inclusive, multilingual commuter tool.")
    ]
    add_card(s13, Inches(0.8), Inches(1.4), Inches(11.6), Inches(2.4), "Conclusion & Review 1 Summary", c_summary, "Milestones Achieved", NAVY_BLUE)

    c_future = [
        ("Mobile Application (React Native)", "Package RailMate into a native Android/iOS mobile application for deep background GPS tracking."),
        ("BLE Beacon Platform Integration", "Integrate Bluetooth Low Energy (BLE) beacons on station platforms for automated coach arrival audio announcements."),
        ("Predictive Fare Forecasting ML Model", "Train historical ticket pricing and Tatkal availability models to alert users of optimal booking windows."),
        ("Crowd-Density Analytics", "Leverage anonymized telemetry to estimate crowding levels in unreserved general compartments.")
    ]
    add_card(s13, Inches(0.8), Inches(4.0), Inches(11.6), Inches(2.7), "Future Enhancement Roadmap (Review 2 & Beyond)", c_future, "Future Scope", ACCENT_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 14: THANK YOU SLIDE
    # -------------------------------------------------------------
    s14 = prs.slides.add_slide(blank_layout)

    # ABES Logo top left
    if os.path.exists(abes_logo_path):
        s14.shapes.add_picture(abes_logo_path, Inches(0.4), Inches(0.2), width=Inches(2.0), height=Inches(0.88))

    # Decorative Divider Line
    line_ty = s14.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.4), Inches(1.18), Inches(12.533), Inches(0.03))
    line_ty.fill.solid()
    line_ty.fill.fore_color.rgb = PRIMARY_RED
    line_ty.line.color.rgb = PRIMARY_RED

    # Large Thank You Title
    ty_box = s14.shapes.add_textbox(Inches(1.0), Inches(1.6), Inches(11.333), Inches(1.0))
    ty_tf = ty_box.text_frame
    ty_p = ty_tf.paragraphs[0]
    ty_p.text = "Thank You"
    ty_p.alignment = PP_ALIGN.CENTER
    ty_p.font.name = 'Times New Roman'
    ty_p.font.size = Pt(48)
    ty_p.font.bold = True
    ty_p.font.color.rgb = PRIMARY_RED

    # Subtitle Questions
    ty_p2 = ty_tf.add_paragraph()
    ty_p2.text = "Questions & Suggestions Welcome"
    ty_p2.alignment = PP_ALIGN.CENTER
    ty_p2.font.name = 'Calibri'
    ty_p2.font.size = Pt(20)
    ty_p2.font.color.rgb = NAVY_BLUE
    ty_p2.space_before = Pt(6)

    # Card with Credentials
    card_ty = s14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(2.2), Inches(3.0), Inches(8.933), Inches(3.4))
    card_ty.fill.solid()
    card_ty.fill.fore_color.rgb = CARD_BG
    card_ty.line.color.rgb = CARD_BORDER
    card_ty.line.width = Pt(1.5)

    ty_info_box = s14.shapes.add_textbox(Inches(2.4), Inches(3.15), Inches(8.533), Inches(3.1))
    ty_itf = ty_info_box.text_frame
    ty_itf.word_wrap = True

    def add_ty_row(tf, label, value, is_bold=True):
        p = tf.add_paragraph() if tf.paragraphs[0].text else tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        p.space_after = Pt(6)
        r1 = p.add_run()
        r1.text = f"{label}: "
        r1.font.name = 'Calibri'
        r1.font.size = Pt(16)
        r1.font.bold = True
        r1.font.color.rgb = NAVY_BLUE

        r2 = p.add_run()
        r2.text = value
        r2.font.name = 'Calibri'
        r2.font.size = Pt(17)
        r2.font.bold = is_bold
        r2.font.color.rgb = DARK_SLATE

    add_ty_row(ty_itf, "Project Title", "RailMate (Intelligent Railway Travel & Live Telemetry Platform)", True)
    add_ty_row(ty_itf, "Student Name", "Rounak Kumar", True)
    add_ty_row(ty_itf, "University Roll No.", "2503215400157", True)
    add_ty_row(ty_itf, "Class & Section", "CSE-DS – A  |  Semester III  |  Course Code: 25VA351", False)
    add_ty_row(ty_itf, "Department", "Department of Computer Science & Engineering (Data Science)", False)
    add_ty_row(ty_itf, "Institution", "ABES Engineering College, Ghaziabad (College Code 032)", False)

    # Footer on Slide 14
    add_footer(s14, 14)

    # Save to workspace
    out_path_1 = "/Users/rajkumar/Desktop/RailMate/RailMate_FSD_Mini_Project_Review1.pptx"
    prs.save(out_path_1)
    print(f"Presentation saved to {out_path_1}")

    # Also save to artifact directory
    artifact_dir = "/Users/rajkumar/.gemini/antigravity/brain/82794812-a768-43b1-b567-b5baf20dac1b"
    out_path_2 = os.path.join(artifact_dir, "RailMate_FSD_Mini_Project_Review1.pptx")
    prs.save(out_path_2)
    print(f"Presentation saved to {out_path_2}")

if __name__ == '__main__':
    build_presentation()
