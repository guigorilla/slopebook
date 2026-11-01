import { isBookingAgentInput } from "../lib/booking-agent";
import { getBookingAgentProvider } from "../lib/agent-provider";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 180_000) return Response.json({ error: "Conversation too long" }, { status: 413 });
    body = JSON.parse(text);
  } catch { return Response.json({ error: "Invalid conversation" }, { status: 400 }); }
  if (!isBookingAgentInput(body)) return Response.json({ error: "Invalid booking profile" }, { status: 400 });
  try {
    const provider = await getBookingAgentProvider();
    return Response.json(await provider.reply(body, request.signal), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Your mountain guide couldn't respond just now. Your conversation and profile are safe. Please try again." }, { status: 503 });
  }
}
