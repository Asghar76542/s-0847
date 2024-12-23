import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkPasswordStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("No active session found");
          navigate("/login");
          return;
        }

        console.log("Checking password status for user:", session.user.email);
        
        const { data: member, error } = await supabase
          .from('members')
          .select('password_changed')
          .eq('email', session.user.email)
          .single();

        if (error) {
          console.error("Error checking password status:", error);
          return;
        }

        console.log("Password status:", member?.password_changed);

        if (member?.password_changed) {
          toast({
            title: "Password already changed",
            description: "You have already changed your password. Redirecting to profile.",
          });
          navigate("/admin/profile");
        }
      } catch (error) {
        console.error("Error in checkPasswordStatus:", error);
      }
    };

    checkPasswordStatus();
  }, [navigate, toast]);

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>
    </div>
  );
}