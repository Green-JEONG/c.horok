import { ensureCategoryByName } from "@/lib/categories";
import {
  ALL_NOTICE_TAG_OPTIONS,
  getNoticeCategoryQueryNames,
  isNoticeCategoryName,
  type NoticeTag,
  normalizeNoticeCategory,
} from "@/lib/notice-categories";
import {
  comparePostMetrics,
  DEFAULT_SORT,
  type SortType,
} from "@/lib/post-sort";
import { prisma } from "@/lib/prisma";
import { getTechNoticePath } from "@/lib/routes";

export const LEGACY_NOTICE_SEED = [
  {
    title: "c.horok 오픈 안내",
    summary:
      "기술 기록과 공유를 위한 c.horok가 문을 열었습니다. 주요 기능과 이용 방향을 안내드립니다.",
    publishedAt: "2026-04-05T00:00:00.000Z",
    isPinned: true,
    content: [
      "안녕하세요. c.horok를 찾아주셔서 감사합니다.",
      "c.horok는 개발 기록을 남기고, 배운 내용을 공유하고, 서로의 성장을 응원하는 공간으로 준비했습니다.",
      "현재는 피드, 좋아요, 마이페이지, 공지사항 기능을 중심으로 운영하고 있으며 앞으로 커뮤니티 경험을 더 풍성하게 다듬어갈 예정입니다.",
      "서비스 이용 중 불편한 점이나 제안하고 싶은 기능이 있다면 언제든지 의견을 남겨 주세요. 작은 피드백도 꼼꼼히 반영하겠습니다.",
      "앞으로의 업데이트와 운영 소식은 공지사항 탭을 통해 가장 먼저 전달드리겠습니다. 감사합니다.",
    ],
  },
  {
    title: "서비스 업데이트 예정 안내",
    summary:
      "게시글 탐색성과 커뮤니티 편의성을 높이기 위한 다음 업데이트 방향을 공유합니다.",
    publishedAt: "2026-04-05T00:00:00.000Z",
    isPinned: false,
    content: [
      "다음 업데이트에서는 공지사항 고도화, 피드 탐색 개선, 사용자 경험 안정화 작업을 우선적으로 진행할 예정입니다.",
      "특히 자주 찾는 정보에 더 빠르게 접근할 수 있도록 목록 구성과 상세 페이지 흐름을 정리하고 있습니다.",
      "업데이트 일정은 개발 진행 상황에 따라 일부 조정될 수 있으며, 확정되는 내용은 별도 공지로 안내드리겠습니다.",
    ],
  },
  {
    title: "커뮤니티 이용 가이드",
    summary:
      "모두가 편안하게 기록하고 소통할 수 있도록 기본 운영 원칙을 안내드립니다.",
    publishedAt: "2026-04-05T00:00:00.000Z",
    isPinned: false,
    content: [
      "서로를 존중하는 표현과 태도를 기본으로 해 주세요.",
      "광고성 도배, 타인을 불쾌하게 하는 표현, 서비스 운영을 방해하는 행위는 제한될 수 있습니다.",
      "기술 기록과 질문, 회고, 배운 점 공유 등 커뮤니티에 도움이 되는 내용을 환영합니다.",
    ],
  },
] as const;

export const LEGACY_BANNER_NOTICE_SEED = [
  {
    title:
      "호록 기술 블로그가 2026년 1월 6일부로 개설되었어요! 많은 관심 가져 주세요.  🎉",
    summary:
      "호록 기술 블로그 오픈 소식을 배너에서 보셨던 문구 그대로 공지사항에도 남겨둡니다.",
    publishedAt: "2026-01-06T00:00:00.000Z",
    categoryName: "공지" as NoticeTag,
    content: [
      "호록 기술 블로그가 2026년 1월 6일부로 개설되었어요! 많은 관심 가져 주세요.  🎉",
      "기존 배너에서 안내하던 오픈 문구를 공지사항 게시물로도 함께 보관합니다.",
      "앞으로 서비스 오픈, 주요 변경, 운영 안내는 공지사항과 배너에 함께 반영됩니다.",
    ],
  },
  {
    title: "2026년 붉은🔥 말🐴의 해가 밝았어요. 새해 복 많이 받으세요!",
    summary: "기존 새해 배너 문구를 공지사항 게시물로 옮겨 보관합니다.",
    publishedAt: "2026-01-01T00:00:00.000Z",
    categoryName: "공지" as NoticeTag,
    content: [
      "2026년 붉은🔥 말🐴의 해가 밝았어요. 새해 복 많이 받으세요!",
      "배너에 노출되던 새해 인사 문구도 공지사항 게시물로 함께 저장합니다.",
      "앞으로 배너에 보여주는 운영 메시지는 가능한 한 공지사항 데이터와 같은 원본을 사용합니다.",
    ],
  },
] as const;

export type NoticeListItem = {
  id: number;
  title: string;
  categoryName: NoticeTag;
  summary: string;
  publishedAt: string;
  authorName: string;
  isPinned: boolean;
  isLocked: boolean;
  isSecret: boolean;
  canViewSecret: boolean;
  isResolved: boolean;
  likesCount: number;
  commentsCount: number;
  viewCount: number;
};

export type NoticeDetail = {
  id: number;
  title: string;
  content: string;
  summary: string;
  publishedAt: Date;
  updatedAt: Date;
  authorName: string;
  categoryName: string;
  thumbnail: string | null;
  viewCount: number;
  likesCount: number;
  commentsCount: number;
  isHidden: boolean;
  isBanner: boolean;
  userId: number;
  isPinned: boolean;
  isSecret: boolean;
  canViewSecret: boolean;
  isResolved: boolean;
};

export type NoticeBannerItem = {
  id: number;
  title: string;
  href: string;
};

function extractPlainText(markdown: string) {
  return markdown
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\([^)]+\)/g, "$1")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/[>*_~[\]()|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSummary(markdown: string) {
  const plainText = extractPlainText(markdown);
  return plainText.length > 140 ? `${plainText.slice(0, 140)}...` : plainText;
}

function stripLegacyNoticePrefix(title: string) {
  const match = title.match(/^\[([^\]]+)\]\s*(.+)$/);

  if (match && isNoticeCategoryName(match[1])) {
    return match[2];
  }

  return title;
}

export function isPinnedNotice(categoryName: string, title: string) {
  const normalizedTitle = title.trim();
  return categoryName !== "공지" || normalizedTitle === "c.horok 오픈 안내";
}

export async function findNotices(
  sort: SortType = DEFAULT_SORT,
  category?: NoticeTag,
  options?: {
    viewerUserId?: number | null;
    isAdmin?: boolean;
  },
) {
  const notices = await prisma.post.findMany({
    omit: {
      isResolved: true,
    },
    where: {
      isDeleted: false,
      isHidden: false,
      category: {
        is: {
          name: {
            in: getNoticeCategoryQueryNames(category),
          },
        },
      },
    },
    include: {
      user: {
        select: { name: true },
      },
      category: {
        select: { name: true },
      },
      views: {
        select: { viewCount: true },
      },
      _count: {
        select: {
          likes: true,
          comments: {
            where: { isDeleted: false },
          },
        },
      },
    },
  });

  return notices
    .filter((notice) => {
      const normalizedCategory = normalizeNoticeCategory(notice.category.name);

      if (normalizedCategory !== "QnA") {
        return true;
      }

      if (options?.isAdmin) {
        return true;
      }

      return options?.viewerUserId
        ? Number(notice.userId) === options.viewerUserId
        : false;
    })
    .sort((a, b) =>
      comparePostMetrics(
        sort,
        {
          id: a.id,
          createdAt: a.createdAt,
          likeCount: a._count.likes,
          commentsCount: a._count.comments,
          viewCount: Number(a.views?.viewCount ?? 0),
        },
        {
          id: b.id,
          createdAt: b.createdAt,
          likeCount: b._count.likes,
          commentsCount: b._count.comments,
          viewCount: Number(b.views?.viewCount ?? 0),
        },
      ),
    )
    .map<NoticeListItem>((notice) => {
      const normalizedCategory =
        normalizeNoticeCategory(notice.category.name) ?? "공지";
      const canViewSecret =
        !notice.isSecret ||
        Boolean(options?.isAdmin) ||
        (typeof options?.viewerUserId === "number" &&
          Number(notice.userId) === options.viewerUserId);

      return {
        id: Number(notice.id),
        title: stripLegacyNoticePrefix(notice.title),
        categoryName: normalizedCategory,
        summary: canViewSecret ? getSummary(notice.content) : "비밀글입니다.",
        publishedAt: notice.createdAt.toISOString().slice(0, 10),
        authorName: notice.user.name ?? "c.horok 운영팀",
        isPinned: isPinnedNotice(normalizedCategory, notice.title),
        isLocked: normalizedCategory === "QnA" || notice.isSecret,
        isSecret: notice.isSecret,
        canViewSecret,
        isResolved: false,
        likesCount: notice._count.likes,
        commentsCount: notice._count.comments,
        viewCount: Number(notice.views?.viewCount ?? 0),
      };
    });
}

export async function findBannerNotices(limit = 5) {
  const notices = await prisma.post.findMany({
    omit: {
      isResolved: true,
    },
    where: {
      isDeleted: false,
      isHidden: false,
      isBanner: true,
      category: {
        is: {
          name: {
            in: [...ALL_NOTICE_TAG_OPTIONS],
          },
        },
      },
    },
    include: {
      category: {
        select: { name: true },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });

  return notices.slice(0, limit).map<NoticeBannerItem>((notice) => ({
    id: Number(notice.id),
    title: stripLegacyNoticePrefix(notice.title),
    href: getTechNoticePath(Number(notice.id)),
  }));
}

export async function seedLegacyBannerNotices(userId: number) {
  const category = await ensureCategoryByName("공지");
  const titles = LEGACY_BANNER_NOTICE_SEED.map((notice) => notice.title);
  const existingPosts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      title: {
        in: titles,
      },
      categoryId: BigInt(category.id),
    },
    select: {
      id: true,
      title: true,
      isBanner: true,
    },
  });

  const existingTitleSet = new Set(existingPosts.map((post) => post.title));
  const postsToUpdate = existingPosts.filter((post) => !post.isBanner);
  const noticesToCreate = LEGACY_BANNER_NOTICE_SEED.filter(
    (notice) => !existingTitleSet.has(notice.title),
  );

  if (postsToUpdate.length === 0 && noticesToCreate.length === 0) {
    return { createdCount: 0, updatedCount: 0 };
  }

  await prisma.$transaction([
    ...postsToUpdate.map((post) =>
      prisma.post.update({
        where: { id: post.id },
        data: { isBanner: true },
      }),
    ),
    ...noticesToCreate.map((notice) =>
      prisma.post.create({
        data: {
          userId: BigInt(userId),
          categoryId: BigInt(category.id),
          title: notice.title,
          content: notice.content.join("\n\n"),
          isBanner: true,
          createdAt: new Date(notice.publishedAt),
          updatedAt: new Date(notice.publishedAt),
        },
      }),
    ),
  ]);

  return {
    createdCount: noticesToCreate.length,
    updatedCount: postsToUpdate.length,
  };
}

export async function findNoticeById(
  id: number,
  options?: {
    includeHiddenForUserId?: number | null;
    isAdmin?: boolean;
  },
) {
  const notice = await prisma.post.findFirst({
    omit: {
      isResolved: true,
    },
    where: {
      id: BigInt(id),
      isDeleted: false,
      category: {
        is: {
          name: {
            in: [...ALL_NOTICE_TAG_OPTIONS],
          },
        },
      },
      OR: [
        { isHidden: false },
        ...(options?.includeHiddenForUserId
          ? [{ userId: BigInt(options.includeHiddenForUserId) }]
          : []),
      ],
    },
    include: {
      user: {
        select: { name: true },
      },
      category: {
        select: { name: true },
      },
      views: {
        select: { viewCount: true },
      },
      _count: {
        select: {
          likes: true,
          comments: {
            where: { isDeleted: false },
          },
        },
      },
    },
  });

  if (!notice) {
    return null;
  }

  const normalizedCategory = normalizeNoticeCategory(notice.category.name);
  const isPrivateQna = normalizedCategory === "QnA";
  const canAccessPrivateQna =
    options?.isAdmin ||
    (options?.includeHiddenForUserId
      ? Number(notice.userId) === options.includeHiddenForUserId
      : false);
  const canViewSecret =
    !notice.isSecret ||
    options?.isAdmin ||
    (options?.includeHiddenForUserId
      ? Number(notice.userId) === options.includeHiddenForUserId
      : false);

  if (isPrivateQna && !canAccessPrivateQna) {
    return null;
  }

  return {
    id: Number(notice.id),
    title: stripLegacyNoticePrefix(notice.title),
    content: canViewSecret ? notice.content : "비밀글입니다.",
    summary: canViewSecret ? getSummary(notice.content) : "비밀글입니다.",
    publishedAt: notice.createdAt,
    updatedAt: notice.updatedAt,
    authorName: notice.user.name ?? "c.horok 운영팀",
    categoryName: normalizedCategory ?? "공지",
    thumbnail: canViewSecret ? notice.thumbnail : null,
    viewCount: Number(notice.views?.viewCount ?? 0),
    likesCount: notice._count.likes,
    commentsCount: notice._count.comments,
    isHidden: notice.isHidden,
    isBanner: notice.isBanner,
    userId: Number(notice.userId),
    isPinned: isPinnedNotice(
      normalizedCategory ?? notice.category.name,
      notice.title,
    ),
    isSecret: notice.isSecret,
    canViewSecret,
    isResolved: false,
  } satisfies NoticeDetail;
}
