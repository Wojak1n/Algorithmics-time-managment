import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { type } = params;

    let courses;

    switch (type) {
      case 'teacher':
        if (!id) {
          return NextResponse.json(
            { error: 'Teacher ID is required' },
            { status: 400 }
          );
        }
        courses = await prisma.course.findMany({
          where: { teacherId: id },
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            },
            group: true,
            room: true
          }
        });
        break;

      case 'group':
        if (!id) {
          return NextResponse.json(
            { error: 'Group ID is required' },
            { status: 400 }
          );
        }
        courses = await prisma.course.findMany({
          where: { groupId: id },
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            },
            group: true,
            room: true
          }
        });
        break;

      case 'room':
        if (!id) {
          return NextResponse.json(
            { error: 'Room ID is required' },
            { status: 400 }
          );
        }
        courses = await prisma.course.findMany({
          where: { roomId: id },
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            },
            group: true,
            room: true
          }
        });
        break;

      case 'all':
        courses = await prisma.course.findMany({
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            },
            group: true,
            room: true
          }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid schedule type' },
          { status: 400 }
        );
    }

    // Generate schedule grid
    const timeSlots = [
      '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
      '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
      '16:00-17:00', '17:00-18:00'
    ];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const schedule: any[] = [];

    // Create all possible time slots
    days.forEach(day => {
      timeSlots.forEach(time => {
        schedule.push({
          day,
          time,
          course: null
        });
      });
    });

    // Fill in scheduled courses
    courses.forEach(course => {
      if (course.schedule && Array.isArray(course.schedule)) {
        course.schedule.forEach((slot: any) => {
          const scheduleSlot = schedule.find(s =>
            s.day === slot.day && s.time === slot.time
          );
          if (scheduleSlot) {
            scheduleSlot.course = course;
          }
        });
      }
    });

    return NextResponse.json(schedule);

  } catch (error) {
    console.error('Get schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}