# NIVO — "Quiet Luxury" Fashion Store (video replication)

Source: 61-second mobile walkthrough (1080×2400) of the NIVO Arabic RTL fashion storefront + its admin studio dashboard.
Status: **CONFIRMED by user** — user replied "ابنِ الويب سايت كامل بنفس كل التفاصيل اللي في الفيديو، بما فيها لوحة الإدارة بباسورد NIVO555."

## 1. Goal & roles

A pixel-close Arabic (RTL) recreation of the NIVO brand site from the video: editorial "quiet luxury" storefront in Egyptian colloquial Arabic, plus the Studio admin dashboard the video shows behind it.

Roles:
- **Visitor** (no login) — browses the store, filters, opens a product, adds to cart, checks out, sends a contact message, subscribes to the newsletter.
- **Store owner / admin** — enters the Studio at `/admin` with the store password (`NIVO555` by default, overridable by env `ADMIN_PASSWORD`); adds / edits / deletes pieces, edits prices, collections, images, stock, reviews orders, and edits the site's own content (logo, brand line, contact data, social links).

## 2. Data model (Drizzle, Postgres, dev + prod)

All tables are business tables; the platform `users` table is untouched.

**products** — one garment
- `id` uuid PK · `name` text · `slug` text unique · `collection` text · `category` text (`women`|`men`|`knitwear`)
- `price` integer (EGP) · `compareAtPrice` integer nullable · `sizes` text (comma) · `colors` text
- `description` text · `material` text · `imageUrl` text · `galleryUrls` text (comma)
- `featured` boolean · `active` boolean · `stock` integer · `sortOrder` integer · `createdAt` timestamp

**orders** — `id` uuid · `code` text unique (NVO-XXXX) · `customerName` · `phone` · `email` · `city` · `address` · `note` · `total` integer · `status` text (`pending`|`packed`|`shipped`|`done`|`cancelled`) · `createdAt`

**orderItems** — `id` uuid · `orderId` uuid FK cascade · `productId` uuid nullable · `nameSnapshot` · `priceSnapshot` integer · `qty` integer · `size` text

**messages** — `id` uuid · `name` · `email` · `subject` · `body` · `handled` boolean · `createdAt`

**subscribers** — `id` uuid · `email` text unique · `createdAt`

**siteSettings** — `key` text PK · `value` text. Seeded keys: `brandLine`, `logoText`, `phone`, `phoneHours`, `email`, `address`, `addressNote`, `productionHours`, `mapText`, `whatsapp`, `instagramUrl`, `instagramName`, `facebookUrl`, `facebookName`, `tiktokUrl`, `tiktokName`, `pinterestUrl`, `pinterestName`.

Ownership: single-brand store — no per-user scoping. Admin writes gated by the admin session; visitor writes limited to orders, messages, subscribers.

## 3. Pages & routes

Public:
- `/` — home: full-bleed hero (model in cream coat, "هدوم تفضل هادية." + white CTA "تسوق الكولكشن"; corners "مصنوعة في البرتغال وإيطاليا" / "مصممة في كوبنهاجن" / "انزل ↓"); infinite ticker strip; "القطع اللي بنرجع لها دايماً" featured rail; "بطيء بالقصد" 3 numbered cards (01 خامات نعرف مصدرها / 02 قص بكميات صغيرة / 03 بنصلّح، مش بنستبدل); editorial 2-up image with «أحلى القطع هي اللي بتنسى إنك لابسها.» + "تسوق التريكو →"; 4-up service strip; newsletter; footer.
- `/shop` — كل القطع: label الكولكشن, big serif title, category pills (كل حاجة / نسائي / رجالي / تريكو), sort dropdown, filter toggle showing "٠ قطعة", designed empty state "مفيش حاجة مطابقة" + olive "إعادة ضبط الفلتر".
- `/shop/women`, `/shop/men`, `/shop/knitwear` — same shell with per-category copy.
- `/product/:slug` — gallery, name, price, material, sizes, add-to-cart, description, repair note.
- `/cart` — line items, qty edit, total, checkout form → creates order.
- `/order/:code` — order confirmation + tracking code.
- `/about` — hero image, "الحكاية" story, material pills (صوف / حرير / كتان / كشمير / جلد مدبوغ نباتيًا), "اللي بنؤمن بيه" 3 value cards, timeline (2019 / 2022 / 2026), CTA.
- `/contact` — "اكتب للاستوديو" + form (name, email, subject dropdown, message with ٥٠٠-char counter), studio detail rows, social links, designed map panel.
- `/materials`, `/privacy`, `/terms`, `/shipping` — compact info pages sharing the layout.

Requires admin session:
- `/admin` — password gate → dashboard: header "استوديو NIVO", 4 metric cards (الإيرادات / طلبات جديدة / ملابس نسائية / ملابس رجالية), tabs المنتجات / الطلبات / بيانات الموقع; products toolbar (category pills, search, "+ أضف قطعة" olive, restore); table (القطعة · المجموعة · الفئة · السعر · إيرادات) with empty state; add/edit product dialog; orders table with status change; site-data form with "حفظ البيانات" / "تراجع".

Empty states are designed on every list.

## 4. Permission rules

- Public read: products where `active = true`, public site settings.
- Public write: create order (total recomputed server-side from product prices), create message, subscribe email.
- Admin-only: product create/update/delete, order status, all site settings, reading messages/subscribers, admin stats.
- Admin gate: `admin.login` with password compared server-side against `env.config("ADMIN_PASSWORD", "NIVO555")`; sets a long random httpOnly `nivo_admin` cookie (HMAC-signed with jwtSecret) verified per request; logout clears it. No password stored client-side or echoed back.

## 5. Visual direction (from the video, exact)

- Palette: page cream `#F9F8F4`; card `#FFFFFF`; alt band `#F3F1EA`; ink `#16130F`; muted `#6F6A61`; hairline border `#E5E1D8`; **olive accent `#4A5D3B`**; **deep forest footer `#0B0F09`**; hero overlay text white.
- Type: display = Arabic serif (Amiri) for every big heading; body/UI = IBM Plex Sans Arabic; Latin wordmark "NIVO" letterspaced. Type scale: display clamp 5xl–7xl, section title 3xl, body 15–17px, label 11–12px letterspaced, line-height 1.9 for Arabic body.
- Geometry: sharp-ish corners (2–4px), pill category chips, hairline 1px borders, no shadows except a whisper on sticky header; generous vertical padding (96–140px desktop, 56–72 mobile); RTL with `dir="rtl"`, logical properties.
- Layout: max-width ~1240px content, hero 100svh full-bleed, 3-up numbered cards, 2-up editorial, 4-up service strip, footer 4-column dark with newsletter form.
- Motion (all CSS/JS, `prefers-reduced-motion` respected): hero slow ken-burns + staggered fade-up text; ticker infinite marquee (pause on hover); IntersectionObserver reveal for every section (fade + 24px rise, 60ms stagger); sticky header that gains a hairline + blur on scroll; image hover scale 1.03; counter count-up on admin metrics; smooth anchor scroll; page fade-in on route change.

## 6. Out of scope (explicit)

- **No payment processing** — checkout records the order (cash-on-delivery); no card gateway.
- **No outbound email/SMS** — newsletter list and contact messages are stored and readable in the Studio; nothing is sent. Order confirmation is the on-screen `/order/:code` page.
- **No real map tiles** — designed static map panel with an "افتح في الخرائط" link, not a Google Maps embed.
- **No Arabic/English bilingual toggle** — copy stays Arabic only.
- **No multi-admin accounts / roles** — one store password, one admin session.
- Admin stats computed live from the tables; no analytics integration.
