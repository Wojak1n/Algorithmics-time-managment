'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Clock, Calendar, Save, Plus, Trash2 } from 'lucide-react';

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
  room?: {
    id: string;
    name: string;
  };
}

interface TimeSlot {
  day: string;
  time: string;
  duration?: number;
}

export default function CreateSchedulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedCourseData, setSelectedCourseData] = useState<Course | null>(null);
  const [scheduleSlots, setScheduleSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
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
      setSelectedCourseData(course);
      const initialSlots: TimeSlot[] = Array(course.weeklySessions).fill(null).map(() => ({
        day: '',
        time: '',
        duration: 60
      }));
      setScheduleSlots(initialSlots);
    }
  };

  const updateScheduleSlot = (index: number, field: keyof TimeSlot, value: string | number) => {
    const updatedSlots = [...scheduleSlots];
    if (field === 'duration') {
      updatedSlots[index][field] = value as number;
    } else {
      updatedSlots[index][field] = value as string;
    }
    setScheduleSlots(updatedSlots);
  };

  const addScheduleSlot = () => {
    setScheduleSlots([...scheduleSlots, { day: '', time: '', duration: 60 }]);
  };

  const removeScheduleSlot = (index: number) => {
    const updatedSlots = scheduleSlots.filter((_, i) => i !== index);
    setScheduleSlots(updatedSlots);
  };

  const handleSaveSchedule = async () => {
    if (!selectedCourse || scheduleSlots.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a course and add time slots',
        variant: 'destructive',
      });
      return;
    }

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
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        router.push('/admin/schedules');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-6 w-6" />
              <span>Create Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Course Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Select Course</label>
              <Select value={selectedCourse} onValueChange={handleCourseSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name} - {course.subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Details */}
            {selectedCourseData && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">{selectedCourseData.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Subject: {selectedCourseData.subject.name}</div>
                  <div>Teacher: {selectedCourseData.teacher.user.name}</div>
                  <div>Group: {selectedCourseData.group.name}</div>
                  <div>Sessions: {selectedCourseData.weeklySessions}/week</div>
                </div>
              </div>
            )}

            {/* Time Slots */}
            {scheduleSlots.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Schedule Time Slots</h3>
                  <Button onClick={addScheduleSlot} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slot
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {scheduleSlots.map((slot, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Day</label>
                          <Select
                            value={slot.day}
                            onValueChange={(value) => updateScheduleSlot(index, 'day', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                            <SelectContent>
                              {days.map((day) => (
                                <SelectItem key={day} value={day}>{day}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Time</label>
                          <Select
                            value={slot.time}
                            onValueChange={(value) => updateScheduleSlot(index, 'time', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Duration</label>
                          <Select
                            value={slot.duration?.toString() || '60'}
                            onValueChange={(value) => updateScheduleSlot(index, 'duration', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30 min</SelectItem>
                              <SelectItem value="45">45 min</SelectItem>
                              <SelectItem value="60">60 min</SelectItem>
                              <SelectItem value="90">90 min</SelectItem>
                              <SelectItem value="120">120 min</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeScheduleSlot(index)}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/schedules')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSchedule}
                disabled={saving || !selectedCourse || scheduleSlots.length === 0}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Schedule
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
