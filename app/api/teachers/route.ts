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

    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
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

    return NextResponse.json(teachers);

  } catch (error) {
    console.error('Get teachers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { teacherId, unavailableTimes, skillIds } = await request.json();

    // Check if user is admin or the teacher themselves
    const isAdmin = user.role === 'ADMIN';
    const isOwnProfile = user.teacher?.id === teacherId;

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update teacher
    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        unavailableTimes: unavailableTimes
      },
      include: {
        user: {
          select: {
            id: true,
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
        }
      }
    });

    // Update skills if provided
    if (skillIds && Array.isArray(skillIds)) {
      // Remove existing skills
      await prisma.teacherSkill.deleteMany({
        where: { teacherId }
      });

      // Add new skills
      await prisma.teacherSkill.createMany({
        data: skillIds.map((skillId: string) => ({
          teacherId,
          skillId
        }))
      });
    }

    return NextResponse.json(updatedTeacher);

  } catch (error) {
    console.error('Update teacher error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}