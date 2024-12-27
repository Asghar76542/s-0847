import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserCheck, Shield } from "lucide-react";
import { useState } from "react";
import { RoleButton } from "./RoleButton";
import { CollectorDialog } from "./CollectorDialog";

interface UserListProps {
  users: any[];
  onUpdate: () => void;
  updating: string | null;
  setUpdating: (id: string | null) => void;
}

export function UserList({ users, onUpdate, updating, setUpdating }: UserListProps) {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCollectorDialog, setShowCollectorDialog] = useState(false);

  const updateUserRole = async (userId: string, newRole: string, currentRole: string | null) => {
    setUpdating(userId);
    try {
      console.log('Updating user role:', { userId, newRole, currentRole });
      
      // If user already has the role, remove it (toggle behavior)
      const updatedRole = currentRole === newRole ? null : newRole;
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: updatedRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: updatedRole ? "Role added" : "Role removed",
        description: `User role has been successfully ${updatedRole ? 'updated' : 'removed'}.`,
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

  const handleCollectorCreation = async (isNew: boolean, collectorName: string, collectorId: string) => {
    if (!selectedUserId) return;

    try {
      setUpdating(selectedUserId);

      if (isNew) {
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

      // Update user role to include collector role
      const user = users.find(u => u.id === selectedUserId);
      const newRole = user?.role === 'admin' ? 'admin,collector' : 'collector';
      await updateUserRole(selectedUserId, newRole, user?.role);

      setSelectedUserId(null);
      setShowCollectorDialog(false);
      
      toast({
        title: "Success",
        description: isNew 
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

  const handleMakeCollector = (userId: string) => {
    setSelectedUserId(userId);
    setShowCollectorDialog(true);
  };

  const handleMakeAdmin = async (userId: string, currentRole: string | null) => {
    // If user is already a collector, add admin role while keeping collector role
    const newRole = currentRole === 'collector' ? 'admin,collector' : 'admin';
    await updateUserRole(userId, newRole, currentRole);
  };

  return (
    <div className="space-y-4">
      {users.map((user) => {
        const roles = user.role ? user.role.split(',') : [];
        const isAdmin = roles.includes('admin');
        const isCollector = roles.includes('collector');

        return (
          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">{user.member_number || 'No Member Number'}</p>
              <p className="text-sm text-muted-foreground">
                Email: {user.email}
              </p>
              <p className="text-sm text-muted-foreground">
                Roles: {roles.join(', ') || 'None'}
              </p>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RoleButton
                onClick={() => handleMakeCollector(user.id)}
                disabled={updating === user.id}
                isActive={isCollector}
                icon={UserCheck}
                label="Collector"
              />
              <RoleButton
                onClick={() => handleMakeAdmin(user.id, user.role)}
                disabled={updating === user.id}
                isActive={isAdmin}
                icon={Shield}
                label="Admin"
              />
            </div>
          </div>
        );
      })}

      <CollectorDialog
        isOpen={showCollectorDialog}
        onClose={() => setShowCollectorDialog(false)}
        onConfirm={handleCollectorCreation}
        isLoading={!!updating}
      />
    </div>
  );
}
