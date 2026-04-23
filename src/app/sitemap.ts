import type { MetadataRoute } from "next";
// import { getSiteUrl } from "@/lib/site-url"; // 이 함수가 non-www를 주면 문제가 반복됨.

export default function sitemap(): MetadataRoute.Sitemap {
  // 구글이 '선택한 표준 URL'인 www 버전 입력
  const baseUrl = "https://www.horok.co.kr";

  return [
    {
      url: baseUrl, // https://www.horok.co.kr (끝에 / 없음)
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/horok-tech`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/horok-tech/feeds`, // https://www.horok.co.kr/horok-tech/feeds (끝에 / 없음)
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/horok-tech/notices`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/horok-tv`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/horok-cote`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/horok-shop`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
