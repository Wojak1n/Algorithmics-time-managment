'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CalendarPlus, Save, ArrowLeft, Clock, Users, BookOpen, MapPin } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  subject: {
    code: string;
    name: string;
  };
  teacher: {
    user: {
      name: string;
    };
  };
  group: {
    name: string;
  };
  room: {
    name: string;
  } | null;
  weeklySessions: number;
  schedule?: {
    day: string;
    time: string;
  }[];
}

export default function ManualSchedulePage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [scheduleSlots, setScheduleSlots] = useState<{day: string; time: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
    '16:00-17:00', '17:00-18:00'
  ];

  useEffect(() => {
    // Check for stored auth
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setToken(storedToken);
      
      // Only admin can access manual scheduling
      if (userData.role !== 'ADMIN') {
        router.push('/');
        return;
      }
    } else {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (user && token && user.role === 'ADMIN') {
      fetchCourses();
    }
  }, [user, token]);

  const fetchCourses = async () => {
    setLoading(true);
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

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    const course = courses.find(c => c.id === courseId);
    if (course) {
      // Load existing schedule or create empty slots based on weekly sessions
      if (course.schedule && course.schedule.length > 0) {
        setScheduleSlots(course.schedule);
      } else {
        // Create empty slots for the number of weekly sessions
        const emptySlots = Array(course.weeklySessions).fill(null).map(() => ({
          day: '',
          time: ''
        }));
        setScheduleSlots(emptySlots);
      }
    }
  };

  const updateScheduleSlot = (index: number, field: 'day' | 'time', value: string) => {
    const newSlots = [...scheduleSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setScheduleSlots(newSlots);
  };

  const addScheduleSlot = () => {
    setScheduleSlots([...scheduleSlots, { day: '', time: '' }]);
  };

  const removeScheduleSlot = (index: number) => {
    const newSlots = scheduleSlots.filter((_, i) => i !== index);
    setScheduleSlots(newSlots);
  };

  const handleSaveSchedule = async () => {
    if (!selectedCourse) {
      toast({
        title: 'Error',
        description: 'Please select a course first',
        variant: 'destructive',
      });
      return;
    }

    // Validate that all slots have both day and time
    const invalidSlots = scheduleSlots.some(slot => !slot.day || !slot.time);
    if (invalidSlots) {
      toast({
        title: 'Error',
        description: 'Please fill in all day and time slots',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/courses/${selectedCourse}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule: scheduleSlots
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Schedule saved successfully',
        });
        // Refresh courses to show updated schedule
        fetchCourses();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save schedule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while saving schedule',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <CalendarPlus className="mr-3 h-8 w-8 text-gray-900 dark:text-gray-100" />
                  Manual Schedule Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Manually assign time slots to courses
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Course Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Course</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select value={selectedCourse} onValueChange={handleCourseSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course to schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} - {course.subject.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCourseData && (
                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">Course Details</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-gray-500" />
                          <span>{selectedCourseData.subject.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{selectedCourseData.teacher.user.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{selectedCourseData.group.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{selectedCourseData.room?.name || 'No room assigned'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>{selectedCourseData.weeklySessions} sessions per week</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Schedule Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Time Slots</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCourse ? (
                    <>
                      {scheduleSlots.map((slot, index) => (
                        <div key={index} className="flex items-center space-x-2 p-3 border rounded-md">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Day</Label>
                              <Select 
                                value={slot.day} 
                                onValueChange={(value) => updateScheduleSlot(index, 'day', value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Day" />
                                </SelectTrigger>
                                <SelectContent>
                                  {days.map((day) => (
                                    <SelectItem key={day} value={day}>{day}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Time</Label>
                              <Select 
                                value={slot.time} 
                                onValueChange={(value) => updateScheduleSlot(index, 'time', value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map((time) => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeScheduleSlot(index)}
                            className="h-8 w-8 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      ))}

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={addScheduleSlot}
                          className="flex-1"
                        >
                          Add Time Slot
                        </Button>
                        <Button
                          onClick={handleSaveSchedule}
                          disabled={saving}
                          className="flex-1"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Saving...' : 'Save Schedule'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Select a course to configure its schedule
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
