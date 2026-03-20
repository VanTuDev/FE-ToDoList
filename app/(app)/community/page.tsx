"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"
import {
  Heart, MessageSquare, Send, UserPlus, UserCheck, Users,
  Newspaper, X, Trash2, Check, Clock, ChevronLeft,
  Loader2, Sparkles, GraduationCap, Hash, Layers,
  BookOpen, Target, Flame,
} from "lucide-react"
import * as api from "@/lib/community-api"
import type { CommunityPost, CommunityUser, FriendUser, FriendRequest, ChatMessage } from "@/lib/community-api"

type Tab = "feed" | "people" | "friends"

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "from-orange-500 to-amber-400",
  "from-violet-500 to-purple-400",
  "from-blue-500 to-cyan-400",
  "from-green-500 to-emerald-400",
  "from-pink-500 to-rose-400",
  "from-sky-500 to-indigo-400",
]
function gradientFor(seed: string) {
  return AVATAR_COLORS[(seed.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}

function UserAvatar({
  name, avatar, size = "md",
}: { name: string; avatar?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-sm", lg: "h-11 w-11 text-base" }[size]
  const label = name?.trim() ? name.slice(0, 1).toUpperCase() : "?"

  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={name || "avatar"}
        width={size === "lg" ? 44 : size === "md" ? 36 : 28}
        height={size === "lg" ? 44 : size === "md" ? 36 : 28}
        unoptimized
        className={cn("rounded-full object-cover shrink-0", sizeClass)}
      />
    )
  }
  return (
    <div className={cn(
      "shrink-0 rounded-full bg-linear-to-br flex items-center justify-center font-bold text-white shadow-sm",
      sizeClass, gradientFor(name || "?")
    )}>
      {label}
    </div>
  )
}

// ─── Display name helper ──────────────────────────────────────────────────────
function displayLabel(name: string, userId: string) {
  return name?.trim() || `Người dùng ${userId.slice(-4)}`
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { state } = useApp()
  const [myId, setMyId] = useState("")
  useEffect(() => { setMyId(localStorage.getItem("unitracker_userId") ?? "") }, [])

  const myName        = state.profile?.name || ""
  const myAvatar      = state.profile?.avatar || ""
  const myDisplayName = myName || `Người dùng ${myId.slice(-4)}`

  const [tab, setTab] = useState<Tab>("feed")

  // Feed
  const [posts,         setPosts]         = useState<CommunityPost[]>([])
  const [postLoading,   setPostLoading]   = useState(false)
  const [newContent,    setNewContent]    = useState("")
  const [posting,       setPosting]       = useState(false)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [openComments,  setOpenComments]  = useState<Record<string, boolean>>({})

  // People
  const [users,        setUsers]        = useState<CommunityUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())
  const [peopleModalUser, setPeopleModalUser] = useState<CommunityUser | null>(null)
  const [friendIdSet, setFriendIdSet] = useState<Set<string>>(new Set())
  const [hintCards, setHintCards] = useState<
    Array<{ title: string; text: string; icon: any }>
  >([])

  // Friends
  const [friends,          setFriends]         = useState<FriendUser[]>([])
  const [friendsLoading,   setFriendsLoading]  = useState(false)
  const [pendingRequests,  setPendingRequests] = useState<FriendRequest[]>([])

  // Chat
  const [activeChat,  setActiveChat]  = useState<FriendUser | null>(null)
  const [messages,    setMessages]    = useState<ChatMessage[]>([])
  const [chatInput,   setChatInput]   = useState("")
  const [chatSending, setChatSending] = useState(false)
  const lastMsgRef = useRef("")
  const chatEndRef = useRef<HTMLDivElement>(null)
  const pollRef    = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (tab === "feed")    loadPosts()
    if (tab === "people")  loadUsers()
    if (tab === "friends") loadFriends()
  }, [tab])

  const hintPool = useMemo(() => ([
    {
      title: "Mỗi ngày 1 bước",
      text: "Hãy bắt đầu từ việc nhỏ. Làm xong một phần sẽ tạo đà cho cả ngày.",
      icon: <Sparkles className="h-4 w-4 text-primary" />,
    },
    {
      title: "Checklist trước khi bắt đầu",
      text: "Viết ra 3 việc quan trọng nhất. Khi hoàn thành, tick vào để tăng động lực.",
      icon: <Target className="h-4 w-4 text-primary" />,
    },
    {
      title: "Ôn tập theo vòng lặp",
      text: "Chia nội dung thành phiên ngắn và lặp lại. Bạn sẽ nhớ lâu hơn.",
      icon: <BookOpen className="h-4 w-4 text-primary" />,
    },
    {
      title: "Đừng trì hoãn",
      text: "Nếu còn 10 phút, hãy mở tài liệu ngay. Bắt đầu sớm hơn thì dễ thành công hơn.",
      icon: <Flame className="h-4 w-4 text-primary" />,
    },
    {
      title: "Tập trung 25 phút",
      text: "Hẹn giờ Pomodoro. Tập trung một lần, kết thúc một lần.",
      icon: <Clock className="h-4 w-4 text-primary" />,
    },
  ]), [])

  useEffect(() => {
    // Random hint mỗi lần vào trang
    const pool = [...hintPool]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = pool[i]
      pool[i] = pool[j]
      pool[j] = tmp
    }
    setHintCards(pool.slice(0, 3))
  }, [hintPool])

  const loadPosts = async () => {
    setPostLoading(true)
    try { setPosts(await api.getPosts()) } catch {} finally { setPostLoading(false) }
  }
  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const [d, r, f] = await Promise.all([
        api.getCommunityUsers(),
        api.getFriendRequests(),
        api.getFriends(),
      ])
      setUsers(d)
      setSentRequests(new Set(r.sent.map((x) => x.toUserId)))
      setFriends(f)
      setFriendIdSet(new Set(f.map((x) => x.userId)))
    } catch {} finally { setUsersLoading(false) }
  }
  const loadFriends = async () => {
    setFriendsLoading(true)
    try {
      const [f, r] = await Promise.all([api.getFriends(), api.getFriendRequests()])
      setFriends(f); setPendingRequests(r.received)
    } catch {} finally { setFriendsLoading(false) }
  }

  const handlePost = async () => {
    if (!newContent.trim() || posting) return
    setPosting(true)
    try {
      const post = await api.createPost(newContent.trim(), myDisplayName)
      setPosts((p) => [post, ...p]); setNewContent("")
    } catch (e) { alert(e instanceof Error ? e.message : "Lỗi đăng bài") }
    finally { setPosting(false) }
  }

  const handleLike = async (postId: string) => {
    try {
      await api.toggleLike(postId)
      setPosts((prev) => prev.map((p) => {
        if (p._id !== postId) return p
        const liked = p.likes.includes(myId)
        return { ...p, likes: liked ? p.likes.filter((id) => id !== myId) : [...p.likes, myId] }
      }))
    } catch {}
  }

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim(); if (!content) return
    try {
      const comment = await api.addComment(postId, content, myDisplayName)
      setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, comments: [...p.comments, comment] } : p))
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }))
    } catch {}
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Xóa bài viết này?")) return
    try { await api.deletePost(postId); setPosts((p) => p.filter((x) => x._id !== postId)) } catch {}
  }

  const handleAddFriend = async (toUserId: string) => {
    try { await api.sendFriendRequest(toUserId); setSentRequests((p) => new Set([...p, toUserId])) }
    catch (e) { alert(e instanceof Error ? e.message : "Lỗi gửi lời mời") }
  }

  const handleRespond = async (reqId: string, action: "accept" | "reject") => {
    try {
      await api.respondFriendRequest(reqId, action)
      setPendingRequests((p) => p.filter((r) => r._id !== reqId))
      if (action === "accept") loadFriends()
    } catch {}
  }

  const openChat = useCallback(async (friend: FriendUser) => {
    setActiveChat(friend); setChatInput("")
    try {
      const msgs = await api.getMessages(friend.userId)
      setMessages(msgs)
      if (msgs.length > 0) lastMsgRef.current = msgs[msgs.length - 1].createdAt
    } catch { setMessages([]) }
  }, [])

  const closeChat = useCallback(() => {
    setActiveChat(null); setMessages([])
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  useEffect(() => {
    if (!activeChat) return
    let running = true
    const poll = async () => {
      if (!running || !lastMsgRef.current) return
      try {
        const newMsgs = await api.pollNewMessages(activeChat.userId, lastMsgRef.current)
        if (!running) return
        if (newMsgs.length > 0) { setMessages((p) => [...p, ...newMsgs]); lastMsgRef.current = newMsgs[newMsgs.length - 1].createdAt }
      } catch {}
    }
    pollRef.current = setInterval(poll, 5000)
    return () => { running = false; if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeChat])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const handleSendMsg = async () => {
    if (!chatInput.trim() || !activeChat || chatSending) return
    setChatSending(true)
    const content = chatInput.trim(); setChatInput("")
    try {
      const msg = await api.sendChatMessage(activeChat.userId, content)
      setMessages((p) => [...p, msg]); lastMsgRef.current = msg.createdAt
    } catch {} finally { setChatSending(false) }
  }

  const tabs = [
    { key: "feed"    as Tab, label: "Bảng tin",  icon: <Newspaper className="h-3.5 w-3.5" /> },
    { key: "people"  as Tab, label: "Mọi người", icon: <Users className="h-3.5 w-3.5" /> },
    { key: "friends" as Tab, label: "Bạn bè",    icon: <UserCheck className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="mx-auto max-w-2xl pb-6">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Cộng đồng</h1>
          <p className="text-xs text-muted-foreground">Kết nối với bạn học, chia sẻ trải nghiệm</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative flex gap-1 rounded-xl bg-secondary p-1 mb-6 shadow-inner">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200",
              tab === t.key
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.icon}{t.label}
            {t.key === "friends" && pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Gợi ý học tập (luôn hiển thị bên phải, không nằm trong tab Mọi người) */}
      <aside className="hidden xl:block fixed right-6 top-24 w-80">
        <div className="sticky top-6 space-y-3">
          <div className="rounded-2xl glass border-border p-4 orange-glow-border animate-gradient-x">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Gợi ý học tập</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Mỗi lần vào trang, bạn sẽ nhận một hint ngẫu nhiên.
            </p>
          </div>
          {hintCards.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl glass border-border p-4 hover:border-primary/30 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                {c.icon}
                <p className="text-sm font-semibold text-foreground">{c.title}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* ══ FEED ══ */}
      {tab === "feed" && (
        <div className="space-y-4 animate-slide-up">
          {/* Compose */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 hover:border-primary/20 transition-colors">
            <div className="flex items-start gap-3">
              <UserAvatar name={myDisplayName} avatar={myAvatar} />
              <Textarea
                placeholder={`${myDisplayName}, hôm nay bạn nghĩ gì?`}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="flex-1 bg-secondary border-border resize-none text-sm min-h-[72px] focus:border-primary/40 transition-colors"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{newContent.length > 0 ? `${newContent.length} ký tự` : ""}</span>
              <Button size="sm" onClick={handlePost} disabled={!newContent.trim() || posting}
                className="gap-1.5 hover:scale-105 transition-transform">
                {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Đăng bài
              </Button>
            </div>
          </div>

          {postLoading ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Đang tải bài viết...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
                <Newspaper className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground">Chưa có bài viết nào</p>
              <p className="text-xs text-muted-foreground">Hãy là người đầu tiên chia sẻ!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post._id} post={post} myId={myId}
                commentInput={commentInputs[post._id] ?? ""}
                showComments={openComments[post._id] ?? false}
                onLike={() => handleLike(post._id)}
                onToggleComments={() => setOpenComments((p) => ({ ...p, [post._id]: !p[post._id] }))}
                onCommentChange={(v) => setCommentInputs((p) => ({ ...p, [post._id]: v }))}
                onCommentSubmit={() => handleComment(post._id)}
                onDelete={() => handleDeletePost(post._id)}
              />
            ))
          )}
        </div>
      )}

      {/* ══ PEOPLE ══ */}
      {tab === "people" && (
        <div className="flex gap-6 items-start">
          <div className="flex-1 space-y-2.5 animate-slide-up">
          {usersLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : users.filter((u) => {
            const isFriend =
              friendIdSet.has(u.userId) ||
              (!!u.phoneId && friendIdSet.has(u.phoneId)) ||
              (!!u.googleId && friendIdSet.has(u.googleId))
            return !isFriend
          }).length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">Chưa có người dùng nào khác.</p>
            </div>
          ) : (
            users
              .filter((u) => {
                const isFriend =
                  friendIdSet.has(u.userId) ||
                  (!!u.phoneId && friendIdSet.has(u.phoneId)) ||
                  (!!u.googleId && friendIdSet.has(u.googleId))
                return !isFriend
              })
              .map((user) => {
              const name = displayLabel(user.displayName, user.userId)
              return (
                <div key={user.userId}
                  className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 p-4">
                    <button
                      type="button"
                      onClick={() => setPeopleModalUser(user)}
                      className="flex flex-1 min-w-0 items-center gap-3 text-left rounded-lg -m-1 p-1 hover:bg-secondary/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <UserAvatar name={name} avatar={user.avatar} size="lg" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {user.studentId ? (
                            <span className="inline-flex items-center gap-1">
                              <Hash className="h-2.5 w-2.5 shrink-0" />
                              {user.studentId}
                            </span>
                          ) : (
                            "Ấn để xem hồ sơ · FPT University"
                          )}
                        </p>
                      </div>
                    </button>
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      {sentRequests.has(user.userId) ? (
                        <div className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> Đã gửi
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddFriend(user.userId)}
                          className="gap-1.5 hover:scale-105 active:scale-95 transition-transform"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Kết bạn
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          </div>

        </div>
      )}

      {/* Modal hồ sơ thành viên (Mọi người) */}
      <Dialog
        open={peopleModalUser !== null}
        onOpenChange={(open) => {
          if (!open) setPeopleModalUser(null)
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border gap-0 p-0 overflow-hidden">
          {peopleModalUser && (
            <>
              <div className="bg-linear-to-br from-primary/15 via-primary/5 to-transparent px-6 pt-6 pb-4">
                <DialogHeader className="gap-1 text-center sm:text-center">
                  <DialogTitle className="text-base font-semibold text-foreground">
                    Hồ sơ thành viên
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Thông tin công khai để bạn kết nối
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-3 mt-2">
                  <UserAvatar
                    name={displayLabel(peopleModalUser.displayName, peopleModalUser.userId)}
                    avatar={peopleModalUser.avatar}
                    size="lg"
                  />
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">
                      {displayLabel(peopleModalUser.displayName, peopleModalUser.userId)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">FPT University</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 space-y-3 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Thông tin cá nhân
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <Hash className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Mã số sinh viên</p>
                      <p className="font-medium text-foreground">
                        {peopleModalUser.studentId?.trim() || "—"}
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <GraduationCap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Lớp học</p>
                      <p className="font-medium text-foreground">
                        {peopleModalUser.class?.trim() || "—"}
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <Layers className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ngành học</p>
                      <p className="font-medium text-foreground">
                        {peopleModalUser.major?.trim() || "—"}
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <DialogFooter className="px-6 py-4 border-t border-border bg-secondary/30 sm:justify-center gap-2">
                {sentRequests.has(peopleModalUser.userId) ? (
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 w-full py-2">
                    <Clock className="h-3.5 w-3.5" /> Đã gửi lời mời kết bạn
                  </p>
                ) : (
                  <Button
                    className="w-full sm:w-auto gap-1.5"
                    onClick={() => {
                      handleAddFriend(peopleModalUser.userId)
                      setPeopleModalUser(null)
                    }}
                  >
                    <UserPlus className="h-4 w-4" /> Gửi lời mời kết bạn
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ══ FRIENDS ══ */}
      {tab === "friends" && (
        <div className="space-y-4 animate-slide-up">
          {/* Pending */}
          {pendingRequests.length > 0 && (
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Lời mời kết bạn
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {pendingRequests.length}
                </span>
              </h3>
              {pendingRequests.map((req) => (
                <div key={req._id} className="flex items-center justify-between gap-3 rounded-xl bg-card/50 px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserAvatar name={req.fromUserId.slice(-4)} size="sm" />
                    <p className="text-sm text-foreground truncate font-medium">{req.fromUserId}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => handleRespond(req._id, "accept")}
                      className="h-7 px-2.5 gap-1 text-xs hover:scale-105 active:scale-95 transition-transform">
                      <Check className="h-3 w-3" /> Đồng ý
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRespond(req._id, "reject")}
                      className="h-7 px-2.5 gap-1 text-xs border-border hover:border-destructive/50 hover:text-destructive hover:scale-105 active:scale-95 transition-all">
                      <X className="h-3 w-3" /> Từ chối
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {friendsLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground">Chưa có bạn bè</p>
              <p className="text-xs text-muted-foreground">Vào tab &ldquo;Mọi người&rdquo; để gửi lời mời.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {friends.map((friend) => {
                const name = displayLabel(friend.displayName, friend.userId)
                return (
                  <div key={friend.userId}
                    className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-all duration-200"
                  >
                    <UserAvatar name={name} avatar={friend.avatar} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <UserCheck className="h-2.5 w-2.5 text-green-400" /> Bạn bè
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openChat(friend)}
                      className="gap-1.5 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all">
                      <MessageSquare className="h-3.5 w-3.5" /> Nhắn tin
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ CHAT PANEL ══ */}
      {activeChat && (
        <div className="fixed z-50 right-4 w-full max-w-sm bottom-[80px] lg:bottom-4 animate-slide-up">
          <div
            className="flex flex-col rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 overflow-hidden"
            style={{ height: "min(70vh, calc(100dvh - 160px))" }}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-secondary/50">
              <button onClick={closeChat} className="text-muted-foreground hover:text-foreground hover:scale-110 transition-all rounded-lg p-1">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <UserAvatar name={displayLabel(activeChat.displayName, activeChat.userId)} avatar={activeChat.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{displayLabel(activeChat.displayName, activeChat.userId)}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" /> Cập nhật mỗi 5 giây
                </p>
              </div>
              <button onClick={closeChat} className="text-muted-foreground hover:text-destructive hover:scale-110 transition-all rounded-lg p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">Bắt đầu cuộc trò chuyện...</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg._id} className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                  msg.fromUserId === myId
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                    : "mr-auto bg-secondary text-foreground rounded-bl-sm"
                )}>
                  {msg.content}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-border p-3 flex gap-2 bg-secondary/30">
              <Input
                placeholder="Nhắn tin..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMsg()}
                className="flex-1 bg-card border-border text-sm focus:border-primary/40"
              />
              <Button size="sm" onClick={handleSendMsg} disabled={!chatInput.trim() || chatSending}
                className="hover:scale-105 active:scale-95 transition-transform">
                {chatSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PostCard ─────────────────────────────────────────────────────────────────
function PostCard({ post, myId, commentInput, showComments, onLike, onToggleComments, onCommentChange, onCommentSubmit, onDelete }: {
  post: CommunityPost; myId: string; commentInput: string; showComments: boolean
  onLike: () => void; onToggleComments: () => void
  onCommentChange: (v: string) => void; onCommentSubmit: () => void; onDelete: () => void
}) {
  const liked   = post.likes.includes(myId)
  const isOwner = post.userId === myId
  const name    = displayLabel(post.displayName, post.userId)

  return (
    <div className="group rounded-2xl border border-border bg-card p-4 space-y-3 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <UserAvatar name={name} />
          <div>
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-[11px] text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        {isOwner && (
          <button onClick={onDelete}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

      <div className="flex items-center gap-1 pt-1 border-t border-border/50">
        <button onClick={onLike} className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 active:scale-95",
          liked ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "text-muted-foreground hover:bg-secondary hover:text-red-400"
        )}>
          <Heart className={cn("h-3.5 w-3.5 transition-transform", liked && "fill-current scale-110")} />
          {post.likes.length > 0 && post.likes.length}
        </button>
        <button onClick={onToggleComments} className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:scale-105",
          showComments ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}>
          <MessageSquare className="h-3.5 w-3.5" />
          {post.comments.length > 0 && post.comments.length} Bình luận
        </button>
      </div>

      {showComments && (
        <div className="space-y-2 pt-1 animate-slide-up">
          {post.comments.map((c, i) => (
            <div key={i} className="flex gap-2.5">
              <UserAvatar name={displayLabel(c.displayName, c.userId)} size="sm" />
              <div className="flex-1 rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-[11px] font-semibold text-foreground">{displayLabel(c.displayName, c.userId)}</p>
                <p className="text-xs text-foreground/80 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Viết bình luận..."
                value={commentInput}
                onChange={(e) => onCommentChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onCommentSubmit()}
                className="h-8 text-xs bg-secondary border-border focus:border-primary/40"
              />
              <Button size="sm" className="h-8 px-2.5 hover:scale-105 active:scale-95 transition-transform"
                onClick={onCommentSubmit} disabled={!commentInput.trim()}>
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
