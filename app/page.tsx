'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleThemeToggle, ThemeToggle } from '@/components/theme-toggle';
import { LogoIcon } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Users,
  BookOpen,
  MapPin,
  Clock,
  TrendingUp,
  Activity,
  CheckCircle
} from 'lucide-react';
import { AnimatedCounter, AnimatedPercentage } from '@/components/ui/animated-counter';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalRooms: 0,
    scheduledClasses: 0,
    conflicts: 0
  });
  const [preferences, setPreferences] = useState({
    showWelcomeMessage: true,
    compactView: false
  });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    // Check for stored auth
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);

      // Load preferences
      const storedPreferences = localStorage.getItem('userPreferences');
      if (storedPreferences) {
        setPreferences({ ...preferences, ...JSON.parse(storedPreferences) });
      }
    }
  }, []);

  useEffect(() => {
    if (user && token) {
      fetchStats();
    }
  }, [user, token]);

  const fetchStats = async () => {
    try {
      // Fetch basic stats from various endpoints
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [coursesRes, teachersRes, studentsRes, roomsRes] = await Promise.all([
        fetch('/api/courses', { headers }),
        fetch('/api/teachers', { headers }),
        fetch('/api/students', { headers }),
        fetch('/api/rooms', { headers })
      ]);

      // Handle each response individually to avoid all-or-nothing failure
      let courses = [];
      let teachers = [];
      let students = [];
      let rooms = [];

      if (coursesRes.ok) {
        courses = await coursesRes.json();
      } else {
        console.error('Courses API failed:', coursesRes.status);
      }

      if (teachersRes.ok) {
        teachers = await teachersRes.json();
      } else {
        console.error('Teachers API failed:', teachersRes.status);
      }

      if (studentsRes.ok) {
        students = await studentsRes.json();
      } else {
        console.error('Students API failed:', studentsRes.status);
      }

      if (roomsRes.ok) {
        rooms = await roomsRes.json();
      } else {
        console.error('Rooms API failed:', roomsRes.status);
      }

      const scheduledClasses = courses.filter((course: any) => course.schedule).length;

      console.log('Dashboard stats:', {
        courses: courses.length,
        teachers: teachers.length,
        students: students.length,
        rooms: rooms.length
      });

      setStats({
        totalCourses: courses.length,
        totalTeachers: teachers.length,
        totalStudents: students.length,
        totalRooms: rooms.length,
        scheduledClasses,
        conflicts: 0 // This would come from the scheduling algorithm
      });

      setStatsLoaded(true);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogin = (userData: any, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const handleGenerateSchedule = async () => {
    try {
      const response = await fetch('/api/schedule/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: `Schedule generated successfully! ${result.scheduledCourses} courses scheduled.`,
        });
        // Refresh stats
        fetchStats();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to generate schedule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while generating schedule',
        variant: 'destructive',
      });
    }
  };



  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 dark:from-gray-900 dark:via-purple-900 dark:to-black relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 opacity-15 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500 opacity-15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-violet-500 opacity-10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>

        {/* Theme toggle in top right */}
        <div className="fixed top-6 right-6 z-50">
          <SimpleThemeToggle />
        </div>

        {/* Main content */}
        <div className="relative z-10 h-full flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md">
            {/* Logo and branding */}
            <div className="text-center mb-6 mt-4">
              <div className="flex items-center justify-center mb-4">
                <LogoIcon size={50} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                Algorithmics Time Management
              </h1>
              <p className="text-purple-100 text-sm">
                Smart scheduling for modern education
              </p>
            </div>

            {/* Login form container */}
            <Card className="shadow-2xl p-2">
              <CardHeader className="text-center pb-6 px-8">
                <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
                <p className="text-muted-foreground text-sm">Sign in to your account</p>
              </CardHeader>
              <CardContent className="pt-0 px-8 pb-8">
                <LoginForm onSuccess={handleLogin} />
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-4">
              <p className="text-purple-100 text-xs">
                Secure • Reliable • Intelligent
              </p>
            </div>
          </div>
        </div>

        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
              {preferences.showWelcomeMessage && (
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Welcome back, {user.name}! Here's your timetable system overview.
                </p>
              )}
            </div>
            <ThemeToggle />
          </div>

          {/* Stats Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8 ${preferences.compactView ? 'gap-4' : 'gap-6'}`}>
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className={preferences.compactView ? "p-4" : "p-6"}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Courses</p>
                    <p className="text-2xl font-bold">
                      <AnimatedCounter value={stats.totalCourses} delay={100} />
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
              <CardContent className={preferences.compactView ? "p-4" : "p-6"}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Teachers</p>
                    <p className="text-2xl font-bold">
                      <AnimatedCounter value={stats.totalTeachers} delay={300} />
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-emerald-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className={preferences.compactView ? "p-4" : "p-6"}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Students</p>
                    <p className="text-2xl font-bold">
                      <AnimatedCounter value={stats.totalStudents} delay={500} />
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className={preferences.compactView ? "p-4" : "p-6"}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Rooms</p>
                    <p className="text-2xl font-bold">
                      <AnimatedCounter value={stats.totalRooms} delay={700} />
                    </p>
                  </div>
                  <MapPin className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Scheduled Classes</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      <AnimatedCounter value={stats.scheduledClasses} delay={900} />
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      <AnimatedPercentage
                        value={Math.round((stats.scheduledClasses / Math.max(stats.totalCourses, 1)) * 100)}
                        delay={1200}
                      /> Complete
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Schedule Conflicts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      <AnimatedCounter value={stats.conflicts} delay={1100} />
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Detected in current schedule
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">System Efficiency</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      <AnimatedPercentage
                        value={stats.totalCourses > 0 ? Math.round(((stats.totalCourses - stats.conflicts) / stats.totalCourses) * 100) : 100}
                        delay={1300}
                      />
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      Optimized scheduling
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {user.role === 'ADMIN' && (
                  <>
                    <Button
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={handleGenerateSchedule}
                    >
                      <Calendar className="h-6 w-6" />
                      <span>Generate Schedule</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => router.push('/users')}
                    >
                      <Users className="h-6 w-6" />
                      <span>Manage Users</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => router.push('/courses')}
                    >
                      <BookOpen className="h-6 w-6" />
                      <span>Add Course</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => router.push('/rooms')}
                    >
                      <MapPin className="h-6 w-6" />
                      <span>Manage Rooms</span>
                    </Button>
                  </>
                )}
                
                {user.role === 'TEACHER' && (
                  <>
                    <Button
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => router.push('/schedules')}
                    >
                      <Clock className="h-6 w-6" />
                      <span>View My Schedule</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => router.push('/courses')}
                    >
                      <Users className="h-6 w-6" />
                      <span>My Classes</span>
                    </Button>
                  </>
                )}
                
                {user.role === 'STUDENT' && (
                  <>
                    <Button
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => router.push('/schedules')}
                    >
                      <Calendar className="h-6 w-6" />
                      <span>My Timetable</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => router.push('/my-subjects')}
                    >
                      <BookOpen className="h-6 w-6" />
                      <span>My Subjects</span>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}