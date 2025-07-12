'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, UserCheck, Clock } from 'lucide-react';

interface Teacher {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  unavailableTimes: any[];
  skills: {
    id: string;
    skill: {
      id: string;
      name: string;
      subject: {
        name: string;
        code: string;
      };
    };
  }[];
  courses: {
    id: string;
    name: string;
    subject: {
      name: string;
      code: string;
    };
    group: {
      name: string;
    };
    room: {
      id: string;
      name: string;
    } | null;
  }[];
}

interface Subject {
  id: string;
  name: string;
  code: string;
  skills: {
    id: string;
    name: string;
  }[];
}

export default function TeachersPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [unavailableTimes, setUnavailableTimes] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const timeSlots = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
    '16:00-17:00', '17:00-18:00'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setToken(storedToken);
      
      if (!['ADMIN', 'TEACHER'].includes(userData.role)) {
        router.push('/');
        return;
      }
    } else {
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (user && token) {
      fetchTeachers();
      fetchSubjects();
    }
  }, [user, token]);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Both teachers and admins can see all teachers
        setTeachers(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch teachers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while fetching teachers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    // Only ADMIN can edit - strict security check
    if (user?.role !== 'ADMIN') {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to edit teacher information',
        variant: 'destructive',
      });
      return;
    }
    setEditingTeacher(teacher);
    setSelectedSkills(teacher.skills.map(ts => ts.skill.id));
    setUnavailableTimes(teacher.unavailableTimes || []);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only ADMIN can submit changes - strict security check
    if (user?.role !== 'ADMIN') {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to modify teacher information',
        variant: 'destructive',
      });
      return;
    }

    if (!editingTeacher) return;

    try {
      const response = await fetch(`/api/teachers/${editingTeacher.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillIds: selectedSkills,
          unavailableTimes
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Teacher updated successfully',
        });
        setDialogOpen(false);
        resetForm();
        fetchTeachers();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update teacher',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while updating teacher',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingTeacher(null);
    setSelectedSkills([]);
    setUnavailableTimes([]);
  };

  const handleSkillToggle = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleTimeSlotToggle = (day: string, time: string) => {
    const timeSlot = `${day}-${time}`;
    setUnavailableTimes(prev =>
      prev.includes(timeSlot)
        ? prev.filter(slot => slot !== timeSlot)
        : [...prev, timeSlot]
    );
  };

  const handleDelete = async (teacherId: string) => {
    // Only ADMIN can delete - strict security check
    if (user?.role !== 'ADMIN') {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to delete teacher information',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Teacher deleted successfully',
        });
        fetchTeachers();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete teacher',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while deleting teacher',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  if (!user || !['ADMIN', 'TEACHER'].includes(user.role)) {
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
                <UserCheck className="mr-3 h-8 w-8 text-gray-900 dark:text-gray-100" />
                Teachers
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {user?.role === 'ADMIN'
                  ? 'Manage teacher skills and availability'
                  : 'View teacher information, course assignments, and room allocations'
                }
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-gray-600 dark:text-gray-300">Loading teachers...</div>
              ) : (
                <>
                  {/* Debug info - remove this after testing */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 text-xs">
                      Debug: User role = "{user?.role}" | User ID = "{user?.id}" | Is Admin = {String(user?.role === 'ADMIN')}
                    </div>
                  )}
                <Table key={user?.role}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Skills</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Rooms</TableHead>
                      {user?.role === 'ADMIN' ? <TableHead>Actions</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">{teacher.user.name}</TableCell>
                        <TableCell>{teacher.user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teacher.skills.map((ts) => (
                              <Badge key={ts.id} variant="secondary" className="text-xs">
                                {ts.skill.subject.code}: {ts.skill.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {teacher.courses.length} courses
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {teacher.courses.length > 0 ? (
                              // Get unique rooms from all courses
                              Array.from(new Set(
                                teacher.courses
                                  .filter(course => course.room)
                                  .map(course => course.room!.name)
                              )).map((roomName, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {roomName}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400 text-sm">No rooms assigned</span>
                            )}
                          </div>
                        </TableCell>
                        {user?.role === 'ADMIN' ? (
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(teacher)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(teacher.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </>
              )}
            </CardContent>
          </Card>

          {/* Read-only notice for teachers */}
          {user?.role === 'TEACHER' && (
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <Clock className="h-4 w-4 inline mr-2" />
                    You are viewing teacher information in read-only mode. You can see all teachers' skills, courses, and room assignments. Contact your administrator to update skills or availability.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            {/* Only show dialog if editingTeacher and user is ADMIN */}
            {user.role === 'ADMIN' && editingTeacher && (
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Edit Teacher: {editingTeacher?.user.name}
                  </DialogTitle>
                  <DialogDescription>
                    Update the teacher's skills and availability schedule.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold">Skills</Label>
                    <div className="mt-2 space-y-4">
                      {subjects.map((subject) => (
                        <div key={subject.id} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">{subject.name} ({subject.code})</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {subject.skills.map((skill) => (
                              <div key={skill.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={skill.id}
                                  checked={selectedSkills.includes(skill.id)}
                                  onCheckedChange={() => handleSkillToggle(skill.id)}
                                />
                                <Label htmlFor={skill.id} className="text-sm">
                                  {skill.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Unavailable Times
                    </Label>
                    <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-8 gap-2">
                        <div></div>
                        {days.map((day) => (
                          <div key={day} className="text-center font-medium text-sm text-gray-900 dark:text-gray-100">
                            {day.slice(0, 3)}
                          </div>
                        ))}
                        {timeSlots.map((time) => (
                          <div key={time} className="contents">
                            <div className="text-sm font-medium py-1 text-gray-900 dark:text-gray-100">{time}</div>
                            {days.map((day) => {
                              const timeSlot = `${day}-${time}`;
                              return (
                                <div key={timeSlot} className="flex justify-center">
                                  <Checkbox
                                    checked={unavailableTimes.includes(timeSlot)}
                                    onCheckedChange={() => handleTimeSlotToggle(day, time)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Update Teacher
                    </Button>
                  </div>
                </form>
              </DialogContent>
            )}
          </Dialog>
        </div>
      </div>
    </div>
  );
}
