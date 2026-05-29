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
import { Pencil, Check, X, Trash2 } from "lucide-react"

// Firebase
import { db } from "@/lib/firebase"
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore"
import { useAuth } from "@/hooks/useAuth"

export interface LinkItem {
  id: string
  title: string
  url: string
  faviconUrl?: string
  clickCount: number
  createdAt: any
}

export function LinkList() {
  const { user } = useAuth()
  const [links, setLinks] = useState<LinkItem[]>([])
  
  // 링크 추가 다이얼로그 상태
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // 인라인 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editUrl, setEditUrl] = useState("")

  // 삭제 확인 다이얼로그 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<LinkItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 실시간 데이터 구독 (Read)
  useEffect(() => {
    // 이제 LinkList는 로그인 된 상태에서만 렌더링 되므로 user.uid를 안심하고 사용할 수 있습니다.
    if (!user?.uid) return

    const linksRef = collection(db, "users", user.uid, "links")
    const q = query(linksRef, orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLinks: LinkItem[] = []
      snapshot.forEach((docSnap) => {
        fetchedLinks.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as LinkItem)
      })
      setLinks(fetchedLinks)
    }, (err) => {
      console.error("Firestore 실시간 데이터 구독 에러:", err)
    })

    return () => unsubscribe()
  }, [user?.uid])

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

  function isValidUrl(rawUrl: string): boolean {
    try {
      new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`)
      return true
    } catch {
      return false
    }
  }

  // --- 추가(Create) 로직 ---
  function handleOpen() {
    setTitle("")
    setUrl("")
    setError("")
    setOpen(true)
  }

  async function handleSubmit() {
    if (!user?.uid) return
    if (!title.trim()) {
      setError("제목을 입력해 주세요.")
      return
    }
    if (!url.trim() || !isValidUrl(url)) {
      setError("올바른 URL을 입력해 주세요.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const normalizedUrl = url.startsWith("http") ? url : `https://${url}`
      const linksRef = collection(db, "users", user.uid, "links")

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
      setError("링크 추가에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  // --- 인라인 수정(Update) 로직 ---
  function startEditing(link: LinkItem) {
    setEditingId(link.id)
    setEditTitle(link.title)
    setEditUrl(link.url)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditTitle("")
    setEditUrl("")
  }

  async function saveEdit(id: string) {
    if (!user?.uid) return
    if (!editTitle.trim() || !editUrl.trim() || !isValidUrl(editUrl)) {
      alert("올바른 제목과 URL을 입력해주세요.")
      return
    }

    setIsLoading(true)
    try {
      const normalizedUrl = editUrl.startsWith("http") ? editUrl : `https://${editUrl}`
      const linkRef = doc(db, "users", user.uid, "links", id)
      
      await updateDoc(linkRef, {
        title: editTitle.trim(),
        url: normalizedUrl,
        faviconUrl: getFaviconUrl(normalizedUrl),
        updatedAt: serverTimestamp(),
      })
      
      cancelEditing()
    } catch (err) {
      console.error("수정 실패:", err)
      alert("수정에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  // --- 삭제(Delete) 로직 ---
  function openDeleteModal(link: LinkItem) {
    setLinkToDelete(link)
    setDeleteModalOpen(true)
  }

  async function confirmDelete() {
    if (!linkToDelete || !user?.uid) return

    setIsDeleting(true)
    try {
      const linkRef = doc(db, "users", user.uid, "links", linkToDelete.id)
      await deleteDoc(linkRef)
      setDeleteModalOpen(false)
      setLinkToDelete(null)
    } catch (err) {
      console.error("삭제 실패:", err)
      alert("삭제에 실패했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  // 통계 계산
  const totalClicks = links.reduce((sum, link) => sum + (link.clickCount || 0), 0)
  const sortedLinksByClick = [...links].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))

  // LinkList는 이제 page.tsx에서 user가 있을 때만 렌더링되므로, 
  // 바로 관리자 뷰 UI를 반환합니다.
  return (
    <>
      <Button
        onClick={handleOpen}
        className="mb-4 w-full rounded-xl font-semibold shadow-md"
      >
        + 링크 추가
      </Button>

      {/* 링크 목록 */}
      <div className="flex flex-col gap-3">
        {links.map((link) => {
          const isEditing = editingId === link.id

          return (
            <Card 
              key={link.id} 
              className="relative overflow-hidden border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/40"
            >
              <CardContent className="p-3 sm:p-4 min-h-[4rem] flex flex-col justify-center">
                {isEditing ? (
                  // 수정 모드 (인라인 에디터)
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <div className="flex-1 flex flex-col gap-2">
                      <Input 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="제목"
                        className="h-8 text-sm"
                      />
                      <Input 
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="URL"
                        className="h-8 text-sm text-muted-foreground"
                      />
                    </div>
                    <div className="flex sm:flex-col gap-2 justify-end sm:justify-start">
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="h-8 w-8 sm:w-auto px-2"
                        onClick={() => saveEdit(link.id)}
                        disabled={isLoading}
                      >
                        <Check className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">저장</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 sm:w-auto px-2"
                        onClick={cancelEditing}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">취소</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 보기 모드
                  <div className="flex items-center w-full group">
                    <Link
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 z-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                    />
                    
                    {/* 파비콘 */}
                    <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted mr-4 pointer-events-none">
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
                    <span className="z-10 flex-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary pointer-events-none truncate mr-2">
                      {link.title}
                    </span>

                    {/* 제어 버튼 (수정/삭제) */}
                    <div className="z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-card/50 backdrop-blur-sm rounded-md px-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.preventDefault()
                          startEditing(link)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">수정</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault()
                          openDeleteModal(link)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">삭제</span>
                      </Button>
                    </div>

                    {/* 우측 화살표 */}
                    <span className="z-10 ml-2 shrink-0 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-primary/70 pointer-events-none hidden sm:inline-block">
                      →
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {links.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            등록된 링크가 없습니다.
          </div>
        )}
      </div>

      {/* --- 통계 섹션 --- */}
      {links.length > 0 && (
        <div className="mt-12 mb-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-lg font-bold text-foreground tracking-tight">📊 내 링크 통계</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {/* 총 클릭 수 카드 */}
            <Card className="bg-primary/5 border-primary/20 shadow-sm">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-medium text-muted-foreground mb-1">모든 링크 총 클릭 수</span>
                <span className="text-5xl font-extrabold text-primary tracking-tight">
                  {totalClicks.toLocaleString()}
                </span>
              </CardContent>
            </Card>

            {/* 개별 링크 통계 */}
            <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-4 flex flex-col gap-3">
                <span className="text-xs font-semibold text-muted-foreground px-1 mb-1 uppercase tracking-wider">
                  링크별 순위
                </span>
                <div className="flex flex-col gap-2">
                  {sortedLinksByClick.map((link, index) => (
                    <div key={link.id} className="flex items-center justify-between p-2.5 rounded-xl bg-background/80 border border-border/50 shadow-sm transition-colors hover:border-primary/30">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-xs font-bold text-muted-foreground/70 w-4 text-center">
                          {index + 1}
                        </span>
                        <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-muted border border-border/50">
                          {link.faviconUrl ? (
                            <img src={link.faviconUrl} alt="icon" className="h-3.5 w-3.5 object-contain" />
                          ) : (
                            <span className="text-xs">🔗</span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-foreground truncate">
                          {link.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3 bg-primary/10 px-2.5 py-1 rounded-full">
                        <span className="text-sm font-bold text-primary">{link.clickCount || 0}</span>
                        <span className="text-[10px] font-medium text-primary/70">클릭</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

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

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-foreground">
              <strong className="font-semibold text-primary">[{linkToDelete?.title}]</strong> 링크가 삭제됩니다.
            </p>
            <p className="mt-2 text-sm text-destructive font-medium">
              ⚠️ 이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
