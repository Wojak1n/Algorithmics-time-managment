'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Edit, UserPlus } from 'lucide-react';

interface Student {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  groupId: string | null;
  group: {
    id: string;
    name: string;
    size: number;
  } | null;
}

interface Group {
  id: string;
  name: string;
  size: number;
  students: Student[];
}

export default function StudentsPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('no-group');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setToken(storedToken);
      
      if (userData.role !== 'ADMIN') {
        router.push('/');
        return;
      }
    } else {
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (user && token && user.role === 'ADMIN') {
      fetchStudents();
      fetchGroups();
    }
  }, [user, token]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch students',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while fetching students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setSelectedGroupId(student.groupId || 'no-group');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingStudent) return;

    try {
      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: (selectedGroupId && selectedGroupId !== 'no-group') ? selectedGroupId : null
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Student updated successfully',
        });
        setDialogOpen(false);
        resetForm();
        fetchStudents();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update student',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while updating student',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingStudent(null);
    setSelectedGroupId('no-group');
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  const getGroupStats = (group: Group) => {
    const currentStudents = students.filter(s => s.groupId === group.id).length;
    return `${currentStudents}/${group.size}`;
  };

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <div className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <Users className="mr-3 h-8 w-8 text-gray-900 dark:text-gray-100" />
                Students Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Manage student group assignments</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>All Students</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4 text-gray-600 dark:text-gray-300">Loading students...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Group</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.user.name}</TableCell>
                            <TableCell>{student.user.email}</TableCell>
                            <TableCell>
                              {student.group ? (
                                <Badge variant="secondary">
                                  {student.group.name}
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  No Group
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(student)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Groups Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {groups.map((group) => (
                      <div key={group.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{group.name}</h4>
                          <Badge variant="outline">
                            {getGroupStats(group)}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Capacity: {group.size} students
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(students.filter(s => s.groupId === group.id).length / group.size) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Edit Student: {editingStudent?.user.name}
                </DialogTitle>
                <DialogDescription>
                  Assign or change the group for this student.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="group">Group Assignment</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-group">No Group</SelectItem>
                      {groups.map((group) => {
                        const currentStudents = students.filter(s => s.groupId === group.id).length;
                        const isFull = currentStudents >= group.size && selectedGroupId !== group.id;
                        return (
                          <SelectItem 
                            key={group.id} 
                            value={group.id}
                            disabled={isFull}
                          >
                            {group.name} ({currentStudents}/{group.size})
                            {isFull && ' - Full'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Update Student
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
