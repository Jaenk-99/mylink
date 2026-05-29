import Link from "next/link"
import { LinkList } from "@/components/link-list"

export default function Page() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background">
      {/* 배경 그라데이션 효과 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-60 -left-20 h-[300px] w-[300px] rounded-full bg-violet-400/10 blur-[90px]" />
        <div className="absolute top-80 -right-20 h-[300px] w-[300px] rounded-full bg-indigo-400/10 blur-[90px]" />
      </div>

      <div className="w-full max-w-sm px-5 py-14">
        {/* 프로필 영역 */}
        <div className="mb-10 flex flex-col items-center text-center">
          {/* 프로필 이미지 */}
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-violet-500 to-indigo-500 blur-md opacity-50" />
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-white/30 shadow-xl">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=jaenk"
                alt="Profile Avatar"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* 닉네임 */}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            김재현
          </h1>

          {/* 소개글 */}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            여러분의 모든 링크를 하나로 모으세요.
            <br />
            크리에이터 · 프리랜서 · 비즈니스
          </p>
        </div>

        {/* 링크 목록 및 추가 기능 (클라이언트 컴포넌트) */}
        <div className="flex flex-col gap-3">
          <LinkList />
        </div>

        {/* 브랜딩 푸터 */}
        <div className="mt-14 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            <span>🔗</span>
            마이링크 만들기
          </Link>
        </div>
      </div>
    </main>
  )
}
