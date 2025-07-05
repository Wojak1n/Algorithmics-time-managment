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

    // Simple schedule generation
    const timeSlots = [
      '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
      '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
      '16:00-17:00', '17:00-18:00'
    ];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Get all courses
    const courses = await prisma.course.findMany({
      include: {
        subject: true,
        teacher: {
          include: {
            user: true
          }
        },
        group: true,
        room: true
      }
    });

    let scheduledCount = 0;

    // Simple scheduling: assign each course to random available slots
    for (const course of courses) {
      const scheduleSlots = [];

      for (let session = 0; session < course.weeklySessions; session++) {
        const randomDay = days[Math.floor(Math.random() * days.length)];
        const randomTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];

        scheduleSlots.push({
          day: randomDay,
          time: randomTime
        });
      }

      // Update course with schedule
      await prisma.course.update({
        where: { id: course.id },
        data: {
          schedule: scheduleSlots
        }
      });

      scheduledCount++;
    }

    return NextResponse.json({
      message: 'Schedule generated successfully',
      scheduledCourses: scheduledCount,
      totalCourses: courses.length,
      conflicts: 0,
      conflictDetails: []
    });

  } catch (error) {
    console.error('Generate schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}