import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export const useLoginHandlers = (setIsLoggedIn: (value: boolean) => void) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleMemberIdSubmit = async (memberId: string, password: string) => {
    try {
      console.log("Looking up member:", memberId);
      
      // First, get the member details with detailed logging
      const { data: members, error: memberError } = await supabase
        .from('members')
        .select('id, email, default_password_hash, password_changed, auth_user_id')
        .ilike('member_number', memberId); // Changed from eq to ilike for case-insensitive comparison

      console.log("Member lookup response:", { members, memberError });

      if (memberError) {
        console.error('Member lookup error:', memberError);
        throw new Error("Error checking member status. Please try again later.");
      }

      if (!members || members.length === 0) {
        console.error('No member found with ID:', memberId);
        throw new Error("Invalid Member ID. Please check your credentials and try again.");
      }

      const member = members[0];
      console.log("Found member:", { memberId: member.id, hasAuthId: !!member.auth_user_id });

      // Attempt to sign in with the temp email
      const tempEmail = `${memberId.toLowerCase()}@temp.pwaburton.org`;
      console.log("Attempting login with:", tempEmail);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error("Invalid Member ID or password. Please try again.");
        }
        throw signInError;
      }

      console.log("Sign in successful:", { userId: data.user?.id });

      // Update auth_user_id if not set
      if (!member.auth_user_id && data.user) {
        console.log("Updating member with auth user ID:", data.user.id);
        const { error: updateError } = await supabase
          .from('members')
          .update({ 
            auth_user_id: data.user.id,
            email_verified: true,
            profile_updated: true
          })
          .eq('id', member.id);

        if (updateError) {
          console.error('Error updating auth_user_id:', updateError);
        }
      }

      // Check if password needs to be changed
      if (!member.password_changed) {
        console.log("Password change required, redirecting...");
        navigate("/change-password");
        return;
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      setIsLoggedIn(true);
      navigate("/admin/profile");
    } catch (error) {
      console.error("Member ID login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    handleMemberIdSubmit,
  };
};