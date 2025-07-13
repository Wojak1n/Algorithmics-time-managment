'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock, Calendar, Save, Users, User, BookOpen, ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  weeklySessions: number;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  teacher: {
    id: string;
    user: {
      id: string;
      name: string;
    };
  };
  group: {
    id: string;
    name: string;
  };
}

interface TimeSlot {
  day: string;
  time: string;
}

export default function CreateSchedulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [scheduleSlots, setScheduleSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
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
      // Initialize with empty slots based on weekly sessions
      const initialSlots: TimeSlot[] = Array(course.weeklySessions).fill(null).map(() => ({
        day: '',
        time: ''
      }));
      setScheduleSlots(initialSlots);
    }
  };

  const updateScheduleSlot = (index: number, field: keyof TimeSlot, value: string) => {
    const updatedSlots = [...scheduleSlots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    setScheduleSlots(updatedSlots);
  };

  const addScheduleSlot = () => {
    setScheduleSlots([...scheduleSlots, { day: '', time: '' }]);
  };

  const removeScheduleSlot = (index: number) => {
    const updatedSlots = scheduleSlots.filter((_, i) => i !== index);
    setScheduleSlots(updatedSlots);
  };

  const handleSaveSchedule = async () => {
    if (!selectedCourse) {
      toast({
        title: 'Error',
        description: 'Please select a course',
        variant: 'destructive',
      });
      return;
    }

    // Validate all slots are filled
    const incompleteSlots = scheduleSlots.some(slot => !slot.day || !slot.time);
    if (incompleteSlots) {
      toast({
        title: 'Error',
        description: 'Please fill in all time slots',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/schedules/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          timeSlots: scheduleSlots,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Schedule created successfully',
        });
        router.push('/schedules');
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create schedule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create schedule',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Schedule</h1>
            <p className="text-gray-600 dark:text-gray-400">Create a custom schedule for a course</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Course Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Select Course</span>
            </CardTitle>
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
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span>{selectedCourseData.subject.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{selectedCourseData.teacher.user.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{selectedCourseData.group.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{selectedCourseData.weeklySessions} sessions per week</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Schedule Time Slots</span>
            </CardTitle>
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
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={addScheduleSlot}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Slot
                  </Button>
                  <Button
                    onClick={handleSaveSchedule}
                    disabled={saving}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Creating...' : 'Create Schedule'}
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
  );
}
