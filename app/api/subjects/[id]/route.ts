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

    const { name, code, skills } = await request.json();
    const subjectId = params.id;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!existingSubject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check if code is already taken by another subject
    const codeTaken = await prisma.subject.findFirst({
      where: {
        code,
        id: { not: subjectId }
      }
    });

    if (codeTaken) {
      return NextResponse.json(
        { error: 'Subject code is already taken by another subject' },
        { status: 409 }
      );
    }

    // Update subject
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name,
        code
      }
    });

    // Update skills
    if (skills && Array.isArray(skills)) {
      // Remove existing skills
      await prisma.skill.deleteMany({
        where: { subjectId }
      });

      // Add new skills
      const validSkills = skills.filter(skill => skill && skill.trim() !== '');
      if (validSkills.length > 0) {
        await prisma.skill.createMany({
          data: validSkills.map((skillName: string) => ({
            name: skillName.trim(),
            subjectId
          }))
        });
      }
    }

    // Fetch updated subject with skills
    const subjectWithSkills = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        skills: true,
        courses: true
      }
    });

    return NextResponse.json(subjectWithSkills);

  } catch (error) {
    console.error('Update subject error:', error);
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

    const subjectId = params.id;

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        courses: true
      }
    });

    if (!existingSubject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check if subject has courses
    if (existingSubject.courses.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete subject that has courses assigned to it' },
        { status: 400 }
      );
    }

    // Delete subject (cascade will handle skills)
    await prisma.subject.delete({
      where: { id: subjectId }
    });

    return NextResponse.json({ message: 'Subject deleted successfully' });

  } catch (error) {
    console.error('Delete subject error:', error);
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

    const subjectId = params.id;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        skills: true,
        courses: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            },
            group: true,
            room: true
          }
        }
      }
    });

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(subject);

  } catch (error) {
    console.error('Get subject error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
