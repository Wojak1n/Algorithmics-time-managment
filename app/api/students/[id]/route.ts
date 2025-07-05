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

    const { groupId } = await request.json();
    const studentId = params.id;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // If groupId is provided, check if group exists and has capacity
    if (groupId) {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          students: true
        }
      });

      if (!group) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      // Check if group has capacity (excluding current student if already in this group)
      const currentStudentsInGroup = group.students.filter(s => s.id !== studentId).length;
      if (currentStudentsInGroup >= group.size) {
        return NextResponse.json(
          { error: 'Group is at full capacity' },
          { status: 400 }
        );
      }
    }

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        groupId: groupId || null
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        group: {
          select: {
            id: true,
            name: true,
            size: true
          }
        }
      }
    });

    return NextResponse.json(updatedStudent);

  } catch (error) {
    console.error('Update student error:', error);
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

    const studentId = params.id;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        group: {
          include: {
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
        }
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(student);

  } catch (error) {
    console.error('Get student error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
