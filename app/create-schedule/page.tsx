'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar, Clock, Save, Plus, Trash2, Users, User, BookOpen,
  MapPin, GraduationCap, AlertCircle, CheckCircle, Info,
  Timer, Building, School, Target, Zap
} from 'lucide-react';

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
  duration: number;
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
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [existingSchedules, setExistingSchedules] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00'
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

  const fetchExistingSchedules = async (courseId: string) => {
    try {
      const response = await fetch(`/api/schedules?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setExistingSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching existing schedules:', error);
    }
  };

  const checkConflicts = async () => {
    if (!selectedCourse || scheduleSlots.length === 0) return;

    try {
      const response = await fetch('/api/schedules/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse,
          timeSlots: scheduleSlots.filter(slot => slot.day && slot.time)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConflicts(data.conflicts || []);
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  const validateSchedule = () => {
    const errors: string[] = [];

    if (!selectedCourse) {
      errors.push('Please select a course');
    }

    if (scheduleSlots.length === 0) {
      errors.push('Please add at least one time slot');
    }

    const incompleteSlots = scheduleSlots.some(slot => !slot.day || !slot.time);
    if (incompleteSlots) {
      errors.push('Please fill in all time slots');
    }

    // Check for duplicate slots
    const duplicates = scheduleSlots.filter((slot, index) =>
      scheduleSlots.findIndex(s => s.day === slot.day && s.time === slot.time) !== index
    );
    if (duplicates.length > 0) {
      errors.push('Duplicate time slots are not allowed');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const getScheduleProgress = () => {
    const filledSlots = scheduleSlots.filter(slot => slot.day && slot.time).length;
    return scheduleSlots.length > 0 ? (filledSlots / scheduleSlots.length) * 100 : 0;
  };

  const getTimeSlotStatus = (day: string, time: string) => {
    if (!day || !time) return { hasConflict: false, isExisting: false };

    const hasConflict = conflicts.some((conflict: any) =>
      conflict.message && conflict.message.includes(day) && conflict.message.includes(time)
    );

    const isExisting = existingSchedules.some((schedule: any) =>
      schedule.day === day && schedule.time === time
    );

    return { hasConflict, isExisting };
  };

  const handleCourseSelect = async (courseId: string) => {
    setSelectedCourse(courseId);
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourseData(course);

      // Initialize with empty slots based on weekly sessions
      const initialSlots: TimeSlot[] = Array(course.weeklySessions).fill(null).map(() => ({
        day: '',
        time: '',
        duration: 60
      }));
      setScheduleSlots(initialSlots);

      // Fetch existing schedules for this course
      await fetchExistingSchedules(courseId);

      // Clear previous conflicts and validation errors
      setConflicts([]);
      setValidationErrors([]);

      toast({
        title: 'Course Selected',
        description: `${course.name} - ${course.weeklySessions} sessions per week`,
      });
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

    // Clear validation errors when user makes changes
    setValidationErrors([]);

    // Check conflicts after a short delay
    setTimeout(() => {
      checkConflicts();
    }, 500);
  };

  const addScheduleSlot = () => {
    setScheduleSlots([...scheduleSlots, { day: '', time: '', duration: 60 }]);
  };

  const removeScheduleSlot = (index: number) => {
    const updatedSlots = scheduleSlots.filter((_, i) => i !== index);
    setScheduleSlots(updatedSlots);
  };

  const handleSaveSchedule = async () => {
    // Validate the schedule first
    if (!validateSchedule()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving',
        variant: 'destructive',
      });
      return;
    }

    // Final conflict check
    await checkConflicts();

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
        const result = await response.json();
        toast({
          title: 'Success! 🎉',
          description: `Schedule created with ${scheduleSlots.length} time slots`,
        });

        // Show success details
        setTimeout(() => {
          toast({
            title: 'Schedule Details',
            description: `Course: ${selectedCourseData?.name} | Sessions: ${scheduleSlots.length}`,
          });
        }, 1000);

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
        description: 'Failed to create schedule. Please try again.',
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
          <CardContent className="space-y-8">
            {/* Header Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Schedule Creation</h2>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Create a new schedule for your course</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <School className="h-4 w-4 text-blue-600" />
                  <span>Total Courses: {courses.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>Days Available: 7</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Time Slots: {timeSlots.length}</span>
                </div>
              </div>
            </div>

            {/* Course Selection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-gray-600" />
                <label className="text-lg font-semibold">Select Course</label>
                <Badge variant="outline" className="ml-auto">
                  Step 1 of 3
                </Badge>
              </div>
              <Select value={selectedCourse} onValueChange={handleCourseSelect}>
                <SelectTrigger className="h-14 text-lg border-2 hover:border-blue-300 focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="🎯 Choose a course to schedule" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id} className="py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <div>
                          <div className="font-medium">{course.name}</div>
                          <div className="text-sm text-gray-500">
                            {course.subject.name} ({course.subject.code}) • {course.weeklySessions} sessions/week
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {courses.length === 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No courses available. Please create courses first before scheduling.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Course Details */}
            {selectedCourseData && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <label className="text-lg font-semibold">Course Details</label>
                  <Badge variant="outline" className="ml-auto">
                    Step 2 of 3
                  </Badge>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                        {selectedCourseData.name}
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Ready for scheduling
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <GraduationCap className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Subject</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedCourseData.subject.name} ({selectedCourseData.subject.code})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Teacher</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedCourseData.teacher.user.name}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                          <Users className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Group</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedCourseData.group.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <Timer className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Sessions</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedCourseData.weeklySessions} per week
                          </p>
                        </div>
                      </div>

                      {selectedCourseData.room && (
                        <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                            <Building className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">Room</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedCourseData.room.name}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Time Slots */}
            {scheduleSlots.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <label className="text-lg font-semibold">Configure Time Slots</label>
                  <Badge variant="outline" className="ml-auto">
                    Step 3 of 3
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Schedule Progress</span>
                    <span className="text-gray-600">{Math.round(getScheduleProgress())}% Complete</span>
                  </div>
                  <Progress value={getScheduleProgress()} className="h-2" />
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      <div className="font-semibold mb-2">Please fix the following issues:</div>
                      <ul className="text-sm space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Conflicts Warning */}
                {conflicts.length > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      <div className="font-semibold mb-2">Scheduling Conflicts Detected</div>
                      <ul className="text-sm space-y-1">
                        {conflicts.slice(0, 3).map((conflict, index) => (
                          <li key={index}>• {conflict.message}</li>
                        ))}
                        {conflicts.length > 3 && (
                          <li className="text-xs">...and {conflicts.length - 3} more</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Time Slots ({scheduleSlots.length})</span>
                    {existingSchedules.length > 0 && (
                      <Badge variant="secondary">
                        {existingSchedules.length} existing
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={addScheduleSlot} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Slot
                    </Button>
                    <Button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      size="sm"
                      variant="ghost"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {showAdvanced ? 'Hide' : 'Show'} Advanced
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {scheduleSlots.map((slot, index) => {
                    const status = getTimeSlotStatus(slot.day, slot.time);
                    const isComplete = slot.day && slot.time;

                    return (
                      <div key={index} className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                        status.hasConflict
                          ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                          : status.isExisting
                            ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20'
                            : isComplete
                              ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                              : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50'
                      }`}>
                        {/* Slot Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              Session {index + 1}
                            </span>
                            {isComplete && (
                              <Badge variant="secondary" className="text-xs">
                                {slot.day} at {slot.time}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {status.hasConflict && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Conflict
                              </Badge>
                            )}
                            {status.isExisting && (
                              <Badge variant="secondary" className="text-xs">
                                <Info className="h-3 w-3 mr-1" />
                                Existing
                              </Badge>
                            )}
                            {isComplete && !status.hasConflict && !status.isExisting && (
                              <Badge variant="default" className="text-xs bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ready
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Slot Configuration */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                              Day of Week
                            </label>
                            <Select
                              value={slot.day}
                              onValueChange={(value) => updateScheduleSlot(index, 'day', value)}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                              <SelectContent>
                                {days.map((day) => (
                                  <SelectItem key={day} value={day}>
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-4 w-4" />
                                      <span>{day}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                              Start Time
                            </label>
                            <Select
                              value={slot.time}
                              onValueChange={(value) => updateScheduleSlot(index, 'time', value)}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-4 w-4" />
                                      <span>{time}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                              Duration (minutes)
                            </label>
                            <Select
                              value={slot.duration.toString()}
                              onValueChange={(value) => updateScheduleSlot(index, 'duration', parseInt(value))}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30">
                                  <div className="flex items-center space-x-2">
                                    <Timer className="h-4 w-4" />
                                    <span>30 minutes</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="45">
                                  <div className="flex items-center space-x-2">
                                    <Timer className="h-4 w-4" />
                                    <span>45 minutes</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="60">
                                  <div className="flex items-center space-x-2">
                                    <Timer className="h-4 w-4" />
                                    <span>60 minutes</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="90">
                                  <div className="flex items-center space-x-2">
                                    <Timer className="h-4 w-4" />
                                    <span>90 minutes</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="120">
                                  <div className="flex items-center space-x-2">
                                    <Timer className="h-4 w-4" />
                                    <span>120 minutes</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeScheduleSlot(index)}
                              className="w-full h-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Advanced Options */}
                        {showAdvanced && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>End Time: {slot.time && slot.time !== '' ?
                                  new Date(`2000-01-01 ${slot.time}`).getTime() + (slot.duration * 60000) > 0 ?
                                  new Date(new Date(`2000-01-01 ${slot.time}`).getTime() + (slot.duration * 60000)).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: false}) :
                                  'Invalid' : 'Not set'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-gray-500" />
                                <span>Room: {selectedCourseData?.room?.name || 'Not assigned'}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary and Actions */}
            {selectedCourseData && scheduleSlots.length > 0 && (
              <div className="space-y-6">
                <Separator />

                {/* Schedule Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                        Schedule Summary
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Review your schedule before creating
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{scheduleSlots.length}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Slots</div>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {scheduleSlots.filter(slot => slot.day && slot.time).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{conflicts.length}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Conflicts</div>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(scheduleSlots.reduce((sum, slot) => sum + slot.duration, 0) / 60)}h
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/schedules')}
                    className="flex-1 h-12"
                  >
                    <div className="flex items-center space-x-2">
                      <span>Cancel</span>
                    </div>
                  </Button>

                  <Button
                    onClick={() => {
                      validateSchedule();
                      checkConflicts();
                    }}
                    variant="secondary"
                    className="flex-1 h-12"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>Validate Schedule</span>
                    </div>
                  </Button>

                  <Button
                    onClick={handleSaveSchedule}
                    disabled={saving || !selectedCourse || scheduleSlots.length === 0 || validationErrors.length > 0}
                    className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    {saving ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating Schedule...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Save className="h-4 w-4" />
                        <span>Create Schedule</span>
                      </div>
                    )}
                  </Button>
                </div>

                {/* Help Text */}
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <p>💡 Tip: Make sure all time slots are filled and conflicts are resolved before creating the schedule.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
