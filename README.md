# LOTEC Vietnam Website
> Giải pháp Giám sát Thông minh & Tự động hóa

## 🚀 Tech Stack
- **React 18** + **Vite 5** — lightning fast dev & build
- **Inter / Manrope** — enterprise typography
- **JetBrains Mono** — monospace for dashboard/code elements
- **localStorage** — Document CMS storage (ready for Supabase upgrade)

---

## 📦 Project Structure

```
lotec-website/
├── index.html              # Vite entry HTML (SEO meta tags included)
├── vite.config.js          # Vite config with React plugin
├── vercel.json             # Vercel deployment config (SPA rewrites)
├── package.json
├── .gitignore
├── .eslintrc.cjs
├── src/
│   ├── main.jsx            # React 18 entry point
│   ├── App.jsx             # Root component
│   ├── index.css           # Global styles, CSS variables, scrollbar
│   ├── components/
│   │   └── LotecHomepage.jsx   # Full homepage + Document CMS
│   └── assets/
│       └── lotec-logo.png
└── public/
    └── logo.png            # Favicon + OG image
```

---

## 🛠 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (opens at http://localhost:3000)
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build locally
npm run preview
```

---

## ☁️ Deploy to Vercel

### Option A — Vercel CLI (fastest)
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option B — Vercel Dashboard
1. Push project to GitHub / GitLab
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your repository
4. Framework: **Vite** (auto-detected)
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Click **Deploy** ✓

### Option C — Drag & Drop
1. Run `npm run build`
2. Go to [vercel.com/new](https://vercel.com/new)
3. Drag the `dist/` folder → Deploy instantly

---

## 📝 Environment Variables

Create `.env.local` for local overrides:

```env
# Google Apps Script — Form backend
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_ID/exec
```

Then update in `LotecHomepage.jsx`:
```js
const GAS_URL = import.meta.env.VITE_GAS_URL || "YOUR_FALLBACK_URL"
```

---

## 📄 Document CMS — Admin Usage

1. Scroll to **"Tài liệu tải về"** section
2. Click **⚙️ Quản lý tài liệu** (top-right of section)
3. Choose **➕ Thêm tài liệu mới**
4. Drag & drop PDF/DOCX/XLSX/PPTX
5. Fill in title, category, description → **Save**
6. Document appears instantly on the page

**Backup:** Export JSON → keeps all document metadata  
**Restore:** Import JSON → restores from backup

---

## 🗄 Upgrade to Supabase (Production)

```bash
npm install @supabase/supabase-js
```

Replace in `LotecHomepage.jsx`:

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Load docs
async function loadDocs() {
  const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
  return data || INITIAL_DOCS
}

// Save doc
async function saveDoc(doc) {
  if (doc.file) {
    const { data } = await supabase.storage.from('doc-files').upload(`${Date.now()}-${doc.file.name}`, doc.file)
    doc.fileUrl = supabase.storage.from('doc-files').getPublicUrl(data.path).data.publicUrl
  }
  await supabase.from('documents').upsert(doc)
}
```

**Supabase table schema:**
```sql
CREATE TABLE documents (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  cat_id      TEXT,
  desc        TEXT,
  format      TEXT,
  size        TEXT,
  pages       TEXT,
  year        TEXT,
  file_url    TEXT,
  file_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📞 Contact Form — Google Apps Script

1. Open `lotec_form_backend.gs`
2. Deploy as Web App in [script.google.com](https://script.google.com)
3. Set `VITE_GAS_URL` to your deployment URL

---

## 🎨 Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Navy | `#030B16` | Hero bg, dark sections |
| Blue | `#1D4ED8` | Primary CTA, links |
| Cyan | `#38BDF8` | Dashboard accents |
| Orange | `#EA7218` | CTA buttons, highlights |
| White | `#FFFFFF` | Header, card bg |

---

*LOTEC Vietnam Co., Ltd. © 2025*
