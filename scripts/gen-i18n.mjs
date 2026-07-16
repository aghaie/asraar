/**
 * تولیدِ کاتالوگ‌های زبانِ رابط از روی fa.json (ADR-0022، اصل ۸ — یک‌بار، commit‌شده).
 *
 * از موتور OpenAI (همان کلیدِ .env) استفاده می‌کند تا هر زبان را از فارسی بسازد و در
 * src/i18n/messages/<lang>.json بنویسد. کلیدها ثابت می‌مانند؛ فقط مقادیر ترجمه می‌شوند.
 * placeholderهای {name} حفظ می‌شوند.
 *
 * اجرا:  OPENAI_API_KEY=… node scripts/gen-i18n.mjs [lang1 lang2 …]
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('src/i18n/messages');
const fa = JSON.parse(fs.readFileSync(path.join(DIR, 'fa.json'), 'utf8'));

const TARGETS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['en', 'ar', 'tr', 'ur', 'id', 'fr', 'de', 'es', 'ru', 'zh', 'hi'];

const LANG_NAME = {
  en: 'English', ar: 'Arabic', tr: 'Turkish', ur: 'Urdu', id: 'Indonesian',
  fr: 'French', de: 'German', es: 'Spanish', ru: 'Russian', zh: 'Simplified Chinese', hi: 'Hindi',
};

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error('OPENAI_API_KEY لازم است.');
  process.exit(1);
}
const model = process.env.MONAD_MODEL || 'gpt-5';

function systemFor(lang) {
  return `You localize a UI string catalog for MONAD, a calm, Quran-grounded dialogue engine for seeking truth (humble, no social-media vibe).
Translate every VALUE of the JSON object below into ${LANG_NAME[lang] || lang}. Keep every KEY exactly as-is.
- Preserve placeholders like {count}, {turns}, {query} EXACTLY (do not translate the word inside braces).
- Keep the calm, humble, non-marketing tone; concise.
- Output ONLY a single JSON object with the same keys. No prose, no code fences, no wrapper object.`;
}

const firstKey = Object.keys(fa)[0];

/** شیءِ حاویِ کلیدهای کاتالوگ را پیدا کن (حتی اگر مدل آن را تودرتو برگرداند). */
function findCatalog(obj) {
  if (obj && typeof obj === 'object' && typeof obj[firstKey] === 'string') return obj;
  if (obj && typeof obj === 'object') {
    for (const v of Object.values(obj)) {
      const found = findCatalog(v);
      if (found) return found;
    }
  }
  return null;
}

async function translateCatalog(lang) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      max_completion_tokens: 24000,
      reasoning_effort: 'low',
      messages: [
        { role: 'system', content: systemFor(lang) },
        { role: 'user', content: JSON.stringify(fa) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  let text = (data.choices?.[0]?.message?.content ?? '').trim();
  text = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('non-JSON output');
  const obj = findCatalog(JSON.parse(text.slice(start, end + 1)));
  if (!obj) throw new Error('output had no matching keys');
  // اطمینان از پوشش همه‌ی کلیدها؛ نبوده‌ها از fa پر می‌شوند.
  const out = {};
  let translated = 0;
  for (const k of Object.keys(fa)) {
    if (typeof obj[k] === 'string' && obj[k] !== fa[k]) {
      out[k] = obj[k];
      translated += 1;
    } else {
      out[k] = obj[k] === fa[k] ? obj[k] : fa[k];
    }
  }
  if (translated < Object.keys(fa).length / 2) {
    throw new Error(`only ${translated} keys translated — likely wrong output`);
  }
  return out;
}

for (const lang of TARGETS) {
  try {
    const out = await translateCatalog(lang);
    fs.writeFileSync(path.join(DIR, `${lang}.json`), JSON.stringify(out, null, 2) + '\n');
    console.log(`✓ ${lang}.json (${Object.keys(out).length} کلید)`);
  } catch (e) {
    console.error(`✗ ${lang}: ${e.message}`);
  }
}
