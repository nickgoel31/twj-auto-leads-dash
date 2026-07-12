"use server";

import * as db from "@/lib/turso";
import type { ParsedProposal, PricingRow, ProposalMeta } from "@/lib/proposal-types";


export async function fetchPricingCatalog() {
  return await db.getPricing();
}

export async function updateCatalogPricing(id: number, price: number, description: string) {
  await db.updatePricingItem(id, price, description);
  return { success: true };
}

export async function saveLeadCallSummary(id: number, callSummary: string) {
  await db.updateLeadCallSummary(id, callSummary);
  return { success: true };
}

// Generate proposal: Returns structured data for PDF rendering
export async function generateLeadProposal(
  leadId: number,
  callSummary: string,
  wantsPortfolio = false,
  serviceType = "website",
  agreedPricing?: number
): Promise<{ success: boolean; proposal: ParsedProposal; meta: ProposalMeta }> {
  const leads = await db.getLeads();
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) throw new Error("Lead not found");

  await db.updateLeadCallSummary(leadId, callSummary);

  const pricingItems = await db.getPricing();
  
  // Read pricing.md guidelines if exists
  let pricingMdContent = "";
  try {
    const fs = await import("fs");
    const path = await import("path");
    const pricingMdPath = path.join(process.cwd(), "pricing.md");
    if (fs.existsSync(pricingMdPath)) {
      pricingMdContent = fs.readFileSync(pricingMdPath, "utf-8");
    }
  } catch (e) {
    console.warn("Failed to read pricing.md context:", e);
  }

  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.gemini_api_key;
  const openRouterApiKey = process.env.OPENROUTER_API_KEY || process.env.openrouter_api_key;
  const openaiApiKey = process.env.OPENAI_API_KEY || process.env.openai_api_key || process.env.OpenAI_API_Key;

  console.log("Proposal generation API Key status:", {
    hasOpenAI: !!openaiApiKey,
    hasOpenRouter: !!openRouterApiKey,
    hasGemini: !!geminiApiKey
  });

  const meta: ProposalMeta = {
    clientName: lead.name,
    clientCategory: lead.category,
    clientCity: lead.city,
    clientPhone: lead.phone,
    generatedAt: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  // Select 3 portfolio items based on service type
  let portfolioItems: { imageUrl: string; category: string; description: string }[] = [];
  if (wantsPortfolio) {
    if (serviceType === "website") {
      portfolioItems = [
        { imageUrl: "/portfolio/website/Screenshot 2026-07-12 105141.png", category: "Web Design / Development", description: "Premium modern web UI layouts designed for conversion." },
        { imageUrl: "/portfolio/website/Screenshot 2026-07-12 105149.png", category: "Web Design / Development", description: "Interactive landing pages built with high performant framer motion animations." },
        { imageUrl: "/portfolio/website/Screenshot 2026-07-12 105200.png", category: "Web Design / Development", description: "Minimalist design systems focused on content and usability." }
      ];
    } else if (serviceType === "marketing") {
      portfolioItems = [
        { imageUrl: "/portfolio/hero/4.png", category: "Digital Marketing", description: "Social media and marketing page designs." },
        { imageUrl: "/portfolio/hero/5.png", category: "Digital Marketing", description: "Optimized checkout flows to boost e-commerce performance." },
        { imageUrl: "/portfolio/ecommerce/1.png", category: "Digital Marketing", description: "SEO-optimized business layouts that drive traffic." }
      ];
    } else if (serviceType === "ai-chatbot") {
      portfolioItems = [
        { imageUrl: "/portfolio/ai/1.png", category: "AI Chat Assistant", description: "Smart customer support chatbot interface with context awareness." },
        { imageUrl: "/portfolio/ai/2.png", category: "AI Chat Assistant", description: "Bento grid AI dashboard for data visualization." },
        { imageUrl: "/portfolio/ai/3.png", category: "AI Chat Assistant", description: "Clean chat console for seamless multi-agent control." }
      ];
    } else if (serviceType === "ai-voice-agent") {
      portfolioItems = [
        { imageUrl: "/portfolio/ai/4.png", category: "AI Voice Agent", description: "Interactive voice response control panel." },
        { imageUrl: "/portfolio/ai/1.png", category: "AI Voice Agent", description: "Workflow automation canvas displaying call logs and analytics." },
        { imageUrl: "/portfolio/ai/3.png", category: "AI Voice Agent", description: "Smart agent onboarding and customization panel." }
      ];
    }
  }

  // Match relevant pricing items based on call summary keywords (fallback logic)
  const normalizedSummary = callSummary.toLowerCase();
  let selectedPricing = pricingItems.filter((item) =>
    item.name
      .toLowerCase()
      .split(" ")
      .some((w) => w.length > 3 && normalizedSummary.includes(w))
  );
  if (selectedPricing.length === 0 && pricingItems.length > 0) {
    selectedPricing = pricingItems.filter((item) => {
      if (serviceType === "website") return item.name.toLowerCase().includes("web") || item.name.toLowerCase().includes("design");
      if (serviceType === "marketing") return item.name.toLowerCase().includes("seo") || item.name.toLowerCase().includes("marketing");
      if (serviceType === "ai-chatbot" || serviceType === "ai-voice-agent") return item.name.toLowerCase().includes("ai") || item.name.toLowerCase().includes("bot") || item.name.toLowerCase().includes("agent");
      return false;
    });
    if (selectedPricing.length === 0) {
      selectedPricing = [pricingItems[0]];
    }
  }

  const defaultTotalInvestment = selectedPricing.reduce((s, p) => s + p.price, 0);

  const defaultPricingRows: PricingRow[] = selectedPricing.map((p) => ({
    name: p.name,
    price: `₹${p.price.toLocaleString()}`,
    billing: p.billing,
    description: p.description,
  }));

  // Default text content & structure
  let title = `Proposal for ${lead.name}`;
  let executiveSummary = `The Walking Jumbo has prepared this proposal to outline a collaborative strategy with ${lead.name}. Operating in the ${lead.category} sector in ${lead.city}, our goal is to scale your operations, enhance customer retention, and resolve key objectives noted during our recent discussion.`;
  let scopeContent = `We propose a tailored digital transformation framework for your ${lead.category} business that directly addresses: "${callSummary.slice(0, 150)}". Our solution delivers end-to-end coverage including architecture design, development, QA, and ongoing support.`;
  let scopeItems = [
    `Client Focus: Directly addressing "${callSummary.slice(0, 80)}..."`,
    "Design & Architecture: Scalable, accessible design systems with fast load times.",
    "Analytics & Reporting: Real-time dashboards to measure ROI and customer engagement.",
    "Security & Compliance: Best-practice security auditing and data protection.",
  ];
  let recommendedInvestmentIntro = "Based on your goals and business context, we recommend the following service package:";
  let timelineIntro = "We follow an agile phased delivery model to ensure transparency and alignment at every milestone:";
  let timelineItems = [
    "Discovery & Alignment (Week 1): Detailed specifications, scope confirmation, and wireframes.",
    "Core Development (Weeks 2–4): Database design, API integration, and front-end build.",
    "QA & Optimization (Week 5): Security audit, cross-device testing, and performance tuning.",
    "Deployment & Handover (Week 6): Live deployment, training, and documentation handoff.",
  ];
  let nextStepsIntro = "To proceed with this engagement, please complete the following:";
  let nextStepsItems = [
    "Review the proposed scope and submit any revisions or clarifications.",
    "Schedule a 15-minute alignment call to finalize timeline and resources.",
    "Review and sign the engagement agreement to initiate the project.",
  ];

  let finalPricingRows = defaultPricingRows;
  let finalTotalInvestment = agreedPricing ? `₹${agreedPricing.toLocaleString()} + GST` : `₹${defaultTotalInvestment.toLocaleString()} + GST`;

  // System Prompt for AI Generation
  const prompt = `You are a senior business development consultant for "The Walking Jumbo". 
Write a structured business proposal for the following lead, specifically customized for the requested Service Type: "${serviceType}".

Lead Details:
- Company: ${lead.name}
- Industry: ${lead.category}
- Location: ${lead.city}
- Phone: ${lead.phone}

Call Summary / Client Goals:
"${callSummary}"

Here is the database's available pricing options:
${pricingItems.map((p) => `- ${p.name}: ₹${p.price} (${p.billing}): ${p.description}`).join("\n")}

Here are additional pricing, packing & business rules from "pricing.md":
${pricingMdContent}

Agreed Pricing: ${agreedPricing ? `₹${agreedPricing}` : "None"}

Based on the call summary and the pricing catalog / pricing rules above:
1. Formulate the recommended services (name, price, billing structure, description) that match the Service Type: "${serviceType}". 
   - CRITICAL: If Agreed Pricing is specified above (and is not "None"), you MUST ignore any pricing or numbers mentioned in the Call Summary (for example, if the Call Summary mentions 4000 but the Agreed Pricing is 8000, you MUST use 8000). The total investment and the sum of recommended service prices MUST match the Agreed Pricing exactly.
   - If Agreed Pricing is "None", default back to the pricing mentioned in the Call Summary or the pricing rules in pricing.md.
2. Calculate the total investment (must match the Agreed Pricing exactly if specified).
3. Tailor the title, executive summary, scope, timeline and next steps specifically to the Service Type: "${serviceType}" and client goals.

Return ONLY a JSON object (no markdown code blocks, no explanation) with this exact schema:
{
  "title": "Creative/professional title tailored to client and service (e.g., Digital Transformation & SEO for [Client])",
  "executiveSummary": "2-3 professional sentences about the client, their current business context, and goals, focusing on the ${serviceType} request",
  "scopeContent": "1-2 sentences introducing the solution scope customized to their specific request for ${serviceType}",
  "scopeItems": ["bullet 1 tailored to ${serviceType}", "bullet 2", "bullet 3", "bullet 4"],
  "recommendedInvestmentIntro": "A professional sentence introducing the pricing table and package recommendations",
  "recommendedInvestment": [
    {
      "name": "Service Name",
      "price": "$X,XXX",
      "billing": "one-time / monthly",
      "description": "Short explanation of service details"
    }
  ],
  "totalInvestment": "$X,XXX USD",
  "timelineIntro": "Introductory sentence for the project timeline/phases",
  "timelineItems": ["Phase 1 (Week X): Description", "Phase 2 (Week X): Description", "Phase 3 (Week X): Description", "Phase 4 (Week X): Description"],
  "nextStepsIntro": "Introductory sentence for next steps",
  "nextStepsItems": ["Step 1 description", "Step 2 description", "Step 3 description"]
}`;

  let aiGenerated = false;

  // 1. Try OpenAI (cheapest & highly intelligent model: gpt-4o-mini)
  if (openaiApiKey) {
    try {
      console.log("Attempting proposal generation using OpenAI model: gpt-4o-mini");
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const rawText = json.choices?.[0]?.message?.content ?? "";
        const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        
        if (parsed.title) title = parsed.title;
        if (parsed.executiveSummary) executiveSummary = parsed.executiveSummary;
        if (parsed.scopeContent) scopeContent = parsed.scopeContent;
        if (parsed.scopeItems) scopeItems = parsed.scopeItems;
        if (parsed.recommendedInvestmentIntro) recommendedInvestmentIntro = parsed.recommendedInvestmentIntro;
        if (parsed.recommendedInvestment && Array.isArray(parsed.recommendedInvestment)) {
          finalPricingRows = parsed.recommendedInvestment;
        }
        if (parsed.totalInvestment) {
          finalTotalInvestment = parsed.totalInvestment;
        }
        if (parsed.timelineIntro) timelineIntro = parsed.timelineIntro;
        if (parsed.timelineItems && Array.isArray(parsed.timelineItems)) {
          timelineItems = parsed.timelineItems;
        }
        if (parsed.nextStepsIntro) nextStepsIntro = parsed.nextStepsIntro;
        if (parsed.nextStepsItems && Array.isArray(parsed.nextStepsItems)) {
          nextStepsItems = parsed.nextStepsItems;
        }
        aiGenerated = true;
        console.log("Successfully generated proposal using OpenAI model: gpt-4o-mini");
      } else {
        const errText = await res.text();
        console.warn("OpenAI API returned error status:", res.status, "Response:", errText);
      }
    } catch (e) {
      console.warn("OpenAI generation failed:", e);
    }
  }

  // 2. Try OpenRouter (fallback)
  if (!aiGenerated && openRouterApiKey) {
    const candidateModels = [
      "google/gemini-2.5-flash", 
      "google/gemini-2.5-flash:free", 
      "meta-llama/llama-3.3-70b-instruct:free", 
      "openrouter/free"
    ];

    for (const model of candidateModels) {
      try {
        console.log(`Attempting proposal generation using OpenRouter model: ${model}`);
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openRouterApiKey}`,
            "HTTP-Referer": "https://stunning-semolina-2f5d9a.netlify.app",
            "X-Title": "The Walking Jumbo Dashboard",
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const rawText = json.choices?.[0]?.message?.content ?? "";
          const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          
          if (parsed.title) title = parsed.title;
          if (parsed.executiveSummary) executiveSummary = parsed.executiveSummary;
          if (parsed.scopeContent) scopeContent = parsed.scopeContent;
          if (parsed.scopeItems) scopeItems = parsed.scopeItems;
          if (parsed.recommendedInvestmentIntro) recommendedInvestmentIntro = parsed.recommendedInvestmentIntro;
          if (parsed.recommendedInvestment && Array.isArray(parsed.recommendedInvestment)) {
            finalPricingRows = parsed.recommendedInvestment;
          }
          if (parsed.totalInvestment) {
            finalTotalInvestment = parsed.totalInvestment;
          }
          if (parsed.timelineIntro) timelineIntro = parsed.timelineIntro;
          if (parsed.timelineItems && Array.isArray(parsed.timelineItems)) {
            timelineItems = parsed.timelineItems;
          }
          if (parsed.nextStepsIntro) nextStepsIntro = parsed.nextStepsIntro;
          if (parsed.nextStepsItems && Array.isArray(parsed.nextStepsItems)) {
            nextStepsItems = parsed.nextStepsItems;
          }
          aiGenerated = true;
          console.log(`Successfully generated proposal using OpenRouter model: ${model}`);
          break; // successfully generated, stop trying other models
        } else {
          console.warn(`OpenRouter API model ${model} returned error status:`, res.status);
        }
      } catch (e) {
        console.warn(`OpenRouter generation failed for model ${model}:`, e);
      }
    }
  }

  // 2. Fallback to Gemini Direct API Key if OpenRouter wasn't used or failed
  if (!aiGenerated && geminiApiKey) {
    try {
      console.log("Attempting direct Gemini API fallback");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const rawText: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        
        if (parsed.title) title = parsed.title;
        if (parsed.executiveSummary) executiveSummary = parsed.executiveSummary;
        if (parsed.scopeContent) scopeContent = parsed.scopeContent;
        if (parsed.scopeItems) scopeItems = parsed.scopeItems;
        if (parsed.recommendedInvestmentIntro) recommendedInvestmentIntro = parsed.recommendedInvestmentIntro;
        if (parsed.recommendedInvestment && Array.isArray(parsed.recommendedInvestment)) {
          finalPricingRows = parsed.recommendedInvestment;
        }
        if (parsed.totalInvestment) {
          finalTotalInvestment = parsed.totalInvestment;
        }
        if (parsed.timelineIntro) timelineIntro = parsed.timelineIntro;
        if (parsed.timelineItems && Array.isArray(parsed.timelineItems)) {
          timelineItems = parsed.timelineItems;
        }
        if (parsed.nextStepsIntro) nextStepsIntro = parsed.nextStepsIntro;
        if (parsed.nextStepsItems && Array.isArray(parsed.nextStepsItems)) {
          nextStepsItems = parsed.nextStepsItems;
        }
        aiGenerated = true;
        console.log("Successfully generated proposal using direct Gemini API");
      }
    } catch (e) {
      console.warn("Gemini Direct API generation failed:", e);
    }
  }

  // Failsafe: Post-process to guarantee agreedPricing is strictly respected
  if (agreedPricing) {
    finalTotalInvestment = `₹${agreedPricing.toLocaleString()} + GST`;
    
    if (finalPricingRows.length === 1) {
      finalPricingRows[0].price = `₹${agreedPricing.toLocaleString()}`;
    } else if (finalPricingRows.length > 1) {
      let totalOriginal = 0;
      const numericPrices = finalPricingRows.map((item) => {
        const val = Number(item.price.replace(/[^0-9]/g, ""));
        totalOriginal += val;
        return val;
      });

      if (totalOriginal > 0) {
        let sumScaled = 0;
        finalPricingRows = finalPricingRows.map((item, idx) => {
          if (idx === finalPricingRows.length - 1) {
            return {
              ...item,
              price: `₹${(agreedPricing - sumScaled).toLocaleString()}`
            };
          }
          const scaled = Math.round((numericPrices[idx] / totalOriginal) * agreedPricing);
          sumScaled += scaled;
          return {
            ...item,
            price: `₹${scaled.toLocaleString()}`
          };
        });
      } else {
        finalPricingRows[0].price = `₹${agreedPricing.toLocaleString()}`;
      }
    }
  }

  const proposal: ParsedProposal = {
    title: title,
    sections: [
      {
        heading: "1. Executive Summary",
        content: executiveSummary,
      },
      {
        heading: "2. Scope & Solution",
        content: scopeContent,
        listItems: scopeItems,
      },
      {
        heading: "3. Recommended Investment",
        content: recommendedInvestmentIntro,
      },
      {
        heading: "4. Timeline & Execution",
        content: timelineIntro,
        orderedList: timelineItems,
      },
      {
        heading: "5. Next Steps",
        content: nextStepsIntro,
        orderedList: nextStepsItems,
      },
    ],
    pricingRows: finalPricingRows,
    totalInvestment: finalTotalInvestment,
    timeline: [],
    nextSteps: [],
    wantsPortfolio,
    portfolioItems,
    serviceType,
    agreedPricing,
  };

  return { success: true, proposal, meta };
}
