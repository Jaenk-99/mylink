"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, doc, updateDoc, increment } from "firebase/firestore"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

interface UserProfile {
  uid: string
  displayName: string
  username: string
  photoURL: string
  bio?: string
}

interface LinkItem {
  id: string
  title: string
  url: string
  faviconUrl?: string
}

export default function PublicViewerPage() {
  const params = useParams()
  const username = params.username as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [links, setLinks] = useState<LinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. 유저 정보 찾기 (username 기준)
        const usersRef = collection(db, "users")
        const qUser = query(usersRef, where("username", "==", username))
        const userSnapshot = await getDocs(qUser)

        if (userSnapshot.empty) {
          setError(true)
          setLoading(false)
          return
        }

        const userData = userSnapshot.docs[0].data() as UserProfile
        setProfile(userData)

        // 2. 해당 유저의 링크 목록 가져오기
        const linksRef = collection(db, "users", userData.uid, "links")
        const qLinks = query(linksRef, orderBy("createdAt", "desc"))
        const linkSnapshot = await getDocs(qLinks)

        const fetchedLinks = linkSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LinkItem[]

        setLinks(fetchedLinks)
      } catch (err) {
        console.error("데이터 로드 실패:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchData()
    }
  }, [username])

  // 링크 클릭 시 Firestore에 클릭 카운트 증가
  const handleLinkClick = async (linkId: string) => {
    if (!profile?.uid) {
      console.error("유저 정보를 찾을 수 없어 카운트를 업데이트할 수 없습니다.")
      return
    }
    
    try {
      const linkRef = doc(db, "users", profile.uid, "links", linkId)
      // 동시 다발적인 클릭에도 누락되지 않도록 increment(1)를 사용해 서버에서 안전하게 카운트를 증가시킵니다.
      await updateDoc(linkRef, {
        clickCount: increment(1)
      })
    } catch (err) {
      console.error("클릭 카운트 저장 실패:", err)
    }
  }

  if (loading) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-bold mb-2 text-foreground">페이지를 찾을 수 없습니다</h1>
        <p className="text-muted-foreground mb-6">입력하신 주소가 올바른지 확인해 주세요.</p>
        <Link href="/" className="text-primary hover:underline font-medium">
          마이링크 홈으로 가기
        </Link>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background">
      {/* 배경 그라데이션 */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-60 -left-20 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-sm px-5 py-14 flex flex-col min-h-screen z-10">
        {/* 프로필 영역 */}
        <div className="mb-10 flex flex-col items-center text-center mt-4">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-violet-500 to-indigo-500 blur-md opacity-40" />
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-background shadow-xl bg-muted z-10">
              <img
                src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`}
                alt="Profile Avatar"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {profile.displayName}
          </h1>
          
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {profile.bio || "안녕하세요! 마이링크입니다."}
          </p>
        </div>

        {/* 링크 목록 */}
        <div className="flex flex-col gap-3 flex-1">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick(link.id)}
              className="group outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-xl block"
            >
              <Card className="relative overflow-hidden border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5">
                <CardContent className="p-3 sm:p-4 min-h-[4rem] flex items-center w-full">
                  {/* 파비콘 */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/80 mr-4">
                    {link.faviconUrl ? (
                      <img
                        src={link.faviconUrl}
                        alt={`${link.title} icon`}
                        className="h-5 w-5 object-contain"
                      />
                    ) : (
                      <span className="text-sm">🔗</span>
                    )}
                  </div>

                  {/* 링크 제목 */}
                  <span className="flex-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary truncate mr-2">
                    {link.title}
                  </span>

                  {/* 화살표 */}
                  <span className="ml-2 shrink-0 text-muted-foreground/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary/70">
                    →
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
          
          {links.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground bg-muted/30 rounded-xl border border-border/50">
              아직 등록된 링크가 없습니다.
            </div>
          )}
        </div>

        {/* 브랜딩 푸터 */}
        <div className="mt-14 text-center pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            <span>🔗</span>
            나도 마이링크 만들기
          </Link>
        </div>
      </div>
    </main>
  )
}
