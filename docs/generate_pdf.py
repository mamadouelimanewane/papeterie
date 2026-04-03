#!/usr/bin/env python3
"""
Génération du document PDF — NDUGUMi : Documentation Technique & Fonctionnelle
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, Image
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, Circle, String, Line
from reportlab.graphics import renderPDF
import os
import math

# ── Couleurs ──
PRIMARY     = HexColor("#6B6BD5")  # Violet NDUGUMi
PRIMARY_DK  = HexColor("#4F4FB0")
SECONDARY   = HexColor("#2d3a4a")  # Bleu foncé
ACCENT      = HexColor("#22c55e")  # Vert
ACCENT_WARN = HexColor("#f59e0b")  # Orange
ACCENT_RED  = HexColor("#ef4444")  # Rouge
ACCENT_BLUE = HexColor("#3b82f6")  # Bleu
BG_LIGHT    = HexColor("#f8f9fc")
BG_CARD     = HexColor("#ffffff")
TEXT_DARK   = HexColor("#1e293b")
TEXT_MED    = HexColor("#475569")
TEXT_LIGHT  = HexColor("#94a3b8")
BORDER      = HexColor("#e2e8f0")

W, H = A4

# ── Styles ──
styles = getSampleStyleSheet()

styles.add(ParagraphStyle(
    'CoverTitle', parent=styles['Title'],
    fontSize=36, leading=42, textColor=white,
    alignment=TA_CENTER, fontName='Helvetica-Bold',
    spaceAfter=8
))
styles.add(ParagraphStyle(
    'CoverSub', parent=styles['Normal'],
    fontSize=16, leading=22, textColor=HexColor("#c7c7f0"),
    alignment=TA_CENTER, fontName='Helvetica'
))
styles.add(ParagraphStyle(
    'SectionTitle', parent=styles['Heading1'],
    fontSize=20, leading=26, textColor=PRIMARY,
    fontName='Helvetica-Bold', spaceBefore=18, spaceAfter=10,
    borderPadding=(0, 0, 4, 0)
))
styles.add(ParagraphStyle(
    'SubSection', parent=styles['Heading2'],
    fontSize=14, leading=18, textColor=SECONDARY,
    fontName='Helvetica-Bold', spaceBefore=12, spaceAfter=6
))
styles.add(ParagraphStyle(
    'SubSubSection', parent=styles['Heading3'],
    fontSize=12, leading=16, textColor=PRIMARY_DK,
    fontName='Helvetica-Bold', spaceBefore=8, spaceAfter=4
))
styles.add(ParagraphStyle(
    'BodyText2', parent=styles['Normal'],
    fontSize=10, leading=14, textColor=TEXT_DARK,
    fontName='Helvetica', alignment=TA_JUSTIFY,
    spaceAfter=4
))
styles.add(ParagraphStyle(
    'SmallGray', parent=styles['Normal'],
    fontSize=8, leading=10, textColor=TEXT_LIGHT,
    fontName='Helvetica'
))
styles.add(ParagraphStyle(
    'CodeBlock', parent=styles['Normal'],
    fontSize=8, leading=11, textColor=HexColor("#1e1e1e"),
    fontName='Courier', backColor=HexColor("#f1f5f9"),
    borderPadding=6, spaceAfter=6, spaceBefore=4
))
styles.add(ParagraphStyle(
    'TableHeader', parent=styles['Normal'],
    fontSize=9, leading=12, textColor=white,
    fontName='Helvetica-Bold', alignment=TA_CENTER
))
styles.add(ParagraphStyle(
    'TableCell', parent=styles['Normal'],
    fontSize=8, leading=11, textColor=TEXT_DARK,
    fontName='Helvetica'
))
styles.add(ParagraphStyle(
    'TableCellCenter', parent=styles['Normal'],
    fontSize=8, leading=11, textColor=TEXT_DARK,
    fontName='Helvetica', alignment=TA_CENTER
))
styles.add(ParagraphStyle(
    'BulletItem', parent=styles['Normal'],
    fontSize=10, leading=14, textColor=TEXT_DARK,
    fontName='Helvetica', leftIndent=16,
    bulletIndent=4, spaceAfter=3
))

# ── Flowables personnalisés ──
class ColorBar(Flowable):
    """Barre de couleur horizontale décorative"""
    def __init__(self, color=PRIMARY, width=None, height=3):
        Flowable.__init__(self)
        self.color = color
        self.bar_width = width
        self.bar_height = height

    def wrap(self, aW, aH):
        self.bar_width = self.bar_width or aW
        return (self.bar_width, self.bar_height)

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.bar_width, self.bar_height, 1.5, fill=1, stroke=0)


class InfoCard(Flowable):
    """Carte d'information avec icône texte, titre et valeur"""
    def __init__(self, icon, title, value, color=PRIMARY, card_width=120, card_height=55):
        Flowable.__init__(self)
        self.icon = icon
        self.title = title
        self.value = value
        self.color = color
        self.card_width = card_width
        self.card_height = card_height

    def wrap(self, aW, aH):
        return (self.card_width, self.card_height)

    def draw(self):
        c = self.canv
        # Card background
        c.setFillColor(BG_CARD)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.5)
        c.roundRect(0, 0, self.card_width, self.card_height, 6, fill=1, stroke=1)
        # Top color bar
        c.setFillColor(self.color)
        c.roundRect(0, self.card_height - 4, self.card_width, 4, 2, fill=1, stroke=0)
        # Icon
        c.setFont("Helvetica-Bold", 16)
        c.setFillColor(self.color)
        c.drawString(10, self.card_height - 24, self.icon)
        # Value
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(TEXT_DARK)
        c.drawString(36, self.card_height - 24, str(self.value))
        # Title
        c.setFont("Helvetica", 8)
        c.setFillColor(TEXT_MED)
        c.drawString(10, 8, self.title)


class SectionBanner(Flowable):
    """Bannière de section avec fond coloré"""
    def __init__(self, text, number="", color=PRIMARY, width=None):
        Flowable.__init__(self)
        self.text = text
        self.number = number
        self.color = color
        self.banner_width = width

    def wrap(self, aW, aH):
        self.banner_width = self.banner_width or aW
        return (self.banner_width, 32)

    def draw(self):
        c = self.canv
        c.setFillColor(self.color)
        c.roundRect(0, 0, self.banner_width, 30, 6, fill=1, stroke=0)
        # Number badge
        if self.number:
            c.setFillColor(white)
            c.circle(20, 15, 12, fill=1, stroke=0)
            c.setFont("Helvetica-Bold", 11)
            c.setFillColor(self.color)
            c.drawCentredString(20, 11, self.number)
            x_text = 40
        else:
            x_text = 14
        # Text
        c.setFont("Helvetica-Bold", 13)
        c.setFillColor(white)
        c.drawString(x_text, 9, self.text)


# ── Header/Footer ──
def header_footer(canvas_obj, doc):
    canvas_obj.saveState()
    # Header line
    canvas_obj.setStrokeColor(PRIMARY)
    canvas_obj.setLineWidth(1.5)
    canvas_obj.line(20*mm, H - 12*mm, W - 20*mm, H - 12*mm)
    canvas_obj.setFont("Helvetica", 7)
    canvas_obj.setFillColor(TEXT_LIGHT)
    canvas_obj.drawString(20*mm, H - 11*mm, "NDUGUMi — Documentation Technique & Fonctionnelle")
    canvas_obj.drawRightString(W - 20*mm, H - 11*mm, "v1.0 — Mars 2026")
    # Footer
    canvas_obj.setStrokeColor(BORDER)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(20*mm, 14*mm, W - 20*mm, 14*mm)
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(TEXT_MED)
    canvas_obj.drawCentredString(W/2, 9*mm, f"Page {doc.page}")
    canvas_obj.setFillColor(TEXT_LIGHT)
    canvas_obj.drawString(20*mm, 9*mm, "Confidentiel")
    canvas_obj.drawRightString(W - 20*mm, 9*mm, "NDUGUMi Platform")
    canvas_obj.restoreState()


def cover_page(canvas_obj, doc):
    """Page de couverture"""
    canvas_obj.saveState()
    # Background gradient effect
    for i in range(100):
        ratio = i / 100.0
        r = int(0x6B + (0x2d - 0x6B) * ratio)
        g = int(0x6B + (0x3a - 0x6B) * ratio)
        b = int(0xD5 + (0x4a - 0xD5) * ratio)
        canvas_obj.setFillColor(HexColor(f"#{r:02x}{g:02x}{b:02x}"))
        canvas_obj.rect(0, H - (H * (i+1) / 100), W, H / 100 + 1, fill=1, stroke=0)

    # Decorative circles
    canvas_obj.setFillColor(HexColor("#ffffff10"))
    canvas_obj.setStrokeColor(HexColor("#ffffff15"))
    canvas_obj.setLineWidth(2)
    canvas_obj.circle(W - 80, H - 120, 160, fill=0, stroke=1)
    canvas_obj.circle(60, 200, 120, fill=0, stroke=1)
    canvas_obj.circle(W/2, H/2 - 60, 250, fill=0, stroke=1)

    # Logo area
    canvas_obj.setFillColor(white)
    canvas_obj.setFont("Helvetica-Bold", 52)
    canvas_obj.drawCentredString(W/2, H - 200, "NDUGUMi")

    # Leaf icon
    canvas_obj.setFont("Helvetica", 40)
    canvas_obj.drawCentredString(W/2, H - 260, "Admin Backoffice")

    # Separator
    canvas_obj.setStrokeColor(HexColor("#ffffff80"))
    canvas_obj.setLineWidth(2)
    canvas_obj.line(W/2 - 80, H - 290, W/2 + 80, H - 290)

    # Subtitle
    canvas_obj.setFont("Helvetica", 18)
    canvas_obj.setFillColor(HexColor("#c7c7f0"))
    canvas_obj.drawCentredString(W/2, H - 320, "Documentation Technique")
    canvas_obj.drawCentredString(W/2, H - 345, "& Fonctionnelle Complete")

    # Version info box
    canvas_obj.setFillColor(HexColor("#ffffff15"))
    canvas_obj.roundRect(W/2 - 120, 120, 240, 80, 10, fill=1, stroke=0)
    canvas_obj.setFont("Helvetica", 11)
    canvas_obj.setFillColor(HexColor("#e0e0f0"))
    canvas_obj.drawCentredString(W/2, 175, "Version 1.0 — Mars 2026")
    canvas_obj.drawCentredString(W/2, 158, "Next.js 16 | React 19 | MongoDB")
    canvas_obj.drawCentredString(W/2, 141, "Prisma 7 | TypeScript 5 | Tailwind 4")

    # Footer
    canvas_obj.setFont("Helvetica", 9)
    canvas_obj.setFillColor(HexColor("#9090c0"))
    canvas_obj.drawCentredString(W/2, 60, "Plateforme de gestion de livraison — Senegal, France, Cote d'Ivoire")
    canvas_obj.drawCentredString(W/2, 45, "github.com/mamadouelimanewane/ndugumi")

    canvas_obj.restoreState()


# ── Helper functions ──
def make_table(headers, rows, col_widths=None, header_color=PRIMARY):
    """Crée un tableau stylisé"""
    h_cells = [Paragraph(h, styles['TableHeader']) for h in headers]
    data = [h_cells]
    for row in rows:
        data.append([Paragraph(str(c), styles['TableCell']) for c in row])

    w = col_widths or [None] * len(headers)
    t = Table(data, colWidths=w, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), header_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 1), (-1, -1), BG_CARD),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [BG_CARD, BG_LIGHT]),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t

def make_feature_table(rows, col_widths=None):
    """Tableau de fonctionnalites avec colonnes: #, Fonctionnalite, Route, Details"""
    return make_table(
        ["#", "Fonctionnalite", "Route", "Details"],
        rows,
        col_widths or [25, 130, 100, 220]
    )

def bullet(text):
    return Paragraph(f"<bullet>&bull;</bullet> {text}", styles['BulletItem'])

def spacer(h=6):
    return Spacer(1, h)


# ══════════════════════════════════════════
#           BUILD THE PDF
# ══════════════════════════════════════════

output_path = os.path.join(os.path.dirname(__file__), "NDUGUMi_Documentation.pdf")

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=18*mm, rightMargin=18*mm,
    topMargin=18*mm, bottomMargin=20*mm
)

story = []

# ══════ PAGE DE COUVERTURE ══════
# La couverture est gérée par onFirstPage
story.append(Spacer(1, H - 50*mm))  # Remplir la première page
story.append(PageBreak())

# ══════ TABLE DES MATIERES ══════
story.append(Paragraph("Table des Matieres", styles['SectionTitle']))
story.append(ColorBar(PRIMARY))
story.append(spacer(10))

toc_items = [
    ("1", "Stack Technique & Architecture", "3"),
    ("2", "Base de Donnees (Schema Prisma)", "4"),
    ("3", "Authentification & Securite", "6"),
    ("4", "Tableau de Bord", "7"),
    ("5", "Configuration de Base", "7"),
    ("6", "Gestion Epicerie", "9"),
    ("7", "Gestion des Livreurs", "10"),
    ("8", "Gestion Utilisateurs", "12"),
    ("9", "Gestion du Contenu", "12"),
    ("10", "Notifications & Portefeuille", "13"),
    ("11", "Gestion des Transactions", "13"),
    ("12", "Rapports & Analytiques", "14"),
    ("13", "Parametres & Administration", "15"),
    ("14", "Portail Marchand", "16"),
    ("15", "Composants UI Reutilisables", "17"),
    ("16", "Integrations Externes & API", "17"),
    ("17", "Configuration & Deploiement", "18"),
    ("18", "Resume Chiffre", "19"),
]

toc_data = []
for num, title, page in toc_items:
    toc_data.append([
        Paragraph(f"<b>{num}</b>", styles['TableCellCenter']),
        Paragraph(title, styles['TableCell']),
        Paragraph(page, styles['TableCellCenter']),
    ])

toc_table = Table(toc_data, colWidths=[30, 370, 40])
toc_table.setStyle(TableStyle([
    ('ROWBACKGROUNDS', (0, 0), (-1, -1), [BG_CARD, BG_LIGHT]),
    ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(toc_table)
story.append(PageBreak())

# ══════════════════════════════════════════
# SECTION 1 — STACK TECHNIQUE
# ══════════════════════════════════════════
story.append(SectionBanner("STACK TECHNIQUE & ARCHITECTURE", "1", PRIMARY))
story.append(spacer(12))

story.append(Paragraph("Architecture Globale", styles['SubSection']))
story.append(Paragraph(
    "NDUGUMi est une plateforme de gestion de livraison construite avec Next.js 16 (App Router). "
    "L'application utilise une architecture monolithique full-stack avec rendu cote serveur (SSR) "
    "et composants React cote client. La base de donnees MongoDB est accedee via Prisma ORM.",
    styles['BodyText2']
))
story.append(spacer(8))

# Architecture diagram as table
arch_data = [
    [Paragraph("<b>Couche</b>", styles['TableHeader']),
     Paragraph("<b>Technologie</b>", styles['TableHeader']),
     Paragraph("<b>Version</b>", styles['TableHeader']),
     Paragraph("<b>Role</b>", styles['TableHeader'])],
    [Paragraph("Frontend", styles['TableCell']),
     Paragraph("React + Next.js", styles['TableCell']),
     Paragraph("19.2.3 / 16.1.6", styles['TableCellCenter']),
     Paragraph("Interface utilisateur, SSR, App Router", styles['TableCell'])],
    [Paragraph("Styling", styles['TableCell']),
     Paragraph("Tailwind CSS", styles['TableCell']),
     Paragraph("4.x", styles['TableCellCenter']),
     Paragraph("Framework CSS utility-first", styles['TableCell'])],
    [Paragraph("Langage", styles['TableCell']),
     Paragraph("TypeScript", styles['TableCell']),
     Paragraph("5.x", styles['TableCellCenter']),
     Paragraph("Typage statique, securite du code", styles['TableCell'])],
    [Paragraph("Base de donnees", styles['TableCell']),
     Paragraph("MongoDB", styles['TableCell']),
     Paragraph("Atlas / Local", styles['TableCellCenter']),
     Paragraph("Stockage NoSQL, documents JSON", styles['TableCell'])],
    [Paragraph("ORM", styles['TableCell']),
     Paragraph("Prisma", styles['TableCell']),
     Paragraph("7.5.0", styles['TableCellCenter']),
     Paragraph("Acces donnees, migrations, generation client", styles['TableCell'])],
    [Paragraph("Auth", styles['TableCell']),
     Paragraph("NextAuth.js", styles['TableCell']),
     Paragraph("4.24.13", styles['TableCellCenter']),
     Paragraph("JWT, Credentials Provider", styles['TableCell'])],
    [Paragraph("Cartes", styles['TableCell']),
     Paragraph("Leaflet + LocationIQ", styles['TableCell']),
     Paragraph("1.9.4 / 5.0.0", styles['TableCellCenter']),
     Paragraph("Cartes interactives, geocodage, itineraires", styles['TableCell'])],
    [Paragraph("Graphiques", styles['TableCell']),
     Paragraph("Recharts", styles['TableCell']),
     Paragraph("3.8.0", styles['TableCellCenter']),
     Paragraph("Visualisation de donnees, graphiques revenus", styles['TableCell'])],
    [Paragraph("Notifications", styles['TableCell']),
     Paragraph("OneSignal", styles['TableCell']),
     Paragraph("3.5.1", styles['TableCellCenter']),
     Paragraph("Push notifications (web + mobile)", styles['TableCell'])],
    [Paragraph("UI Components", styles['TableCell']),
     Paragraph("Radix UI", styles['TableCell']),
     Paragraph("Multiple", styles['TableCellCenter']),
     Paragraph("Dialog, Dropdown, Avatar, Label, Select", styles['TableCell'])],
    [Paragraph("Securite", styles['TableCell']),
     Paragraph("bcryptjs", styles['TableCell']),
     Paragraph("3.0.3", styles['TableCellCenter']),
     Paragraph("Hachage mots de passe", styles['TableCell'])],
    [Paragraph("Icones", styles['TableCell']),
     Paragraph("Lucide React", styles['TableCell']),
     Paragraph("0.577.0", styles['TableCellCenter']),
     Paragraph("Bibliotheque d'icones SVG", styles['TableCell'])],
    [Paragraph("Utilitaires", styles['TableCell']),
     Paragraph("date-fns, clsx, sonner", styles['TableCell']),
     Paragraph("4.1 / 2.1 / 2.0", styles['TableCellCenter']),
     Paragraph("Dates FR, classes CSS, toasts", styles['TableCell'])],
]

arch_table = Table(arch_data, colWidths=[75, 110, 75, 210])
arch_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [BG_CARD, BG_LIGHT]),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(arch_table)
story.append(spacer(10))

story.append(Paragraph("Variables d'Environnement Requises", styles['SubSection']))
env_rows = [
    ["DATABASE_URL", "MongoDB connection string (Atlas ou local)"],
    ["NEXTAUTH_SECRET", "Cle secrete JWT pour NextAuth"],
    ["NEXTAUTH_URL", "URL de callback authentification"],
    ["ADMIN_EMAIL / ADMIN_PASSWORD", "Identifiants admin par defaut"],
    ["NEXT_PUBLIC_LOCATIONIQ_KEY", "Cle API LocationIQ (cartes)"],
    ["NEXT_PUBLIC_ONESIGNAL_APP_ID", "ID app OneSignal (client)"],
    ["ONESIGNAL_REST_API_KEY", "Cle API REST OneSignal (serveur)"],
]
story.append(make_table(["Variable", "Description"], env_rows, [190, 290]))
story.append(PageBreak())

# ══════════════════════════════════════════
# SECTION 2 — BASE DE DONNEES
# ══════════════════════════════════════════
story.append(SectionBanner("BASE DE DONNEES (SCHEMA PRISMA)", "2", SECONDARY))
story.append(spacer(12))

story.append(Paragraph(
    "La base de donnees MongoDB est structuree en 13 modeles interconnectes, geree via Prisma ORM. "
    "Le schema definit les entites principales : utilisateurs, livreurs, magasins, produits, "
    "commandes, categories, codes promo, pays, zones de service, vehicules, bannières, "
    "notifications, transactions et administrateurs.",
    styles['BodyText2']
))
story.append(spacer(8))

# Models table
models = [
    ["User", "Utilisateurs de la plateforme", "id, userId, name, phone, email, walletMoney, userType, signupType, country, status, registeredAt"],
    ["Driver", "Livreurs / chauffeurs", "id, driverId, name, phone, email, serviceArea, country, totalOrders, rating, earning, walletMoney, status, approvalStatus, lastLocation, vehicleType"],
    ["Store", "Magasins / epiceries", "id, name, phone, email, address, image, loginUrl, rating, walletMoney, status, serviceArea, segment, totalOrders"],
    ["Product", "Produits en catalogue", "id, name, description, price, image, status, category, storeId (FK Store)"],
    ["Order", "Commandes clients", "id, orderId, storeId (FK Store), userId, driverId, total, status, items (JSON), address"],
    ["Category", "Categories de produits", "id, name, segment, parentCategory, image, sequence, status"],
    ["PromoCode", "Codes promotionnels", "id, code, discount, type, maxUses, usedCount, expiresAt, status"],
    ["Country", "Pays desservis", "id, name, code, status"],
    ["ServiceArea", "Zones de livraison", "id, name, country, status"],
    ["Vehicle", "Types de vehicules", "id, name, image, status"],
    ["SliderBanner", "Bannieres d'accueil", "id, title, image, link, sequence, status"],
    ["Notification", "Notifications push", "id, title, message, target, sentAt, status"],
    ["Transaction", "Transactions financieres", "id, userId, driverId, amount, type, description, status"],
    ["Admin", "Administrateurs", "id, name, email, password, role, status"],
]

story.append(Paragraph("Modeles de Donnees (13 modeles)", styles['SubSection']))
story.append(make_table(
    ["Modele", "Description", "Champs principaux"],
    models, [70, 110, 300]
))
story.append(spacer(8))

story.append(Paragraph("Relations entre Modeles", styles['SubSection']))
story.append(bullet("Store <b>1:N</b> Product — Un magasin possede plusieurs produits"))
story.append(bullet("Store <b>1:N</b> Order — Un magasin recoit plusieurs commandes"))
story.append(bullet("Order contient <b>userId</b> et <b>driverId</b> (references logiques)"))
story.append(bullet("Category supporte la <b>hierarchie parent/enfant</b> via parentCategory"))
story.append(bullet("Transaction reference <b>userId</b> ou <b>driverId</b> (operations financieres)"))
story.append(PageBreak())

# ══════════════════════════════════════════
# SECTION 3 — AUTHENTIFICATION
# ══════════════════════════════════════════
story.append(SectionBanner("AUTHENTIFICATION & SECURITE", "3", HexColor("#7c3aed")))
story.append(spacer(12))

auth_rows = [
    ["3.1", "Connexion Admin", "/login", "Email + mot de passe, validation JWT, gestion erreurs"],
    ["3.2", "Connexion Marchand", "/merchant/login", "Login par lien securise avec token + mot de passe"],
    ["3.3", "Protection des routes", "Layout dashboard", "Toutes pages admin protegees par session NextAuth"],
    ["3.4", "Deconnexion", "Sidebar", "Bouton logout en bas de la barre laterale"],
    ["3.5", "Gestion de session", "Global", "JWT persistant, callbacks token/session, role admin"],
]
story.append(make_feature_table(auth_rows))
story.append(spacer(8))

story.append(Paragraph("Flux d'Authentification", styles['SubSection']))
story.append(Paragraph(
    "<b>Admin :</b> Email + mot de passe -> NextAuth Credentials Provider -> Validation contre "
    "variables d'environnement -> Token JWT avec role 'admin' -> Redirection /dashboard",
    styles['BodyText2']
))
story.append(Paragraph(
    "<b>Marchand :</b> Lien securise avec ?store=ID&amp;token=HASH -> Validation token -> "
    "Verification mot de passe -> Acces au portail marchand avec contexte magasin",
    styles['BodyText2']
))
story.append(spacer(6))

# ══════════════════════════════════════════
# SECTION 4 — TABLEAU DE BORD
# ══════════════════════════════════════════
story.append(SectionBanner("TABLEAU DE BORD", "4", ACCENT_BLUE))
story.append(spacer(12))

dash_rows = [
    ["4.1", "Statistiques du site", "/dashboard", "7 cartes : Utilisateurs (20 887), Livreurs (148), Pays (3), Zones (3), Docs expirants (1), Revenus (413 666 FCFA), Remises"],
    ["4.2", "Statistiques epicerie", "/dashboard", "6 cartes : Magasins (14), Categories (27), Produits (2 546), Commandes (3 253), Revenus, Remises"],
    ["4.3", "Liens rapides", "/dashboard", "Chaque carte avec lien vers la page de detail"],
]
story.append(make_feature_table(dash_rows))
story.append(spacer(6))

# ══════════════════════════════════════════
# SECTION 5 — CONFIGURATION DE BASE
# ══════════════════════════════════════════
story.append(SectionBanner("CONFIGURATION DE BASE", "5", PRIMARY))
story.append(spacer(12))

story.append(Paragraph("5.1 — Gestion des Pays", styles['SubSection']))
config_pays = [
    ["5.1.1", "Liste des pays", "/countries", "Drapeau, nom, code, indicatif tel, devise, symbole, statut, date"],
    ["5.1.2", "Ajouter un pays", "/countries", "Formulaire de creation"],
    ["5.1.3", "Modifier / Supprimer", "/countries", "Actions en ligne. Pays : Senegal, France, Cote d'Ivoire"],
]
story.append(make_feature_table(config_pays))
story.append(spacer(6))

story.append(Paragraph("5.2 — Zones de Service", styles['SubSection']))
zones = [
    ["5.2.1", "Liste des zones", "/service-areas", "Nom, coordonnees GPS, rayon (km), frais livraison FCFA, statut"],
    ["5.2.2", "Ajouter une zone", "/service-areas", "Dakar (15km/500F), Rufisque (10km/750F), Pikine (8km/600F), Guediawaye (7km/650F)"],
]
story.append(make_feature_table(zones))
story.append(spacer(6))

story.append(Paragraph("5.3 — Categories Produits", styles['SubSection']))
cats = [
    ["5.3.1", "Liste categories", "/categories", "10 categories : segment, nom, parent, statut, ordre, image emoji, date"],
    ["5.3.2", "Hierarchie", "/categories", "Parent/enfant (ex: Daily Essentials sous Faire Votre Marche)"],
    ["5.3.3", "Recherche / Actions", "/categories", "Barre de recherche, modifier, supprimer en ligne"],
]
story.append(make_feature_table(cats))
story.append(spacer(6))

story.append(Paragraph("5.4 — Tarification & Codes Promo", styles['SubSection']))
tarif = [
    ["5.4.1", "Regles tarifaires", "/price-card/fare-rules", "Configuration des regles de prix de livraison"],
    ["5.4.2", "Tarification dynamique", "/price-card/surge", "Prix majore en periode de forte demande (surge)"],
    ["5.4.3", "Codes promo", "/promo-code", "Code, remise, type (% ou fixe), utilisations, expiration, statut"],
    ["5.4.4", "Creneaux horaires", "/service-time-slots", "Fenetres de service de livraison configurables"],
]
story.append(make_feature_table(tarif))
story.append(spacer(6))

story.append(Paragraph("5.5 — Autres Configurations", styles['SubSection']))
other_config = [
    ["5.5.1", "Documents", "/documents", "Types de pieces requises pour les livreurs"],
    ["5.5.2", "Types vehicules", "/vehicles", "Categories : Moto, Voiture, Velo"],
    ["5.5.3", "Unites de poids", "/weight-units", "Unites de mesure pour les produits"],
    ["5.5.4", "Marqueurs carte", "/map-markers", "Icones personnalisees pour la carte interactive"],
]
story.append(make_feature_table(other_config))
story.append(PageBreak())

# ══════════════════════════════════════════
# SECTION 6 — GESTION EPICERIE
# ══════════════════════════════════════════
story.append(SectionBanner("GESTION EPICERIE", "6", ACCENT))
story.append(spacer(12))

story.append(Paragraph("6.1 — Magasins", styles['SubSection']))
stores = [
    ["6.1.1", "Liste magasins", "/stores", "7 magasins : coordonnees, adresse, URL connexion, note etoiles, solde FCFA"],
    ["6.1.2", "Connexion directe", "/stores", "Lien incognito pour portail marchand de chaque magasin"],
    ["6.1.3", "Filtres", "/stores", "Par zone (Dakar, Rufisque, Keur Massar) + recherche"],
    ["6.1.4", "Detail magasin", "/stores/[id]", "Page detaillee avec toutes les informations"],
]
story.append(make_feature_table(stores))
story.append(spacer(6))

story.append(Paragraph("6.2 — Commandes", styles['SubSection']))
orders = [
    ["6.2.1", "Liste commandes", "/orders", "17 colonnes : N\u00B0, facture, magasin, client, livreur, produits, montants, paiement, statut"],
    ["6.2.2", "Filtres avances", "/orders", "Par N\u00B0 commande/client, produit, magasin, plage de dates"],
    ["6.2.3", "Onglets statut", "/orders", "Tous (6), En attente (1), En cours (1), Livrees (3), Annulees (1)"],
    ["6.2.4", "Modes paiement", "/orders", "Cash, Orange Money, Wave"],
]
story.append(make_feature_table(orders))
story.append(spacer(6))

story.append(Paragraph("6.3 — Factures & Slider", styles['SubSection']))
inv_slider = [
    ["6.3.1", "Factures commandes", "/invoices", "N\u00B0 facture, commande, magasin, client, montant, statut + export CSV"],
    ["6.3.2", "Slider accueil", "/slider", "Bannieres : titre, image, lien, sequence, statut actif/inactif"],
]
story.append(make_feature_table(inv_slider))
story.append(PageBreak())

# ══════════════════════════════════════════
# SECTION 7 — GESTION DES LIVREURS
# ══════════════════════════════════════════
story.append(SectionBanner("GESTION DES LIVREURS", "7", ACCENT_WARN))
story.append(spacer(12))

story.append(Paragraph("7.1 — Liste & Filtres Livreurs", styles['SubSection']))
drivers_list = [
    ["7.1.1", "Tableau livreurs", "/drivers", "10 colonnes : ID, zone, details, statistiques, transactions, inscription, statut, position, actions"],
    ["7.1.2", "Filtres multiples", "/drivers", "9 statuts, pays, zone, vehicule, recherche (nom/ID/tel/email)"],
    ["7.1.3", "Stats en-tete", "/drivers", "Inscription (1673), Docs temp (0), En attente (0), Details (12), Rejetes (0)"],
    ["7.1.4", "Pagination", "/drivers", "25, 50, 100 entrees par page"],
]
story.append(make_feature_table(drivers_list))
story.append(spacer(6))

story.append(Paragraph("7.2 — Approbation & Documents", styles['SubSection']))
drivers_approval = [
    ["7.2.1", "Livreurs en attente", "/drivers/pending", "3 demandes : ID, nom, zone, vehicule, docs (3/3 ou 2/3), date"],
    ["7.2.2", "Livreurs rejetes", "/drivers/rejected", "Liste des candidatures refusees"],
    ["7.2.3", "Documents expirants", "/drivers/documents", "Suivi des documents a expiration prochaine"],
    ["7.2.4", "Par vehicule", "/drivers/vehicle-based", "Tri livreurs par type (Moto, Voiture, Velo)"],
]
story.append(make_feature_table(drivers_approval))
story.append(spacer(6))

story.append(Paragraph("7.3 — Detail Livreur", styles['SubSection']))
driver_detail = [
    ["7.3.1", "Profil complet", "/drivers/[id]", "Toutes informations, historique, documents"],
    ["7.3.2", "Envoyer notification", "/drivers/[id]", "Modal : titre, message, image URL, promo, expiration"],
    ["7.3.3", "Ajouter argent", "/drivers/[id]", "Modal : methode, type Credit/Debit, montant, recu, description"],
    ["7.3.4", "Infos appareil", "/drivers/[id]", "Details du telephone du livreur"],
    ["7.3.5", "Toggle appel", "/drivers/[id]", "Activer/desactiver le bouton d'appel"],
    ["7.3.6", "Forcer deconnexion", "/drivers/[id]", "Deconnecter le livreur a distance"],
]
story.append(make_feature_table(driver_detail))
story.append(spacer(6))

story.append(Paragraph("7.4 — Carte Temps Reel & Heatmap", styles['SubSection']))
maps = [
    ["7.4.1", "Carte interactive", "/map/driver", "Vue Plan + Satellite, Leaflet + LocationIQ, 6 livreurs affiches"],
    ["7.4.2", "Statuts en direct", "/map/driver", "3 en ligne, 2 en livraison, 1 hors ligne + filtres"],
    ["7.4.3", "Itineraire", "/map/driver", "Visualisation des trajets de livraison"],
    ["7.4.4", "Heatmap commandes", "/map/heatmap", "Densite des commandes par zone + filtres temporels"],
    ["7.4.5", "Classement zones", "/map/heatmap", "Top 6 zones avec tendances (%) : Dakar Centre (1240), Plateau (987)..."],
]
story.append(make_feature_table(maps))
story.append(PageBreak())

# ══════════════════════════════════════════
# SECTION 8 — GESTION UTILISATEURS
# ══════════════════════════════════════════
story.append(SectionBanner("GESTION UTILISATEURS", "8", ACCENT_BLUE))
story.append(spacer(12))

users = [
    ["8.1", "Liste utilisateurs", "/users", "20 891 utilisateurs : ID, details, service, solde FCFA, inscription, statut"],
    ["8.2", "Filtres avances", "/users", "Nom, email, tel, ID, adresse, type inscription, source, parrainage, pays"],
    ["8.3", "Pagination", "/users", "10, 25, 50, 100 entrees par page"],
    ["8.4", "Statuts", "/users", "Actif, Inactif, Bloque"],
    ["8.5", "Actions", "/users", "Colonne actions par utilisateur"],
]
story.append(make_feature_table(users))
story.append(spacer(6))

# ══════════════════════════════════════════
# SECTION 9 — GESTION DU CONTENU
# ══════════════════════════════════════════
story.append(SectionBanner("GESTION DU CONTENU", "9", HexColor("#8b5cf6")))
story.append(spacer(12))

content = [
    ["9.1", "Pages CMS", "/content/pages", "Pages statiques (CGU, politique de confidentialite, etc.)"],
    ["9.2", "FAQ", "/content/faqs", "3 entrees par categorie (Commandes, Livraison, Support) + ajout"],
    ["9.3", "Textes application", "/content/app-strings", "Gestion des textes affiches dans l'app"],
    ["9.4", "Textes modules", "/content/module-strings", "Textes par module fonctionnel"],
    ["9.5", "Options paiement", "/content/payment-options", "Configuration Cash, Orange Money, Wave"],
]
story.append(make_feature_table(content))
story.append(spacer(6))

# ══════════════════════════════════════════
# SECTION 10 — NOTIFICATIONS & PORTEFEUILLE
# ══════════════════════════════════════════
story.append(SectionBanner("NOTIFICATIONS & PORTEFEUILLE", "10", HexColor("#ec4899")))
story.append(spacer(12))

notif = [
    ["10.1", "Liste notifications", "/notifications", "Tableau : titre, message, cible, statut (Envoye/Brouillon), date"],
    ["10.2", "Nouvelle notification", "/notifications", "Creation + ciblage par segment ou zone"],
    ["10.3", "Push OneSignal", "/api/notifications/send", "API REST pour envoi via OneSignal, bilingue FR/EN"],
    ["10.4", "Historique recharges", "/wallet", "Utilisateur, type, montant, methode, description, statut"],
    ["10.5", "Types operations", "/wallet", "Recharge manuelle, Bonus performance, Remboursement"],
]
story.append(make_feature_table(notif))
story.append(PageBreak())

# ══════════════════════════════════════════
# SECTION 11 — GESTION DES TRANSACTIONS
# ══════════════════════════════════════════
story.append(SectionBanner("GESTION DES TRANSACTIONS", "11", ACCENT_RED))
story.append(spacer(12))

transactions = [
    ["11.1", "Retraits livreurs", "/cashout/drivers", "3 onglets : En attente, Approuve, Rejete + actions approbation"],
    ["11.2", "Details retrait", "/cashout/drivers", "Nom, montant FCFA, methode (Orange Money/Wave/Cash), date"],
    ["11.3", "Retraits magasins", "/cashout/stores", "Meme fonctionnement que les retraits livreurs"],
]
story.append(make_feature_table(transactions))
story.append(spacer(6))

# ══════════════════════════════════════════
# SECTION 12 — RAPPORTS & ANALYTIQUES
# ══════════════════════════════════════════
story.append(SectionBanner("RAPPORTS & ANALYTIQUES", "12", HexColor("#0891b2")))
story.append(spacer(12))

reports = [
    ["12.1", "Rapport revenus", "/reports/earnings", "Stats : 4 livraisons, 67 350F total, 6 425F plateforme, 57 825F magasins"],
    ["12.2", "Graphique revenus", "/reports/earnings", "Visualisation mensuelle (Recharts) + filtres dates/magasin"],
    ["12.3", "Export CSV", "/reports/earnings", "Telechargement des donnees"],
    ["12.4", "Revenus livreurs", "/reports/earnings/drivers", "Rapport detaille par livreur"],
    ["12.5", "Revenus magasins", "/reports/earnings/stores", "Rapport detaille par magasin"],
    ["12.6", "Temps en ligne", "/reports/driver-online-time", "Analytique du temps de connexion des livreurs"],
    ["12.7", "Transactions globales", "/reports/transactions", "Vue globale toutes transactions portefeuille"],
    ["12.8", "Trans. utilisateur", "/reports/transactions/user", "Filtre par utilisateur"],
    ["12.9", "Trans. livreur", "/reports/transactions/driver", "Filtre par livreur"],
    ["12.10", "Trans. business", "/reports/transactions/business", "Filtre par activite commerciale"],
    ["12.11", "Soldes", "/reports/transactions/balance", "Rapport des soldes actuels"],
]
story.append(make_feature_table(reports))
story.append(PageBreak())

# ══════════════════════════════════════════
# SECTION 13 — PARAMETRES & ADMINISTRATION
# ══════════════════════════════════════════
story.append(SectionBanner("PARAMETRES & ADMINISTRATION", "13", SECONDARY))
story.append(spacer(12))

story.append(Paragraph("13.1 — Sous-Admins", styles['SubSection']))
subadmin = [
    ["13.1.1", "Liste sous-admins", "/settings/sub-admin", "3 admins : nom, email, role (Super Admin/Admin/Operateur), statut"],
    ["13.1.2", "Ajouter admin", "/settings/sub-admin/new", "Formulaire de creation nouveau sous-admin"],
    ["13.1.3", "Roles & Permissions", "/sub-admin/roles", "Configuration detaillee des droits par role"],
]
story.append(make_feature_table(subadmin))
story.append(spacer(6))

story.append(Paragraph("13.2 — Configuration Generale", styles['SubSection']))
settings = [
    ["13.2.1", "Contact & signalement", "/settings/configuration", "Email et telephone de rapport de problemes"],
    ["13.2.2", "Maintenance apps", "/settings/configuration", "6 toggles : Android/iOS x Utilisateur/Livreur/Commerce"],
    ["13.2.3", "Versions apps", "/settings/configuration", "Version + mise a jour obligatoire par plateforme"],
    ["13.2.4", "Langues", "/settings/configuration", "Admin, Utilisateur, Livreur (anglais/francais)"],
    ["13.2.5", "Apparence/Theme", "/settings/configuration", "Couleur, theme, image paiement (upload PNG/JPG)"],
]
story.append(make_feature_table(settings))
story.append(spacer(6))

story.append(Paragraph("13.3 — Sous-Configurations (13 pages)", styles['SubSection']))
sub_settings = [
    ["13.3.1", "Parametres requetes", "/settings/.../request", "Configuration des requetes de course"],
    ["13.3.2", "Parametres livreur", "/settings/.../driver", "Reglages specifiques livreurs"],
    ["13.3.3", "Parametres carte", "/settings/.../map", "Cle API LocationIQ, configuration carte"],
    ["13.3.4", "Config email", "/settings/.../email", "Serveur SMTP, expediteur"],
    ["13.3.5", "Templates email", "/settings/.../email-templates", "Modeles d'emails personnalisables"],
    ["13.3.6", "Types de service", "/settings/.../service-type", "Configuration des types de service"],
    ["13.3.7", "URLs application", "/settings/.../app-url", "Liens de telechargement des apps"],
    ["13.3.8", "Push notification", "/settings/.../push-notification", "Configuration OneSignal"],
    ["13.3.9", "Raisons annulation", "/settings/.../cancel-reasons", "Motifs d'annulation predefinis"],
    ["13.3.10", "Methodes paiement", "/settings/.../payment-method", "Activation Cash/OM/Wave"],
    ["13.3.11", "Abonnements", "/settings/.../membership", "Plans d'adhesion et tarification"],
    ["13.3.12", "Profil admin", "/settings/profile", "Modifier son profil administrateur"],
]
story.append(make_feature_table(sub_settings))
story.append(PageBreak())

# ══════════════════════════════════════════
# SECTION 14 — PORTAIL MARCHAND
# ══════════════════════════════════════════
story.append(SectionBanner("PORTAIL MARCHAND", "14", HexColor("#059669")))
story.append(spacer(12))

story.append(Paragraph(
    "Le portail marchand est une interface separee destinee aux gerants de magasins. "
    "Il dispose de sa propre authentification, navigation et mise en page. "
    "Le contexte magasin est passe via le parametre URL ?store=ID.",
    styles['BodyText2']
))
story.append(spacer(6))

merchant = [
    ["14.1", "Dashboard marchand", "/merchant/dashboard", "Vue d'ensemble des commandes et metriques du magasin"],
    ["14.2", "Commandes", "/merchant/orders", "6 onglets : Tout, En attente, En preparation, En livraison, Livre, Annule"],
    ["14.3", "Accepter / Refuser", "/merchant/orders", "Boutons rapides pour commandes en attente"],
    ["14.4", "Pret a livrer", "/merchant/orders", "Marquer une commande prete pour le livreur"],
    ["14.5", "Produits", "/merchant/products", "Catalogue produits du magasin"],
    ["14.6", "Portefeuille", "/merchant/wallet", "Gains et historique financier"],
    ["14.7", "Avis clients", "/merchant/reviews", "Notes et commentaires clients"],
    ["14.8", "Profil magasin", "/merchant/profile", "Informations et parametres du magasin"],
    ["14.9", "Parametres", "/merchant/settings", "Configuration avancee du magasin"],
    ["14.10", "Navigation mobile", "Layout", "Sidebar sombre + support tiroir mobile responsive"],
]
story.append(make_feature_table(merchant))
story.append(spacer(6))

# ══════════════════════════════════════════
# SECTION 15 — COMPOSANTS UI
# ══════════════════════════════════════════
story.append(SectionBanner("COMPOSANTS UI REUTILISABLES", "15", PRIMARY))
story.append(spacer(12))

ui_comps = [
    ["DataTable", "components/ui/DataTable.tsx", "Tableau generique avec tri, recherche, colonnes configurables, rendering custom"],
    ["StatCard", "components/ui/StatCard.tsx", "Carte metrique avec icone, label, valeur, lien optionnel, effet hover"],
    ["StatusBadge", "components/ui/StatusBadge.tsx", "Badge couleur : vert (actif), rouge (rejete), jaune (attente), gris, bleu"],
    ["LeafletMap", "components/ui/LeafletMap.tsx", "Carte interactive : marqueurs, polylignes, geoloc, tuiles LocationIQ"],
    ["Header", "components/layout/Header.tsx", "Barre violette (#6B6BD5), retour, plein ecran, notifs, langue, avatar"],
    ["Sidebar", "components/layout/Sidebar.tsx", "Navigation hierarchique, 9 sections repliables, logout, profil"],
]

story.append(make_table(
    ["Composant", "Fichier", "Description"],
    ui_comps, [70, 160, 250]
))
story.append(PageBreak())

# ══════════════════════════════════════════
# SECTION 16 — INTEGRATIONS EXTERNES
# ══════════════════════════════════════════
story.append(SectionBanner("INTEGRATIONS EXTERNES & API", "16", HexColor("#0d9488")))
story.append(spacer(12))

story.append(Paragraph("16.1 — LocationIQ (Cartes & Geolocalisation)", styles['SubSection']))
loc_features = [
    ["getTileUrl()", "Generation URL tuiles carte (streets/satellite/hybrid)"],
    ["geocode()", "Geocodage direct : adresse -> coordonnees GPS"],
    ["reverseGeocode()", "Geocodage inverse : coordonnees -> adresse"],
    ["getDirections()", "Itineraire entre 2 points (driving/cycling/walking)"],
    ["autocomplete()", "Recherche de lieu avec auto-completion et biais de proximite"],
    ["staticMapUrl()", "Generation URL carte statique PNG avec marqueurs"],
]
story.append(make_table(["Fonction", "Description"], loc_features, [120, 360]))
story.append(spacer(6))

story.append(Paragraph("16.2 — OneSignal (Notifications Push)", styles['SubSection']))
onesignal_features = [
    ["initOneSignal()", "Initialisation SDK client-side"],
    ["subscribeUser()", "Abonnement utilisateur aux notifications"],
    ["getSubscriptionId()", "Recuperation ID d'abonnement"],
    ["sendPushNotification()", "Envoi serveur via API REST, ciblage segments/playerIds, bilingue"],
    ["sendTagToUser()", "Ajout de tags pour segmentation"],
]
story.append(make_table(["Fonction", "Description"], onesignal_features, [140, 340]))
story.append(spacer(6))

story.append(Paragraph("16.3 — Endpoints API", styles['SubSection']))
api_rows = [
    ["POST", "/api/auth/[...nextauth]", "Authentification NextAuth (login/logout/session)"],
    ["POST", "/api/notifications/send", "Envoi de notifications push via OneSignal"],
]
story.append(make_table(["Methode", "Route", "Description"], api_rows, [50, 170, 260]))
story.append(spacer(6))

# ══════════════════════════════════════════
# SECTION 17 — CONFIGURATION & DEPLOIEMENT
# ══════════════════════════════════════════
story.append(SectionBanner("CONFIGURATION & DEPLOIEMENT", "17", SECONDARY))
story.append(spacer(12))

story.append(Paragraph("Scripts de Build", styles['SubSection']))
scripts = [
    ["npm run dev", "next dev", "Serveur de developpement (http://localhost:3000)"],
    ["npm run build", "prisma generate && next build", "Generation Prisma + build production"],
    ["npm start", "next start", "Demarrage serveur production"],
    ["npm run lint", "eslint", "Verification qualite du code"],
]
story.append(make_table(["Commande", "Execution", "Description"], scripts, [100, 180, 200]))
story.append(spacer(8))

story.append(Paragraph("Structure du Projet", styles['SubSection']))
story.append(Paragraph(
    "<font face='Courier' size=8>"
    "ndugumi/<br/>"
    "&nbsp;&nbsp;src/<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;app/           <font color='#94a3b8'># Routes Next.js (App Router)</font><br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(auth)/      <font color='#94a3b8'># Pages d'authentification</font><br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(dashboard)/ <font color='#94a3b8'># 48+ pages admin protegees</font><br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;api/         <font color='#94a3b8'># Endpoints API (auth, notifications)</font><br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;merchant/    <font color='#94a3b8'># 7 pages portail marchand</font><br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;components/    <font color='#94a3b8'># Composants reutilisables (layout, ui, providers)</font><br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;lib/           <font color='#94a3b8'># Services (prisma, locationiq, onesignal, utils)</font><br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;generated/     <font color='#94a3b8'># Client Prisma auto-genere</font><br/>"
    "&nbsp;&nbsp;prisma/<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;schema.prisma  <font color='#94a3b8'># 13 modeles MongoDB</font><br/>"
    "&nbsp;&nbsp;public/          <font color='#94a3b8'># Fichiers statiques</font><br/>"
    "&nbsp;&nbsp;package.json     <font color='#94a3b8'># Dependances (20 deps, 7 devDeps)</font><br/>"
    "&nbsp;&nbsp;tsconfig.json    <font color='#94a3b8'># TypeScript strict mode</font><br/>"
    "&nbsp;&nbsp;next.config.ts   <font color='#94a3b8'># Configuration Next.js</font>"
    "</font>",
    styles['BodyText2']
))
story.append(PageBreak())

# ══════════════════════════════════════════
# SECTION 18 — RESUME CHIFFRE
# ══════════════════════════════════════════
story.append(SectionBanner("RESUME CHIFFRE", "18", PRIMARY))
story.append(spacer(12))

summary = [
    ["Pages admin", "48+", "Routes protegees dans (dashboard)/"],
    ["Pages marchand", "7", "Dashboard, commandes, produits, wallet, avis, profil, parametres"],
    ["Routes API", "2", "Authentification NextAuth + Notifications OneSignal"],
    ["Sections navigation", "9", "Sidebar hierarchique avec menus depliables"],
    ["Composants UI", "6", "DataTable, StatCard, StatusBadge, LeafletMap, Header, Sidebar"],
    ["Modeles Prisma", "13", "User, Driver, Store, Product, Order, Category, etc."],
    ["Integrations tierces", "4", "MongoDB, LocationIQ, OneSignal, NextAuth"],
    ["Pays supportes", "3", "Senegal (FCFA), France (EUR), Cote d'Ivoire (FCFA)"],
    ["Zones de service", "4", "Dakar, Rufisque, Pikine, Guediawaye"],
    ["Utilisateurs", "20 891", "Inscrits via app ou admin"],
    ["Livreurs actifs", "148", "Sur 1 673 inscrits"],
    ["Magasins", "7", "3 actifs, 4 inactifs"],
    ["Dependances", "20", "+ 7 devDependencies"],
    ["Fonctionnalites totales", "120+", "Pages, formulaires, filtres, actions, modals"],
]

summary_table = Table(
    [[Paragraph("<b>Metrique</b>", styles['TableHeader']),
      Paragraph("<b>Valeur</b>", styles['TableHeader']),
      Paragraph("<b>Detail</b>", styles['TableHeader'])]] +
    [[Paragraph(r[0], styles['TableCell']),
      Paragraph(f"<b>{r[1]}</b>", styles['TableCellCenter']),
      Paragraph(r[2], styles['TableCell'])] for r in summary],
    colWidths=[120, 60, 300]
)
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [BG_CARD, BG_LIGHT]),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(summary_table)
story.append(spacer(20))

# Final note
story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
story.append(spacer(10))
story.append(Paragraph(
    "<i>Document genere automatiquement le 31 mars 2026. "
    "Cette documentation couvre l'ensemble des fonctionnalites de la plateforme NDUGUMi "
    "telle que deployee sur ndugumi.vercel.app. "
    "Pour toute question, contacter l'equipe de developpement.</i>",
    styles['SmallGray']
))

# ══════ BUILD PDF ══════
doc.build(
    story,
    onFirstPage=cover_page,
    onLaterPages=header_footer
)

print(f"PDF genere avec succes : {output_path}")
print(f"Taille : {os.path.getsize(output_path) / 1024:.0f} Ko")
