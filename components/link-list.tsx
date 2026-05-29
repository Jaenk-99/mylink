"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

// Firebase
import { db } from "@/lib/firebase"
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"

// 임시 UID (로그인 구현 전까지 사용)
const TEST_UID = "test-uid"

// LinkItem 타입 재정의 (Firestore 데이터 형태에 맞춤)
export interface LinkItem {
  id: string
  title: string
  url: string
  faviconUrl?: string
  clickCount: number
  createdAt: any // Firestore Timestamp
}

export function LinkList() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // 실시간 데이터 구독 (Read)
  useEffect(() => {
    // users/{uid}/links 경로 참조 및 정렬 (최신순)
    const linksRef = collection(db, "users", TEST_UID, "links")
    const q = query(linksRef, orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLinks: LinkItem[] = []
      snapshot.forEach((doc) => {
        fetchedLinks.push({
          id: doc.id,
          ...doc.data(),
        } as LinkItem)
      })
      setLinks(fetchedLinks)
    }, (err) => {
      console.error("Firestore 실시간 데이터 구독 에러:", err)
    })

    // 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe()
  }, [])

  /** URL에서 Google Favicon 프록시 URL 생성 */
  function getFaviconUrl(rawUrl: string): string {
    try {
      const { hostname } = new URL(
        rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`
      )
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
    } catch {
      return ""
    }
  }

  /** URL 유효성 간단 검사 */
  function isValidUrl(rawUrl: string): boolean {
    try {
      new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`)
      return true
    } catch {
      return false
    }
  }

  function handleOpen() {
    setTitle("")
    setUrl("")
    setError("")
    setOpen(true)
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError("제목을 입력해 주세요.")
      return
    }
    if (!url.trim() || !isValidUrl(url)) {
      setError("올바른 URL을 입력해 주세요. (예: https://example.com)")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const normalizedUrl = url.startsWith("http") ? url : `https://${url}`
      const linksRef = collection(db, "users", TEST_UID, "links")

      // Firestore에 문서 추가 (Create)
      await addDoc(linksRef, {
        title: title.trim(),
        url: normalizedUrl,
        faviconUrl: getFaviconUrl(url),
        clickCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setOpen(false)
    } catch (err) {
      console.error("링크 추가 실패:", err)
      setError("링크 추가에 실패했습니다. (콘솔 확인)")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* 링크 추가 버튼 */}
      <Button
        onClick={handleOpen}
        className="mb-4 w-full rounded-xl font-semibold"
      >
        + 링크 추가
      </Button>

      {/* 링크 목록 */}
      <div className="flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
          >
            <Card className="border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/40 hover:bg-card">
              <CardContent className="relative flex h-14 items-center px-5">
                {/* 파비콘 */}
                <div className="absolute left-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {link.faviconUrl ? (
                    <img
                      src={link.faviconUrl}
                      alt={`${link.title} icon`}
                      className="h-4 w-4 object-contain"
                    />
                  ) : (
                    <span className="text-sm">🔗</span>
                  )}
                </div>

                {/* 링크 제목 */}
                <span className="w-full text-center text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                  {link.title}
                </span>

                {/* 화살표 */}
                <span className="absolute right-4 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-primary/70">
                  →
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}

        {links.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            등록된 링크가 없습니다.
          </div>
        )}
      </div>

      {/* 링크 추가 다이얼로그 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 링크 추가</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="link-title">제목</Label>
              <Input
                id="link-title"
                placeholder="예: 인스타그램"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setError("")
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="예: https://instagram.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError("")
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) handleSubmit()
                }}
              />
              <p className="text-xs text-muted-foreground">
                URL을 입력하면 파비콘이 자동으로 적용됩니다.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
