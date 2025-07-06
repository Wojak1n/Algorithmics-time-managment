import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || !['ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { skillIds, unavailableTimes } = await request.json();
    const teacherId = params.id;

    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: teacherId }
    });

    if (!existingTeacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // If not admin, ensure teacher can only edit their own profile
    if (user.role === 'TEACHER' && user.teacher?.id !== teacherId) {
      return NextResponse.json(
        { error: 'You can only edit your own profile' },
        { status: 403 }
      );
    }

    // Update teacher availability
    await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        unavailableTimes: unavailableTimes || []
      }
    });

    // Update teacher skills
    if (skillIds && Array.isArray(skillIds)) {
      // Remove existing skills
      await prisma.teacherSkill.deleteMany({
        where: { teacherId }
      });

      // Add new skills
      if (skillIds.length > 0) {
        await prisma.teacherSkill.createMany({
          data: skillIds.map((skillId: string) => ({
            teacherId,
            skillId
          }))
        });
      }
    }

    // Fetch updated teacher
    const updatedTeacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        skills: {
          include: {
            skill: {
              include: {
                subject: true
              }
            }
          }
        },
        courses: {
          include: {
            subject: true,
            group: true,
            room: true
          }
        }
      }
    });

    return NextResponse.json(updatedTeacher);

  } catch (error) {
    console.error('Update teacher error:', error);
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

    const teacherId = params.id;

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        skills: {
          include: {
            skill: {
              include: {
                subject: true
              }
            }
          }
        },
        courses: {
          include: {
            subject: true,
            group: true,
            room: true
          }
        }
      }
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(teacher);

  } catch (error) {
    console.error('Get teacher error:', error);
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

    const teacherId = params.id;

    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        courses: true
      }
    });

    if (!existingTeacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Check if teacher has active courses
    if (existingTeacher.courses.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete teacher with active courses. Please reassign or delete courses first.' },
        { status: 400 }
      );
    }

    // Delete teacher (this will also delete the associated user due to cascade)
    await prisma.teacher.delete({
      where: { id: teacherId }
    });

    return NextResponse.json({ message: 'Teacher deleted successfully' });

  } catch (error) {
    console.error('Delete teacher error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
