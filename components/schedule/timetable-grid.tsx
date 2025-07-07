'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { TimetableExporter } from '@/lib/export';

interface ScheduleItem {
  courseId: string;
  courseName: string;
  subjectName: string;
  teacherName: string;
  roomName: string;
  groupName: string;
  timeSlot: {
    day: number;
    hour: number;
    duration: number;
  };
}

interface TimetableGridProps {
  scheduleItems: ScheduleItem[];
  title: string;
  viewType: 'teacher' | 'group' | 'room' | 'all';
}

export function TimetableGrid({ scheduleItems, title, viewType }: TimetableGridProps) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  const scheduleGrid = useMemo(() => {
    const grid: Record<string, ScheduleItem | null> = {};
    
    scheduleItems.forEach(item => {
      if (item.timeSlot) {
        const key = `${item.timeSlot.day}-${item.timeSlot.hour}`;
        grid[key] = item;
      }
    });
    
    return grid;
  }, [scheduleItems]);

  const getScheduleItem = (day: number, hour: number): ScheduleItem | null => {
    return scheduleGrid[`${day}-${hour}`] || null;
  };

  const getItemContent = (item: ScheduleItem) => {
    switch (viewType) {
      case 'teacher':
        return (
          <div>
            <div className="font-medium text-sm">{item.subjectName}</div>
            <div className="text-xs text-muted-foreground">{item.groupName}</div>
            <div className="text-xs text-muted-foreground">{item.roomName}</div>
          </div>
        );
      case 'group':
        return (
          <div>
            <div className="font-medium text-sm">{item.subjectName}</div>
            <div className="text-xs text-muted-foreground">{item.teacherName}</div>
            <div className="text-xs text-muted-foreground">{item.roomName}</div>
          </div>
        );
      case 'room':
        return (
          <div>
            <div className="font-medium text-sm">{item.subjectName}</div>
            <div className="text-xs text-muted-foreground">{item.teacherName}</div>
            <div className="text-xs text-muted-foreground">{item.groupName}</div>
          </div>
        );
      default:
        return (
          <div>
            <div className="font-medium text-sm">{item.subjectName}</div>
            <div className="text-xs text-muted-foreground">{item.teacherName}</div>
            <div className="text-xs text-muted-foreground">{item.groupName} • {item.roomName}</div>
          </div>
        );
    }
  };

  const handleExportPDF = () => {
    TimetableExporter.exportToPDF(scheduleItems, title);
  };

  const handleExportExcel = () => {
    TimetableExporter.exportToExcel(scheduleItems, title);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Excel</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-1">
          {/* Header row */}
          <div className="p-2 font-medium text-center border rounded bg-muted">
            Time
          </div>
          {days.map((day, dayIndex) => (
            <div key={day} className="p-2 font-medium text-center border rounded bg-muted">
              {day}
            </div>
          ))}
          
          {/* Schedule rows */}
          {hours.map(hour => (
            <>
              <div key={`time-${hour}`} className="p-2 text-center border rounded bg-muted/50 text-sm font-medium">
                {hour}:00
              </div>
              {days.map((_, dayIndex) => {
                const item = getScheduleItem(dayIndex, hour);
                
                return (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className={`p-2 border rounded min-h-[80px] ${
                      item
                        ? 'bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors'
                        : 'bg-gray-50 hover:bg-gray-100 transition-colors'
                    }`}
                  >
                    {item && (
                      <div className="h-full flex flex-col justify-center">
                        {getItemContent(item)}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>

        {scheduleItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No schedule items found. Generate a schedule first.
          </div>
        )}
      </CardContent>
    </Card>
  );
}