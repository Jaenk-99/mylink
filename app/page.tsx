"use client"

import { useEffect, useState } from "react"
import { LinkList } from "@/components/link-list"
import { Header } from "@/components/header"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { auth, db } from "@/lib/firebase"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, setDoc, serverTimestamp, onSnapshot, updateDoc, collection, query, where, getDocs, getDoc } from "firebase/firestore"
import Link from "next/link"
import { Settings, Copy, Check, Link2, BarChart3, AtSign } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function createSlugFromEmail(email: string | null) {
  if (!email) return "user"
  return email.split("@")[0].toLowerCase()
}

export default function Page() {
  const { user, loading } = useAuth()

  // DB에서 불러온 사용자 프로필 상태
  const [profile, setProfile] = useState<any>(null)

  // 프로필 수정 모달 상태
  const [editOpen, setEditOpen] = useState(false)
  const [editUsername, setEditUsername] = useState("")
  const [editDisplayName, setEditDisplayName] = useState("")
  const [editBio, setEditBio] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState("")

  // 주소 복사 상태
  const [isCopied, setIsCopied] = useState(false)

  // 로그인 시 DB 저장 로직
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const loggedInUser = result.user

      // 기존 유저 문서가 있는지 확인 후 없으면 생성
      const userRef = doc(db, "users", loggedInUser.uid)
      const docSnap = await getDoc(userRef)

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: loggedInUser.uid,
          displayName: loggedInUser.displayName,
          username: createSlugFromEmail(loggedInUser.email),
          email: loggedInUser.email,
          photoURL: loggedInUser.photoURL,
          bio: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      } else {
        // 이미 존재하면 기본 정보만 업데이트 (username은 건드리지 않음)
        await setDoc(userRef, {
          photoURL: loggedInUser.photoURL,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }
    } catch (err) {
      console.error("구글 로그인 실패:", err)
    }
  }

  // 실시간 프로필 구독
  useEffect(() => {
    if (!user?.uid) {
      setProfile(null)
      return
    }

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data())
      }
    })

    return () => unsubscribe()
  }, [user?.uid])

  // 로딩 상태 처리
  if (loading) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </main>
    )
  }

  // 프로필 수정 모달 열기
  const handleOpenEdit = () => {
    setEditUsername(profile?.username || createSlugFromEmail(user?.email || null))
    setEditDisplayName(profile?.displayName || user?.displayName || "")
    setEditBio(profile?.bio || "")
    setEditError("")
    setEditOpen(true)
  }

  // 프로필 저장 로직
  const handleSaveProfile = async () => {
    if (!user?.uid) return
    if (!editUsername.trim() || !editDisplayName.trim()) {
      setEditError("아이디와 닉네임은 필수입니다.")
      return
    }

    // username 유효성 검사 (영문 소문자, 숫자, -, _)
    if (!/^[a-z0-9_-]+$/.test(editUsername)) {
      setEditError("아이디는 영문 소문자, 숫자, -, _ 만 사용 가능합니다.")
      return
    }

    setEditLoading(true)
    setEditError("")

    try {
      // 아이디 중복 체크 (기존 내 아이디와 다를 경우에만)
      if (editUsername !== profile?.username) {
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("username", "==", editUsername))
        const querySnapshot = await getDocs(q)

        // 검색된 결과가 있는데, 내 uid와 다르면 중복
        const isDuplicate = querySnapshot.docs.some(doc => doc.id !== user.uid)

        if (isDuplicate) {
          setEditError("이미 사용 중인 주소(아이디)입니다. 다른 주소를 입력해주세요.")
          setEditLoading(false)
          return
        }
      }

      // 저장
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        username: editUsername,
        displayName: editDisplayName,
        bio: editBio,
        updatedAt: serverTimestamp()
      })

      setEditOpen(false)
    } catch (err) {
      console.error("프로필 수정 에러:", err)
      setEditError("프로필 수정 중 오류가 발생했습니다.")
    } finally {
      setEditLoading(false)
    }
  }

  // 대시보드에 표시할 닉네임, 주소
  const displayUsername = profile?.username || createSlugFromEmail(user?.email || null)
  const displayTitle = profile?.displayName || user?.displayName || "사용자"
  const displayBio = profile?.bio || "환영합니다! 나만의 링크를 등록하고 관리해보세요."

  // 고유 주소 복사 로직
  const handleCopyUrl = async () => {
    // 로컬 호스트 및 실제 배포 도메인을 포함한 전체 URL 생성
    const fullUrl = `${window.location.origin}/${displayUsername}`
    try {
      await navigator.clipboard.writeText(fullUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000) // 2초 후 체크 표시 복구
    } catch (err) {
      console.error("복사 실패:", err)
      alert("주소 복사에 실패했습니다.")
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background">
      <Header />

      {/* 배경 그라데이션 효과 (글로벌하게 적용) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] animate-pulse duration-1000" />
        <div className="absolute top-60 -left-20 h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-[100px]" />
        <div className="absolute top-80 -right-20 h-[400px] w-[400px] rounded-full bg-indigo-500/15 blur-[100px]" />
      </div>

      {!user ? (
        // ==========================================
        // 로그아웃 상태 (랜딩 페이지 뷰)
        // ==========================================
        <div className="w-full flex flex-col items-center z-10">

          {/* 1. 히어로 섹션 */}
          <section className="w-full max-w-5xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-24 flex flex-col items-center justify-center text-center">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8 backdrop-blur-sm shadow-sm transition-transform hover:scale-105 cursor-default">
              ✨ 나만의 링크 프로필 만들기
            </div>

            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.15]">
              나를 표현하는 <br className="sm:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-500 to-indigo-500">
                단 하나의 링크
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
              인스타그램, 틱톡, 포트폴리오, 쇼핑몰까지.<br className="hidden sm:block" />
              흩어져 있는 여러분의 모든 링크를 마이링크 하나로 쉽고 예쁘게 모아보세요.
            </p>

            <Button
              size="lg"
              className="rounded-full px-8 h-14 text-base font-bold shadow-xl shadow-primary/25 hover:scale-105 transition-all duration-300 hover:shadow-primary/40"
              onClick={handleLogin}
            >
              Google 계정으로 시작하기
            </Button>
          </section>

          {/* 2. 기능 소개 섹션 */}
          <section className="w-full max-w-5xl px-6 py-20 sm:py-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">쉽고 강력한 링크 관리</h2>
              <p className="text-muted-foreground text-lg">마이링크가 제공하는 핵심 기능들을 만나보세요.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors shadow-sm text-left">
                <CardHeader className="pb-2">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <Link2 className="h-6 w-6" />
                  </div>
                  <CardTitle>무제한 링크 추가</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-foreground/70 leading-relaxed">
                    SNS, 블로그, 포트폴리오 등 필요한 모든 링크를 개수 제한 없이 하나의 페이지에 담으세요.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors shadow-sm text-left">
                <CardHeader className="pb-2">
                  <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 text-violet-500">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <CardTitle>실시간 클릭 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-foreground/70 leading-relaxed">
                    방문자들이 어떤 링크를 가장 많이 클릭하는지 관리자 대시보드에서 실시간으로 확인하세요.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors shadow-sm text-left">
                <CardHeader className="pb-2">
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-500">
                    <AtSign className="h-6 w-6" />
                  </div>
                  <CardTitle>나만의 고유 주소</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-foreground/70 leading-relaxed">
                    mylink.com/아이디 형태의 짧고 기억하기 쉬운 고유 URL을 통해 나를 세상에 알려보세요.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 3. 미리보기 (목업) & 두 번째 CTA */}
          <section className="w-full max-w-5xl px-6 py-20 sm:py-32 flex flex-col items-center text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-10">스마트폰에 최적화된 화면</h2>

            <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[8px] rounded-[2.5rem] h-[500px] w-[280px] shadow-2xl mb-16 overflow-hidden flex flex-col items-center justify-center bg-background">
              <div className="w-[120px] h-[20px] bg-gray-800 absolute top-0 rounded-b-xl z-20"></div>
              {/* 목업 내부 화면 디자인 */}
              <div className="w-full h-full bg-gradient-to-br from-primary/10 via-background to-violet-500/10 flex flex-col items-center p-5 pt-12 relative z-10">
                <div className="h-20 w-20 rounded-full bg-muted border-2 border-background shadow-md mb-4 flex items-center justify-center overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=mockup" alt="avatar" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-lg mb-1">마이링크 데모</h3>
                <p className="text-xs text-muted-foreground mb-6">여러분의 모든 링크를 하나로.</p>

                <div className="w-full flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-full h-12 rounded-xl bg-card border border-border/50 shadow-sm flex items-center px-4">
                      <div className="h-5 w-5 rounded-full bg-muted mr-3"></div>
                      <div className="h-3 w-24 bg-muted rounded-full"></div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pb-4">
                  <div className="h-6 w-24 bg-muted/50 rounded-full flex items-center justify-center gap-1.5 px-3">
                    <span className="text-[10px]">🔗</span>
                    <div className="h-2 w-12 bg-muted rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-4">지금 바로 당신의 링크를 만들어보세요</h3>
            <p className="text-muted-foreground mb-8">가입부터 나만의 프로필 생성까지 단 10초면 충분합니다.</p>
            <Button
              size="lg"
              className="rounded-full px-10 h-14 text-base font-bold shadow-lg hover:scale-105 transition-transform"
              onClick={handleLogin}
            >
              Google 계정으로 시작하기
            </Button>
          </section>

          {/* 4. 푸터 */}
          <footer className="w-full border-t border-border/40 bg-muted/20 py-10 mt-auto">
            <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔗</span>
                <span className="font-semibold text-foreground tracking-tight">마이링크</span>
              </div>
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                © {new Date().getFullYear()} MyLink. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors p-2 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 8 18v4" />
                  </svg>
                  <span className="sr-only">GitHub</span>
                </a>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        // ==========================================
        // 로그인 상태 (관리자 대시보드 뷰)
        // ==========================================
        <div className="w-full max-w-sm px-5 py-14 flex flex-col min-h-screen z-10">
          {/* 프로필 영역 */}
          <div className="mb-10 flex flex-col items-center text-center mt-4">
            <div className="relative mb-5 group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-violet-500 to-indigo-500 blur-md opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
              <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-background shadow-xl bg-muted z-10">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  alt="Profile Avatar"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="relative inline-flex items-center justify-center mt-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {displayTitle}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-10 h-8 w-8 rounded-full"
                onClick={handleOpenEdit}
              >
                <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                <span className="sr-only">프로필 수정</span>
              </Button>
            </div>

            {/* 내 주소 및 복사 버튼 영역 */}
            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 bg-muted/60 pl-4 pr-1.5 py-1.5 rounded-full border border-border/50 shadow-sm backdrop-blur-sm transition-colors hover:bg-muted/80">
                <span className="text-sm text-foreground font-medium truncate max-w-[200px]">
                  mylink.com/<span className="text-primary">{displayUsername}</span>
                </span>

                {/* 주소 복사 버튼 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-background/50 hover:bg-background shadow-sm"
                  onClick={handleCopyUrl}
                  title="주소 복사하기"
                >
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="sr-only">주소 복사</span>
                </Button>
              </div>

              {/* 미리보기 버튼 */}
              <Link
                href={`/${displayUsername}`}
                target="_blank"
                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
              >
                새 탭에서 내 링크 미리보기 ↗
              </Link>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {displayBio}
            </p>
          </div>

          {/* 링크 목록 및 추가 기능 */}
          <div className="flex flex-col gap-3 flex-1">
            <LinkList />
          </div>

          {/* 브랜딩 푸터 */}
          <div className="mt-14 text-center pb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-primary"
            >
              <span>🔗</span>
              마이링크 관리자 페이지
            </Link>
          </div>
        </div>
      )}

      {/* 프로필 수정 모달 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>프로필 수정</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">
                고유 아이디 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value.toLowerCase())}
                placeholder="영문 소문자, 숫자 조합"
              />
              <p className="text-[10px] text-muted-foreground">이 아이디가 고유 URL 주소(mylink.com/아이디)가 됩니다.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">
                표시 이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="displayName"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="화면에 표시될 이름"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bio">소개글</Label>
              <Textarea
                id="bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="간단한 자기소개를 작성해보세요 (최대 150자)"
                maxLength={150}
                className="resize-none h-24"
              />
            </div>

            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">취소</Button>
            </DialogClose>
            <Button onClick={handleSaveProfile} disabled={editLoading}>
              {editLoading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
