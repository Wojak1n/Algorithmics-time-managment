import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId, timeSlots } = await request.json();

    if (!courseId || !timeSlots || !Array.isArray(timeSlots)) {
      return NextResponse.json(
        { error: 'Course ID and time slots are required' },
        { status: 400 }
      );
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: {
          include: {
            user: true
          }
        },
        group: true,
        room: true
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const conflicts = [];

    // Check each time slot for conflicts
    for (const slot of timeSlots) {
      if (!slot.day || !slot.time) continue;

      // Check teacher conflicts
      const teacherConflicts = await prisma.schedule.findMany({
        where: {
          day: slot.day,
          time: slot.time,
          teacherId: course.teacherId,
          courseId: { not: courseId }
        },
        include: {
          course: {
            include: {
              subject: true
            }
          }
        }
      });

      for (const conflict of teacherConflicts) {
        conflicts.push({
          type: 'teacher',
          message: `Teacher ${course.teacher.user.name} is already scheduled for ${conflict.course.subject.name} on ${slot.day} at ${slot.time}`,
          conflictingCourse: conflict.course.name
        });
      }

      // Check room conflicts (if room is assigned)
      if (course.roomId) {
        const roomConflicts = await prisma.schedule.findMany({
          where: {
            day: slot.day,
            time: slot.time,
            roomId: course.roomId,
            courseId: { not: courseId }
          },
          include: {
            course: {
              include: {
                subject: true
              }
            }
          }
        });

        for (const conflict of roomConflicts) {
          conflicts.push({
            type: 'room',
            message: `Room ${course.room?.name} is already booked for ${conflict.course.subject.name} on ${slot.day} at ${slot.time}`,
            conflictingCourse: conflict.course.name
          });
        }
      }

      // Check group conflicts
      const groupConflicts = await prisma.schedule.findMany({
        where: {
          day: slot.day,
          time: slot.time,
          groupId: course.groupId,
          courseId: { not: courseId }
        },
        include: {
          course: {
            include: {
              subject: true
            }
          }
        }
      });

      for (const conflict of groupConflicts) {
        conflicts.push({
          type: 'group',
          message: `Group ${course.group.name} already has ${conflict.course.subject.name} scheduled on ${slot.day} at ${slot.time}`,
          conflictingCourse: conflict.course.name
        });
      }
    }

    return NextResponse.json({
      conflicts: conflicts,
      conflictCount: conflicts.length
    });

  } catch (error) {
    console.error('Check conflicts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
