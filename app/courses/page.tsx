'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  weeklySessions: number;
  schedule: any;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  teacher: {
    id: string;
    user: {
      name: string;
    };
  };
  group: {
    id: string;
    name: string;
  };
  room: {
    id: string;
    name: string;
  } | null;
}

export default function CoursesPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subjectId: '',
    teacherId: '',
    groupId: '',
    roomId: '',
    weeklySessions: '1'
  });
  const { toast } = useToast();
  const router = useRouter();

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
      fetchCourses();
      fetchSubjects();
      fetchTeachers();
      fetchGroups();
      fetchRooms();
    }
  }, [user, token]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch courses',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while fetching courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.subjectId || !formData.teacherId || !formData.groupId || !formData.weeklySessions) {
      toast({
        title: 'Error',
        description: 'All fields except room are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = editingCourse ? `/api/courses/${editingCourse.id}` : '/api/courses';
      const method = editingCourse ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          subjectId: formData.subjectId,
          teacherId: formData.teacherId,
          groupId: formData.groupId,
          roomId: formData.roomId || null,
          weeklySessions: parseInt(formData.weeklySessions)
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Course ${editingCourse ? 'updated' : 'created'} successfully`,
        });
        setDialogOpen(false);
        resetForm();
        fetchCourses();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save course',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while saving course',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      subjectId: course.subject.id,
      teacherId: course.teacher.id,
      groupId: course.group.id,
      roomId: course.room?.id || '',
      weeklySessions: course.weeklySessions.toString()
    });
    setDialogOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Course deleted successfully',
        });
        fetchCourses();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete course',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while deleting course',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subjectId: '',
      teacherId: '',
      groupId: '',
      roomId: '',
      weeklySessions: '1'
    });
    setEditingCourse(null);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  const getTeachersBySubject = (subjectId: string) => {
    return teachers.filter(teacher => 
      teacher.skills.some((skill: any) => skill.skill.subjectId === subjectId)
    );
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
                <Calendar className="mr-3 h-8 w-8 text-gray-900 dark:text-gray-100" />
                Courses Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">Manage course instances and assignments</p>
            </div>
            
            {user.role === 'ADMIN' && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCourse ? 'Edit Course' : 'Add New Course'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Course Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Mathematics for Group A"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Select value={formData.subjectId} onValueChange={(value) => setFormData({ ...formData, subjectId: value, teacherId: '' })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.code}: {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="teacher">Teacher</Label>
                        <Select value={formData.teacherId} onValueChange={(value) => setFormData({ ...formData, teacherId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {getTeachersBySubject(formData.subjectId).map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="group">Group</Label>
                        <Select value={formData.groupId} onValueChange={(value) => setFormData({ ...formData, groupId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select group" />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name} ({group.students.length}/{group.size})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="room">Room (Optional)</Label>
                        <Select value={formData.roomId} onValueChange={(value) => setFormData({ ...formData, roomId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No Room</SelectItem>
                            {rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.name} (Cap: {room.capacity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="sessions">Weekly Sessions</Label>
                      <Select value={formData.weeklySessions} onValueChange={(value) => setFormData({ ...formData, weeklySessions: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} session{num > 1 ? 's' : ''} per week
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingCourse ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-gray-600 dark:text-gray-300">Loading courses...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Schedule</TableHead>
                      {user.role === 'ADMIN' && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {course.subject.code}
                          </Badge>
                        </TableCell>
                        <TableCell>{course.teacher.user.name}</TableCell>
                        <TableCell>{course.group.name}</TableCell>
                        <TableCell>
                          {course.room ? (
                            <Badge variant="secondary">{course.room.name}</Badge>
                          ) : (
                            <Badge variant="outline">No Room</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {course.weeklySessions}/week
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {course.schedule ? (
                            <Badge variant="default">
                              <Clock className="h-3 w-3 mr-1" />
                              Scheduled
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Not Scheduled
                            </Badge>
                          )}
                        </TableCell>
                        {user.role === 'ADMIN' && (
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(course)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(course.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
