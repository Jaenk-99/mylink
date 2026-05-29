import { ImageResponse } from 'next/og'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

export const runtime = 'edge'

export const alt = '마이링크'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: { username: string } }) {
  // Edge runtime에서 로컬 폰트 파일을 읽기 (앞서 다운로드 받은 NotoSansKR-Bold.otf)
  const fontData = await fetch(
    new URL('../../public/fonts/NotoSansKR-Bold.otf', import.meta.url)
  ).then((res) => res.arrayBuffer())

  // URL에서 인코딩된 username을 안전하게 디코딩
  const decodedUsername = decodeURIComponent(params.username)

  // Firestore에서 유저 및 링크 정보 가져오기
  let displayName = decodedUsername
  let photoURL = `https://api.dicebear.com/7.x/avataaars/svg?seed=${decodedUsername}`
  let bio = '여러분의 모든 링크를 마이링크에서 만나보세요.'
  let linkCount = 0

  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('username', '==', decodedUsername))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data()
      displayName = userData.displayName || decodedUsername
      if (userData.photoURL) photoURL = userData.photoURL
      if (userData.bio) bio = userData.bio

      // 유저의 링크 개수 가져오기
      const linksRef = collection(db, 'users', userDoc.id, 'links')
      const linksSnapshot = await getDocs(linksRef)
      linkCount = linksSnapshot.size
    }
  } catch (err) {
    console.error('OG Image data fetch error:', err)
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #ffffff, #f8fafc, #f1f5f9)',
          fontFamily: '"Noto Sans KR"',
        }}
      >
        {/* 장식용 원형 그라데이션 배경 */}
        <div
          style={{
            position: 'absolute',
            top: -200,
            left: -200,
            width: 800,
            height: 800,
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(255,255,255,0) 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -200,
            right: -200,
            width: 800,
            height: 800,
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(255,255,255,0) 70%)',
            borderRadius: '50%',
          }}
        />

        {/* 중앙 컨텐츠 영역 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: '40px 80px',
          }}
        >
          {/* 프로필 이미지 */}
          <div
            style={{
              display: 'flex',
              width: 180,
              height: 180,
              borderRadius: 90,
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              border: '6px solid white',
              marginBottom: 32,
              backgroundColor: '#f4f4f5',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={photoURL} 
              alt="Profile" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>

          {/* 메인 타이틀 (사용자 이름) */}
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 700,
              color: '#09090b',
              textAlign: 'center',
              letterSpacing: '-0.02em',
              marginBottom: 20,
            }}
          >
            {displayName}
          </div>
          
          {/* 소개글 */}
          <div
            style={{
              display: 'flex',
              fontSize: 32,
              fontWeight: 400,
              color: '#52525b',
              textAlign: 'center',
              maxWidth: 800,
              lineHeight: 1.4,
              marginBottom: 40,
            }}
          >
            {bio}
          </div>

          {/* 배지 모음 */}
          <div style={{ display: 'flex', gap: 24, marginTop: 'auto', marginBottom: 20 }}>
            {/* 링크 배지 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 28,
                fontWeight: 700,
                color: '#6d28d9',
                backgroundColor: 'rgba(139, 92, 246, 0.12)',
                padding: '12px 32px',
                borderRadius: 999,
                gap: 12,
              }}
            >
              <span style={{ fontSize: 32 }}>✨</span>
              <span>{linkCount}개의 링크</span>
            </div>

            {/* 브랜드 배지 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 28,
                fontWeight: 700,
                color: '#09090b',
                backgroundColor: '#f4f4f5',
                padding: '12px 32px',
                borderRadius: 999,
                gap: 12,
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              }}
            >
              <span style={{ fontSize: 32 }}>🔗</span>
              <span>mylink.com/{decodedUsername}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Noto Sans KR',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  )
}
