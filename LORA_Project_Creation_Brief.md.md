# LORA Website Rebuild — Project Creation Brief

## Project Name

**LORA — Luweibdeh Old Residents Association Website + CMS**

## Objective

Build a custom full-stack rebuild of the LORA website with a backend-controlled CMS. The website must not use preset templates. It must be modern, editorial, interactive, bilingual, and controlled from the backend at the content, layout, theme, and interaction levels.

Existing website:

```txt
https://www.lorajo.org/
```

---

## Core Requirement

The backend must control:

- Page content
- Page sections
- Section order
- Section visibility
- Section layout variants
- Spacing
- Alignment
- Colors
- Typography tokens
- Background styles
- Image and video placement
- Button styles
- Card styles
- Animation presets
- Carousel settings
- Gallery behavior
- Navigation
- Footer
- SEO metadata
- Draft/publish state

Hardcode only:

- Rendering engine
- Reusable components
- Allowed variants
- Validation
- Authentication/security logic
- API contracts

---

## Recommended Stack

Use:

```txt
Next.js 15 App Router
TypeScript
Tailwind CSS
shadcn/ui
Prisma
PostgreSQL
Auth.js
Cloudinary
Resend
Framer Motion
Embla Carousel
Lenis smooth scroll
Zod
```

---

## Brand Guidelines

### Brand Name

```txt
LORA
Luweibdeh Old Residents Association
```

### Tagline

```txt
Our cultural heritage is our identity
```

### Business Overview

```txt
LORA is an Amman-based association dedicated to preserving Jabal Al-Luweibdeh’s historical architecture, greenery, and cultural heritage. Founded by long-time residents, the organization promotes community engagement through artistic initiatives, historical documentation, and local economic projects to ensure a sustainable future for the neighborhood.
```

### Brand Values

```txt
Heritage Preservation
Community Engagement
Sustainability
Equity
```

### Brand Aesthetic

```txt
Heritage Preservation
Civic-Minded
Community-Rooted
Understated Elegance
Urban Nostalgia
```

### Brand Tone of Voice

```txt
Professional
Dedicated
Community-oriented
Respectful
```

### Colors

```txt
Soft White: #f2faf6
Deep Black: #0a0a0a
Heritage Green: #01963c
Light Neutral: #f0f0f0
```

### Fonts

```txt
Primary: Avenir-lt-w01_35-light1475496
Fallback: Avenir, Avenir Next, Inter, Helvetica Neue, sans-serif
```

---

## Visual Direction

The site should feel like a modern cultural institution, not a nonprofit template.

Inspired by:

- Old Amman stone houses
- Jabal Al-Luweibdeh stairs
- Balconies
- Jasmine
- Archival photographs
- Neighborhood maps
- Heritage documentation
- Understated civic identity

The final look should feel:

- Elegant
- Serious
- Cultural
- Calm
- Premium
- Local
- Trustworthy
- Modern

Avoid:

- Generic NGO design
- Wix-like layouts
- Startup SaaS design
- Loud gradients
- Excessive icons
- Stock-photo feeling
- Overused charity layouts
- Template-looking cards

---

## Public Website Pages

Build these public pages:

```txt
/en
/en/who-we-are
/en/what-we-do
/en/founding-members
/en/photo-gallery
/en/contact

/ar
/ar/who-we-are
/ar/what-we-do
/ar/founding-members
/ar/photo-gallery
/ar/contact
```

The Arabic pages must be RTL-ready.

---

## Existing Website Text to Migrate

### Navigation

```txt
WHO WE ARE
WHAT WE DO
FOUNDING MEMBERS
PHOTO GALLERY
```

---

### Homepage

```txt
LORA
Luweibdeh Old Residents Association
OUR CULTURAL HERITAGE IS OUR IDENTITY
```

Section title:

```txt
What we do ?
```

Homepage summary:

```txt
LORA aims to enhance community engagement and improve services in the neighborhood in cultural, environmental, and heritage aspects.
```

Button:

```txt
Read More
```

Footer:

```txt
LORA
Luweibdeh old residents association
```

Location:

```txt
Amman, Paris square
```

Phone:

```txt
+962 7 7930 6500
```

Email:

```txt
info@lorajo.org
```

---

### Who We Are Page

Title:

```txt
LORA JO
```

Subtitle:

```txt
luweibdeh old residents association
```

Body:

```txt
Established in 2024 at the initiative of a group of long-time residents, LORA is dedicated to preserving Luweibdeh’s historical buildings, natural landscape, streets, and greenery in the face of the assault of modern trends of architectural urbanization and serving its community members.

Its main activities include supporting all private and public initiatives to make this neighborhood attractive for cultural and artistic activities.

LORA aspires to create a dynamic, engaged community that honors its past while looking forward to a sustainable and promising future.

LORA voluntarily and equitably provides services to all its members, with no intention of generating financial profit or offering personal benefits, either directly or indirectly to its board members. It consciously avoids political, sectarian, and personal agendas.
```

---

### What We Do Page

Title:

```txt
What we do ?
```

Body:

```txt
The founding committee has outlined two primary objectives:

1. Fostering a Sense of Belonging:
LORA aims to enhance community engagement and improve services in the neighborhood in cultural, environmental, and heritage aspects. This will be achieved through various activities and initiatives, such as:

- Conducting research, documentation, and skill development programs tailored to the community, especially the younger generations, through lectures, seminars, and workshops in different fields.
- LORA will spare no effort to analyze the neighborhood's challenges and issues and work with proper authorities to address them.

2. Organizing Small Income-Generating Projects:
LORA seeks to collaborate with residents to operate small-scale projects that benefit the community and individual participants. Proposed programs and activities will be implemented through:

- Enhancing the economic well-being of Al-Luweibdeh residents through appropriate initiatives and projects, thereby creating new job opportunities.
- Hosting a seasonal bazaar in collaboration with specialized local organizations, with priority given to neighborhood residents.
```

---

### Founding Members Page

Title:

```txt
LORA
```

Subtitle:

```txt
Dedication. Expertise. Passion.
```

Do not show this placeholder text on the final public site, but store it as old imported content in seed data:

```txt
This is your Team section. It's a great place to introduce your team and talk about what makes it special, such as your culture or work philosophy. Don't be afraid to illustrate personality and character to help users connect with your team.
```

Founding members:

```txt
Omar T. Alfaouri
Wael Hamza Smadi
Saleem Quna
Reem Farkouh
Rami Daher
Muneer Al Kurdi
Marwan Al Manha
Ali Al Manha
Majdolin Ghazawi
Marwan Abuazzam
```

---

### Photo Gallery Page

Sections:

```txt
HISTORICAL PHOTOS
LANDMARKS
FAMOUS FIGURES
```

Note:

```txt
The old website has a typo: “FAMOUS FIGUERS”.
Correct it to “FAMOUS FIGURES” in the new public UI.
```

---

## Admin Dashboard

Create a secure admin dashboard with:

- Login
- Dashboard overview
- Site Builder
- Theme Studio
- Media Library
- Page manager
- Navigation manager
- Footer manager
- Projects manager
- Events manager
- Articles manager
- Gallery manager
- Founding members manager
- Contact messages inbox
- Newsletter subscribers
- Volunteer applications
- Draft/publish workflow
- Preview before publish

Admin UI style:

- Dark
- Modern
- Clean
- Precise
- Professional
- Uses shadcn/ui components
- Includes sidebar, topbar, cards, tables, forms, drag/drop builder, media picker, and live preview panel

---

## Site Builder Requirements

The Site Builder must allow admins to:

- Create pages
- Edit page SEO
- Add sections
- Delete sections
- Reorder sections
- Hide/show sections
- Choose section type
- Choose layout variant
- Choose animation preset
- Control top/bottom spacing
- Control background style
- Assign images/videos
- Edit bilingual content
- Preview live page before publishing

---

## Theme Studio Requirements

The Theme Studio must allow admins to control:

- Primary color
- Secondary color
- Accent color
- Background color
- Foreground/text color
- Muted color
- Heading font
- Body font
- Typography scale
- Border radius
- Button style
- Card style
- Shadow style
- Navigation style
- Footer style
- Animation intensity

Use CSS variables:

```css
--color-primary
--color-secondary
--color-background
--color-foreground
--color-muted
--color-accent
--radius-card
--shadow-soft
--font-heading
--font-body
```

---

## Public Site Interaction Requirements

Use restrained modern interactivity:

- Smooth scrolling with Lenis
- Scroll reveal animations with Framer Motion
- Subtle parallax on hero/media sections
- Interactive lightbox gallery
- Hover states for cards and buttons
- Animated navigation underline
- Animated counters where stats exist
- Carousel support with Embla
- Reduced-motion accessibility support

Do not overanimate. The site should feel elegant, not like a tech demo.

---

## Section Types

Implement:

```txt
hero
video_scroll_hero
rich_text
image_text
gallery_grid
gallery_masonry
project_grid
event_list
member_grid
quote
timeline
stats
map
contact_form
newsletter_signup
cta
heritage_story
text_marquee
image_carousel
```

---

## Section Variants

### Hero Variants

```txt
editorial_fullscreen
split_text_image
centered_minimal
video_scroll_scale
```

### Gallery Variants

```txt
masonry
carousel
lightbox_grid
```

### Members Variants

```txt
editorial_portraits
clean_cards
compact_list
```

### Text/Image Variants

```txt
image_left
image_right
overlapping_editorial
full_bleed_image
```

---

## Video Scroll Hero Component Reference

Use this as the base for a backend-controlled video scroll hero section.

Make these values backend-controlled through PageSection settings:

- Video source
- Title
- Subtitle
- Tagline
- Start scale
- Overlay opacity
- Animation enablement
- Styling classes

```tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface VideoScrollHeroProps {
  videoSrc?: string;
  enableAnimations?: boolean;
  className?: string;
  startScale?: number;
}

export function VideoScrollHero({
  videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  enableAnimations = true,
  className = "",
  startScale = 0.25,
}: VideoScrollHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [scrollScale, setScrollScale] = useState(startScale);

  useEffect(() => {
    if (!enableAnimations || shouldReduceMotion) return;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight;
      const windowHeight = window.innerHeight;

      const scrolled = Math.max(0, -rect.top);
      const maxScroll = containerHeight - windowHeight;
      const progress = Math.min(scrolled / maxScroll, 1);

      const newScale = startScale + progress * (1 - startScale);
      setScrollScale(newScale);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [enableAnimations, shouldReduceMotion, startScale]);

  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="relative h-[200vh] bg-background">
        <div className="sticky top-0 w-full h-screen flex items-center justify-center z-10">
          <div
            className="relative flex items-center justify-center will-change-transform"
            style={{
              transform: shouldAnimate ? `scale(${scrollScale})` : "scale(1)",
              transformOrigin: "center center",
            }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-[80vw] max-w-4xl h-[60vh] object-cover shadow-2xl rounded-2xl"
            >
              <source src={videoSrc} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <motion.div
              className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="text-center text-white">
                <motion.h1
                  className="text-2xl md:text-4xl lg:text-6xl font-bold mb-4"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.8,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                  }}
                >
                  Scroll to Scale
                </motion.h1>
                <motion.p
                  className="text-sm md:text-lg lg:text-xl text-white/80 max-w-2xl px-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 1.0,
                    duration: 0.8,
                    type: "spring",
                    stiffness: 200,
                    damping: 25,
                  }}
                >
                  Watch as the video expands with your scroll
                </motion.p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Replace the default text with backend-controlled LORA content:

```txt
Title: LORA
Subtitle: Luweibdeh Old Residents Association
Tagline: Our cultural heritage is our identity
```

---

## Dynamic Rendering Model

Every public page must render from database sections.

Rendering flow:

```txt
Database
→ API
→ DynamicPage
→ SectionRenderer
→ Variant Component
→ Theme Tokens
```

Expected behavior:

```txt
DynamicPage loads Page by slug and locale.
Page includes ordered visible PageSections.
SectionRenderer maps section.type + section.variant to a component.
ThemeProvider loads active SiteTheme from DB and applies CSS variables.
```

Do not hardcode public pages with fixed JSX content.

---

## API Routes

Implement:

```txt
POST /api/auth/login

GET /api/pages/:slug
POST /api/admin/pages
PUT /api/admin/pages/:id
DELETE /api/admin/pages/:id

POST /api/admin/pages/:id/sections
PUT /api/admin/sections/:id
DELETE /api/admin/sections/:id
POST /api/admin/sections/reorder

GET /api/theme
PUT /api/admin/theme

GET /api/navigation
PUT /api/admin/navigation

GET /api/footer
PUT /api/admin/footer

GET /api/projects
POST /api/admin/projects
PUT /api/admin/projects/:id
DELETE /api/admin/projects/:id

GET /api/events
POST /api/admin/events
PUT /api/admin/events/:id
DELETE /api/admin/events/:id

GET /api/gallery
POST /api/admin/gallery
PUT /api/admin/gallery/:id
DELETE /api/admin/gallery/:id

GET /api/members
POST /api/admin/members
PUT /api/admin/members/:id
DELETE /api/admin/members/:id

POST /api/contact
GET /api/admin/messages
PUT /api/admin/messages/:id

POST /api/newsletter
POST /api/volunteer
```

---

## Prisma Models

Create models for:

```txt
User
Role
SiteTheme
DesignToken
Page
PageSection
SectionBlock
NavigationItem
FooterColumn
Project
Event
Article
Member
GalleryCollection
GalleryImage
MediaAsset
ContactMessage
NewsletterSubscriber
VolunteerApplication
AnimationPreset
ComponentVariant
AuditLog
```

---

## Suggested Project Structure

```txt
lora-site/
  app/
    [locale]/
      page.tsx
      [...slug]/
        page.tsx
    admin/
      dashboard/
        page.tsx
      pages/
        page.tsx
      site-builder/
        page.tsx
      theme/
        page.tsx
      media/
        page.tsx
      projects/
        page.tsx
      events/
        page.tsx
      articles/
        page.tsx
      gallery/
        page.tsx
      members/
        page.tsx
      messages/
        page.tsx
    api/
      pages/
      admin/
      contact/
      newsletter/
      volunteer/
  components/
    public/
    admin/
    sections/
    layout/
    ui/
  lib/
    auth.ts
    prisma.ts
    theme.ts
    validations.ts
    cloudinary.ts
    email.ts
  prisma/
    schema.prisma
    seed.ts
  public/
    logo/
    images/
  styles/
    globals.css
```

---

## Seed Data

Seed:

- Active theme using brand colors
- Navigation items
- Footer content
- Homepage
- Who We Are page
- What We Do page
- Founding Members page
- Photo Gallery page
- Founding member records
- Gallery collections
- Animation presets
- Component variants
- Initial admin user

---

## Development Phases

### Phase 1 — Foundation

- Initialize Next.js project
- Install dependencies
- Configure Tailwind
- Configure shadcn/ui
- Configure Prisma
- Configure PostgreSQL
- Configure Auth.js
- Create global theme tokens

### Phase 2 — Database + Seed

- Build Prisma schema
- Add migrations
- Add seed script
- Seed public pages and brand content
- Seed section variants and animation presets

### Phase 3 — Dynamic Public Rendering

- Build ThemeProvider
- Build DynamicPage
- Build SectionRenderer
- Build base sections
- Build homepage from seeded backend data

### Phase 4 — Admin CMS

- Add protected admin routes
- Build admin layout
- Build Site Builder
- Build Theme Studio
- Build Media Library
- Build CRUD screens

### Phase 5 — Interactivity

- Add Lenis smooth scroll
- Add Framer Motion reveals
- Add video scroll hero
- Add Embla carousel
- Add gallery lightbox
- Add reduced-motion support

### Phase 6 — Forms + Trust Layer

- Contact form
- Newsletter signup
- Volunteer application
- Governance/documents support
- Email notifications with Resend
- Admin message inbox

### Phase 7 — Production

- SEO metadata
- Sitemap
- Robots.txt
- Open Graph images
- Accessibility pass
- Deployment configuration
- Environment documentation

---

## Acceptance Criteria

The project is successful when:

- The public site renders fully from backend-controlled content.
- The admin can edit page sections without code changes.
- The admin can change theme tokens without code changes.
- The site supports English and Arabic routing.
- The homepage looks modern, editorial, and heritage-focused.
- The design does not resemble Wix or a generic nonprofit template.
- Contact/newsletter/volunteer forms save to the database.
- Admin routes are protected.
- The codebase is clean, typed, validated, and deployment-ready.

---

## First Claude Code Task

Start by creating:

1. The Next.js project structure
2. Dependency setup
3. Tailwind and shadcn/ui configuration
4. Prisma schema
5. Seed script
6. Theme token system
7. Dynamic page renderer
8. Section renderer
9. Admin dashboard shell
10. Initial homepage rendered from seeded data

Do not implement random static pages. The first working version must already use the dynamic backend-controlled rendering model.

