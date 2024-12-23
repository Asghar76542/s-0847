import { Cog, User, Mail, Phone, MapPin, Calendar, Key, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NextOfKinSection } from "@/components/registration/NextOfKinSection";
import { SpousesSection } from "@/components/registration/SpousesSection";
import { DependantsSection } from "@/components/registration/DependantsSection";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/components/ui/use-toast";
import { Member } from "@/components/members/types";
import { useNavigate } from "react-router-dom";

interface AccountSettingsSectionProps {
  memberData?: Member;
}

export const AccountSettingsSection = ({ memberData }: AccountSettingsSectionProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleLink = () => {
    toast({
      title: "Google Account Linking",
      description: "This feature will be implemented soon.",
    });
  };

  const handleChangePassword = () => {
    navigate("/change-password");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="default"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 flex-grow mr-2"
          disabled
        >
          <div className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            <span>Profile Settings</span>
          </div>
        </Button>
        <Button 
          variant="outline"
          className="flex items-center gap-2"
          onClick={handleChangePassword}
        >
          <Key className="h-4 w-4" />
          <span>Change Password</span>
        </Button>
      </div>

      <div className="space-y-6 pt-4">
        {/* Member ID and Collector Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Member ID
            </label>
            <Input value={memberData?.member_number || ''} readOnly className="bg-gray-50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Collector
            </label>
            <Input value={memberData?.collector || ''} readOnly className="bg-gray-50" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name
            </label>
            <Input defaultValue={memberData?.full_name} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </label>
            <Textarea defaultValue={memberData?.address || ""} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Town</label>
            <Input defaultValue={memberData?.town || ""} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Post Code</label>
            <Input defaultValue={memberData?.postcode || ""} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </label>
            <Input defaultValue={memberData?.email || ""} type="email" />
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full h-10 bg-white hover:bg-gray-50 border-2 shadow-sm text-gray-700 font-medium"
              onClick={handleGoogleLink}
            >
              <Icons.google className="mr-2 h-5 w-5" />
              Link Google Account
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Mobile No
            </label>
            <Input defaultValue={memberData?.phone || ""} type="tel" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date of Birth
            </label>
            <Input 
              type="date" 
              defaultValue={memberData?.date_of_birth || ""} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Marital Status</label>
            <Select defaultValue={memberData?.marital_status || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select Marital Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <Select defaultValue={memberData?.gender || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6 pt-4">
          <NextOfKinSection />
          <SpousesSection />
          <DependantsSection />
        </div>

        <div className="flex justify-end">
          <Button className="bg-green-500 hover:bg-green-600">Update Profile</Button>
        </div>
      </div>
    </div>
  );
};