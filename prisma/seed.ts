import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await hashPassword('password');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create teacher user
  const teacherPassword = await hashPassword('password');
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: {},
    create: {
      email: 'teacher@test.com',
      name: 'Teacher User',
      password: teacherPassword,
      role: 'TEACHER',
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      unavailableTimes: [],
    },
  });

  // Create student user
  const studentPassword = await hashPassword('password');
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@test.com' },
    update: {},
    create: {
      email: 'student@test.com',
      name: 'Student User',
      password: studentPassword,
      role: 'STUDENT',
    },
  });

  // Create subjects
  const mathSubject = await prisma.subject.upsert({
    where: { code: 'MATH101' },
    update: {},
    create: {
      name: 'Mathematics',
      code: 'MATH101',
    },
  });

  const physicsSubject = await prisma.subject.upsert({
    where: { code: 'PHYS101' },
    update: {},
    create: {
      name: 'Physics',
      code: 'PHYS101',
    },
  });

  // Create skills
  const mathSkill = await prisma.skill.upsert({
    where: { id: 'math-skill-1' },
    update: {},
    create: {
      id: 'math-skill-1',
      name: 'Basic Mathematics',
      subjectId: mathSubject.id,
    },
  });

  // Add skill to teacher
  await prisma.teacherSkill.upsert({
    where: {
      teacherId_skillId: {
        teacherId: teacher.id,
        skillId: mathSkill.id,
      },
    },
    update: {},
    create: {
      teacherId: teacher.id,
      skillId: mathSkill.id,
    },
  });

  // Create rooms
  const room1 = await prisma.room.upsert({
    where: { id: 'room-1' },
    update: {},
    create: {
      id: 'room-1',
      name: 'Room A101',
      capacity: 30,
      unavailableTimes: [],
    },
  });

  const room2 = await prisma.room.upsert({
    where: { id: 'room-2' },
    update: {},
    create: {
      id: 'room-2',
      name: 'Room B202',
      capacity: 25,
      unavailableTimes: [],
    },
  });

  // Create group
  const group = await prisma.group.upsert({
    where: { id: 'group-1' },
    update: {},
    create: {
      id: 'group-1',
      name: 'Group A',
      size: 25,
      unavailableTimes: [],
    },
  });

  // Add student to group
  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      groupId: group.id,
    },
  });

  // Add subjects to group
  await prisma.groupSubject.upsert({
    where: {
      groupId_subjectId: {
        groupId: group.id,
        subjectId: mathSubject.id,
      },
    },
    update: {},
    create: {
      groupId: group.id,
      subjectId: mathSubject.id,
    },
  });

  await prisma.groupSubject.upsert({
    where: {
      groupId_subjectId: {
        groupId: group.id,
        subjectId: physicsSubject.id,
      },
    },
    update: {},
    create: {
      groupId: group.id,
      subjectId: physicsSubject.id,
    },
  });

  // Create courses
  await prisma.course.upsert({
    where: { id: 'course-1' },
    update: {},
    create: {
      id: 'course-1',
      name: 'Mathematics for Group A',
      subjectId: mathSubject.id,
      teacherId: teacher.id,
      groupId: group.id,
      roomId: room1.id,
      weeklySessions: 3,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });