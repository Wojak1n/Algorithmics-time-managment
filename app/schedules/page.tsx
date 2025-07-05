'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, Calendar, RefreshCw, Download, Users, User, BookOpen } from 'lucide-react';

interface ScheduleSlot {
  day: string;
  time: string;
  course?: {
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
  };
}

export default function SchedulesPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<'teacher' | 'student' | 'group' | 'room'>('teacher');
  const [selectedId, setSelectedId] = useState<string>('');
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const timeSlots = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
    '16:00-17:00', '17:00-18:00'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setToken(storedToken);
    } else {
      router.push('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (user && token) {
      fetchData();
    }
  }, [user, token]);

  useEffect(() => {
    if (selectedId && scheduleType) {
      fetchSchedule();
    }
  }, [selectedId, scheduleType]);

  const fetchData = async () => {
    try {
      const [teachersRes, groupsRes, roomsRes] = await Promise.all([
        fetch('/api/teachers', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/groups', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/rooms', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData);
        
        // Auto-select current user if they're a teacher
        if (user.role === 'TEACHER' && user.teacher) {
          setScheduleType('teacher');
          setSelectedId(user.teacher.id);
        }
      }
      
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
        
        // Auto-select current user's group if they're a student
        if (user.role === 'STUDENT') {
          setScheduleType('group');
          if (user.student?.group) {
            setSelectedId(user.student.group.id);
          } else {
            // Student is not assigned to a group
            toast({
              title: 'No Group Assigned',
              description: 'You are not currently assigned to any group. Please contact your administrator.',
              variant: 'destructive',
            });
          }
        }
      }
      
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchSchedule = async () => {
    if (!selectedId || !scheduleType) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/schedule/${scheduleType}?id=${selectedId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch schedule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error while fetching schedule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSchedule = async () => {
    if (user.role !== 'ADMIN') {
      toast({
        title: 'Error',
        description: 'Only administrators can generate schedules',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/schedule/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Schedule generated successfully',
        });
        if (selectedId) {
          fetchSchedule();
        }
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
    } finally {
      setGenerating(false);
    }
  };

  const exportSchedule = () => {
    if (!schedule.length) {
      toast({
        title: 'Error',
        description: 'No schedule to export',
        variant: 'destructive',
      });
      return;
    }

    // Create CSV content
    const csvContent = [
      ['Day', 'Time', 'Subject', 'Teacher', 'Group', 'Room'],
      ...schedule
        .filter(slot => slot.course)
        .map(slot => [
          slot.day,
          slot.time,
          `${slot.course!.subject.code}: ${slot.course!.subject.name}`,
          slot.course!.teacher.user.name,
          slot.course!.group.name,
          slot.course!.room?.name || 'No Room'
        ])
    ].map(row => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-${scheduleType}-${selectedId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getScheduleSlot = (day: string, time: string) => {
    return schedule.find(slot => slot.day === day && slot.time === time);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  const getOptionsForType = () => {
    switch (scheduleType) {
      case 'teacher':
        return teachers.map(t => ({ id: t.id, name: t.user.name }));
      case 'group':
        return groups.map(g => ({ id: g.id, name: g.name }));
      case 'room':
        return rooms.map(r => ({ id: r.id, name: r.name }));
      default:
        return [];
    }
  };

  if (!user) {
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
                <Clock className="mr-3 h-8 w-8 text-gray-900 dark:text-gray-100" />
                {user.role === 'STUDENT' ? 'My Timetable' : 'Schedules & Timetables'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {user.role === 'STUDENT' ? 'View your class schedule' : 'View and manage class schedules'}
              </p>
            </div>
            
            <div className="flex space-x-2">
              {user.role === 'ADMIN' && (
                <Button onClick={generateSchedule} disabled={generating}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'Generating...' : 'Generate Schedule'}
                </Button>
              )}
              {schedule.length > 0 && (
                <Button variant="outline" onClick={exportSchedule}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>

          {user.role !== 'STUDENT' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Schedule Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={scheduleType} onValueChange={(value: any) => {
                    setScheduleType(value);
                    setSelectedId('');
                    setSchedule([]);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          Teacher Schedule
                        </div>
                      </SelectItem>
                      <SelectItem value="group">
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4" />
                          Group Schedule
                        </div>
                      </SelectItem>
                      <SelectItem value="room">
                        <div className="flex items-center">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Room Schedule
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Select {scheduleType}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Choose ${scheduleType}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {getOptionsForType().map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          )}

          {user.role === 'STUDENT' && (
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    My Class Timetable
                    {user.student?.group && (
                      <Badge variant="outline" className="ml-2">
                        {user.student.group.name}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.student?.group ? (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Viewing schedule for your group: <strong>{user.student.group.name}</strong>
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      You are not currently assigned to any group. Please contact your administrator.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading schedule...</div>
              ) : (user.role === 'STUDENT' && user.student?.group) || selectedId ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800 font-medium text-gray-900 dark:text-gray-100">Time</th>
                        {days.map((day) => (
                          <th key={day} className="border border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800 font-medium min-w-[200px] text-gray-900 dark:text-gray-100">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((time) => (
                        <tr key={time}>
                          <td className="border border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800 font-medium text-sm text-gray-900 dark:text-gray-100">
                            {time}
                          </td>
                          {days.map((day) => {
                            const slot = getScheduleSlot(day, time);
                            return (
                              <td key={`${day}-${time}`} className="border border-gray-200 dark:border-gray-700 p-2 h-20 align-top bg-white dark:bg-gray-900">
                                {slot?.course ? (
                                  <div className="bg-blue-100 dark:bg-blue-900 rounded p-2 h-full">
                                    <div className="font-medium text-sm text-blue-900 dark:text-blue-100">
                                      {slot.course.subject.code}
                                    </div>
                                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                      {scheduleType !== 'teacher' && (
                                        <div>{slot.course.teacher.user.name}</div>
                                      )}
                                      {scheduleType !== 'group' && (
                                        <div>{slot.course.group.name}</div>
                                      )}
                                      {scheduleType !== 'room' && slot.course.room && (
                                        <div>{slot.course.room.name}</div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                                    Free
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : user.role === 'STUDENT' ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  You need to be assigned to a group to view your timetable. Please contact your administrator.
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Select a {scheduleType} to view their schedule
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
