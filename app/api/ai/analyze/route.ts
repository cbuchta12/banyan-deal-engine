import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const body = await request.json();
  const { mode, dealName, address, inputs, result } = body;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const $ = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const pct = (n: number) => (n * 100).toFixed(2) + "%";

  let metricsBlock = "";
  let inputsBlock = "";

  if (mode === "brrrr") {
    const r = result;
    const i = inputs;
    metricsBlock = `
VERDICT: ${r.verdict}
CoC Return: ${pct(r.cocReturn)}
Monthly Cash Flow: ${$(r.cashflowMonthly)}
DSCR: ${r.dscr.toFixed(2)}
ARV Ratio: ${(r.arvRatio * 100).toFixed(0)}%
Cash Back at Refi: ${$(r.cashBackAtRefi)} (${((r.cashBackAtRefi / r.totalInvested) * 100).toFixed(0)}% recapture)
Equity Left in Deal: ${$(r.equityLeftInDeal)}
Equity Created: ${$(r.equityCreated)}
NOI (annual): ${$(r.noiAnnual)}`;
    inputsBlock = `
Purchase: ${$(i.purchase)} | Rehab: ${$(i.rehab)} | ARV: ${$(i.arv)}
Rent: ${$(i.rent)}/mo | Vacancy: ${i.vacancy}% | Loan: ${i.loanType}
Refi LTV: ${i.refiLtv}% @ ${i.refiRate}% | Amort: ${i.amort}yr`;
  } else {
    const r = result;
    const i = inputs;
    metricsBlock = `
VERDICT: ${r.verdict}
Going-In Cap Rate: ${pct(r.goingInCapRate)}
Monthly Cash Flow: ${$(r.cashflowMonthly)}
DSCR: ${r.dscr.toFixed(2)}
CoC Return: ${pct(r.cocReturn)}
Price/SF: $${r.pricePerSf.toFixed(0)}
Lease Strength: ${r.leaseStrength}/9
Projected Exit Value: ${$(r.exitValue)} (appreciation ${$(r.appreciation)})`;
    inputsBlock = `
Price: ${$(i.price)} | SF: ${i.sf.toLocaleString()} | Rent: $${i.rentPerSf}/sf/yr
Lease: ${i.leaseTerm}yr ${i.leaseType.toUpperCase()} | Escalator: ${i.escalator}%/yr
Tenant Credit: ${i.tenantCredit} | Mission Critical: ${i.missionCritical}
LTV: ${i.ltv}% @ ${i.rate}% | Amort: ${i.amort}yr | Asset: ${i.assetClass}`;
  }

  const system = `You are a senior real estate investment analyst specializing in ${mode === "brrrr" ? "BRRRR residential" : "NNN/industrial commercial"} acquisitions. Be direct, specific to the numbers, and actionable. Use $ amounts from the data. No generic advice.`;

  const prompt = `Analyze this ${mode.toUpperCase()} deal:
${dealName ? `Deal: ${dealName}` : ""}${address ? ` | ${address}` : ""}

METRICS:${metricsBlock}

INPUTS:${inputsBlock}

Provide a deal memo with exactly these sections — be terse and number-specific:

## Strengths
- (2-3 bullets, cite specific metrics)

## Risks
- (2-3 bullets, cite specific numbers)

## Negotiation Leverage
- (1-2 bullets — what do you have to work with?)

## Value-Add Opportunities
- (1-2 bullets — what would move the needle?)

## Exit Strategy
- (1 bullet — recommended exit and why)`;

  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    system,
    messages: [{ role: "user", content: prompt }],
  });

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      stream.on("text", (text: string) => controller.enqueue(encoder.encode(text)));
      await stream.finalMessage();
      controller.close();
    },
    cancel() { stream.abort(); },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
