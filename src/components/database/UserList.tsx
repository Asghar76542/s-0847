import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserCheck, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface UserListProps {
  users: any[];
  onUpdate: () => void;
  updating: string | null;
  setUpdating: (id: string | null) => void;
}

export function UserList({ users, onUpdate, updating, setUpdating }: UserListProps) {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [collectorName, setCollectorName] = useState("");
  const [existingCollectors, setExistingCollectors] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCollectorId, setSelectedCollectorId] = useState<string>("");
  const [isNewCollector, setIsNewCollector] = useState(true);

  const updateUserRole = async (userId: string, newRole: "member" | "collector" | "admin") => {
    setUpdating(userId);
    try {
      console.log('Updating user role:', { userId, newRole });
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "User role has been successfully updated.",
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role. You might not have permission.",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const makeAdmin = async (userId: string) => {
    await updateUserRole(userId, "admin");
  };

  const fetchCollectors = async () => {
    const { data, error } = await supabase
      .from('collectors')
      .select('id, name')
      .order('name');
    
    if (error) {
      console.error('Error fetching collectors:', error);
      return;
    }
    
    setExistingCollectors(data || []);
  };

  const handleMakeCollector = async (userId: string) => {
    setSelectedUserId(userId);
    await fetchCollectors();
    setCollectorName("");
    setSelectedCollectorId("");
    setIsNewCollector(true);
  };

  const handleCollectorCreation = async () => {
    if (!selectedUserId) return;

    try {
      setUpdating(selectedUserId);

      if (isNewCollector) {
        if (!collectorName.trim()) {
          toast({
            title: "Error",
            description: "Please enter a collector name",
            variant: "destructive",
          });
          return;
        }

        // Generate prefix from collector name
        const prefix = collectorName
          .split(/\s+/)
          .map(word => word.charAt(0).toUpperCase())
          .join('');

        // Get the next available number
        const { data: existingCollectors } = await supabase
          .from('collectors')
          .select('number')
          .ilike('prefix', prefix);

        const nextNumber = String(
          Math.max(0, ...existingCollectors?.map(c => parseInt(c.number)) || [0]) + 1
        ).padStart(2, '0');

        // Create new collector
        const { error: createError } = await supabase
          .from('collectors')
          .insert({
            name: collectorName,
            prefix,
            number: nextNumber,
            active: true
          });

        if (createError) throw createError;
      }

      // Update user role
      await updateUserRole(selectedUserId, "collector");

      setSelectedUserId(null);
      toast({
        title: "Success",
        description: isNewCollector 
          ? "New collector created and role updated" 
          : "User role updated to collector",
      });
    } catch (error) {
      console.error('Error creating collector:', error);
      toast({
        title: "Error",
        description: "Failed to create collector",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <p className="font-medium">{user.member_number || 'No Member Number'}</p>
            <p className="text-sm text-muted-foreground">
              Email: {user.email}
            </p>
            <p className="text-sm text-muted-foreground">
              Last login: {user.last_sign_in_at 
                ? new Date(user.last_sign_in_at).toLocaleString() 
                : 'Never logged in'}
            </p>
            <p className="text-sm text-muted-foreground">
              Created: {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMakeCollector(user.id)}
                  disabled={updating === user.id || user.role === 'collector'}
                  className={user.role === 'collector' ? 'bg-blue-100' : ''}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  Collector
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Make User a Collector</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant={isNewCollector ? "default" : "outline"}
                      onClick={() => setIsNewCollector(true)}
                    >
                      Create New
                    </Button>
                    <Button
                      variant={!isNewCollector ? "default" : "outline"}
                      onClick={() => setIsNewCollector(false)}
                    >
                      Select Existing
                    </Button>
                  </div>

                  {isNewCollector ? (
                    <Input
                      placeholder="Enter collector name"
                      value={collectorName}
                      onChange={(e) => setCollectorName(e.target.value)}
                    />
                  ) : (
                    <Select
                      value={selectedCollectorId}
                      onValueChange={setSelectedCollectorId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a collector" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingCollectors.map((collector) => (
                          <SelectItem key={collector.id} value={collector.id}>
                            {collector.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button 
                    onClick={handleCollectorCreation}
                    disabled={isNewCollector ? !collectorName : !selectedCollectorId}
                  >
                    Confirm
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={() => makeAdmin(user.id)}
              disabled={updating === user.id || user.role === 'admin'}
              className={user.role === 'admin' ? 'bg-red-100' : ''}
            >
              <Shield className="h-4 w-4 mr-1" />
              Admin
            </Button>
            <Select
              value={user.role || 'member'}
              onValueChange={(value: "member" | "collector" | "admin") => updateUserRole(user.id, value)}
              disabled={updating === user.id}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="collector">Collector</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}