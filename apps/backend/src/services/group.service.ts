// ═══════════════════════════════════════════════════
// ArtVerse — Group Service
// ═══════════════════════════════════════════════════

import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";

/** Create a community group */
export async function createGroup(creatorId: string, data: { name: string; description?: string; type?: string }) {
  const group = await prisma.group.create({
    data: {
      name: data.name,
      description: data.description,
      type: (data.type as "PUBLIC" | "PRIVATE") || "PUBLIC",
      creatorId,
      members: { create: { userId: creatorId, role: "ADMIN" } },
    },
    include: { _count: { select: { members: true } }, creator: { select: { id: true, name: true, avatar: true } } },
  });
  return group;
}

/** List groups with search + pagination */
export async function getGroups(page = 1, limit = 20, search?: string, userId?: string) {
  const skip = (page - 1) * limit;
  const where = {
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    ...(userId && { members: { some: { userId } } }),
  };

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where, skip, take: limit,
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true, messages: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.group.count({ where }),
  ]);

  return {
    data: groups.map(({ _count, ...g }) => ({ ...g, memberCount: _count.members, messageCount: _count.messages })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
  };
}

/** Get group detail */
export async function getGroupById(groupId: string, userId?: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      members: { include: { user: { select: { id: true, name: true, avatar: true, role: true } } }, orderBy: { joinedAt: "asc" } },
      _count: { select: { members: true, messages: true } },
    },
  });
  if (!group) throw new AppError("Group not found", 404);

  const isMember = userId ? group.members.some((m) => m.userId === userId) : false;
  const { _count, ...rest } = group;
  return { ...rest, memberCount: _count.members, messageCount: _count.messages, isMember };
}

/** Join a group */
export async function joinGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new AppError("Group not found", 404);

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (existing) throw new AppError("Already a member", 409);

  if (group.type === "PRIVATE") throw new AppError("This group is private. You need an invitation.", 403);

  await prisma.groupMember.create({ data: { groupId, userId, role: "MEMBER" } });
  return { joined: true };
}

/** Leave a group */
export async function leaveGroup(groupId: string, userId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) throw new AppError("You are not a member", 400);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (group?.creatorId === userId) throw new AppError("Group creator cannot leave. Transfer ownership or delete the group.", 400);

  await prisma.groupMember.delete({ where: { id: member.id } });
  return { left: true };
}
