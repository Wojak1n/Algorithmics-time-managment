import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, hashPassword } from '@/lib/auth';

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

    const { name, email, password, role } = await request.json();
    const userId = params.id;

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    const emailTaken = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId }
      }
    });

    if (emailTaken) {
      return NextResponse.json(
        { error: 'Email is already taken by another user' },
        { status: 409 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role
    };

    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.password = await hashPassword(password);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Handle role changes
    if (existingUser.role !== role) {
      // Remove old role-specific record
      if (existingUser.role === 'TEACHER') {
        await prisma.teacher.deleteMany({
          where: { userId }
        });
      } else if (existingUser.role === 'STUDENT') {
        await prisma.student.deleteMany({
          where: { userId }
        });
      }

      // Create new role-specific record
      if (role === 'TEACHER') {
        await prisma.teacher.create({
          data: { userId }
        });
      } else if (role === 'STUDENT') {
        await prisma.student.create({
          data: { userId }
        });
      }
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Update user error:', error);
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

    const userId = params.id;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting the current admin user
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Handle deletion of related records based on user role
    if (existingUser.role === 'TEACHER') {
      // Find the teacher record
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
        include: {
          courses: true,
          skills: true
        }
      });

      if (teacher) {
        // Check if teacher has assigned courses
        if (teacher.courses.length > 0) {
          return NextResponse.json(
            { error: `Cannot delete teacher. They are assigned to ${teacher.courses.length} course(s). Please reassign or delete the courses first.` },
            { status: 400 }
          );
        }

        // Delete teacher skills first
        await prisma.teacherSkill.deleteMany({
          where: { teacherId: teacher.id }
        });

        // Delete teacher record
        await prisma.teacher.delete({
          where: { id: teacher.id }
        });
      }
    } else if (existingUser.role === 'STUDENT') {
      // Delete student record if exists
      await prisma.student.deleteMany({
        where: { userId }
      });
    }

    // Now delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
