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

    const groups = await prisma.group.findMany({
      include: {
        students: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        subjects: {
          include: {
            subject: true
          }
        },
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
            room: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(groups);

  } catch (error) {
    console.error('Get groups error:', error);
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

    const { name, size, subjectIds, unavailableTimes } = await request.json();

    if (!name || !size) {
      return NextResponse.json(
        { error: 'Name and size are required' },
        { status: 400 }
      );
    }

    // Create group
    const group = await prisma.group.create({
      data: {
        name,
        size: parseInt(size),
        unavailableTimes: unavailableTimes || []
      }
    });

    // Add subjects to group
    if (subjectIds && Array.isArray(subjectIds) && subjectIds.length > 0) {
      await prisma.groupSubject.createMany({
        data: subjectIds.map((subjectId: string) => ({
          groupId: group.id,
          subjectId
        }))
      });
    }

    const groupWithSubjects = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        students: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        subjects: {
          include: {
            subject: true
          }
        },
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
            room: true
          }
        }
      }
    });

    return NextResponse.json(groupWithSubjects);

  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}