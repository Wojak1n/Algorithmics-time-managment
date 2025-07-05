import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, size, subjectIds, unavailableTimes } = await request.json();
    const groupId = params.id;

    if (!name || !size) {
      return NextResponse.json(
        { error: 'Name and size are required' },
        { status: 400 }
      );
    }

    // Check if group exists
    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        students: true
      }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if new size is not smaller than current student count
    const newSize = parseInt(size);
    if (newSize < existingGroup.students.length) {
      return NextResponse.json(
        { error: `Cannot reduce size below current student count (${existingGroup.students.length})` },
        { status: 400 }
      );
    }

    // Update group
    await prisma.group.update({
      where: { id: groupId },
      data: {
        name,
        size: newSize,
        unavailableTimes: unavailableTimes || []
      }
    });

    // Update subjects
    if (subjectIds && Array.isArray(subjectIds)) {
      // Remove existing subjects
      await prisma.groupSubject.deleteMany({
        where: { groupId }
      });

      // Add new subjects
      if (subjectIds.length > 0) {
        await prisma.groupSubject.createMany({
          data: subjectIds.map((subjectId: string) => ({
            groupId,
            subjectId
          }))
        });
      }
    }

    // Fetch updated group
    const updatedGroup = await prisma.group.findUnique({
      where: { id: groupId },
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

    return NextResponse.json(updatedGroup);

  } catch (error) {
    console.error('Update group error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const groupId = params.id;

    // Check if group exists
    const existingGroup = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        students: true,
        courses: true
      }
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if group has students
    if (existingGroup.students.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete group that has students assigned to it' },
        { status: 400 }
      );
    }

    // Check if group has courses
    if (existingGroup.courses.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete group that has courses assigned to it' },
        { status: 400 }
      );
    }

    // Delete group (cascade will handle group subjects)
    await prisma.group.delete({
      where: { id: groupId }
    });

    return NextResponse.json({ message: 'Group deleted successfully' });

  } catch (error) {
    console.error('Delete group error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const groupId = params.id;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
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

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(group);

  } catch (error) {
    console.error('Get group error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
