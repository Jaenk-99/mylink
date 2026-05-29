"use client"

import { useAuth } from "@/hooks/useAuth"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { Button } from "@/components/ui/button"

export function Header() {
  const { user, loading } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error("로그아웃 실패:", err)
    }
  }

  // 랜딩 페이지에 중앙 로그인 버튼이 있으므로, 헤더에서는 로그인 상태일 때만 프로필/로그아웃 버튼을 표시합니다.
  if (loading || !user) return null

  return (
    <header className="absolute top-0 right-0 w-full p-4 flex justify-end items-center z-50">
      <div className="flex items-center gap-4 bg-background/50 backdrop-blur-md px-4 py-2 rounded-full border border-border/50 shadow-sm">
        <span className="text-sm font-medium text-foreground">
          {user.displayName || "사용자"}님
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 rounded-full">
          로그아웃
        </Button>
      </div>
    </header>
  )
}
