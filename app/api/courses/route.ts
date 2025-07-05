import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const courses = await prisma.course.findMany({
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        group: true,
        room: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(courses);

  } catch (error) {
    console.error('Get courses error:', error);
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

    const { name, subjectId, teacherId, groupId, roomId, weeklySessions } = await request.json();

    if (!name || !subjectId || !teacherId || !groupId || !weeklySessions) {
      return NextResponse.json(
        { error: 'All fields except room are required' },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        name,
        subjectId,
        teacherId,
        groupId,
        roomId: roomId || null,
        weeklySessions: parseInt(weeklySessions)
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        group: true,
        room: true
      }
    });

    return NextResponse.json(course);

  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}