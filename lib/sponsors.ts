export type Status = "Prospect" | "Contacted" | "Replied";

export type Profile = {
  name: string;
  url: string;
  niche: string;
  audience: string;
  location: string;
  audienceSize: string;
  price: string;
};

export type SponsorMatch = {
  id: string;
  company: string;
  category: string;
  domain: string;
  score: number;
  why: string;
  angle: string;
  opener: string;
  signals: string[];
};

type Ctx = {
  name: string;
  topic: string;
  audience: string;
  location: string;
  unit: string; // "issue", "episode", "edition", "video", "post"
};

type SponsorSeed = {
  company: string;
  domain: string;
  category: string;
  keywords: string[];
  regions?: string[];
  minAudience: number;
  why: (c: Ctx) => string;
  angle: (c: Ctx) => string;
  opener: (c: Ctx) => string;
};

/**
 * Hand-written seed library. Mock data for the MVP — every match is generated
 * locally from the intake answers; nothing leaves the browser.
 */
const SEEDS: SponsorSeed[] = [
  {
    company: "Notion",
    domain: "notion.so",
    category: "Productivity",
    keywords: ["productivity", "students", "student", "startup", "career", "founder", "tech", "university", "college", "writing", "notes"],
    minAudience: 2000,
    why: (c) => `Notion's growth team targets people who organise their own work — ${c.audience} match the profile of early adopters who spread templates by word of mouth.`,
    angle: (c) => `A "how ${c.name} runs on Notion" ${c.unit} with a free, downloadable template for readers.`,
    opener: (c) => `We built our whole ${c.topic} workflow at ${c.name} in Notion — our readers keep asking for the template, so I thought of you first.`,
  },
  {
    company: "Ghost",
    domain: "ghost.org",
    category: "Publishing",
    keywords: ["newsletter", "journalism", "media", "writing", "independent", "publication", "magazine", "news", "creators", "blog"],
    minAudience: 500,
    why: (c) => `Ghost sells to independent publishers. An audience of ${c.audience} includes the next wave of writers deciding where to launch.`,
    angle: () => `Behind-the-scenes on running an independent publication, with an "ask us anything about our stack" reader Q&A.`,
    opener: (c) => `Half the emails I get from ${c.name} readers are "how do I start my own?" — I'd love to point them to Ghost properly.`,
  },
  {
    company: "beehiiv",
    domain: "beehiiv.com",
    category: "Publishing",
    keywords: ["newsletter", "creators", "creator", "media", "marketing", "growth", "writing", "audience"],
    minAudience: 1000,
    why: (c) => `beehiiv's referral program rewards creators who reach other aspiring writers — ${c.name}'s readers over-index on people building their own audience.`,
    angle: () => `A transparent growth breakdown (open rates, referral wins) with a beehiiv trial link.`,
    opener: (c) => `We grew ${c.name} without paid ads, and our readers want the playbook — beehiiv is a natural part of that story.`,
  },
  {
    company: "Squarespace",
    domain: "squarespace.com",
    category: "Websites",
    keywords: ["design", "creators", "creator", "photography", "art", "small business", "portfolio", "fashion", "music", "podcast", "food"],
    minAudience: 5000,
    why: (c) => `Squarespace consistently buys placements with creative and small-business audiences; ${c.audience} are exactly the people who need a portfolio or shop.`,
    angle: (c) => `Feature three readers' sites built on Squarespace in a "made by our community" ${c.unit}.`,
    opener: (c) => `Our ${c.topic} community is full of people launching their first portfolio or shop — and most of them have never been asked by a brand directly.`,
  },
  {
    company: "Mercury",
    domain: "mercury.com",
    category: "Fintech",
    keywords: ["startup", "startups", "founder", "founders", "business", "finance", "tech", "venture", "entrepreneur", "saas"],
    minAudience: 2000,
    regions: ["us", "usa", "united states", "san francisco", "new york", "nyc"],
    why: (c) => `Mercury acquires founders before they open a business account. ${c.name} reaches ${c.audience} — often right at incorporation stage.`,
    angle: () => `A "first 90 days of a company" checklist sponsored by Mercury, with a founder perk code.`,
    opener: (c) => `A lot of ${c.name} readers are in the "just incorporated" moment — which I think is exactly when Mercury wants to meet them.`,
  },
  {
    company: "Linear",
    domain: "linear.app",
    category: "Software",
    keywords: ["software", "engineering", "developer", "developers", "startup", "product", "tech", "design", "coding", "programming"],
    minAudience: 3000,
    why: (c) => `Linear's brand spend favours taste-driven, product-minded communities. ${c.audience} matches the teams Linear wants as early champions.`,
    angle: (c) => `A thoughtful ${c.unit} on how small teams ship, with Linear as the case study rather than a banner ad.`,
    opener: (c) => `${c.name} is read by the kind of builders who care how software feels — I'd love to talk about a thoughtful, non-banner placement.`,
  },
  {
    company: "Figma",
    domain: "figma.com",
    category: "Design",
    keywords: ["design", "designer", "ux", "ui", "students", "student", "creative", "product", "art", "university"],
    minAudience: 2000,
    why: (c) => `Figma invests heavily in education and community; ${c.audience} sit right in their student and early-career design funnel.`,
    angle: () => `Host a reader design challenge judged by the editors, with Figma Education promoted throughout.`,
    opener: (c) => `We'd love to run a design challenge for the ${c.name} community — and Figma feels like the only right partner for it.`,
  },
  {
    company: "Brilliant",
    domain: "brilliant.org",
    category: "Education",
    keywords: ["science", "math", "maths", "education", "learning", "students", "student", "tech", "engineering", "physics", "ai", "data", "curious"],
    minAudience: 3000,
    why: (c) => `Brilliant is one of the most active sponsors of curiosity-driven media. ${c.audience} are the self-learners they convert best.`,
    angle: (c) => `A recurring "puzzle of the ${c.unit}" segment linking to a matching Brilliant course.`,
    opener: (c) => `${c.name} readers are relentlessly curious about ${c.topic} — I think a weekly puzzle segment with Brilliant would genuinely delight them.`,
  },
  {
    company: "Oatly",
    domain: "oatly.com",
    category: "Food & drink",
    keywords: ["food", "coffee", "vegan", "plant", "climate", "sustainability", "lifestyle", "cooking", "recipes", "culture"],
    regions: ["uk", "london", "sweden", "europe", "berlin", "us"],
    minAudience: 5000,
    why: (c) => `Oatly's marketing leans on irreverent, culture-led independent media. ${c.audience} share its climate and food values.`,
    angle: (c) => `A playful, editorial-voice ${c.unit} where Oatly gets to be weird — they reward that more than standard ad copy.`,
    opener: (c) => `${c.name} has the slightly odd, very honest voice Oatly is known for — I think our readers would actually enjoy an Oatly placement.`,
  },
  {
    company: "Patagonia",
    domain: "patagonia.com",
    category: "Outdoor",
    keywords: ["outdoors", "outdoor", "climate", "sustainability", "environment", "hiking", "travel", "surf", "climbing", "nature", "activism"],
    minAudience: 5000,
    why: (c) => `Patagonia funds storytelling around environmental action; ${c.audience} care about the issues the brand campaigns on.`,
    angle: (c) => `Co-create a story about a local environmental project${c.location ? ` in ${c.location}` : ""}, with Patagonia Action Works featured.`,
    opener: (c) => `We'd like to tell a real environmental story${c.location ? ` from ${c.location}` : ""} for ${c.name}, and Patagonia is the brand our readers would trust behind it.`,
  },
  {
    company: "Bookshop.org",
    domain: "bookshop.org",
    category: "Books",
    keywords: ["books", "book", "reading", "literature", "writing", "culture", "poetry", "fiction", "local", "independent", "history"],
    regions: ["us", "uk", "spain"],
    minAudience: 500,
    why: (c) => `Bookshop.org supports independent bookshops and partners with small media at almost any size — ${c.audience} are natural book buyers.`,
    angle: (c) => `A curated "${c.name} reading list" with affiliate links plus a sponsored launch ${c.unit}.`,
    opener: (c) => `${c.name} readers buy the books we mention — we'd love to send that traffic to independent shops via Bookshop.org.`,
  },
  {
    company: "Headspace",
    domain: "headspace.com",
    category: "Wellness",
    keywords: ["health", "wellness", "mental", "students", "student", "mindfulness", "stress", "lifestyle", "work", "parenting"],
    minAudience: 5000,
    why: (c) => `Headspace runs student and young-professional campaigns year-round; ${c.audience} are dealing with exactly the stress they address.`,
    angle: (c) => `A sponsored exam-season or burnout ${c.unit} with an extended free trial for readers.`,
    opener: (c) => `Every time ${c.name} writes about burnout, it's our most-shared ${c.unit} — I think there's a real, honest partnership here.`,
  },
  {
    company: "Strava",
    domain: "strava.com",
    category: "Fitness",
    keywords: ["running", "runners", "trail", "cycling", "fitness", "sport", "sports", "outdoors", "health", "triathlon", "marathon", "training"],
    minAudience: 2000,
    why: (c) => `Strava grows through local clubs and community challenges — ${c.audience} are already the people organising group runs and rides.`,
    angle: (c) => `A ${c.name} club challenge on Strava, with monthly leaderboard shout-outs.`,
    opener: (c) => `We'd love to launch an official ${c.name} club on Strava — our readers are already comparing routes in the comments.`,
  },
  {
    company: "Airalo",
    domain: "airalo.com",
    category: "Travel",
    keywords: ["travel", "travelling", "traveling", "nomad", "abroad", "international", "expat", "backpacking", "tourism"],
    minAudience: 1000,
    why: (c) => `Airalo's affiliate and sponsorship budget targets frequent travellers; ${c.audience} cross borders often enough to need an eSIM.`,
    angle: () => `A "what's in our travel kit" segment with an exclusive reader discount code.`,
    opener: (c) => `${c.name} readers are constantly on the move, and the eSIM question comes up every single trip.`,
  },
  {
    company: "Wise",
    domain: "wise.com",
    category: "Fintech",
    keywords: ["travel", "expat", "international", "freelance", "freelancer", "remote", "finance", "money", "abroad", "students", "study abroad"],
    regions: ["uk", "london", "europe", "spain", "germany", "australia"],
    minAudience: 3000,
    why: (c) => `Wise targets people moving money across borders — ${c.audience} include freelancers, students abroad and expats.`,
    angle: (c) => `A practical "getting paid internationally" ${c.unit} with Wise as the worked example.`,
    opener: (c) => `A surprising number of ${c.name} readers get paid in one currency and live in another — Wise is the tool we keep recommending.`,
  },
  {
    company: "Duolingo",
    domain: "duolingo.com",
    category: "Education",
    keywords: ["language", "languages", "travel", "culture", "students", "student", "learning", "education", "international", "spanish"],
    minAudience: 5000,
    why: (c) => `Duolingo loves culturally fluent, playful partners. ${c.audience} are curious, multilingual-minded learners.`,
    angle: (c) => `A light, funny ${c.unit} co-written with Duolingo's social voice — they reward creative risk.`,
    opener: (c) => `${c.name} has a sense of humour that I think the Duolingo team would recognise.`,
  },
  {
    company: "Skillshare",
    domain: "skillshare.com",
    category: "Education",
    keywords: ["creative", "design", "art", "illustration", "photography", "video", "creators", "creator", "craft", "learning", "music"],
    minAudience: 3000,
    why: (c) => `Skillshare has sponsored creative creators for years; ${c.audience} want to learn the craft behind what ${c.name} covers.`,
    angle: () => `A "learn the skill behind the story" placement linking to a hand-picked Skillshare class.`,
    opener: (c) => `Our readers don't just want to read about ${c.topic} — they want to try it. Skillshare is the obvious next step.`,
  },
  {
    company: "Descript",
    domain: "descript.com",
    category: "Creator tools",
    keywords: ["podcast", "podcasts", "video", "youtube", "audio", "creators", "creator", "editing", "media", "interviews"],
    minAudience: 1000,
    why: (c) => `Descript targets people who make audio and video. ${c.name}'s audience includes creators actively looking for a faster editing workflow.`,
    angle: (c) => `Show your real editing workflow in a behind-the-scenes ${c.unit}.`,
    opener: (c) => `We edit every ${c.name} ${c.unit} in Descript, and we'd love to show our audience how.`,
  },
  {
    company: "Riverside",
    domain: "riverside.fm",
    category: "Creator tools",
    keywords: ["podcast", "podcasts", "interviews", "interview", "video", "audio", "creators", "media", "journalism"],
    minAudience: 1000,
    why: (c) => `Riverside sponsors interview-driven shows; ${c.audience} are both listeners and future hosts.`,
    angle: () => `A "how we record remote interviews" segment with a Riverside trial code.`,
    opener: (c) => `Our remote interviews are the backbone of ${c.name} — Riverside is quite literally how we make them.`,
  },
  {
    company: "Perplexity",
    domain: "perplexity.ai",
    category: "AI",
    keywords: ["ai", "research", "tech", "news", "journalism", "students", "student", "science", "data", "university"],
    minAudience: 3000,
    why: (c) => `Perplexity is aggressively reaching students and researchers; ${c.audience} are in that core demographic.`,
    angle: (c) => `A research-methods ${c.unit} showing how the ${c.name} team fact-checks with Perplexity.`,
    opener: (c) => `We spend a lot of time researching for ${c.name} — I think our readers would value seeing how Perplexity fits into that.`,
  },
  {
    company: "Grammarly",
    domain: "grammarly.com",
    category: "Writing",
    keywords: ["writing", "students", "student", "career", "university", "college", "journalism", "work", "english"],
    minAudience: 5000,
    why: (c) => `Grammarly runs back-to-school and career campaigns; ${c.audience} write constantly for class, work or publication.`,
    angle: (c) => `A "how our editors edit" ${c.unit} with practical writing tips and a Grammarly Pro offer.`,
    opener: (c) => `Writing well is the whole point of ${c.name}, and Grammarly is part of how our editors get there.`,
  },
  {
    company: "Monzo",
    domain: "monzo.com",
    category: "Fintech",
    keywords: ["students", "student", "finance", "money", "young", "university", "budget", "uk", "personal finance"],
    regions: ["uk", "london", "manchester", "edinburgh", "glasgow", "bristol", "england", "scotland", "wales"],
    minAudience: 2000,
    why: (c) => `Monzo builds loyalty with young UK audiences early. ${c.audience} are prime candidates for a first "proper" bank account.`,
    angle: () => `A student money survival guide, co-branded with Monzo's budgeting tools.`,
    opener: (c) => `${c.name} readers are figuring out money for the first time — I think Monzo can genuinely help them.`,
  },
  {
    company: "Too Good To Go",
    domain: "toogoodtogo.com",
    category: "Food & drink",
    keywords: ["food", "sustainability", "climate", "local", "students", "student", "budget", "city", "cooking", "waste"],
    regions: ["uk", "europe", "spain", "france", "italy", "germany", "us", "new york"],
    minAudience: 1000,
    why: (c) => `Too Good To Go needs dense local adoption${c.location ? ` in places like ${c.location}` : ""}; ${c.audience} are budget-conscious and climate-aware.`,
    angle: (c) => `A "best surprise bags${c.location ? ` in ${c.location}` : " near you"}" ${c.unit}, tested by the team.`,
    opener: (c) => `We'd love to review the best Too Good To Go spots${c.location ? ` in ${c.location}` : ""} for ${c.name} readers — it's a story they'd actually use.`,
  },
  {
    company: "Ecosia",
    domain: "ecosia.org",
    category: "Climate tech",
    keywords: ["climate", "sustainability", "environment", "tech", "activism", "green", "nature", "students"],
    regions: ["germany", "berlin", "europe", "uk"],
    minAudience: 500,
    why: (c) => `Ecosia partners with values-aligned independent media of every size; ${c.audience} already care about climate action.`,
    angle: (c) => `A "trees planted by ${c.name} readers" running tally across issues.`,
    opener: (c) => `I'd love to see how many trees the ${c.name} community could plant together — Ecosia feels like the right partner.`,
  },
  {
    company: "Bandcamp",
    domain: "bandcamp.com",
    category: "Music",
    keywords: ["music", "indie", "bands", "artists", "vinyl", "culture", "underground", "electronic", "concerts", "local"],
    minAudience: 500,
    why: (c) => `Bandcamp champions independent music media; ${c.audience} buy directly from artists.`,
    angle: () => `A co-curated "Bandcamp Friday" picks list, featuring local artists.`,
    opener: (c) => `${c.name} readers are the people who still buy records — a Bandcamp Friday collaboration feels obvious.`,
  },
  {
    company: "MUBI",
    domain: "mubi.com",
    category: "Film",
    keywords: ["film", "cinema", "movies", "culture", "art", "arts", "criticism", "independent", "festival"],
    minAudience: 2000,
    why: (c) => `MUBI partners with culture media that shapes taste; ${c.audience} watch beyond the mainstream.`,
    angle: (c) => `A monthly "what we're watching on MUBI" ${c.unit} with an extended reader trial.`,
    opener: (c) => `${c.name} readers are exactly the people who already argue about MUBI's monthly picks.`,
  },
  {
    company: "Raspberry Pi",
    domain: "raspberrypi.com",
    category: "Hardware",
    keywords: ["maker", "hardware", "electronics", "coding", "education", "tech", "students", "diy", "engineering", "robotics"],
    regions: ["uk", "cambridge"],
    minAudience: 2000,
    why: (c) => `Raspberry Pi supports maker and education communities; ${c.audience} love building things themselves.`,
    angle: (c) => `A reader build project across a series of ${c.unit}s, using Raspberry Pi kits.`,
    opener: (c) => `We'd love to run a reader build-along on ${c.name} — and it should obviously be on a Raspberry Pi.`,
  },
  {
    company: "Kickstarter",
    domain: "kickstarter.com",
    category: "Creator tools",
    keywords: ["creators", "creator", "design", "games", "gaming", "makers", "art", "comics", "indie", "projects"],
    minAudience: 2000,
    why: (c) => `Kickstarter wants to reach independent makers before they launch; ${c.audience} back and build projects.`,
    angle: () => `A "projects we backed" roundup alongside a creator launch-tips section.`,
    opener: (c) => `${c.name} readers back a surprising number of Kickstarter projects — let's give them better ones to find.`,
  },
  {
    company: "Coursera",
    domain: "coursera.org",
    category: "Education",
    keywords: ["career", "education", "learning", "students", "university", "data", "ai", "professional", "skills", "jobs"],
    minAudience: 5000,
    why: (c) => `Coursera targets career-switchers and students; ${c.audience} are actively investing in new skills.`,
    angle: (c) => `A "skills worth learning this year" ${c.unit} featuring Coursera certificates.`,
    opener: (c) => `${c.name} readers are ambitious about their careers — and they ask us constantly what to learn next.`,
  },
  {
    company: "Ground News",
    domain: "ground.news",
    category: "News",
    keywords: ["news", "politics", "journalism", "media", "current affairs", "student", "students", "local", "policy"],
    minAudience: 1000,
    why: (c) => `Ground News sponsors news and commentary across sizes; ${c.audience} want a broader view of the headlines.`,
    angle: (c) => `A "how this story was covered" sidebar in each ${c.unit}, powered by Ground News.`,
    opener: (c) => `${c.name} is about understanding the news better — Ground News is the tool we'd want our readers using.`,
  },
  {
    company: "Framer",
    domain: "framer.com",
    category: "Websites",
    keywords: ["design", "startup", "web", "creators", "portfolio", "designer", "tech", "product", "no-code"],
    minAudience: 2000,
    why: (c) => `Framer targets designers and founders who ship their own websites; ${c.audience} match that maker profile.`,
    angle: () => `A teardown of the best reader-made Framer sites, with a template giveaway.`,
    opener: (c) => `The ${c.name} community is full of people who design their own sites — Framer would land naturally here.`,
  },
  {
    company: "Local independent café",
    domain: "",
    category: "Local business",
    keywords: ["local", "city", "community", "students", "student", "campus", "neighbourhood", "neighborhood", "food", "coffee"],
    minAudience: 0,
    why: (c) => `Neighbourhood businesses${c.location ? ` in ${c.location}` : ""} often have small budgets but high intent — your local readers are their customers.`,
    angle: (c) => `A recurring "local spot of the ${c.unit}" feature with a reader-only offer.`,
    opener: (c) => `A lot of ${c.name}'s readers live within walking distance of you — I think we could send you some regulars.`,
  },
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function parseNumber(v: string) {
  const s = v.toLowerCase().replace(/,/g, "").trim();
  const m = s.match(/([\d.]+)\s*(k|m)?/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return Math.round(m[2] === "k" ? n * 1000 : m[2] === "m" ? n * 1_000_000 : n);
}

function detectUnit(text: string) {
  if (/podcast|episode|show/.test(text)) return "episode";
  if (/youtube|video|channel/.test(text)) return "video";
  if (/student|campus|university|college|magazine|paper/.test(text)) return "edition";
  if (/newsletter|substack|issue|email/.test(text)) return "issue";
  return "issue";
}

function shortAudience(audience: string) {
  const a = audience.trim().replace(/\.$/, "");
  if (!a) return "your readers";
  // Keep the core noun phrase: "University students aged 18–25 who care about…" → "university students aged 18–25"
  let core = a.split(/[.;\n]/)[0].split(/,| who | that | which | interested in /i)[0].trim();
  if (core.length > 60) core = core.slice(0, 60).replace(/\s+\S*$/, "");
  if (core.length < 8) core = a.slice(0, 60);
  return core.charAt(0).toLowerCase() + core.slice(1);
}

/** Capitalise the start of each sentence after template interpolation. */
function sentenceCase(text: string) {
  return text.replace(/(^|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase());
}

function hasWord(text: string, kw: string) {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}`, "i").test(text);
}

export function generateMatches(p: Profile, limit = 12): SponsorMatch[] {
  const text = `${p.name} ${p.niche} ${p.audience} ${p.url}`.toLowerCase();
  const topicText = `${p.name} ${p.niche}`.toLowerCase();
  const loc = p.location.toLowerCase();
  const size = parseNumber(p.audienceSize);
  const userTopics = p.niche
    .split(/[,/;&\n]| and /)
    .map((t) => t.trim())
    .filter(Boolean);

  const base: Omit<Ctx, "topic"> = {
    name: p.name.trim() || "your publication",
    audience: shortAudience(p.audience),
    location: p.location.trim(),
    unit: detectUnit(text),
  };

  return SEEDS.map((s) => {
    // Collapse plural/singular duplicates ("student" + "students") into one signal.
    const hits = [...new Set(s.keywords.filter((k) => hasWord(text, k)).map((k) => k.replace(/s$/, "")))];
    // Stated topics count double: they're what each issue is actually about.
    const weight = hits.reduce((sum, h) => sum + (hasWord(topicText, h) ? 12 : 6), 0);
    const regionHit = !!s.regions?.some((r) => hasWord(loc, r));
    const sizeOk = size === 0 || size >= s.minAudience;
    const jitter = hash(p.name + s.company) % 6;

    let score = 46 + Math.min(weight, 44) + jitter;
    if (regionHit && hits.length) score += 4;
    if (!sizeOk) score -= 8;
    if (s.company.startsWith("Local") && p.location.trim()) score += 4;
    score = Math.max(31, Math.min(96, score));

    const topic =
      userTopics.find((t) => hits.some((h) => t.toLowerCase().includes(h))) ||
      userTopics[0] ||
      s.category.toLowerCase();
    const ctx: Ctx = { ...base, topic: topic.toLowerCase() };

    const signals = [
      ...hits.slice(0, 3).map((h) => `Topic: ${h}`),
      ...(regionHit ? [`Active in ${p.location.trim()}`] : []),
      sizeOk ? "Audience size in range" : "Usually buys larger audiences",
    ];

    return {
      id: s.company.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      company: s.company,
      category: s.category,
      domain: s.domain,
      score,
      why: sentenceCase(s.why(ctx)),
      angle: sentenceCase(s.angle(ctx)),
      opener: sentenceCase(s.opener(ctx)),
      signals,
    };
  })
    .sort((a, b) => b.score - a.score)
    // Prefer brands with at least one topical signal; only pad with the rest for sparse profiles.
    .filter((m, i, all) => m.signals.some((x) => x.startsWith("Topic")) || i < Math.max(8, all.findIndex((x) => !x.signals.some((y) => y.startsWith("Topic")))))
    .slice(0, limit);
}

export const DEMO_PROFILE: Profile = {
  name: "The Quad Review",
  url: "thequadreview.com",
  niche: "student life, campus news, culture, careers",
  audience: "University students and recent grads aged 18–25 who care about culture, climate and getting their first job",
  location: "London, UK",
  audienceSize: "8,500",
  price: "£250",
};
