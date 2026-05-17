import { prisma } from "./db";

export type AchievementDef = {
  key: string;
  name: string;
  description: string;
  icon: string;
  titleReward?: { name: string; color: string }; // если даёт титул
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: "first_character",
    name: "Творец",
    description: "Создал первого персонажа",
    icon: "✦",
  },
  {
    key: "five_characters",
    name: "Мастер персонажей",
    description: "Создал 5 персонажей",
    icon: "◆",
    titleReward: { name: "Мастер персонажей", color: "gold" },
  },
  {
    key: "first_chat",
    name: "Первый диалог",
    description: "Начал первый чат",
    icon: "◇",
  },
  {
    key: "hundred_messages",
    name: "Болтун",
    description: "Отправил 100 сообщений",
    icon: "▣",
    titleReward: { name: "Болтун", color: "purple" },
  },
  {
    key: "popular_character",
    name: "Популярный автор",
    description: "Персонаж набрал 10 лайков",
    icon: "★",
    titleReward: { name: "Популярный автор", color: "gold" },
  },
  {
    key: "first_like",
    name: "Первый лайк",
    description: "Получил первый лайк на персонажа",
    icon: "♡",
  },
  {
    key: "premium",
    name: "Поддержка проекта",
    description: "Оформил CharacterLab+",
    icon: "◈",
    titleReward: { name: "Спонсор", color: "green" },
  },
  {
    key: "scenario_creator",
    name: "Архитектор миров",
    description: "Создал сценарий/мир",
    icon: "◎",
    titleReward: { name: "Архитектор миров", color: "purple" },
  },
  {
    key: "veteran",
    name: "Ветеран",
    description: "Зарегистрирован более 30 дней",
    icon: "◐",
    titleReward: { name: "Ветеран", color: "gold" },
  },
];

export async function grantAchievement(userId: string, key: string) {
  const def = ACHIEVEMENTS.find((a) => a.key === key);
  if (!def) return null;

  // Проверяем, нет ли уже
  const existing = await prisma.achievement.findUnique({
    where: { userId_key: { userId, key } },
  });
  if (existing) return null;

  // Выдаём достижение
  const achievement = await prisma.achievement.create({
    data: { userId, key, name: def.name, icon: def.icon },
  });

  // Уведомление
  await prisma.notification.create({
    data: {
      userId,
      title: `Достижение: ${def.name}`,
      body: def.description,
      fromBot: true,
    },
  });

  // Если даёт титул — выдаём
  if (def.titleReward) {
    const existingTitle = await prisma.title.findFirst({
      where: { userId, name: def.titleReward.name },
    });
    if (!existingTitle) {
      await prisma.title.create({
        data: {
          userId,
          name: def.titleReward.name,
          color: def.titleReward.color,
        },
      });
    }
  }

  return achievement;
}

// Проверяет и выдаёт достижения на основе текущего состояния
export async function checkAchievements(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      characters: { select: { id: true, likesCount: true, kind: true } },
      chats: { select: { id: true } },
      achievements: { select: { key: true } },
    },
  });
  if (!user) return;

  const has = (k: string) => user.achievements.some((a) => a.key === k);

  // Первый персонаж
  if (user.characters.length >= 1 && !has("first_character")) {
    await grantAchievement(userId, "first_character");
  }

  // 5 персонажей
  if (user.characters.length >= 5 && !has("five_characters")) {
    await grantAchievement(userId, "five_characters");
  }

  // Первый чат
  if (user.chats.length >= 1 && !has("first_chat")) {
    await grantAchievement(userId, "first_chat");
  }

  // Популярный (10 лайков на одном персонаже)
  if (user.characters.some((c) => c.likesCount >= 10) && !has("popular_character")) {
    await grantAchievement(userId, "popular_character");
  }

  // Первый лайк
  if (user.characters.some((c) => c.likesCount >= 1) && !has("first_like")) {
    await grantAchievement(userId, "first_like");
  }

  // Premium
  if (user.isPremium && !has("premium")) {
    await grantAchievement(userId, "premium");
  }

  // Сценарий
  if (user.characters.some((c) => (c as any).kind === "scenario") && !has("scenario_creator")) {
    await grantAchievement(userId, "scenario_creator");
  }

  // Ветеран (30 дней)
  const daysSinceReg = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceReg >= 30 && !has("veteran")) {
    await grantAchievement(userId, "veteran");
  }

  // 100 сообщений
  const msgCount = await prisma.message.count({
    where: { chat: { userId }, role: "user" },
  });
  if (msgCount >= 100 && !has("hundred_messages")) {
    await grantAchievement(userId, "hundred_messages");
  }
}
