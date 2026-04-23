"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const services = [
  {
    href: "/horok-tech",
    bubbleName: "horok tech",
    folderColor: "bg-[#ffca72]",
    tabColor: "bg-[#f89b0f]",
    title: "horok\ntech",
    label: "호록 ",
    accent: "테크",
    accentClassName: "text-[#ff9800]",
    bubbleText: [
      "오늘 내가 배운 점들을 기록으로 남기고, 다른 사람들과 공유하며 내일의 실력을 키워가는 공간입니다.",
    ],
  },
  {
    href: "/horok-cote",
    bubbleName: "horok cote",
    folderColor: "bg-[#70d195]",
    tabColor: "bg-[#52bc75]",
    title: "horok\ncote",
    label: "호록 ",
    accent: "코딩",
    accentClassName: "text-[#44bb68]",
    bubbleText: [
      "당신의 논리적 사고력을 한 단계 업그레이드하세요. 다양한 알고리즘 문제를 풀며 실전 감각을 키우고, 별도의 환경 세팅 없이 브라우저에서 즉시 코드를 작성하고 채점해 보세요.",
    ],
  },
  {
    href: "/horok-tv",
    bubbleName: "horok tv",
    folderColor: "bg-[#ff7b7b]",
    tabColor: "bg-[#eb5551]",
    title: "horok\ntv",
    label: "호록 ",
    accent: "TV",
    accentClassName: "text-[#eb5551]",
    bubbleText: [
      "코딩 시연부터 IT 트렌드까지, 영상으로 만나는 기술 라이브러리입니다. 직관적인 시각 자료를 통해 복잡한 기술도 더 쉽고 생생하게 이해해 보세요.",
    ],
  },
  {
    href: "/horok-shop",
    bubbleName: "horok shop",
    folderColor: "bg-[#6b94eb]",
    tabColor: "bg-[#5383e9]",
    title: "horok\nshop",
    label: "호록 ",
    accent: "쇼핑몰",
    accentClassName: "text-[#5c8fff]",
    bubbleText: [
      "개발자의 일상에 영감과 즐거움을 더하는",
      "호록 컴퍼니만의 특별한 굿즈와 아이템을 만나보세요.",
    ],
  },
] as const;

const defaultBubbleText = [
  "c.horok은 호록 컴퍼니의 약자로,",
  "읽고, 풀고, 시청하며 기술을 사랑하는 모두를 위한",
  "기술 허브입니다.",
] as const;

export default function RootPortal() {
  const [activeServiceHref, setActiveServiceHref] = useState<string | null>(
    null,
  );

  const activeService =
    services.find((service) => service.href === activeServiceHref) ?? null;
  const bubbleLines = activeService?.bubbleText ?? defaultBubbleText;

  return (
    <main className="min-h-dvh bg-[#f7f7f7] px-4 py-10 text-black sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-[1200px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] sm:min-h-0">
        <div className="flex h-16 items-center bg-[#3d4d57] px-[4.2%] sm:h-20 lg:h-24">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <span className="h-4 w-4 rounded-full bg-[#fa5f56] sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            <span className="h-4 w-4 rounded-full bg-[#ffd329] sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            <span className="h-4 w-4 rounded-full bg-[#61c262] sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
          </div>
        </div>

        <div className="flex-1 bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_60%,#dff0e7_100%)] p-4 sm:p-6 lg:p-8">
          <div className="relative aspect-[16/24] w-full min-[480px]:aspect-[16/20] sm:aspect-[16/11.5] lg:aspect-[16/10]">
            <div className="absolute inset-0">
              <div className="absolute left-[3%] top-[6%] z-0 w-[31%] sm:w-[37%]">
                <Image
                  src="/logo_body.png"
                  alt="horok mascot"
                  width={707}
                  height={833}
                  priority
                  className="h-auto w-full object-contain opacity-95 drop-shadow-[0_8px_18px_rgba(255,170,0,0.12)]"
                />
              </div>

              <div className="absolute left-[38%] right-[5%] top-[3%] z-20 rounded-[24px] border border-black/10 bg-white px-[5.2%] py-[4%] shadow-[0_5px_14px_rgba(15,23,42,0.12)] sm:left-auto sm:right-[6.5%] sm:top-[1.5%] sm:w-[50%]">
                <div className="absolute left-[-2.8%] top-[62%] h-0 w-0 -translate-y-1/2 border-y-[0.7vw] border-r-[1.2vw] border-y-transparent border-r-white drop-shadow-[-2px_2px_2px_rgba(15,23,42,0.06)] sm:left-[-3.1%] sm:border-y-[0.9vw] sm:border-r-[1.6vw] lg:left-[-3.3%] lg:border-y-[1.15vw] lg:border-r-[2vw]" />
                <div className="space-y-[4%]">
                  <div className="space-y-[1.8%]">
                    {activeService ? null : (
                      <p className="text-base font-medium leading-none sm:text-xl lg:text-[1.7rem]">
                        안녕하세요!
                      </p>
                    )}
                    <h1 className="text-[1.25rem] font-normal leading-[1.12] min-[480px]:text-[1.55rem] sm:text-[2.1rem] lg:text-[2.5rem]">
                      {activeService ? (
                        <>
                          <strong className="font-black">
                            {activeService.bubbleName}
                          </strong>
                          는
                        </>
                      ) : (
                        <>
                          <strong className="font-black">c.horok</strong>에 오신
                          것을
                          <br />
                          환영합니다.
                        </>
                      )}
                    </h1>
                  </div>
                  <p className="text-[0.88rem] leading-[1.34] text-black/85 min-[480px]:text-[0.98rem] sm:text-[1.05rem] lg:text-[1.12rem]">
                    {bubbleLines.map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                </div>
              </div>

              <section className="absolute bottom-[-8%] left-[7%] right-[7%] z-10 grid grid-cols-2 gap-x-[12%] gap-y-[10%] min-[480px]:bottom-[1%] sm:bottom-0 sm:left-[6%] sm:right-[6%] sm:grid-cols-4 sm:gap-[4.2%] lg:bottom-[3%]">
                {services.map((service) => {
                  const isActive = activeServiceHref === service.href;

                  return (
                    <Link
                      key={service.href}
                      href={service.href}
                      onMouseEnter={() => setActiveServiceHref(service.href)}
                      onMouseLeave={() => setActiveServiceHref(null)}
                      onFocus={() => setActiveServiceHref(service.href)}
                      onBlur={() => setActiveServiceHref(null)}
                      className="group flex flex-col items-center text-center"
                    >
                      <div
                        className={`relative w-full pt-[10%] transition duration-300 ${
                          isActive ? "-translate-y-2 scale-[1.03]" : ""
                        }`}
                      >
                        <div
                          className={`absolute left-0 top-[-8%] h-[96%] w-[56%] origin-top-left rounded-[12px] sm:rounded-[18px] lg:rounded-[24px] ${service.tabColor} transition duration-300 ${
                            isActive
                              ? "-rotate-3 -translate-x-1.5 -translate-y-1"
                              : ""
                          }`}
                        />
                        <div
                          className={`absolute right-0 top-[-4%] h-[92%] w-[56%] origin-top-right rounded-[12px] sm:rounded-[18px] lg:rounded-[24px] ${service.tabColor} transition duration-300 ${
                            isActive
                              ? "rotate-3 translate-x-1.5 -translate-y-1"
                              : ""
                          }`}
                        />
                        <div
                          className={`relative rounded-[18px] sm:rounded-[22px] lg:rounded-[24px] ${service.folderColor} px-[12%] py-[24%] sm:py-[22%] shadow-[0_8px_18px_rgba(15,23,42,0.12)] transition duration-300 ${
                            isActive
                              ? "-translate-y-2 rotate-[-1.5deg] shadow-[0_18px_30px_rgba(15,23,42,0.22)]"
                              : "group:hover:-translate-y-1 group:hover:shadow-[0_14px_24px_rgba(15,23,42,0.14)]"
                          }`}
                        >
                          <p className="whitespace-pre-line text-base font-black leading-[1.08] tracking-[0.14em] text-black sm:text-2xl sm:tracking-[0.16em] lg:text-[2.2rem]">
                            {service.title}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`mt-[5%] text-base font-medium tracking-tight text-black transition duration-300 sm:mt-[4%] sm:text-xl lg:text-[1.8rem] ${
                          isActive ? "translate-y-1 scale-[1.02]" : ""
                        }`}
                      >
                        {service.label}
                        <span className={service.accentClassName}>
                          {service.accent}
                        </span>
                      </p>
                    </Link>
                  );
                })}
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
