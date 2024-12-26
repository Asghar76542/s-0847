export interface Response {
  id: string;
  message: string;
  date: string;
  isAdmin: boolean;
  response: string;  // Making this required to match TicketResponse
  created_at: string;
  updated_at: string;
  responder_id: string;
  ticket_id: string;
}

export interface Ticket {
  id: string;
  subject: string;
  message: string;
  description?: string;
  phoneNumber?: string;
  status: "open" | "closed" | "in_progress" | "resolved";
  date: string;
  created_at?: string;
  responses: Response[];
}