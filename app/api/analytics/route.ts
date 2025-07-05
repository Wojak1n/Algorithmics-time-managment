import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user || !['ADMIN', 'TEACHER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get basic counts
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalSubjects,
      totalCourses,
      totalGroups,
      totalRooms
    ] = await Promise.all([
      prisma.user.count(),
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.subject.count(),
      prisma.course.count(),
      prisma.group.count(),
      prisma.room.count()
    ]);

    // Get users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    // Get courses by subject
    const coursesBySubject = await prisma.course.groupBy({
      by: ['subjectId'],
      _count: {
        subjectId: true
      }
    });

    // Get subjects for course mapping
    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        name: true,
        code: true
      }
    });

    const coursesBySubjectWithNames = coursesBySubject.map(item => {
      const subject = subjects.find(s => s.id === item.subjectId);
      return {
        subject: subject ? `${subject.code}: ${subject.name}` : 'Unknown',
        count: item._count.subjectId
      };
    });

    // Get group utilization
    const groups = await prisma.group.findMany({
      include: {
        students: true
      }
    });

    const groupUtilization = groups.map(group => ({
      groupName: group.name,
      current: group.students.length,
      capacity: group.size,
      utilization: (group.students.length / group.size) * 100
    }));

    // Get room utilization
    const rooms = await prisma.room.findMany({
      include: {
        courses: true
      }
    });

    const roomUtilization = rooms.map(room => ({
      roomName: room.name,
      courses: room.courses.length,
      capacity: room.capacity
    }));

    // Get teacher workload
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            name: true
          }
        },
        courses: true,
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

    const teacherWorkload = teachers.map(teacher => {
      const uniqueSubjects = new Set(
        teacher.skills.map(ts => ts.skill.subjectId)
      );
      
      return {
        teacherName: teacher.user.name,
        courses: teacher.courses.length,
        subjects: uniqueSubjects.size
      };
    });

    const analytics = {
      totalUsers,
      totalTeachers,
      totalStudents,
      totalSubjects,
      totalCourses,
      totalGroups,
      totalRooms,
      usersByRole: usersByRole.map(item => ({
        role: item.role,
        count: item._count.role
      })),
      coursesBySubject: coursesBySubjectWithNames,
      groupUtilization,
      roomUtilization,
      teacherWorkload
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
