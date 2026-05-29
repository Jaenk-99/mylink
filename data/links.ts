export interface LinkItem {
  id: string;
  title: string;
  url: string;
  faviconUrl?: string;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const links: LinkItem[] = [
  {
    id: "link-1",
    title: "Instagram",
    url: "https://instagram.com",
    faviconUrl: "https://www.google.com/s2/favicons?domain=instagram.com&sz=64",
    clickCount: 150,
    createdAt: new Date("2026-05-01T10:00:00Z"),
    updatedAt: new Date("2026-05-01T10:00:00Z"),
  },
  {
    id: "link-2",
    title: "YouTube",
    url: "https://youtube.com",
    faviconUrl: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64",
    clickCount: 85,
    createdAt: new Date("2026-05-02T11:30:00Z"),
    updatedAt: new Date("2026-05-02T11:30:00Z"),
  },
  {
    id: "link-3",
    title: "Blog",
    url: "https://tistory.com",
    faviconUrl: "https://www.google.com/s2/favicons?domain=tistory.com&sz=64", // Blog 대표 아이콘: 티스토리
    clickCount: 42,
    createdAt: new Date("2026-05-03T14:15:00Z"),
    updatedAt: new Date("2026-05-03T14:15:00Z"),
  },
  {
    id: "link-4",
    title: "Github",
    url: "https://github.com",
    faviconUrl: "https://github.com/favicon.ico",
    clickCount: 200,
    createdAt: new Date("2026-05-04T09:20:00Z"),
    updatedAt: new Date("2026-05-04T09:20:00Z"),
  },
  {
    id: "link-5",
    title: "Portfolio",
    url: "https://notion.so",
    faviconUrl: "https://www.google.com/s2/favicons?domain=notion.so&sz=64", // Portfolio 대표 아이콘: 노션
    clickCount: 310,
    createdAt: new Date("2026-05-05T16:45:00Z"),
    updatedAt: new Date("2026-05-05T16:45:00Z"),
  },
];
