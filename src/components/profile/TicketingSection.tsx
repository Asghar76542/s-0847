import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateTicketDialog } from "./CreateTicketDialog";
import { TicketResponseDialog } from "./TicketResponseDialog";
import { Ticket } from "./types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function TicketingSection() {
  const { toast } = useToast();
  const [newTicket, setNewTicket] = useState({ subject: "", message: "" });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState("");

  const { data: tickets = [], refetch: refetchTickets } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const memberNumber = session.user.user_metadata?.member_number;
      
      if (!memberNumber) {
        console.log('No member number found in session');
        return [];
      }

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id')
        .eq('member_number', memberNumber)
        .single();

      if (memberError) {
        console.error('Error fetching member:', memberError);
        return [];
      }

      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          responses:ticket_responses (
            *,
            responder:profiles (
              full_name,
              email
            )
          )
        `)
        .eq('member_id', member.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        return [];
      }

      return tickets;
    }
  });

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const memberNumber = session.user.user_metadata?.member_number;
    
    if (!memberNumber) {
      console.log('No member number found in session');
      return;
    }

    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('member_number', memberNumber)
      .single();

    if (memberError) {
      console.error('Error fetching member:', memberError);
      return;
    }

    const { error } = await supabase
      .from('support_tickets')
      .insert({
        subject: newTicket.subject,
        description: newTicket.message,
        member_id: member.id,
        status: "open",
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
      return;
    }

    setNewTicket({ subject: "", message: "" });
    refetchTickets();
    toast({
      title: "Success",
      description: "Ticket created successfully",
    });
  };

  const handleAddResponse = async () => {
    if (!response || !selectedTicket) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('ticket_responses')
      .insert({
        response,
        ticket_id: selectedTicket.id,
        responder_id: session.user.id
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add response",
        variant: "destructive",
      });
      return;
    }

    setResponse("");
    refetchTickets();
    toast({
      title: "Success",
      description: "Response added successfully",
    });
  };

  return (
    <div className="space-y-6">
      <CreateTicketDialog
        newTicket={newTicket}
        setNewTicket={setNewTicket}
        handleCreateTicket={handleCreateTicket}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>{ticket.id}</TableCell>
                <TableCell>{ticket.subject}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ticket.status === "open"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(ticket.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <TicketResponseDialog
                    ticket={ticket}
                    response={response}
                    setResponse={setResponse}
                    handleAddResponse={handleAddResponse}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}