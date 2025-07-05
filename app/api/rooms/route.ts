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

    const rooms = await prisma.room.findMany({
      include: {
        courses: {
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
            group: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(rooms);

  } catch (error) {
    console.error('Get rooms error:', error);
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

    const { name, capacity, unavailableTimes } = await request.json();

    if (!name || !capacity) {
      return NextResponse.json(
        { error: 'Name and capacity are required' },
        { status: 400 }
      );
    }

    const room = await prisma.room.create({
      data: {
        name,
        capacity: parseInt(capacity),
        unavailableTimes: unavailableTimes || []
      },
      include: {
        courses: {
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
            group: true
          }
        }
      }
    });

    return NextResponse.json(room);

  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

