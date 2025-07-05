'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { BarChart3, Users, BookOpen, Calendar, MapPin, TrendingUp, Clock, UserCheck } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalSubjects: number;
  totalCourses: number;
  totalGroups: number;
  totalRooms: number;
  usersByRole: {
    role: string;
    count: number;
  }[];
  coursesBySubject: {
    subject: string;
    count: number;
  }[];
  groupUtilization: {
    groupName: string;
    current: number;
    capacity: number;
    utilization: number;
  }[];
  roomUtilization: {
    roomName: string;
    courses: number;
    capacity: number;
  }[];
  teacherWorkload: {
    teacherName: string;
    courses: number;
    subjects: number;
  }[];
}

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
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
      fetchAnalytics();
    }
  }, [user, token]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch analytics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while fetching analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar user={user} onLogout={handleLogout} />
        <div className="lg:ml-64 p-6">
          <div className="text-center py-8 text-gray-900 dark:text-gray-100">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar user={user} onLogout={handleLogout} />
        <div className="lg:ml-64 p-6">
          <div className="text-center py-8 text-gray-900 dark:text-gray-100">No analytics data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <div className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <BarChart3 className="mr-3 h-8 w-8 text-gray-900 dark:text-gray-100" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">System statistics and insights</p>
            </div>
            <ThemeToggle />
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalTeachers} teachers, {analytics.totalStudents} students
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalSubjects}</div>
                <p className="text-xs text-muted-foreground">
                  Academic subjects available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  Course instances running
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rooms</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalRooms}</div>
                <p className="text-xs text-muted-foreground">
                  Available classrooms
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Group Utilization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Group Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.groupUtilization.map((group, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{group.groupName}</span>
                        <Badge variant={group.utilization > 80 ? 'default' : 'secondary'}>
                          {group.current}/{group.capacity}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full"
                          style={{ width: `${group.utilization}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {group.utilization.toFixed(1)}% capacity
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Teacher Workload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="mr-2 h-5 w-5" />
                  Teacher Workload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.teacherWorkload.map((teacher, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{teacher.teacherName}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {teacher.subjects} subject{teacher.subjects !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {teacher.courses} course{teacher.courses !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Courses by Subject */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Courses by Subject
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.coursesBySubject.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{item.subject}</span>
                      <Badge variant="secondary">{item.count} course{item.count !== 1 ? 's' : ''}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Room Utilization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Room Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.roomUtilization.map((room, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{room.roomName}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Capacity: {room.capacity} students
                        </div>
                      </div>
                      <Badge variant={room.courses > 0 ? 'default' : 'outline'}>
                        {room.courses} course{room.courses !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
