'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { BookOpen, Users, Clock, MapPin } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Course {
  id: string;
  name: string;
  weeklySessions: number;
  schedule: any;
  subject: Subject;
  teacher: {
    user: {
      name: string;
      email: string;
    };
  };
  group: {
    id: string;
    name: string;
  };
  room: {
    name: string;
  } | null;
}

interface GroupSubject {
  subject: Subject;
}

export default function MySubjectsPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setToken(storedToken);
      
      if (userData.role !== 'STUDENT') {
        router.push('/');
        return;
      }
    } else {
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (user && token && user.role === 'STUDENT') {
      fetchMySubjects();
      fetchMyCourses();
    }
  }, [user, token]);

  const fetchMySubjects = async () => {
    try {
      // First get the student's group
      const studentResponse = await fetch('/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (studentResponse.ok) {
        const students = await studentResponse.json();
        const currentStudent = students.find((s: any) => s.userId === user.id);
        
        if (currentStudent && currentStudent.groupId) {
          // Get the group's subjects
          const groupResponse = await fetch(`/api/groups/${currentStudent.groupId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (groupResponse.ok) {
            const group = await groupResponse.json();
            const groupSubjects = group.subjects || [];
            setSubjects(groupSubjects.map((gs: GroupSubject) => gs.subject));
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch your subjects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCourses = async () => {
    try {
      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const allCourses = await response.json();
        // Filter courses for the student's group
        const studentResponse = await fetch('/api/students', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (studentResponse.ok) {
          const students = await studentResponse.json();
          const currentStudent = students.find((s: any) => s.userId === user.id);
          
          if (currentStudent && currentStudent.groupId) {
            const myCourses = allCourses.filter((course: any) =>
              course.group && course.group.id === currentStudent.groupId
            );
            setCourses(myCourses);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  const getCoursesForSubject = (subjectId: string) => {
    return courses.filter(course => course.subject.id === subjectId);
  };

  const formatSchedule = (schedule: any) => {
    if (!schedule || !Array.isArray(schedule)) return 'Not scheduled';
    
    return schedule.map((slot: any) => 
      `${slot.day} ${slot.startTime}-${slot.endTime}`
    ).join(', ');
  };

  if (!user || user.role !== 'STUDENT') {
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
                <BookOpen className="mr-3 h-8 w-8 text-gray-900 dark:text-gray-100" />
                My Subjects
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">View your enrolled subjects and courses</p>
            </div>
            <ThemeToggle />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading your subjects...</div>
          ) : subjects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Subjects Found</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  You are not currently enrolled in any subjects. Please contact your administrator.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {subjects.map((subject) => {
                const subjectCourses = getCoursesForSubject(subject.id);
                
                return (
                  <Card key={subject.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center">
                            <BookOpen className="mr-2 h-5 w-5" />
                            {subject.name}
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Subject Code: {subject.code}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {subjectCourses.length} {subjectCourses.length === 1 ? 'Course' : 'Courses'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {subjectCourses.length === 0 ? (
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          No courses scheduled for this subject yet.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {subjectCourses.map((course) => (
                            <div key={course.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">{course.name}</h4>
                                <Badge variant="secondary">
                                  {course.weeklySessions} sessions/week
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center text-gray-600 dark:text-gray-300">
                                  <Users className="mr-2 h-4 w-4" />
                                  <span>Teacher: {course.teacher.user.name}</span>
                                </div>
                                
                                {course.room && (
                                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    <span>Room: {course.room.name}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center text-gray-600 dark:text-gray-300">
                                  <Clock className="mr-2 h-4 w-4" />
                                  <span>{formatSchedule(course.schedule)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
