# Design Migration: Technical Brutalist Aesthetic

## Overview
Transitioning from generic SaaS look to "Technical Brutalist" aesthetic targeting founders/engineers skeptical of fluff.

## Key Design Elements

### 1. Huly Card (Rotating Border Pricing Cards)
- **Class**: `.huly-card`
- **Animation**: `border-spin` 4s infinite linear
- **Purpose**: Rotating border pricing cards
- **Location**: index.css:708-779

### 2. Brutalist Mechanical Buttons
- **Class**: `.btn-primary`
- **Style**: High contrast, monospace, visible grids
- **Location**: index.css:632-660

### 3. Glassmorphism Containers
- **Class**: `.glass-panel`
- **Style**: Backdrop blur with subtle borders
- **Location**: index.css:569-577

### 4. SVG Noise Texture Overlay
- **Class**: `.bg-noise`
- **Purpose**: Adds texture/grain to background
- **Location**: index.css:480-491

### 5. Animated Background Blobs
- **Class**: `.fractal-blob`
- **Animation**: `blob-spin` 20s infinite
- **Location**: index.css:504-549

## New Sections Added

### 1. "Built on Giants" Section
- Research institutions showcase
- Nielsen Norman Group, Baymard Institute, Forrester, BJ Fogg
- Citation-backed credibility

### 2. "The Equation of Certainty" Section
- Mathematical formula presentation: H × V × E = Success
- Hypothesis × Validation × Execution
- Visual equation with explanations

### 3. "Compare All Features" Table
- Detailed tier comparison
- Observer vs Insider vs Syndicate
- Feature-by-feature breakdown

### 4. "Intercepted Signals" Testimonials
- Blockchain-verified testimonial style
- Signal IDs with timestamps
- Technical aesthetic

## Copy Changes
- More aggressive, direct tone
- "Stop Guessing" instead of "Build Products That Win"
- "Physics of Success" instead of "Strategic Advantage"
- Technical jargon: "market survival probability", "user stickiness"

## Keyframes & Animations
- `blob-spin`: 20s background blobs
- `border-spin`: 4s rotating card borders
- `shimmer-progress`: 2s loading skeletons

## Winston Logging
- Need to check if implemented
- Server-side logging for debugging

## Implementation Priority
1. ✅ Copy index.css completely (all animations, classes)
2. ✅ Copy Home.tsx structure (all new sections)
3. ✅ Verify all hover states match
4. ✅ Test onclick interactions
5. ✅ Add Winston logging if missing
6. ✅ Test on dev server
7. ✅ Save checkpoint & push to GitHub
