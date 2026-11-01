import type { BookingRequest, CustomerAnswer } from "./domain";

export interface BookingAgentMessage {
  role: "user" | "assistant";
  content: string;
  answer?: CustomerAnswer;
}
export interface BookingAgentInput {
  conversation: BookingAgentMessage[];
  bookingProfile: BookingRequest;
  localDate: string;
}
export interface BookingAgentReply {
  assistantMessage: string;
  quickReplies: string[];
  extractedProfile: BookingRequest;
  missingFields: string[];
  readyToMatch: boolean;
}
