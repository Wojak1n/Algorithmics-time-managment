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

    const subjects = await prisma.subject.findMany({
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
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(subjects);

  } catch (error) {
    console.error('Get subjects error:', error);
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

    const { name, code, skills } = await request.json();

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if subject code already exists
    const existingSubject = await prisma.subject.findUnique({
      where: { code }
    });

    if (existingSubject) {
      return NextResponse.json(
        { error: 'Subject code already exists' },
        { status: 409 }
      );
    }

    // Create subject
    const subject = await prisma.subject.create({
      data: {
        name,
        code
      }
    });

    // Create skills if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      const validSkills = skills.filter(skill => skill && skill.trim() !== '');
      if (validSkills.length > 0) {
        await prisma.skill.createMany({
          data: validSkills.map((skillName: string) => ({
            name: skillName.trim(),
            subjectId: subject.id
          }))
        });
      }
    }

    // Fetch created subject with skills
    const createdSubject = await prisma.subject.findUnique({
      where: { id: subject.id },
      include: {
        skills: true,
        courses: true
      }
    });

    return NextResponse.json(createdSubject);

  } catch (error) {
    console.error('Create subject error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

