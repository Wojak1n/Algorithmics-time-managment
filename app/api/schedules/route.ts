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
    return NextResponse.json(
      { error: 'Schedule creation not implemented yet' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Create schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
