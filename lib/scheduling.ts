export interface TimeSlot {
  day: number; // 0-6 (Monday-Sunday)
  hour: number; // 0-23
  duration: number; // in hours
}

export interface ScheduleItem {
  courseId: string;
  courseName: string;
  subjectName: string;
  teacherName: string;
  roomName: string;
  groupName: string;
  timeSlot: TimeSlot;
}

export interface SchedulingConstraints {
  teacherAvailability: Record<string, TimeSlot[]>; // teacherId -> available slots
  roomAvailability: Record<string, TimeSlot[]>; // roomId -> available slots
  groupAvailability: Record<string, TimeSlot[]>; // groupId -> available slots
}

export class TimetableScheduler {
  private constraints: SchedulingConstraints;
  private schedule: ScheduleItem[] = [];
  private workingHours = { start: 8, end: 18 }; // 8 AM to 6 PM
  private workingDays = [0, 1, 2, 3, 4, 5, 6]; // Monday to Sunday

  constructor(constraints: SchedulingConstraints) {
    this.constraints = constraints;
  }

  public generateSchedule(courses: any[]): ScheduleItem[] {
    this.schedule = [];
    
    // Sort courses by constraints (most constrained first)
    const sortedCourses = this.sortCoursesByConstraints(courses);
    
    // Try to schedule each course
    for (const course of sortedCourses) {
      this.scheduleCourse(course);
    }
    
    return this.schedule;
  }

  private sortCoursesByConstraints(courses: any[]): any[] {
    return courses.sort((a, b) => {
      // Prioritize courses with fewer available slots
      const aAvailability = this.getAvailableSlots(a).length;
      const bAvailability = this.getAvailableSlots(b).length;
      return aAvailability - bAvailability;
    });
  }

  private scheduleCourse(course: any): boolean {
    const availableSlots = this.getAvailableSlots(course);
    
    for (let session = 0; session < course.weeklySessions; session++) {
      const slot = this.findBestSlot(course, availableSlots);
      
      if (!slot) {
        console.warn(`Could not schedule session ${session + 1} for course ${course.name}`);
        continue;
      }

      // Add to schedule
      this.schedule.push({
        courseId: course.id,
        courseName: course.name,
        subjectName: course.subject.name,
        teacherName: course.teacher.user.name,
        roomName: course.room?.name || 'TBD',
        groupName: course.group.name,
        timeSlot: slot
      });

      // Remove slot from available slots for next iteration
      this.removeSlotFromAvailable(slot, availableSlots);
    }

    return true;
  }

  private getAvailableSlots(course: any): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    for (const day of this.workingDays) {
      for (let hour = this.workingHours.start; hour < this.workingHours.end; hour++) {
        const slot: TimeSlot = { day, hour, duration: 1 };
        
        if (this.isSlotAvailable(slot, course)) {
          slots.push(slot);
        }
      }
    }
    
    return slots;
  }

  private isSlotAvailable(slot: TimeSlot, course: any): boolean {
    // Check if teacher is available
    const teacherAvailable = this.isTimeSlotFree(
      slot,
      this.constraints.teacherAvailability[course.teacherId] || []
    );

    // Check if room is available
    const roomAvailable = !course.roomId || this.isTimeSlotFree(
      slot,
      this.constraints.roomAvailability[course.roomId] || []
    );

    // Check if group is available
    const groupAvailable = this.isTimeSlotFree(
      slot,
      this.constraints.groupAvailability[course.groupId] || []
    );

    // Check if slot conflicts with existing schedule
    const noConflicts = !this.hasScheduleConflict(slot, course);

    return teacherAvailable && roomAvailable && groupAvailable && noConflicts;
  }

  private isTimeSlotFree(slot: TimeSlot, unavailableSlots: TimeSlot[]): boolean {
    return !unavailableSlots.some(unavailable => 
      unavailable.day === slot.day &&
      unavailable.hour <= slot.hour &&
      (unavailable.hour + unavailable.duration) > slot.hour
    );
  }

  private hasScheduleConflict(slot: TimeSlot, course: any): boolean {
    return this.schedule.some(scheduled => {
      const conflict = scheduled.timeSlot.day === slot.day &&
        scheduled.timeSlot.hour === slot.hour;

      if (!conflict) return false;

      // Check if same teacher, room, or group
      return (
        scheduled.courseId !== course.id && (
          this.getTeacherId(scheduled) === course.teacherId ||
          this.getRoomId(scheduled) === course.roomId ||
          this.getGroupId(scheduled) === course.groupId
        )
      );
    });
  }

  private findBestSlot(course: any, availableSlots: TimeSlot[]): TimeSlot | null {
    if (availableSlots.length === 0) return null;

    // Simple heuristic: prefer earlier times and spread sessions across days
    const usedDays = this.schedule
      .filter(s => this.getCourseId(s) === course.id)
      .map(s => s.timeSlot.day);

    const unusedDaySlots = availableSlots.filter(slot => !usedDays.includes(slot.day));
    
    if (unusedDaySlots.length > 0) {
      return unusedDaySlots.sort((a, b) => a.hour - b.hour)[0];
    }

    return availableSlots.sort((a, b) => a.hour - b.hour)[0];
  }

  private removeSlotFromAvailable(slot: TimeSlot, availableSlots: TimeSlot[]): void {
    const index = availableSlots.findIndex(s => 
      s.day === slot.day && s.hour === slot.hour
    );
    if (index > -1) {
      availableSlots.splice(index, 1);
    }
  }

  private getTeacherId(scheduleItem: ScheduleItem): string {
    // This would need to be implemented based on how you store teacher info
    return ''; // Placeholder
  }

  private getRoomId(scheduleItem: ScheduleItem): string {
    // This would need to be implemented based on how you store room info
    return ''; // Placeholder
  }

  private getGroupId(scheduleItem: ScheduleItem): string {
    // This would need to be implemented based on how you store group info
    return ''; // Placeholder
  }

  private getCourseId(scheduleItem: ScheduleItem): string {
    return scheduleItem.courseId;
  }

  public detectConflicts(): Array<{
    type: 'teacher' | 'room' | 'group';
    message: string;
    conflictingItems: ScheduleItem[];
  }> {
    const conflicts: Array<{
      type: 'teacher' | 'room' | 'group';
      message: string;
      conflictingItems: ScheduleItem[];
    }> = [];

    // Group schedule items by time slot
    const timeSlotGroups: Record<string, ScheduleItem[]> = {};
    
    this.schedule.forEach(item => {
      const key = `${item.timeSlot.day}-${item.timeSlot.hour}`;
      if (!timeSlotGroups[key]) {
        timeSlotGroups[key] = [];
      }
      timeSlotGroups[key].push(item);
    });

    // Check for conflicts in each time slot
    Object.entries(timeSlotGroups).forEach(([timeKey, items]) => {
      if (items.length <= 1) return;

      // Check teacher conflicts
      const teacherGroups: Record<string, ScheduleItem[]> = {};
      items.forEach(item => {
        if (!teacherGroups[item.teacherName]) {
          teacherGroups[item.teacherName] = [];
        }
        teacherGroups[item.teacherName].push(item);
      });

      Object.entries(teacherGroups).forEach(([teacher, teacherItems]) => {
        if (teacherItems.length > 1) {
          conflicts.push({
            type: 'teacher',
            message: `Teacher ${teacher} has overlapping classes`,
            conflictingItems: teacherItems
          });
        }
      });

      // Check room conflicts
      const roomGroups: Record<string, ScheduleItem[]> = {};
      items.forEach(item => {
        if (!roomGroups[item.roomName]) {
          roomGroups[item.roomName] = [];
        }
        roomGroups[item.roomName].push(item);
      });

      Object.entries(roomGroups).forEach(([room, roomItems]) => {
        if (roomItems.length > 1 && room !== 'TBD') {
          conflicts.push({
            type: 'room',
            message: `Room ${room} has overlapping bookings`,
            conflictingItems: roomItems
          });
        }
      });

      // Check group conflicts
      const groupGroups: Record<string, ScheduleItem[]> = {};
      items.forEach(item => {
        if (!groupGroups[item.groupName]) {
          groupGroups[item.groupName] = [];
        }
        groupGroups[item.groupName].push(item);
      });

      Object.entries(groupGroups).forEach(([group, groupItems]) => {
        if (groupItems.length > 1) {
          conflicts.push({
            type: 'group',
            message: `Group ${group} has overlapping classes`,
            conflictingItems: groupItems
          });
        }
      });
    });

    return conflicts;
  }
}