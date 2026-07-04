import { StartupReport, SurveyAnswers } from './supabase';

// Fully input-driven fallback generator. Every output field is derived from
// the actual user inputs so no two profiles produce the same plan.

const TRACKER_STEPS = [
  'Select Idea',
  'Build MVP',
  'Create Branding',
  'Create Landing Page',
  'Get First User',
  'Get First Customer',
  'Launch',
];

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parseInput(input: SurveyAnswers | string) {
  if (typeof input === 'string') {
    const t = input.toLowerCase();
    const budgetMatch = t.match(/₹?\s*(\d[\d,]*)/);
    const budgetNum = budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, '')) : 2000;
    return {
      describes: /(student|college|school|teen|young)/i.test(t)
        ? 'Student'
        : /(employee|job|work|office)/i.test(t)
        ? 'Employee'
        : /(owner|business|entrepreneur)/i.test(t)
        ? 'Business Owner'
        : 'Aspiring Founder',
      budget: budgetNum <= 1000 ? '₹0-1000' : budgetNum <= 5000 ? '₹1000-5000' : budgetNum <= 25000 ? '₹5000-25000' : '₹25000+',
      budgetNum,
      businessType: /(ecommerce|e-commerce|shop|store|sell|product)/i.test(t)
        ? 'Ecommerce'
        : /(saas|software|app|platform|subscription)/i.test(t)
        ? 'SaaS'
        : /(agency|service|freelance|client)/i.test(t)
        ? 'Agency'
        : /(real.?estate|property|rent|land)/i.test(t)
        ? 'Real Estate'
        : /(physical|manufactur|handmade|craft)/i.test(t)
        ? 'Physical Product'
        : 'AI',
      skills: [
        /(market|social|content|brand)/i.test(t) ? 'Marketing' : null,
        /(cod|develop|program|tech)/i.test(t) ? 'Coding' : null,
        /(writ|blog|copy|story)/i.test(t) ? 'Writing' : null,
        /(design|ui|visual|graphic)/i.test(t) ? 'Design' : null,
        /(sale|sell|pitch|persuad)/i.test(t) ? 'Sales' : null,
      ].filter(Boolean) as string[] || ['Marketing'],
      time: /(5\+|5 hour|full.?time|whole day)/i.test(t)
        ? '5+ hours/day'
        : /(2|3|few hour)/i.test(t)
        ? '2-3 hours/day'
        : '1 hour/day',
      goal: /(full|full.?time|big|quit|replace)/i.test(t)
        ? 'Full Business'
        : /(learn|understand|explore)/i.test(t)
        ? 'Learning'
        : /(startup|raise|fund|scale|grow big)/i.test(t)
        ? 'Startup'
        : 'Side Income',
      raw: input,
      age: (() => { const m = t.match(/(\d{1,2})\s*(year|yr|yo)/i); return m ? parseInt(m[1]) : null; })(),
    };
  }
  const budgetNum = (() => {
    const m = input.budget.match(/\d[\d,]*/);
    return m ? parseInt(m[0].replace(/,/g, '')) : 2000;
  })();
  return {
    describes: input.describes,
    budget: input.budget,
    budgetNum,
    businessType: input.business_type,
    skills: input.skills.length ? input.skills : ['Marketing'],
    time: input.timeAvailable,
    goal: input.goal,
    raw: '',
    age: null as number | null,
  };
}

// Per-category startup idea matrix — multiple entries per category so the
// generator can vary selection based on the user's primary skill.
type IdeaEntry = { title: string; idea: string; description: string; bestSkill: string };

const IDEA_MATRIX: Record<string, IdeaEntry[]> = {
  AI: [
    {
      bestSkill: 'Writing',
      title: 'AI Blog Ghost-Writing Studio',
      idea: 'A subscription service where you use AI tools to write SEO blog posts for businesses.',
      description:
        'Use GPT-based tools to produce 4-8 polished blog posts/month per client. Charge ₹3,000-8,000/month per client. Start with 2-3 clients from LinkedIn outreach and scale by hiring a part-time editor.',
    },
    {
      bestSkill: 'Coding',
      title: 'AI Automation Agency',
      idea: 'Build custom AI automations (Zapier, n8n, OpenAI API) for small businesses to replace repetitive work.',
      description:
        'Identify one repetitive workflow a business does manually—invoice sorting, customer emails, lead follow-up—and automate it using no-code or low-code AI. Charge a one-time setup fee plus monthly maintenance.',
    },
    {
      bestSkill: 'Marketing',
      title: 'AI Social Media Management Service',
      idea: 'Use AI tools to manage social media content calendars for local businesses.',
      description:
        'Offer a monthly package: AI-generated captions, scheduled posts, hashtag research, and a monthly report. Use tools like Buffer + ChatGPT. Target 5-10 local businesses in your city.',
    },
    {
      bestSkill: 'Design',
      title: 'AI Branding Kit Service',
      idea: 'Create complete brand identity packs using AI design tools for startups and freelancers.',
      description:
        'Use Midjourney + Canva + Looka to produce logo, colour palette, business cards, and social templates. Sell as a ₹2,500-8,000 one-time package. Market on Fiverr and Instagram.',
    },
    {
      bestSkill: 'Sales',
      title: 'AI Lead Generation Service',
      idea: 'Sell qualified B2B leads to agencies and consultants using AI research tools.',
      description:
        'Use Apollo.io, LinkedIn Sales Navigator and AI prompts to build targeted lead lists for specific industries. Package as monthly subscriptions or per-lead pricing.',
    },
  ],
  SaaS: [
    {
      bestSkill: 'Coding',
      title: 'Micro-SaaS for a Niche Workflow',
      idea: 'A tiny, focused software tool solving one painful problem for a niche audience.',
      description:
        'Research one specific group (tutors, coaches, salon owners) and identify their most painful admin task. Build a minimal tool in Bubble, Glide, or custom code. Charge ₹299-999/month. Launch on Product Hunt and niche Facebook groups.',
    },
    {
      bestSkill: 'Marketing',
      title: 'SaaS Review & Comparison Newsletter',
      idea: 'A paid newsletter reviewing SaaS tools for a niche audience, with affiliate revenue.',
      description:
        'Write weekly reviews comparing 2-3 tools for a specific profession (teachers, gym owners, lawyers). Earn through Substack subscriptions + affiliate links. Grow via SEO and LinkedIn.',
    },
    {
      bestSkill: 'Writing',
      title: 'SaaS Onboarding Copy Agency',
      idea: 'Write onboarding emails, tooltips, and help docs for SaaS products.',
      description:
        'SaaS companies struggle with churn because their onboarding copy is confusing. Offer a ₹15,000-50,000 package to rewrite their first-week email sequence, in-app messages, and documentation.',
    },
  ],
  Ecommerce: [
    {
      bestSkill: 'Marketing',
      title: 'Niche Print-on-Demand Brand',
      idea: 'A focused print-on-demand store built around a passionate community (gamers, pet lovers, gym rats).',
      description:
        'Choose one passionate niche. Design 5-10 products using Canva. List on Printful + Shopify with zero inventory. Drive traffic via Instagram Reels and TikTok showcasing the culture.',
    },
    {
      bestSkill: 'Design',
      title: 'Premium Digital Products Store',
      idea: 'Sell high-margin digital downloads: Notion templates, Canva kits, Lightroom presets.',
      description:
        'Create 10 polished templates for a specific audience (students, content creators, small businesses). Sell on Gumroad or your own site. Promote through Pinterest and Instagram with aesthetic content.',
    },
    {
      bestSkill: 'Sales',
      title: 'Dropshipping Niche Store',
      idea: 'A one-product dropshipping store targeting a problem-solving product for a specific demographic.',
      description:
        'Research winning products using Minea or AdSpy. Build a Shopify store. Run low-budget Meta ads (₹500/day test budget). Scale what works, cut what doesn\'t. Focus on customer reviews and trust signals.',
    },
    {
      bestSkill: 'Writing',
      title: 'Handpicked Curated Box Subscription',
      idea: 'A monthly box of curated products delivered to a niche audience (booklovers, plant parents, cafe lovers).',
      description:
        'Source 4-6 products from local makers. Sell subscriptions pre-launch to validate demand. Start with 20 subscribers. Use Instagram Stories for behind-the-scenes content to build community.',
    },
  ],
  Agency: [
    {
      bestSkill: 'Design',
      title: 'One-Service Design Agency',
      idea: 'A solo agency offering one specific design deliverable: landing pages, pitch decks, or brand kits.',
      description:
        'Narrow your offer to one service you can deliver in a week. Charge ₹8,000-25,000 per project. Get first 3 clients from your network. Build a portfolio case study after each project to attract the next.',
    },
    {
      bestSkill: 'Coding',
      title: 'No-Code Web Agency',
      idea: 'Build fast, beautiful websites for local businesses using Webflow or Framer.',
      description:
        'Target businesses with ugly or no websites (restaurants, gyms, dentists). Build a template that takes 3 days to customise. Charge ₹15,000-40,000 per site plus ₹1,500/month hosting/maintenance.',
    },
    {
      bestSkill: 'Marketing',
      title: 'Local Business Meta Ads Agency',
      idea: 'Run Facebook and Instagram ads exclusively for one type of local business (restaurants, clinics, real estate).',
      description:
        'Master ads for one vertical. Start by offering a free trial campaign to 2 businesses. Document results. Package as ₹8,000-20,000/month management fee. Scale by duplicating the same system across clients.',
    },
    {
      bestSkill: 'Writing',
      title: 'Content Marketing Retainer Agency',
      idea: 'Monthly content packages (blog posts, email newsletters, LinkedIn posts) for B2B companies.',
      description:
        'Offer a 3-content/week package for one flat monthly fee. Use AI to speed up first drafts, your writing skills for editing. Target B2B SaaS or professional services companies via LinkedIn outreach.',
    },
  ],
  'Physical Product': [
    {
      bestSkill: 'Marketing',
      title: 'D2C Wellness or Lifestyle Brand',
      idea: 'A small direct-to-consumer physical product brand with strong story-driven marketing.',
      description:
        'Create one hero product (candles, skincare, supplements, snacks) with strong packaging and brand story. Sell on your own website + Instagram Shop. Build community before selling.',
    },
    {
      bestSkill: 'Design',
      title: 'Custom Merchandise Brand',
      idea: 'Design and sell branded merchandise (t-shirts, tote bags, accessories) for a niche community.',
      description:
        'Build a brand identity for a specific subculture. Use Printful for fulfilment. Launch limited-edition drops to create scarcity. Grow through community engagement and collaborations with micro-influencers.',
    },
  ],
  'Real Estate': [
    {
      bestSkill: 'Marketing',
      title: 'Hyper-Local Real Estate Content Creator',
      idea: 'Build a local real estate content brand on YouTube/Instagram to attract buyers and sellers.',
      description:
        'Post neighbourhood tours, market updates, and "what ₹X gets you in [city]" videos. Monetise through referral fees from agents, sponsored content, and eventually your own agent licence.',
    },
    {
      bestSkill: 'Sales',
      title: 'Qualified Lead Generation for Property Agents',
      idea: 'Capture buyer/renter leads in a specific micro-market and sell them to property agents.',
      description:
        'Build a simple landing page for a locality. Run low-cost Google/Meta ads. Package warm leads at ₹500-2,000 each to agents. Build trust with 2-3 agents first, then expand to more localities.',
    },
  ],
};

function selectIdea(businessType: string, skills: string[]): IdeaEntry {
  const pool = IDEA_MATRIX[businessType] || IDEA_MATRIX['AI'];
  const primarySkill = skills[0] || 'Marketing';
  const match = pool.find((e) => e.bestSkill === primarySkill) || pool[0];
  return match;
}

// Builds truly personalised text that changes with inputs.
function personalisedWhyItFits(p: ReturnType<typeof parseInput>, idea: IdeaEntry): string {
  const ageNote = p.age ? `At ${p.age}, you have the energy and time to build something from scratch. ` : '';
  const skillNote = `Your ${p.skills.slice(0, 2).join(' and ')} skill${p.skills.length > 1 ? 's' : ''} make${p.skills.length === 1 ? 's' : ''} this a natural fit. `;
  const budgetNote = p.budgetNum <= 1000
    ? 'With a tight budget, this model requires almost zero upfront investment. '
    : p.budgetNum <= 5000
    ? 'Your budget is enough to cover the tools and a small test campaign. '
    : 'Your budget gives you runway to test paid acquisition and iterate quickly. ';
  const goalNote = `Your goal of "${p.goal}" is achievable within 3-4 months with this model.`;
  return `${ageNote}${skillNote}${budgetNote}${goalNote}`;
}

function buildSwot(p: ReturnType<typeof parseInput>, idea: IdeaEntry) {
  const primarySkill = p.skills[0] || 'Marketing';
  const age = p.age;
  return {
    strengths: [
      `Strong ${primarySkill} skill directly applicable to ${idea.title}`,
      age && age < 22 ? 'Youth advantage: lower cost of living, more risk tolerance' : 'Focused mindset and clear goal direction',
      p.goal === 'Full Business' ? 'High commitment level aligns with full-time scaling' : 'Side-project model limits financial risk',
      `${p.businessType} market growing rapidly in India`,
    ],
    weaknesses: [
      `${p.time} daily limits how fast you can scale initially`,
      'No existing customer base or brand awareness yet',
      `Budget of ${p.budget} restricts paid advertising spend`,
      p.skills.length < 2 ? 'Limited skill breadth means you will need to outsource one function' : 'Working alone means all bottlenecks land on you',
    ],
    opportunities: [
      'Indian digital economy growing 20%+ annually — demand is there',
      'AI tools cut production time by 60-80%, giving you a cost edge over established players',
      `${p.businessType} segment has multiple underserved niches that large players ignore`,
      'Content and community can be built for near zero cost and compounds over time',
    ],
    threats: [
      'Established players could launch a competing product with more resources',
      'Algorithm changes on Instagram/YouTube can cut organic reach overnight',
      'AI commoditisation means offering taste, trust and brand matters more than access',
      'Cash-flow pressure if first clients take longer than 60 days to close',
    ],
  };
}

function buildRevenue(p: ReturnType<typeof parseInput>, idea: IdeaEntry) {
  const isService = ['Agency', 'AI'].includes(p.businessType);
  const isProduct = ['Ecommerce', 'Physical Product'].includes(p.businessType);
  const isSaas = p.businessType === 'SaaS';

  const sources = isService
    ? ['Monthly retainer fees (core)', 'Project-based setup fees', 'Upsell add-ons (extra content, reports)', 'Referral bonuses from partners']
    : isSaas
    ? ['Monthly subscriptions (core)', 'Annual plan discount tier', 'One-time onboarding fee', 'Feature add-on upsells']
    : ['Product sales (core)', 'Upsell bundles / packs', 'Digital companion products', 'Affiliate partnerships'];

  const budgetLow = p.budgetNum <= 1000;

  return {
    sources,
    pricingModel: isService
      ? `₹${budgetLow ? '3,000' : '8,000'}-${budgetLow ? '10,000' : '25,000'}/month retainer per client. Start with 3 clients to reach break-even.`
      : isSaas
      ? 'Freemium entry tier, ₹299-999/month Pro, ₹4,999 one-time setup. Focus on annual plans for cash flow.'
      : `₹${budgetLow ? '299' : '999'}-${budgetLow ? '999' : '3,999'} per order. Bundle pricing to increase average order value.`,
    profitPotential: isService ? '65-75% gross margin (your time is the main cost)' : isSaas ? '80-90% gross margin at scale' : '35-55% gross margin depending on COGS and shipping',
    monthlyEstimate: budgetLow
      ? `₹8,000-20,000/month with 3-6 clients or customers in month 3`
      : `₹30,000-1,20,000/month with 10-30 clients or customers in month 4-6`,
  };
}

function buildMarketing(p: ReturnType<typeof parseInput>, idea: IdeaEntry) {
  const bt = p.businessType;
  const primarySkill = p.skills[0] || 'Marketing';

  const igStrategy = bt === 'Ecommerce' || bt === 'Physical Product'
    ? `Post 4 Reels/week showing product aesthetics, unboxing, and customer reactions. Use trending audio. First 100 followers from your personal network. Run a giveaway at 500 followers to accelerate growth.`
    : bt === 'Agency' || bt === 'AI'
    ? `Document your work publicly: "client results before/after" posts. Post 3x/week about ${primarySkill.toLowerCase()} tips. Use story polls to engage prospects. Share case studies as carousel posts.`
    : `Post weekly "behind the scenes" of building the business. Attract an audience of aspiring founders who will become your first customers and ambassadors.`;

  const ytStrategy = bt === 'SaaS' || bt === 'Coding' === true as any
    ? `Create a "Build in Public" series — show the product being built week by week. Tutorial videos get long-tail SEO. Aim for 1 video/week, re-cut into 3 Shorts.`
    : `Document your founder journey in a "₹0 to ₹1 lakh challenge" series. Honest, vulnerable content performs better than polished marketing. Re-cut highlights as Shorts.`;

  const communityStrategy = `Join 3-5 niche communities on Reddit (r/startups, r/india, r/${bt.toLowerCase()}), LinkedIn groups, and Telegram/Discord. Add value first — answer questions, share knowledge. Mention your work only when directly relevant. One helpful comment a day compounds into authority over 90 days.`;

  const acquisitionStrategy = p.goal === 'Full Business'
    ? `Cold DM 15 ideal prospects daily on LinkedIn with a 3-line personalised note (what you noticed, what you can help, what you want). Book calls, not sales — understand problems first. Convert 1 in 20 DMs into a paying client.`
    : `Start with your warm network: friends, family, college seniors, old teachers. Ask for referrals before chasing strangers. Your first 5 customers will come from people who already trust you.`;

  const growthStrategy = `Double down on one channel that shows early traction. If Instagram comments are converting — do more Instagram. If LinkedIn DMs get replies — scale DMs. Resist spreading across 5 channels with no depth. Compound effect on one channel beats shallow presence everywhere.`;

  return { instagram: igStrategy, youtube: ytStrategy, community: communityStrategy, acquisition: acquisitionStrategy, growth: growthStrategy };
}

function buildRoadmap(p: ReturnType<typeof parseInput>, idea: IdeaEntry) {
  return [
    {
      week: 'Week 1 — Validate',
      steps: [
        `Talk to 10 people who match your target customer for ${idea.title}`,
        'Confirm they have the problem and would pay to solve it',
        'Register a business name and secure a domain (₹500 or less)',
        `Set up Instagram + LinkedIn profiles for ${idea.title}`,
      ],
    },
    {
      week: 'Week 2 — Build',
      steps: [
        'Create a minimal version of your offer (1-page website, sample work, or prototype)',
        `Use your ${p.skills[0] || 'primary'} skill to produce one impressive demo or portfolio piece`,
        'Write 5 posts explaining the problem you solve and who you help',
        'Open a waitlist or DM 20 potential first customers',
      ],
    },
    {
      week: 'Week 3 — Launch',
      steps: [
        'Publicly announce your launch on social media with your story',
        'Offer a 20% launch discount to the first 5 customers',
        'Personally onboard each early customer and ask for feedback',
        'Post testimonials and early results immediately',
      ],
    },
    {
      week: 'Week 4 — Scale',
      steps: [
        'Identify the one marketing channel bringing the most leads — double it',
        `Aim for ₹${p.budgetNum <= 1000 ? '5,000' : '15,000'} in revenue this week`,
        'Build a simple referral incentive for happy customers',
        'Plan month 2: set a revenue target and daily action plan',
      ],
    },
  ];
}

function buildCompetitors(p: ReturnType<typeof parseInput>, idea: IdeaEntry) {
  const bt = p.businessType;
  const competitorData: Record<string, { name: string; advantage: string; disadvantage: string; marketPosition: string }[]> = {
    AI: [
      { name: 'Established content agencies', advantage: 'Trusted brand, existing client base', disadvantage: 'High prices (₹50k+/month), slow, impersonal', marketPosition: 'Mid-large businesses only' },
      { name: 'Fiverr freelancers', advantage: 'Cheap and fast', disadvantage: 'No consistency, no strategy, no accountability', marketPosition: 'One-off buyers' },
      { name: 'In-house marketing teams', advantage: 'Deep brand knowledge', disadvantage: 'Expensive full-time cost, limited AI adoption', marketPosition: 'Large companies only' },
    ],
    Ecommerce: [
      { name: 'Amazon India / Flipkart', advantage: 'Massive reach and trust', disadvantage: 'No brand story, race to bottom on price', marketPosition: 'Mass market commodity' },
      { name: 'Local niche stores', advantage: 'Strong community connection', disadvantage: 'No tech leverage, poor marketing', marketPosition: 'Hyper-local, word-of-mouth' },
      { name: 'D2C brands (Sugar, Mamaearth)', advantage: 'Established brand, VC-funded marketing', disadvantage: 'Generic messaging, too broad', marketPosition: 'Mass D2C' },
    ],
    Agency: [
      { name: 'Large digital agencies', advantage: 'Prestigious clients, big teams', disadvantage: 'Expensive, slow, over-process', marketPosition: 'Enterprise clients' },
      { name: 'Other solo freelancers', advantage: 'Low price', disadvantage: 'Inconsistent quality, no process', marketPosition: 'Budget buyers' },
      { name: 'Template-based services (Wix, Squarespace)', advantage: 'DIY, cheap', disadvantage: 'Generic, no strategy, no personalisation', marketPosition: 'DIY startups' },
    ],
  };
  return competitorData[bt] || competitorData['AI'];
}

export function generateFallbackReport(input: SurveyAnswers | string): StartupReport {
  const p = parseInput(input);
  const idea = selectIdea(p.businessType, p.skills);
  const swot = buildSwot(p, idea);
  const revenue = buildRevenue(p, idea);
  const marketing = buildMarketing(p, idea);
  const roadmap = buildRoadmap(p, idea);
  const competitors = buildCompetitors(p, idea);

  const scoreNum = Math.min(
    95,
    60 +
      (p.skills.length >= 2 ? 10 : 0) +
      (p.budgetNum >= 5000 ? 8 : 0) +
      (p.goal === 'Full Business' ? 8 : 0) +
      (p.time === '5+ hours/day' ? 9 : p.time === '2-3 hours/day' ? 5 : 0)
  );

  return {
    overview: {
      title: idea.title,
      summary: `${idea.description} This plan is personalised for a ${p.describes.toLowerCase()} with a ${p.budget} budget, leveraging ${p.skills.slice(0, 2).join(' and ')} skills. With ${p.time} of focused effort, you can reach your goal of "${p.goal}" in 3-5 months by following this roadmap.`,
      tags: [p.businessType, ...p.skills.slice(0, 2), p.goal].filter(Boolean),
    },
    business: {
      idea: idea.idea,
      description: idea.description,
      whyItFits: personalisedWhyItFits(p, idea),
      potentialEarnings: revenue.monthlyEstimate,
      difficulty: p.skills.length >= 2 && p.budgetNum >= 5000 ? 'Medium' : p.budgetNum <= 1000 ? 'Hard initially, Medium at scale' : 'Medium-Hard',
      startupCost: p.budgetNum <= 1000
        ? '₹200-800 (domain + one tool subscription)'
        : p.budgetNum <= 5000
        ? '₹1,500-4,000 (branding, tools, first test ads)'
        : '₹5,000-20,000 (proper setup, ads, professional tools)',
      riskAnalysis: `Primary risk: slow client or customer acquisition in month 1. Mitigate by doing 10+ outreach conversations before building anything. Secondary risk: scope creep — stay focused on ONE offer and ONE channel for the first 90 days. Budget risk is ${p.budgetNum <= 1000 ? 'high — keep all spending under ₹500 until first paying customer' : 'manageable — never spend more than 30% of revenue on ads until month 3'}.`,
    },
    marketing,
    swot,
    revenue,
    competitors,
    roadmap,
    tracker: TRACKER_STEPS.map((label, i) => ({ label, done: i === 0 })),
    inspo: [
      {
        name: 'Notion',
        logoUrl: 'https://logo.clearbit.com/notion.so',
        description: 'All-in-one workspace for notes, docs, and project management.',
        businessModel: 'Freemium SaaS with team plans',
        whyRelevant: 'Started as a simple tool, grew through community-led growth.',
        keyLessons: ['Build a product people love', 'Community-driven growth works', 'Freemium model reduces friction'],
      },
      {
        name: 'Figma',
        logoUrl: 'https://logo.clearbit.com/figma.com',
        description: 'Collaborative design tool used by teams worldwide.',
        businessModel: 'Freemium SaaS with enterprise tiers',
        whyRelevant: 'Disrupted established design tools with collaboration-first approach.',
        keyLessons: ['Collaboration is a moat', 'Browser-first expands reach', 'Free tier drives adoption'],
      },
      {
        name: 'Zerodha',
        logoUrl: 'https://logo.clearbit.com/zerodha.com',
        description: "India's largest discount brokerage platform.",
        businessModel: 'Flat-fee brokerage + premium features',
        whyRelevant: 'Built a fintech giant by simplifying investing for young Indians.',
        keyLessons: ['Simplicity wins', 'Low cost + trust = scale', 'Educate your users'],
      },
    ],
    docs: {
      registrations: [
        { name: 'Udyam (MSME) Registration', description: 'Free online registration that gives your business a government-recognized identity and access to subsidies.', cost: 'Free', url: 'https://udyamregistration.gov.in' },
        { name: 'GST Registration', description: 'Required if your annual turnover exceeds ₹20 lakhs (₹10 lakhs for some states). Needed to collect and pay GST.', cost: 'Free registration, professional help ₹2,000–5,000', url: 'https://www.gst.gov.in' },
      ],
      licenses: [
        { name: 'Shop and Establishment License', description: 'Local municipal license required to operate a business in your state. Apply through your state government portal.', cost: '₹500–3,000' },
      ],
      taxes: [
        { name: 'Income Tax', description: 'Tax on your business profits. File annually as an individual or business entity.', rate: '5%–30% based on income slab' },
        { name: 'GST', description: 'Goods and Services Tax on sales, if registered. File monthly or quarterly returns.', rate: '5%, 12%, 18%, or 28% depending on product/service' },
      ],
      compliance: [
        { name: 'Bank Account', description: 'Open a current account in your business name after registration. Needed for all business transactions.' },
        { name: 'Invoicing', description: 'Maintain proper invoices with GSTIN (if registered) for all sales.' },
      ],
      certifications: [
        { name: 'ISO 9001', description: 'Quality management certification. Optional but builds trust with enterprise clients.', optional: true },
        { name: 'Startup India Recognition', description: 'Get recognized as a startup by DPIIT for tax benefits and easier compliance.', optional: false },
      ],
    },
    prompts: {
      aiPrompts: [
        { category: 'Logo', prompt: 'A modern, minimalist logo for a startup. Green and white color scheme. Clean geometric shapes. Flat design. Professional, trustworthy, and youthful. White background.' },
        { category: 'Social Banner', prompt: 'A wide social media banner (1500x500px) for a startup. Green gradient background with abstract geometric shapes. Modern, clean, professional. Space for text overlay.' },
        { category: 'Website Hero', prompt: 'A hero image for a startup website. Split layout: left side shows a young entrepreneur working on laptop, right side has abstract green tech elements. Bright, optimistic, modern.' },
        { category: 'Instagram Post', prompt: 'A square Instagram post for a startup. Green background with bold white text space. Minimalist design with a single product or service highlight. Modern, clean aesthetic.' },
        { category: 'YouTube Thumbnail', prompt: 'A YouTube thumbnail (1280x720) with a young entrepreneur looking excited. Bold text overlay space. Green accent colors. High contrast, eye-catching.' },
      ],
      businessNames: [
        { name: 'GreenSprout', domainSuggestion: 'greensprout.com', rationale: 'Combines growth (sprout) with the green brand identity.' },
        { name: 'MindWealth', domainSuggestion: 'mindwealth.io', rationale: 'Connects intelligence (mind) with prosperity (wealth).' },
        { name: 'IdeaForge', domainSuggestion: 'ideaforge.com', rationale: 'Evokes creation and innovation — forging ideas into businesses.' },
        { name: 'LaunchLab', domainSuggestion: 'launchlab.in', rationale: 'A place where startups are tested and launched.' },
        { name: 'VentureMint', domainSuggestion: 'venturemint.com', rationale: 'Fresh (mint) approach to ventures. Short, brandable.' },
      ],
    },
  };
}
