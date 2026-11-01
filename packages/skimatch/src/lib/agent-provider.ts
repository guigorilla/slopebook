import type { BookingAgentInput, BookingAgentReply } from "../types/booking-agent";
import { bookingQuestions, applyBookingAnswer, validateAnswer } from "./conversation";
import { missingMatchFields } from "./booking-agent";

export interface BookingAgentProvider { reply(input: BookingAgentInput, signal?: AbortSignal): Promise<BookingAgentReply> }
export function agentProviderName(value = process.env.AGENT_PROVIDER): "mock" | "openai" {
  if (!value || value === "mock") return "mock";
  if (value === "openai") return "openai";
  throw new Error("AGENT_PROVIDER must be mock or openai");
}
export class MockBookingAgentProvider implements BookingAgentProvider {
  async reply(input: BookingAgentInput): Promise<BookingAgentReply> {
    let profile = structuredClone(input.bookingProfile);
    const pending = (p: typeof profile) => bookingQuestions(p).find(q => !p.answers[q.key])
      || bookingQuestions(p).find(q => missingMatchFields(p, input.localDate).includes(q.key));
    const question = pending(profile);
    const latest = input.conversation.at(-1);
    let error: string | undefined;
    if (question && latest?.role === "user") {
      const answer = latest.answer || { commentary: latest.content };
      error = validateAnswer(question, answer);
      if (!error) profile = applyBookingAnswer(profile, question, answer);
    }
    const next = pending(profile);
    const missingFields = missingMatchFields(profile, input.localDate);
    return { extractedProfile: profile, assistantMessage: error || next?.prompt || "Your profile is ready. Let's find the right mountain experience for you.", quickReplies: next?.suggestions || [], missingFields, readyToMatch: !next && missingFields.length === 0 };
  }
}
export async function getBookingAgentProvider(): Promise<BookingAgentProvider> {
  if (agentProviderName() === "mock") return new MockBookingAgentProvider();
  const { OpenAIBookingAgentProvider } = await import("./openai-provider");
  return new OpenAIBookingAgentProvider();
}
