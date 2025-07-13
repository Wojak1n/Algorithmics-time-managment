import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const schedules = await prisma.schedule.findMany({
      include: {
        course: {
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
        }
      },
      orderBy: [
        { day: 'asc' },
        { time: 'asc' }
      ]
    });

    return NextResponse.json(schedules);

  } catch (error) {
    console.error('Get schedules error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
        teacher: true,
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

    // Validate time slots
    for (const slot of timeSlots) {
      if (!slot.day || !slot.time) {
        return NextResponse.json(
          { error: 'All time slots must have day and time' },
          { status: 400 }
        );
      }
    }

    // Create schedule entries
    const schedulePromises = timeSlots.map((slot: any) =>
      prisma.schedule.create({
        data: {
          courseId: courseId,
          teacherId: course.teacherId,
          groupId: course.groupId,
          roomId: course.roomId,
          day: slot.day,
          time: slot.time,
          duration: slot.duration || 60
        }
      })
    );

    const createdSchedules = await Promise.all(schedulePromises);

    return NextResponse.json({
      message: 'Schedule created successfully',
      schedules: createdSchedules
    });

  } catch (error) {
    console.error('Create schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
