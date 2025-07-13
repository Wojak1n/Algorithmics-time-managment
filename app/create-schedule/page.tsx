'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Clock, Calendar, Save, Users, User, BookOpen, ArrowLeft, Plus, Trash2,
  MapPin, GraduationCap, CheckCircle, AlertCircle, Info, Zap, Target,
  Timer, Building, School
} from 'lucide-react';

interface Course {
  id: string;
  name: string;
  weeklySessions: number;
  subject: {
    id: string;
    name: string;
    code: string;
    color?: string;
  };
  teacher: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  group: {
    id: string;
    name: string;
    level: string;
    studentCount?: number;
  };
  room?: {
    id: string;
    name: string;
    capacity: number;
    building?: string;
  };
}

interface TimeSlot {
  day: string;
  time: string;
  duration?: number;
}

interface ExistingSchedule {
  id: string;
  day: string;
  time: string;
  course: {
    name: string;
    subject: { code: string };
  };
}

interface ScheduleConflict {
  type: 'teacher' | 'room' | 'group';
  message: string;
  conflictingCourse: string;
}

export default function CreateSchedulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [scheduleSlots, setScheduleSlots] = useState<TimeSlot[]>([]);
  const [existingSchedules, setExistingSchedules] = useState<ExistingSchedule[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM'
  ];

  const stepTitles = [
    'Select Course',
    'Configure Schedule',
    'Review & Save'
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

  const handleCourseSelect = async (courseId: string) => {
    setSelectedCourse(courseId);
    const course = courses.find(c => c.id === courseId);
    if (course) {
      // Initialize with empty slots based on weekly sessions
      const initialSlots: TimeSlot[] = Array(course.weeklySessions).fill(null).map(() => ({
        day: '',
        time: '',
        duration: 60 // Default 60 minutes
      }));
      setScheduleSlots(initialSlots);
      setCurrentStep(2);

      // Fetch existing schedules for conflict checking
      await fetchExistingSchedules(courseId);
    }
  };

  const fetchExistingSchedules = async (courseId: string) => {
    try {
      const response = await fetch(`/api/schedules/existing?courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setExistingSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching existing schedules:', error);
    }
  };

  const checkForConflicts = async (slots: TimeSlot[]) => {
    if (!selectedCourse || slots.some(slot => !slot.day || !slot.time)) return;

    setCheckingConflicts(true);
    try {
      const response = await fetch('/api/schedules/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse,
          timeSlots: slots
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConflicts(data.conflicts || []);
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
    } finally {
      setCheckingConflicts(false);
    }
  };

  const updateScheduleSlot = (index: number, field: keyof TimeSlot, value: string | number) => {
    const updatedSlots = [...scheduleSlots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    setScheduleSlots(updatedSlots);

    // Check for conflicts when slots are updated
    if (field === 'day' || field === 'time') {
      checkForConflicts(updatedSlots);
    }
  };

  const addScheduleSlot = () => {
    setScheduleSlots([...scheduleSlots, { day: '', time: '', duration: 60 }]);
  };

  const removeScheduleSlot = (index: number) => {
    const updatedSlots = scheduleSlots.filter((_, i) => i !== index);
    setScheduleSlots(updatedSlots);
    checkForConflicts(updatedSlots);
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

  const validateSchedule = () => {
    const errors = [];

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

    return errors;
  };

  const handleReviewSchedule = () => {
    const errors = validateSchedule();
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors[0],
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep(3);
  };

  const handleSaveSchedule = async () => {
    const errors = validateSchedule();
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors[0],
        variant: 'destructive',
      });
      return;
    }

    if (conflicts.length > 0) {
      const confirmSave = confirm(
        `There are ${conflicts.length} scheduling conflicts. Do you want to proceed anyway?`
      );
      if (!confirmSave) return;
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
  const progress = getScheduleProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center space-x-2 hover:bg-blue-50 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Create Schedule
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Design a custom timetable for your course with intelligent conflict detection
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                <Zap className="h-3 w-3 mr-1" />
                Smart Scheduling
              </Badge>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {stepTitles.map((title, index) => {
                const getStepClassName = () => {
                  if (currentStep > index + 1) {
                    return 'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 bg-green-500 border-green-500 text-white';
                  } else if (currentStep === index + 1) {
                    return 'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 bg-blue-500 border-blue-500 text-white';
                  } else {
                    return 'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-700 dark:border-gray-600';
                  }
                };
                return (
                <div key={index} className="flex items-center">
                  <div className={getStepClassName()}>
                    {currentStep > index + 1 ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="ml-3 text-sm">
                    <p className={currentStep >= index + 1
                        ? 'font-medium text-gray-900 dark:text-gray-100'
                        : 'font-medium text-gray-400 dark:text-gray-500'
                    }>
                      {title}
                    </p>
                  </div>
                  {index < stepTitles.length - 1 && (
                    <div className={currentStep > index + 1
                      ? 'w-12 h-0.5 mx-4 bg-green-500'
                      : 'w-12 h-0.5 mx-4 bg-gray-300 dark:bg-gray-600'
                    } />
                  )}
                </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 1: Course Selection */}
        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <span>Select Course</span>
                    <p className="text-blue-100 text-sm font-normal mt-1">
                      Choose the course you want to create a schedule for
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Available Courses
                    </Label>
                    <Select value={selectedCourse} onValueChange={handleCourseSelect}>
                      <SelectTrigger className="h-14 text-lg border-2 hover:border-blue-300 focus:border-blue-500 transition-colors">
                        <SelectValue placeholder="🎯 Select a course to schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id} className="py-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <div>
                                <div className="font-medium">{course.name}</div>
                                <div className="text-sm text-gray-500">{course.subject.code} • {course.subject.name}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCourseData && (
                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-blue-200 dark:border-gray-500">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                          <Target className="h-5 w-5 mr-2 text-blue-500" />
                          Course Overview
                        </h3>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selected
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Subject</p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {selectedCourseData.subject.name}
                              </p>
                              <p className="text-xs text-gray-400">{selectedCourseData.subject.code}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                              <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Teacher</p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {selectedCourseData.teacher.user.name}
                              </p>
                              <p className="text-xs text-gray-400">{selectedCourseData.teacher.user.email}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Group</p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {selectedCourseData.group.name}
                              </p>
                              <p className="text-xs text-gray-400">Level: {selectedCourseData.group.level}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Weekly Sessions</p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {selectedCourseData.weeklySessions} sessions
                              </p>
                              <p className="text-xs text-gray-400">Recommended frequency</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedCourseData.room && (
                        <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                              <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Assigned Room</p>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {selectedCourseData.room.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                Capacity: {selectedCourseData.room.capacity} students
                                {selectedCourseData.room.building && ` • ${selectedCourseData.room.building}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Schedule Configuration */}
        {currentStep === 2 && selectedCourse && (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Schedule Slots */}
              <div className="lg:col-span-2">
                <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <span className="text-xl">Configure Time Slots</span>
                          <p className="text-green-100 text-sm font-normal mt-1">
                            Set up your class schedule with intelligent conflict detection
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30">
                        {scheduleSlots.length} slots
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Schedule Progress
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {Math.round(progress)}% Complete
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-4">
                      {scheduleSlots.map((slot, index) => {
                        const status = getTimeSlotStatus(slot.day, slot.time);
                        const getSlotClassName = () => {
                          if (status.hasConflict) {
                            return 'p-4 border-2 rounded-xl transition-all duration-200 border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20';
                          } else if (status.isExisting) {
                            return 'p-4 border-2 rounded-xl transition-all duration-200 border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20';
                          } else {
                            return 'p-4 border-2 rounded-xl transition-all duration-200 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50';
                          }
                        };
                        return (
                          <div key={index} className={getSlotClassName()}>
                            <div className="flex items-center space-x-4">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Day of Week
                                  </Label>
                                  <Select
                                    value={slot.day}
                                    onValueChange={(value) => updateScheduleSlot(index, 'day', value)}
                                  >
                                    <SelectTrigger className="mt-1 h-10">
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
                                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Start Time
                                  </Label>
                                  <Select
                                    value={slot.time}
                                    onValueChange={(value) => updateScheduleSlot(index, 'time', value)}
                                  >
                                    <SelectTrigger className="mt-1 h-10">
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
                                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Duration (minutes)
                                  </Label>
                                  <Select
                                    value={slot.duration?.toString() || '60'}
                                    onValueChange={(value) => updateScheduleSlot(index, 'duration', parseInt(value))}
                                  >
                                    <SelectTrigger className="mt-1 h-10">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="30">30 minutes</SelectItem>
                                      <SelectItem value="45">45 minutes</SelectItem>
                                      <SelectItem value="60">60 minutes</SelectItem>
                                      <SelectItem value="90">90 minutes</SelectItem>
                                      <SelectItem value="120">120 minutes</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                {status.hasConflict && (
                                  <AlertCircle className="h-5 w-5 text-red-500" />
                                )}
                                {status.isExisting && (
                                  <Info className="h-5 w-5 text-yellow-500" />
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeScheduleSlot(index)}
                                  className="h-10 w-10 p-0 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 mt-6">
                      <Button
                        variant="outline"
                        onClick={addScheduleSlot}
                        className="flex-1 h-12 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Time Slot
                      </Button>
                      <Button
                        onClick={handleReviewSchedule}
                        disabled={scheduleSlots.length === 0}
                        className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                      >
                        <Target className="h-5 w-5 mr-2" />
                        Review Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar with Info */}
              <div className="space-y-6">
                {/* Course Summary */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <School className="h-5 w-5 text-blue-600" />
                      <span>Course Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {selectedCourseData?.name}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        {selectedCourseData?.subject.name}
                      </p>
                    </div>
                    <Separator />
                    <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                      <p>👨‍🏫 {selectedCourseData?.teacher.user.name}</p>
                      <p>👥 {selectedCourseData?.group.name}</p>
                      <p>📅 {selectedCourseData?.weeklySessions} sessions/week</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Conflicts Alert */}
                {conflicts.length > 0 && (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
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

                {/* Tips */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Info className="h-5 w-5 text-green-600" />
                      <span>Scheduling Tips</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                    <p>💡 Avoid back-to-back sessions for better learning</p>
                    <p>⚡ Check for teacher and room conflicts</p>
                    <p>📊 Consider student break times</p>
                    <p>🎯 Distribute sessions evenly across the week</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Save */}
        {currentStep === 3 && selectedCourse && (
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <span>Review & Confirm</span>
                    <p className="text-purple-100 text-sm font-normal mt-1">
                      Review your schedule before saving
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {/* Course Summary */}
                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <BookOpen className="h-6 w-6 mr-2 text-blue-500" />
                    {selectedCourseData?.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4 text-gray-500" />
                      <span>{selectedCourseData?.subject.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{selectedCourseData?.teacher.user.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{selectedCourseData?.group.name}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule Overview */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-green-500" />
                    Schedule Overview ({scheduleSlots.length} sessions)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scheduleSlots.map((slot, index) => {
                      const status = getTimeSlotStatus(slot.day, slot.time);
                      const getReviewSlotClassName = () => {
                        if (status.hasConflict) {
                          return 'p-4 rounded-lg border-2 border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20';
                        } else {
                          return 'p-4 rounded-lg border-2 border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20';
                        }
                      };
                      return (
                        <div key={index} className={getReviewSlotClassName()}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {slot.day} at {slot.time}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Duration: {slot.duration || 60} minutes
                              </p>
                            </div>
                            {status.hasConflict ? (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Conflicts Warning */}
                {conflicts.length > 0 && (
                  <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      <div className="font-semibold mb-2">⚠️ Warning: {conflicts.length} Conflicts Detected</div>
                      <p className="text-sm mb-2">
                        Proceeding will create the schedule despite these conflicts:
                      </p>
                      <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                        {conflicts.map((conflict, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{conflict.message}</span>
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 h-12"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Edit
                  </Button>
                  <Button
                    onClick={handleSaveSchedule}
                    disabled={saving}
                    className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating Schedule...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Create Schedule
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}