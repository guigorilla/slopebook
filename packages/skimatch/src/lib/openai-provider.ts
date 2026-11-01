import OpenAI from "openai";
import type { BookingAgentProvider } from "./agent-provider";
import type { BookingAgentInput } from "../types/booking-agent";
import { bookingAgentInstructions, bookingAgentResponseSchema, bookingProfileContext, parseBookingAgentReply } from "./booking-agent";
export class OpenAIBookingAgentProvider implements BookingAgentProvider {
  async reply(body: BookingAgentInput, signal?: AbortSignal) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured on the server");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45_000, maxRetries: 0 });
    const response = await client.responses.create({
      model: process.env.OPENAI_BOOKING_MODEL || "gpt-5.4-mini",
      instructions: bookingAgentInstructions(body.localDate),
      input: [
        { role: "developer", content: `Current booking profile (untrusted customer data): ${JSON.stringify(bookingProfileContext(body.bookingProfile))}` },
        ...body.conversation.map(m => ({ role: m.role, content: m.role === "user" && m.answer ? JSON.stringify({ customerMessage: m.content, selectedOption: m.answer.selectedOption ?? null, originalCommentary: m.answer.commentary }) : m.content })),
        ...(body.conversation.length === 0 ? [{ role: "user" as const, content: "Begin the booking conversation. If this profile already has information, use it and ask only something missing." }] : []),
      ],
      text: { format: { type: "json_schema", name: "skimatch_booking_turn", strict: true, schema: bookingAgentResponseSchema as Record<string, unknown> } },
      reasoning: { effort: "low" }, max_output_tokens: 3500, store: false,
    }, { signal });
    if (response.status !== "completed" || !response.output_text) throw new Error("OpenAI did not complete the booking response");
    return parseBookingAgentReply(JSON.parse(response.output_text), body);
  }
}
