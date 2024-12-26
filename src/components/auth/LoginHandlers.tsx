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
        .ilike('member_number', memberId)
        .single();

      console.log("Member lookup response:", { members, memberError });

      if (memberError) {
        console.error('Member lookup error:', memberError);
        throw new Error("Error checking member status. Please try again later.");
      }

      if (!members) {
        console.error('No member found with ID:', memberId);
        throw new Error("Invalid Member ID. Please check your credentials and try again.");
      }

      const member = members;
      console.log("Found member:", { memberId: member.id, hasAuthId: !!member.auth_user_id });

      // Attempt to sign in with the temp email
      const tempEmail = `${memberId.toLowerCase()}@temp.pwaburton.org`;
      console.log("Attempting login with:", tempEmail);
      
      let authResponse;
      
      try {
        // First try to sign in
        authResponse = await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: password,
        });

        if (authResponse.error) {
          console.log("Sign in failed, attempting signup:", authResponse.error);
          
          // If sign in fails, try to sign up
          authResponse = await supabase.auth.signUp({
            email: tempEmail,
            password: password,
          });
        }

        if (authResponse.error) {
          console.error("Authentication failed:", authResponse.error);
          throw new Error("Authentication failed. Please check your credentials.");
        }

        console.log("Authentication successful:", { userId: authResponse.data.user?.id });

        // Update auth_user_id if not set
        if (!member.auth_user_id && authResponse.data.user) {
          console.log("Updating member with auth user ID:", authResponse.data.user.id);
          const { error: updateError } = await supabase
            .from('members')
            .update({ 
              auth_user_id: authResponse.data.user.id,
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
      } catch (authError: any) {
        console.error('Authentication error:', authError);
        throw new Error(authError.message || "Authentication failed. Please try again.");
      }
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