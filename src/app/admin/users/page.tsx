"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  MoreVertical,
  UserCog,
  Loader2,
  Filter,
  RefreshCcw,
} from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  profile: {
    role: string;
    email_notifications: boolean;
    sms_notifications: boolean;
    preferred_language: string;
    full_name?: string;
    phone?: string;
  };
}

export default function UsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch users');
      }
      
      const { users: combinedUsers } = await response.json();
      
      setUsers(combinedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };
  const handleUpdateRole = async () => {
    if (!editingUser) return;
    
    setIsUpdating(true);
    try {
      // Update profile via API
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingUser.id,
          profile: {
            role: editingUser.profile.role,
            email_notifications: editingUser.profile.email_notifications,
            sms_notifications: editingUser.profile.sms_notifications,
            preferred_language: editingUser.profile.preferred_language,
          },
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      
      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === editingUser.id ? { ...user, profile: { ...editingUser.profile } } : user
        )
      );
      
      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    
    setIsUpdating(true);
    try {
      // Delete user
      const { error } = await supabase.auth.admin.deleteUser(confirmDeleteUser.id);
      
      if (error) throw error;
      
      // Update local state
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== confirmDeleteUser.id));
      
      toast.success("User deleted successfully");
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.profile.full_name && user.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === null || user.profile.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "technician":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      default:
        return "bg-green-100 text-green-800 hover:bg-green-200";
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "technician":
        return "Technician";
      default:
        return "Customer";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Users Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage users and their roles in the system
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="bg-background rounded-lg border shadow-sm p-6 mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by email or name..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={roleFilter || ""} onValueChange={(value) => setRoleFilter(value === "" ? null : value)}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {roleFilter ? `Role: ${getRoleDisplay(roleFilter)}` : "All Roles"}
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="technician">Technician</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.profile.full_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleBadgeColor(user.profile.role)}>
                          {getRoleDisplay(user.profile.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.last_sign_in_at
                          ? format(new Date(user.last_sign_in_at), "MMM d, yyyy")
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingUser(user);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <UserCog className="h-4 w-4 mr-2" /> Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                setConfirmDeleteUser(user);
                                setIsConfirmDialogOpen(true);
                              }}
                            >
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update role and notification settings for {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editingUser.profile.role}
                  onValueChange={(value) =>
                    setEditingUser({
                      ...editingUser,
                      profile: { ...editingUser.profile, role: value },
                    })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <Label>Notification Preferences</Label>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications" className="cursor-pointer">
                    Email Notifications
                  </Label>
                  <Switch
                    id="email-notifications"
                    checked={editingUser.profile.email_notifications}
                    onCheckedChange={(checked) =>
                      setEditingUser({
                        ...editingUser,
                        profile: { ...editingUser.profile, email_notifications: checked },
                      })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notifications" className="cursor-pointer">
                    SMS Notifications
                  </Label>
                  <Switch
                    id="sms-notifications"
                    checked={editingUser.profile.sms_notifications}
                    onCheckedChange={(checked) =>
                      setEditingUser({
                        ...editingUser,
                        profile: { ...editingUser.profile, sms_notifications: checked },
                      })
                    }
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language</Label>
                <Select
                  value={editingUser.profile.preferred_language}
                  onValueChange={(value) =>
                    setEditingUser({
                      ...editingUser,
                      profile: { ...editingUser.profile, preferred_language: value },
                    })
                  }
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="nl">Dutch</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user {confirmDeleteUser?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
