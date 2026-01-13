# 🎨 CARERING Design System

## Unified Professional Design Language

Design system yang konsisten, modern, dan profesional untuk semua halaman aplikasi CARERING.

---

## 📐 Design Principles

### 1. **Consistency** (Konsistensi)
- Unified border radius
- Consistent spacing
- Standardized shadows
- Color harmony

### 2. **Minimalism** (Minimalisme)
- No unnecessary borders
- Clean shadows instead of heavy borders
- White space for breathing room
- Subtle gradients

### 3. **Hierarchy** (Hierarki)
- Clear visual hierarchy
- Size and weight differentiation
- Shadow elevation for depth
- Color for emphasis

### 4. **Responsiveness** (Responsif)
- Mobile-first approach
- Adaptive layouts
- Touch-friendly targets
- Scalable typography

---

## 🎨 Design Tokens

### Border Radius System
```css
--radius-sm: 12px    /* Small elements (badges, chips) */
--radius-md: 16px    /* Medium cards, buttons */
--radius-lg: 20px    /* Large cards, panels */
--radius-xl: 24px    /* Hero sections, featured cards */
```

**Usage:**
- Search bar: `var(--radius-lg)` (20px)
- Vital cards: `var(--radius-lg)` (20px)
- Category cards: `var(--radius-md)` (16px)
- Hero section: `var(--radius-xl)` (24px)

---

### Shadow Elevation System
```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04)   /* Subtle elevation */
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.06)  /* Medium elevation */
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08)  /* High elevation */
--shadow-xl: 0 12px 32px rgba(0, 0, 0, 0.1)  /* Dramatic elevation */
```

**Elevation Levels:**
- Level 1 (sm): Search bar, category cards, metric items
- Level 2 (md): Vital cards hover, chart cards
- Level 3 (lg): Hero section, panels, featured cards
- Level 4 (xl): Vital cards hover state

---

### Spacing System
```css
--spacing-section: 32px  /* Between major sections */
--spacing-card: 20px     /* Between cards in same section */
```

**Responsive:**
- Mobile: `--spacing-section: 24px`, `--spacing-card: 16px`
- Desktop: `--spacing-section: 32px`, `--spacing-card: 20px`

---

## 🎨 Color Palette

### Primary Colors (Vital Signs)
```css
Red:    #E74C3C → #c0392b  /* Heart Rate */
Blue:   #3498DB → #2980b9  /* SpO2 */
Orange: #F39C12 → #e67e22  /* Temperature */
Green:  #27AE60 → #229954  /* Ambient */
```

### Mental Health Colors
```css
Purple:  #667eea → #764ba2  /* Mood Stability */
Cyan:    #17a2b8 → #138496  /* Anxiety Level */
Indigo:  #5e72e4 → #4c63d2  /* Stress Resilience */
Pink:    #f093fb → #f5576c  /* HRV Score */

Teal:    #14b8a6 → #0d9488  /* Circadian Rhythm */
Navy:    #1e3a8a → #1e40af  /* Sleep Quality */
Amber:   #f59e0b → #d97706  /* Stress Response */
Emerald: #10b981 → #059669  /* Thermoregulation */
```

### Neutral Colors
```css
Gray 50:  #f8fafc  /* Backgrounds */
Gray 100: #f1f5f9  /* Subtle backgrounds */
Gray 200: #e2e8f0  /* Dividers */
Gray 600: #64748b  /* Secondary text */
Gray 900: #1e293b  /* Primary text */
```

### Semantic Colors
```css
Success: #27ae60  /* Good status */
Warning: #f39c12  /* Attention needed */
Danger:  #e74c3c  /* Critical status */
Info:    #3b82f6  /* Information */
```

---

## 📦 Component Styles

### Hero Section
```css
Background: Linear gradient (Purple)
Border Radius: var(--radius-xl) - 24px
Padding: 32px 24px
Shadow: var(--shadow-lg)
Border: none
```

### Search Bar
```css
Background: White
Border Radius: var(--radius-lg) - 20px
Padding: 14px 20px
Shadow: var(--shadow-sm)
Border: 1px solid rgba(0, 0, 0, 0.06) - subtle
```

### Category Cards
```css
Background: White
Border Radius: var(--radius-md) - 16px
Padding: 20px 16px
Shadow: var(--shadow-sm)
Border: none
Hover: translateY(-4px) + shadow-md
```

### Vital Cards
```css
Background: Linear gradient (per color)
Border Radius: var(--radius-lg) - 20px
Padding: 24px
Shadow: var(--shadow-md)
Border: none
Overlay: White gradient (0.1 opacity)
Hover: translateY(-6px) + shadow-xl
```

### Chart Cards
```css
Background: White
Border Radius: var(--radius-lg) - 20px
Padding: 24px
Shadow: var(--shadow-sm)
Border: none
```

### Analysis Panels
```css
Header Background: Purple gradient
Border Radius: var(--radius-lg) - 20px
Shadow: var(--shadow-md)
Border: none
Content Padding: 24px
```

### Insight Items
```css
Border Radius: var(--radius-md) - 16px
Padding: 16px
Shadow: var(--shadow-sm)
Border: none
Hover: translateX(4px) + shadow-md
Background: Gradient per variant
```

### Metric Items
```css
Background: #f8fafc
Border Radius: var(--radius-sm) - 12px
Padding: 10px 12px
Border: none
Hover: background #f1f5f9 + translateX(2px)
```

---

## 📱 Responsive Breakpoints

```css
Mobile:  max-width: 480px
Tablet:  max-width: 768px
Desktop: min-width: 769px
```

### Mobile Adjustments
- Categories grid: 2 columns
- Vitals grid: minmax(160px, 1fr)
- Font sizes: -2px to -4px smaller
- Padding: 75-80% of desktop
- Hero greeting: 24px (from 28px)

### Tablet Adjustments
- Categories grid: 2 columns
- Vitals grid: minmax(240px, 1fr)
- Moderate spacing reduction

---

## ✨ Animation System

### Transitions
```css
Default: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
Quick: all 0.2s ease
```

### Hover Effects
- **Cards:** `translateY(-4px)` to `-6px`
- **Items:** `translateX(2px)` to `4px`
- **Shadow:** Elevation increase by 1-2 levels

### Active States
- **Buttons:** `translateY(-2px)`
- **Cards:** `scale(0.98)`

---

## 🎯 Implementation Guidelines

### DO's ✅
- Use CSS variables for consistency
- Apply shadow instead of borders
- Use gradients for visual interest
- Maintain spacing consistency
- Use relative units (rem, em) for text
- Test on multiple devices

### DON'Ts ❌
- Don't use heavy borders (max 1px subtle)
- Don't mix border radius values randomly
- Don't use inline styles (use classes)
- Don't add unnecessary visual elements
- Don't use absolute pixel values for spacing
- Don't skip hover states

---

## 📋 Component Checklist

When creating new components, ensure:

- [ ] Uses design system variables
- [ ] Has appropriate border radius
- [ ] Uses shadow (not border) for elevation
- [ ] Has hover state
- [ ] Is responsive
- [ ] Has consistent spacing
- [ ] Uses brand colors
- [ ] Has smooth transitions
- [ ] Accessible contrast ratios
- [ ] Works on mobile

---

## 🔧 Common Patterns

### Card Pattern
```css
.custom-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}
```

### Gradient Card Pattern
```css
.gradient-card {
  background: linear-gradient(135deg, #start 0%, #end 100%);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
  border: none;
  color: white;
  position: relative;
  overflow: hidden;
}

.gradient-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
  pointer-events: none;
}
```

### Section Header Pattern
```css
<h2 class="section-title-modern">Section Title</h2>
```

### Grid Layout Pattern
```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}
```

---

## 📊 Before & After

### Before (Old Design)
❌ Multiple border styles (1px, 2px, 3px)
❌ Inconsistent border radius (10px, 12px, 16px, 20px)
❌ Heavy borders everywhere
❌ Inconsistent shadows
❌ Mixed spacing values
❌ Visual clutter

### After (New Design)
✅ No borders (shadows only)
✅ Consistent border radius system (4 values)
✅ Unified shadow elevation (4 levels)
✅ Standardized spacing (2 values)
✅ Clean, professional look
✅ Visual hierarchy clear

---

## 🚀 Benefits

### User Experience
- 📱 **Cleaner UI** - Less visual noise
- 👀 **Better Focus** - Clear hierarchy
- 🎯 **Easier Navigation** - Consistent patterns
- ⚡ **Smoother Interactions** - Consistent animations

### Developer Experience
- 🔧 **Easy Maintenance** - CSS variables
- 📦 **Reusable Components** - Pattern library
- 🎨 **Faster Development** - Pre-defined styles
- 🐛 **Fewer Bugs** - Consistent implementation

### Brand Identity
- 💎 **Professional Look** - Modern design
- 🎨 **Memorable** - Distinctive gradients
- 🏆 **Trustworthy** - Medical-grade feel
- ✨ **Premium** - High-quality aesthetics

---

## 📚 Resources

### Design Inspiration
- Material Design 3
- Apple Human Interface Guidelines
- Stripe Design System
- Ant Design
- Tailwind CSS

### Tools
- Figma (Design)
- Chrome DevTools (Debugging)
- ColorZilla (Color picking)
- WhatFont (Font identification)

---

**Version:** 2.0.0
**Last Updated:** 2026-01-13
**Status:** ✅ Production Ready

---

*Design system implemented across CARERING Health Monitoring App*
