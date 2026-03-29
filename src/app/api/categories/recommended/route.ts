import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getCategorySortGroup(name: string) {
  const trimmedName = name.trim();

  if (/^[가-힣]/.test(trimmedName)) {
    return 0;
  }

  if (/^[A-Za-z]/.test(trimmedName)) {
    return 1;
  }

  return 2;
}

function compareEnglishNames(a: string, b: string) {
  const lowercaseDiff = a
    .toLocaleLowerCase("en")
    .localeCompare(b.toLocaleLowerCase("en"), "en", {
      sensitivity: "base",
    });

  if (lowercaseDiff !== 0) {
    return lowercaseDiff;
  }

  return a.localeCompare(b, "en", {
    caseFirst: "lower",
    sensitivity: "case",
  });
}

function sortCategoriesByName(a: { name: string }, b: { name: string }) {
  const aGroup = getCategorySortGroup(a.name);
  const bGroup = getCategorySortGroup(b.name);
  const groupDiff = aGroup - bGroup;

  if (groupDiff !== 0) {
    return groupDiff;
  }

  if (aGroup === 0) {
    return a.name.localeCompare(b.name, "ko", {
      sensitivity: "base",
    });
  }

  if (aGroup === 1) {
    return compareEnglishNames(a.name, b.name);
  }

  return a.name.localeCompare(b.name, ["ko", "en"], {
    sensitivity: "base",
  });
}

export async function GET() {
  const rows = await prisma.category.findMany({
    where: {
      posts: {
        some: {
          isDeleted: false,
        },
      },
    },
    include: {
      _count: {
        select: {
          posts: {
            where: { isDeleted: false },
          },
        },
      },
    },
  });

  return NextResponse.json(
    rows
      .map((category) => ({
        id: Number(category.id),
        name: category.name,
        slug: category.slug,
        postCount: category._count.posts,
      }))
      .filter((category) => category.postCount > 0)
      .sort(sortCategoriesByName)
      .slice(0, 10),
  );
}
