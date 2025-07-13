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

    // Validate time slots
    for (const slot of timeSlots) {
      if (!slot.day || !slot.time) {
        return NextResponse.json(
          { error: 'All time slots must have day and time specified' },
          { status: 400 }
        );
      }
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        subject: true,
        teacher: {
          include: {
            user: true
          }
        },
        group: true
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Delete existing schedule entries for this course
    await prisma.schedule.deleteMany({
      where: { courseId }
    });

    // Create new schedule entries
    const scheduleEntries = timeSlots.map((slot: { day: string; time: string }) => ({
      courseId,
      day: slot.day,
      time: slot.time,
      subjectId: course.subjectId,
      teacherId: course.teacherId,
      groupId: course.groupId,
      roomId: course.roomId
    }));

    await prisma.schedule.createMany({
      data: scheduleEntries
    });

    return NextResponse.json({
      message: 'Schedule created successfully',
      scheduleCount: scheduleEntries.length
    });

  } catch (error) {
    console.error('Create manual schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
