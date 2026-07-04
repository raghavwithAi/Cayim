import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Context fields we need to collect before generating ideas
const CONTEXT_FIELDS = [
  "goals",
  "skills",
  "budget",
  "interests",
  "location",
  "experience",
  "preferred_business_type",
];

const GREETINGS = [
  "hi", "hello", "hey", "hola", "howdy", "greetings", "what's up",
  "good morning", "good afternoon", "good evening", "sup", "yo", "hey there",
  "whats up", "wassup", "how are you", "hii", "hiii", "heya", "hiya"
];

const wantsToSkipContext = (text: string): boolean => {
  const lower = text.toLowerCase();
  const skipPatterns = [
    /i have (an? )?idea/i,
    /my (own )?idea/i,
    /already have/i,
    /here'?s? my idea/i,
    /this is my idea/i,
    /i want to start/i,
    /i want to build/i,
    /i want to create/i,
    /my business idea/i,
    /my startup idea/i,
    /skip to idea/i,
    /just generate/i,
    /generate (a|an|the|my) (business|startup|idea)/i,
  ];
  return skipPatterns.some(p => p.test(lower));
};

const extractIdeaFromText = (text: string): string | null => {
  const lower = text.toLowerCase();
  // If they're describing their idea, return the whole text as the idea
  if (wantsToSkipContext(text)) {
    return text;
  }
  return null;
};

const SYSTEM_PROMPT = `You are CAYIM, an expert AI Business Mentor with years of startup consulting experience. You help aspiring entrepreneurs discover and validate business ideas through natural conversation.

YOUR PERSONALITY:
- Warm, professional, and genuinely curious - like a seasoned startup advisor
- Ask ONE thoughtful follow-up question at a time (never multiple questions in one response)
- Remember everything the user shares across the conversation
- Be encouraging but realistic about challenges
- Never generate business ideas from simple greetings like "hi" or "hello"

YOUR GOAL:
Have a natural conversation to understand the user deeply before suggesting business ideas. You need to learn about:

1. **Goals** - What does success look like? Side income? Full business? Learning experience?
2. **Skills** - What can they do well? Coding, marketing, writing, design, sales?
3. **Budget** - How much can they invest? Be specific about ranges.
4. **Interests** - What topics excite them? What do they do for fun?
5. **Location** - Where are they based? This affects market opportunities.
6. **Experience** - Have they run a business before? What industry experience?
7. **Preferred Business Type** - SaaS, e-commerce, services, products, creator, local?

CONVERSATION FLOW:
1. Start by understanding their goals - why do they want to start a business?
2. Then explore their skills and interests
3. Ask about budget and time constraints
4. Learn about their location and experience
5. Finally, understand what type of business excites them

CRITICAL RULES:
- If the user sends ONLY a greeting (hi, hello, etc.), respond warmly and ask ONE question about their entrepreneurial goals. DO NOT generate ideas.
- If the user shares their own business idea, acknowledge it and ask if they want full business resources for it.
- Only proceed to idea generation when they explicitly ask for ideas AND you have context in at least 5 areas.
- Always respond in a conversational, consulting style - not as a survey bot.
- Keep responses conversational and concise (2-4 sentences typically).
- Ask only ONE question at a time.
- Do not rush to generate ideas - let the conversation flow naturally.

Respond in JSON format with this structure:
{
  "message": "your conversational response here (string)",
  "context_update": { any context fields you learned from this message },
  "ready_for_ideas": true/false,
  "has_own_idea": "the user's idea if they shared one, otherwise null"
}

EXAMPLE INTERACTIONS:

User: "Hi"
Response: {
  "message": "Hello! Great to meet you. I'm CAYIM, your AI Business Mentor. What's driving you to explore entrepreneurship - are you looking for a side project, a career change, or something else?",
  "context_update": {},
  "ready_for_ideas": false,
  "has_own_idea": null
}

User: "I want to build a SaaS for fitness tracking"
Response: {
  "message": "A fitness tracking SaaS sounds interesting! Before I help you flesh this out, tell me - do you have experience in the fitness space, or is this a market you'd be new to?",
  "context_update": { "preferred_business_type": "SaaS", "interests": ["fitness", "health"] },
  "ready_for_ideas": false,
  "has_own_idea": "I want to build a SaaS for fitness tracking"
}`;

const IDEA_GENERATION_PROMPT = `You are CAYIM, an expert startup consultant. Generate 5 COMPLETELY DIFFERENT startup ideas based on the user's profile.

CRITICAL REQUIREMENTS FOR UNIQUENESS:
1. Each idea MUST be from a DIFFERENT industry/category - NO repetition allowed
2. Choose 5 distinct categories from: AI/SaaS, E-commerce, Mobile App, Physical Products, Services/Agency, Content/Creator, Local Business, Education/EdTech, Health/Wellness, Fintech, Marketplace, B2B Services
3. Ideas must leverage DIFFERENT business models - NOT all subscription, NOT all marketplace
4. Each idea needs unique target audiences - different demographics, different niches
5. Each competitor analysis must be DIFFERENT companies, not the same across ideas
6. Each revenue model must be truly DIFFERENT

For EACH idea, provide comprehensive details in this exact JSON structure:
{
  "ideas": [
    {
      "idea_index": 1,
      "idea_type": "exact category name",
      "title": "catchy business name",
      "summary": "2-3 sentence description of the opportunity",
      "market_research": {
        "market_size": "specific TAM/SAM/SOM with real numbers",
        "growth_rate": "annual growth percentage with source",
        "trends": ["trend 1 with detail", "trend 2 with detail", "trend 3 with detail"],
        "key_insights": "what makes this market attractive now (2-3 sentences)"
      },
      "target_audience": {
        "primary": "detailed persona with age, income, location",
        "demographics": "age range, income level, geographic focus",
        "pain_points": ["specific pain point 1", "specific pain point 2"],
        "where_to_find_them": "specific platforms, communities, channels"
      },
      "competitor_analysis": [
        {
          "name": "real competitor name",
          "strengths": "what they do well",
          "weaknesses": "gaps you can exploit",
          "market_position": "their positioning"
        }
      ],
      "usp": {
        "unique_value": "your unique selling proposition",
        "differentiation": "how you stand out from competitors",
        "value_proposition": "clear value statement for customers"
      },
      "revenue_model": {
        "primary_stream": "main revenue source",
        "secondary_streams": ["additional revenue stream 1", "additional revenue stream 2"],
        "pricing_strategy": "how you price (freemium, tiered, usage-based, etc)",
        "unit_economics": "margins and unit economics details"
      },
      "roi_estimate": {
        "initial_investment": "₹ amount range",
        "break_even_timeline": "months to break even",
        "year_1_revenue_potential": "₹ range",
        "year_3_revenue_potential": "₹ range"
      },
      "startup_roadmap": {
        "phase_1": { "timeline": "Week 1-4", "steps": ["specific step 1", "specific step 2", "specific step 3"] },
        "phase_2": { "timeline": "Month 2-3", "steps": ["specific step 1", "specific step 2", "specific step 3"] },
        "phase_3": { "timeline": "Month 4-6", "steps": ["specific step 1", "specific step 2", "specific step 3"] },
        "phase_4": { "timeline": "Month 7-12", "steps": ["specific step 1", "specific step 2", "specific step 3"] }
      },
      "required_skills": {
        "must_have": ["skill 1", "skill 2"],
        "nice_to_have": ["skill 1", "skill 2"],
        "tools_needed": ["tool 1", "tool 2"],
        "learning_resources": ["resource with url 1", "resource with url 2"]
      },
      "funding_options": {
        "bootstrappable": true/false,
        "funding_sources": ["source 1", "source 2"],
        "grants_available": ["grant name with details"],
        "estimated_startup_cost": "₹ range"
      },
      "hackathons": [
        {
          "name": "specific hackathon name",
          "relevance": "why relevant",
          "timeline": "when it happens",
          "url": "website if known"
        }
      ],
      "communities": [
        {
          "name": "specific community name",
          "platform": "Reddit/Discord/Twitter/LinkedIn",
          "size": "member count approximation",
          "why_join": "benefits of joining"
        }
      ],
      "branding": {
        "name_suggestions": ["name 1", "name 2", "name 3"],
        "tone_of_voice": "brand personality description",
        "visual_identity": "colors, style directions",
        "logo_prompt": "DETAILED AI image prompt: [Write a complete Midjourney/DALL-E prompt for logo generation with specific style, colors, imagery, mood, composition. Be very specific - for example: 'Minimalist modern logo for a fintech startup, shield icon with tech elements, emerald green and deep blue gradients, clean sans-serif typography, professional and trustworthy, white background, vector style, high contrast --v 6']",
        "color_palette": ["#primary", "#secondary", "#accent", "#background"],
        "typography": "specific font recommendations"
      },
      "landing_page": {
        "headline": "compelling headline",
        "subheadline": "supporting tagline",
        "hero_copy": "main value proposition copy",
        "features": ["feature 1", "feature 2", "feature 3"],
        "cta": "call to action text",
        "design_prompt": "DETAILED AI image prompt: [Write a complete design prompt for landing page mockup generation - specific layout, sections, colors, style, mood. For example: 'Modern SaaS landing page hero section, split layout with product mockup on left and text on right, dark mode with emerald accents, glassmorphism cards, 3D isometric illustration, professional and clean, Dribbble-worthy design, 4k --ar 16:9 --v 6']"
      },
      "instagram_strategy": {
        "handle_suggestion": "@username",
        "bio": "Instagram bio with emojis",
        "content_pillars": ["pillar 1", "pillar 2", "pillar 3"],
        "posting_frequency": "suggested schedule",
        "hashtag_strategy": {
          "primary": ["hashtag1", "hashtag2", "hashtag3"],
          "niche": ["hashtag1", "hashtag2", "hashtag3"],
          "community": ["hashtag1", "hashtag2", "hashtag3"]
        },
        "engagement_tactics": ["tactic 1", "tactic 2"]
      },
      "viral_reels": [
        {
          "title": "Reel title",
          "hook": "First 3 seconds - exact attention grabber text",
          "body": "Main content script - 15-20 seconds exact dialogue/action",
          "cta": "Call to action - last 3 seconds",
          "camera_setup": "shot type, angle, framing",
          "b_roll": "overlay footage suggestions",
          "captions": "caption style and placement",
          "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
          "best_time_to_post": "specific day and time",
          "video_prompt": "DETAILED AI video prompt: [Write complete prompt for AI video generation - scene description, camera movement, lighting, style, mood, duration. For example: 'Young entrepreneur at modern desk, natural lighting, soft depth of field, talking to camera, confident expression, minimalist office background, motivational energy, 15 seconds, shot on iPhone style --ar 9:16']"
        }
      ],
      "ai_image_prompts": {
        "logo": "Full detailed prompt for logo generation",
        "brand_colors": "Full detailed prompt for brand color palette visualization",
        "product_mockup": "Full detailed prompt for product/service mockup",
        "social_media_post": "Full detailed prompt for Instagram post template",
        "website_hero": "Full detailed prompt for website hero section",
        "ad_creative": "Full detailed prompt for digital ad creative"
      },
      "ai_video_prompts": {
        "commercial": "Full detailed prompt for 30-second commercial video",
        "product_demo": "Full detailed prompt for product demo video",
        "reel_template": "Full detailed prompt for viral reel template",
        "youtube_short": "Full detailed prompt for YouTube Short",
        "explainer": "Full detailed prompt for explainer video"
      }
    }
  ]
}

Ensure each idea is COMPLETELY UNIQUE with NO overlapping details between ideas.`;

function isGreeting(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  // Only match simple greetings, not sentences containing greeting words
  return GREETINGS.some(g => {
    const normalizedGreeting = g.toLowerCase();
    // Exact match or greeting followed by punctuation
    if (normalized === normalizedGreeting) return true;
    if (normalized.startsWith(normalizedGreeting + " ") && normalized.length < normalizedGreeting.length + 10) return true;
    return false;
  });
}

function needsMoreContext(context: Record<string, any>): { missing: string[], complete: boolean } {
  const collected = CONTEXT_FIELDS.filter(f => context[f] && context[f].toString().length > 0);
  const missing = CONTEXT_FIELDS.filter(f => !context[f] || context[f].toString().length === 0);
  return { missing, complete: collected.length >= 5 };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!GEMINI_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";

    // Allow anonymous usage with anon key
    let userId = "anonymous";
    if (token && token !== process.env.SUPABASE_ANON_KEY) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    const body = await req.json();
    const { message, conversation_id, generate_ideas, user_idea, skip_to_generation } = body;

    if (!message && !generate_ideas && !skip_to_generation) {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get or create conversation
    let conversation;
    if (conversation_id && userId !== "anonymous") {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversation_id)
        .eq("user_id", userId)
        .single();
      conversation = data;
    }

    if (!conversation && userId !== "anonymous") {
      const { data } = await supabase
        .from("conversations")
        .insert({ user_id: userId, context: {} })
        .select()
        .single();
      conversation = data;
    }

    const currentContext = (conversation?.context as Record<string, any>) || {};

    // Handle direct idea generation request (user has their own idea)
    if (skip_to_generation && user_idea) {
      const ideas = await generateIdeasForUser(currentContext, user_idea, true);

      if (userId !== "anonymous" && conversation) {
        await storeIdeas(supabase, conversation.id, userId, ideas);
        await supabase
          .from("conversations")
          .update({ context_complete: true, updated_at: new Date().toISOString() })
          .eq("id", conversation.id);
      }

      return new Response(JSON.stringify({
        message: `Perfect! I've prepared a comprehensive business breakdown for "${user_idea}". Here's everything you need:`,
        conversation_id: conversation?.id,
        ideas: ideas,
        context: currentContext,
        ready_for_ideas: true,
        ideas_generated: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle idea generation request
    if (generate_ideas) {
      const { missing } = needsMoreContext(currentContext);

      // Allow generation with fewer context fields since conversation already happened
      const ideas = await generateIdeasForUser(currentContext, user_idea || null, false);

      if (userId !== "anonymous" && conversation) {
        await storeIdeas(supabase, conversation.id, userId, ideas);
        await supabase
          .from("conversations")
          .update({ context_complete: true, updated_at: new Date().toISOString() })
          .eq("id", conversation.id);
      }

      return new Response(JSON.stringify({
        message: `I've generated 5 diverse startup ideas tailored to your profile. Each one is completely unique with different markets, revenue models, and strategies. Let me show you:`,
        conversation_id: conversation?.id,
        ideas: ideas,
        context: currentContext,
        ready_for_ideas: true,
        ideas_generated: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle user message
    const messageText = message || "";

    // Store user message if we have a conversation
    if (userId !== "anonymous" && conversation) {
      await supabase.from("conversation_messages").insert({
        conversation_id: conversation.id,
        role: "user",
        content: messageText,
      });
    }

    // Check if it's a simple greeting
    if (isGreeting(messageText)) {
      const greetingResponse = {
        message: `Hello! I'm CAYIM, your AI Business Mentor. I'm here to help you discover or refine the right startup for you.\n\nWhat's driving you to explore entrepreneurship right now? Are you looking for a side income, a full-time venture, or just exploring ideas?`,
        context_update: {},
        ready_for_ideas: false,
        has_own_idea: null,
      };

      if (userId !== "anonymous" && conversation) {
        await supabase.from("conversation_messages").insert({
          conversation_id: conversation.id,
          role: "assistant",
          content: greetingResponse.message,
        });
      }

      return new Response(JSON.stringify({
        ...greetingResponse,
        conversation_id: conversation?.id,
        context: currentContext,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user wants to share their own idea or skip context collection
    const extractedIdea = extractIdeaFromText(messageText);
    if (extractedIdea || wantsToSkipContext(messageText)) {
      const idea = extractedIdea || messageText;
      const skipResponse = {
        message: `That sounds like a great concept! I can give you a complete business breakdown including market research, competitor analysis, revenue models, branding, AI prompts for logos and visuals, and viral marketing strategies.\n\nWould you like me to generate the full business plan for this idea?`,
        context_update: { has_own_idea: idea },
        ready_for_ideas: true,
        has_own_idea: idea,
      };

      if (userId !== "anonymous" && conversation) {
        await supabase.from("conversation_messages").insert({
          conversation_id: conversation.id,
          role: "assistant",
          content: skipResponse.message,
        });
        await supabase
          .from("conversations")
          .update({ context: { ...currentContext, has_own_idea: idea }, updated_at: new Date().toISOString() })
          .eq("id", conversation.id);
      }

      return new Response(JSON.stringify({
        ...skipResponse,
        conversation_id: conversation?.id,
        context: { ...currentContext, has_own_idea: idea },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load recent messages for context
    let messages: Array<{ role: string; content: string }> = [];
    if (userId !== "anonymous" && conversation) {
      const { data: recentMessages } = await supabase
        .from("conversation_messages")
        .select("role, content")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (recentMessages && recentMessages.length > 0) {
        messages = recentMessages.reverse();
      }
    }

    // Build conversation context for AI
    const conversationContext = Object.entries(currentContext)
      .filter(([k, v]) => k !== 'has_own_idea' && v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const systemPromptWithContext = `${SYSTEM_PROMPT}

CURRENT USER CONTEXT:
${conversationContext || "No context collected yet."}

CONVERSATION HISTORY (recent messages):
${messages.map(m => `${m.role === "user" ? "User" : "Mentor"}: ${m.content}`).join("\n") || "No previous messages."}

Respond to the user's latest message naturally. If they share information about themselves, update context_update accordingly. Remember to ask only ONE question at a time.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;

    const aiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPromptWithContext }] }],
        generationConfig: {
          temperature: 0.85,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({ error: `AI error: ${errText.slice(0, 200)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiJson = await aiResponse.json();
    const responseText = aiJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return new Response(
        JSON.stringify({ error: "Empty response from AI" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Try to extract meaningful content from non-JSON response
      parsed = {
        message: responseText.slice(0, 500),
        context_update: {},
        ready_for_ideas: false,
        has_own_idea: null,
      };
    }

    // Update context
    const updatedContext = { ...currentContext, ...parsed.context_update };

    if (userId !== "anonymous" && conversation) {
      await supabase
        .from("conversations")
        .update({ context: updatedContext, updated_at: new Date().toISOString() })
        .eq("id", conversation.id);

      // Store assistant message
      await supabase.from("conversation_messages").insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: parsed.message,
      });
    }

    // Check if ready for ideas
    const { complete } = needsMoreContext(updatedContext);

    return new Response(JSON.stringify({
      message: parsed.message,
      conversation_id: conversation?.id,
      context: updatedContext,
      ready_for_ideas: complete || parsed.ready_for_ideas || false,
      has_own_idea: parsed.has_own_idea || null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Server error:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateIdeasForUser(
  context: Record<string, any>,
  userOwnIdea: string | null,
  isOwnIdea: boolean
): Promise<any[]> {
  const profileSummary = Object.entries(context)
    .filter(([k, v]) => k !== 'has_own_idea' && v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  let prompt: string;
  if (isOwnIdea && userOwnIdea) {
    prompt = `${IDEA_GENERATION_PROMPT}\n\nIMPORTANT: The user has their OWN business idea: "${userOwnIdea}"\n\nGenerate 1 detailed idea based on THEIR concept (idea_index 1), plus 4 other COMPLETELY DIFFERENT startup ideas from DIFFERENT industries (ideas 2-5). Each idea must be unique with no overlapping details.\n\nUser's additional context:\n${profileSummary || "No additional context provided."}`;
  } else {
    prompt = `${IDEA_GENERATION_PROMPT}\n\nUser Profile:\n${profileSummary || "No specific profile provided - generate diverse ideas for a general entrepreneur."}\n\nGenerate 5 COMPLETELY DIFFERENT startup ideas. Each must be from a different industry, different business model, different target audience. No repetition allowed.`;
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;

  const genResponse = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.95,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!genResponse.ok) {
    throw new Error("Failed to generate ideas");
  }

  const genJson = await genResponse.json();
  const responseText = genJson?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error("Empty response from AI");
  }

  let ideas;
  try {
    const parsed = JSON.parse(responseText);
    ideas = parsed.ideas || [];
  } catch {
    throw new Error("Failed to parse ideas");
  }

  return ideas;
}

async function storeIdeas(
  supabase: any,
  conversationId: string,
  userId: string,
  ideas: any[]
): Promise<void> {
  for (const idea of ideas) {
    await supabase.from("generated_ideas").insert({
      conversation_id: conversationId,
      user_id: userId,
      idea_index: idea.idea_index || ideas.indexOf(idea) + 1,
      idea_type: idea.idea_type,
      title: idea.title,
      summary: idea.summary,
      market_research: idea.market_research,
      target_audience: idea.target_audience,
      competitor_analysis: idea.competitor_analysis,
      usp: idea.usp,
      revenue_model: idea.revenue_model,
      roi_estimate: idea.roi_estimate,
      startup_roadmap: idea.startup_roadmap,
      required_skills: idea.required_skills,
      funding_options: idea.funding_options,
      hackathons: idea.hackathons,
      communities: idea.communities,
      branding: idea.branding,
      landing_page: idea.landing_page,
      instagram_strategy: idea.instagram_strategy,
      viral_reels: idea.viral_reels,
      full_report: idea,
    });
  }
}
