import {
  comparePostMetrics,
  DEFAULT_SORT,
  type SortType,
} from "@/lib/post-sort";
import { prisma } from "@/lib/prisma";
import { NOTICE_TAG_OPTIONS, type NoticeTag } from "./notice-categories";

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

export type NoticeListItem = {
  id: number;
  title: string;
  categoryName: NoticeTag;
  summary: string;
  publishedAt: string;
  isPinned: boolean;
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
  userId: number;
  isPinned: boolean;
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

  if (match && NOTICE_TAG_OPTIONS.includes(match[1] as NoticeTag)) {
    return match[2];
  }

  return title;
}

export function isPinnedNotice(categoryName: string, title: string) {
  const normalizedTitle = title.trim();
  return categoryName !== "공지" || normalizedTitle === "c.horok 오픈 안내";
}

export async function findNotices(sort: SortType = DEFAULT_SORT) {
  const notices = await prisma.post.findMany({
    where: {
      isDeleted: false,
      isHidden: false,
      category: {
        is: {
          name: {
            in: [...NOTICE_TAG_OPTIONS],
          },
        },
      },
    },
    include: {
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
    .map<NoticeListItem>((notice) => ({
      id: Number(notice.id),
      title: stripLegacyNoticePrefix(notice.title),
      categoryName: notice.category.name as NoticeTag,
      summary: getSummary(notice.content),
      publishedAt: notice.createdAt.toISOString().slice(0, 10),
      isPinned: isPinnedNotice(notice.category.name, notice.title),
      likesCount: notice._count.likes,
      commentsCount: notice._count.comments,
      viewCount: Number(notice.views?.viewCount ?? 0),
    }));
}

export async function findNoticeById(
  id: number,
  options?: {
    includeHiddenForUserId?: number | null;
  },
) {
  const notice = await prisma.post.findFirst({
    where: {
      id: BigInt(id),
      isDeleted: false,
      category: {
        is: {
          name: {
            in: [...NOTICE_TAG_OPTIONS],
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

  return {
    id: Number(notice.id),
    title: stripLegacyNoticePrefix(notice.title),
    content: notice.content,
    summary: getSummary(notice.content),
    publishedAt: notice.createdAt,
    updatedAt: notice.updatedAt,
    authorName: notice.user.name ?? "c.horok 운영팀",
    categoryName: notice.category.name,
    thumbnail: notice.thumbnail,
    viewCount: Number(notice.views?.viewCount ?? 0),
    likesCount: notice._count.likes,
    commentsCount: notice._count.comments,
    isHidden: notice.isHidden,
    userId: Number(notice.userId),
    isPinned: isPinnedNotice(notice.category.name, notice.title),
  } satisfies NoticeDetail;
}
