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
    console.log(`Attempting to delete user: ${existingUser.email}, Role: ${existingUser.role}`);

    try {
      // Use a transaction to ensure all deletions succeed or fail together
      await prisma.$transaction(async (tx) => {
        if (existingUser.role === 'TEACHER') {
          // Find the teacher record
          const teacher = await tx.teacher.findUnique({
            where: { userId },
            include: {
              courses: true,
              skills: true
            }
          });

          console.log(`Teacher record found:`, teacher ? 'Yes' : 'No');
          if (teacher) {
            console.log(`Teacher has ${teacher.courses.length} courses and ${teacher.skills.length} skills`);

            // CASCADE DELETE: Delete all courses assigned to this teacher
            if (teacher.courses.length > 0) {
              console.log(`Cascade deleting ${teacher.courses.length} courses:`, teacher.courses.map(c => c.name));

              // Delete all courses assigned to this teacher
              await tx.course.deleteMany({
                where: { teacherId: teacher.id }
              });

              console.log(`Successfully deleted ${teacher.courses.length} courses`);
            }

            // Delete teacher skills first
            console.log(`Deleting ${teacher.skills.length} teacher skills...`);
            await tx.teacherSkill.deleteMany({
              where: { teacherId: teacher.id }
            });

            // Delete teacher record
            console.log(`Deleting teacher record...`);
            await tx.teacher.delete({
              where: { id: teacher.id }
            });
          } else {
            console.log(`No teacher record found for user with TEACHER role - checking for orphaned data`);

            // Check for any courses that might reference this user indirectly
            const orphanedCourses = await tx.course.findMany({
              where: {
                teacher: {
                  userId: userId
                }
              }
            });

            if (orphanedCourses.length > 0) {
              console.log(`Found ${orphanedCourses.length} orphaned courses, deleting...`);
              await tx.course.deleteMany({
                where: {
                  teacher: {
                    userId: userId
                  }
                }
              });
            }

            // Check for any orphaned teacher skills that might reference this user indirectly
            const orphanedSkills = await tx.teacherSkill.findMany({
              where: {
                teacher: {
                  userId: userId
                }
              }
            });

            if (orphanedSkills.length > 0) {
              console.log(`Found ${orphanedSkills.length} orphaned teacher skills, deleting...`);
              await tx.teacherSkill.deleteMany({
                where: {
                  teacher: {
                    userId: userId
                  }
                }
              });
            }
          }
        } else if (existingUser.role === 'STUDENT') {
          // Delete student record if exists
          console.log(`Deleting student records...`);
          await tx.student.deleteMany({
            where: { userId }
          });
        }

        // Finally, delete the user
        console.log(`Deleting user record...`);
        await tx.user.delete({
          where: { id: userId }
        });

        console.log(`User and all related data deleted successfully`);
      });
    } catch (transactionError) {
      console.error(`Transaction failed:`, transactionError);



      // For other errors, throw to be caught by outer catch
      throw transactionError;
    }

    return NextResponse.json({ message: 'User and all related data deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
