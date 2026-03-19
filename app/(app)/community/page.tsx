"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"
import {
  Heart, MessageSquare, Send, UserPlus, UserCheck, Users,
  Newspaper, X, Trash2, Check, Clock, ChevronLeft,
  Loader2, Sparkles, MessageCircleMore,
} from "lucide-react"
import * as api from "@/lib/community-api"
import type { CommunityPost, CommunityUser, FriendUser, FriendRequest, ChatMessage } from "@/lib/community-api"

type Tab = "feed" | "people" | "friends"

// ─── Avatar helper ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "from-orange-500 to-amber-400",
  "from-violet-500 to-purple-400",
  "from-blue-500 to-cyan-400",
  "from-green-500 to-emerald-400",
  "from-pink-500 to-rose-400",
]
function getAvatarColor(name: string) {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}
function UserAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-sm", lg: "h-11 w-11 text-base" }[size]
  return (
    <div className={cn(
      "shrink-0 rounded-full bg-linear-to-br flex items-center justify-center font-bold text-white shadow-sm",
      sz, getAvatarColor(name)
    )}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { state } = useApp()
  const [myId, setMyId] = useState("")
  useEffect(() => { setMyId(localStorage.getItem("unitracker_userId") ?? "") }, [])

  const myDisplayName = state.profile?.name || `Người dùng ${myId.slice(-4)}`
  const [tab, setTab] = useState<Tab>("feed")

  // Feed
  const [posts,          setPosts]          = useState<CommunityPost[]>([])
  const [postLoading,    setPostLoading]    = useState(false)
  const [newContent,     setNewContent]     = useState("")
  const [posting,        setPosting]        = useState(false)
  const [commentInputs,  setCommentInputs]  = useState<Record<string, string>>({})
  const [openComments,   setOpenComments]   = useState<Record<string, boolean>>({})

  // People
  const [users,         setUsers]         = useState<CommunityUser[]>([])
  const [usersLoading,  setUsersLoading]  = useState(false)
  const [sentRequests,  setSentRequests]  = useState<Set<string>>(new Set())

  // Friends
  const [friends,         setFriends]         = useState<FriendUser[]>([])
  const [friendsLoading,  setFriendsLoading]  = useState(false)
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])

  // Chat
  const [activeChat,   setActiveChat]   = useState<FriendUser | null>(null)
  const [messages,     setMessages]     = useState<ChatMessage[]>([])
  const [chatInput,    setChatInput]    = useState("")
  const [chatSending,  setChatSending]  = useState(false)
  const lastMsgRef  = useRef("")
  const chatEndRef  = useRef<HTMLDivElement>(null)
  const pollRef     = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (tab === "feed")    loadPosts()
    if (tab === "people")  loadUsers()
    if (tab === "friends") loadFriends()
  }, [tab])

  const loadPosts   = async () => { setPostLoading(true);   try { setPosts(await api.getPosts()) }              catch {} finally { setPostLoading(false) } }
  const loadUsers   = async () => { setUsersLoading(true);  try { const [d, r] = await Promise.all([api.getCommunityUsers(), api.getFriendRequests()]); setUsers(d); setSentRequests(new Set(r.sent.map((x) => x.toUserId))) } catch {} finally { setUsersLoading(false) } }
  const loadFriends = async () => { setFriendsLoading(true); try { const [f, r] = await Promise.all([api.getFriends(), api.getFriendRequests()]); setFriends(f); setPendingRequests(r.received) } catch {} finally { setFriendsLoading(false) } }

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
    const content = commentInputs[postId]?.trim()
    if (!content) return
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
    { key: "feed"    as Tab, label: "Bảng tin", icon: <Newspaper className="h-3.5 w-3.5" /> },
    { key: "people"  as Tab, label: "Mọi người", icon: <Users className="h-3.5 w-3.5" /> },
    { key: "friends" as Tab, label: "Bạn bè",    icon: <UserCheck className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="mx-auto max-w-2xl pb-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Cộng đồng</h1>
          <p className="text-xs text-muted-foreground">Kết nối với bạn học, chia sẻ trải nghiệm</p>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="relative flex gap-1 rounded-xl bg-secondary p-1 mb-6 shadow-inner">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
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

      {/* ══════════ FEED ══════════ */}
      {tab === "feed" && (
        <div className="space-y-4 animate-slide-up">
          {/* Compose */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3 hover:border-primary/20 transition-colors">
            <div className="flex items-start gap-3">
              <UserAvatar name={myDisplayName} />
              <Textarea
                placeholder={`${myDisplayName}, hôm nay bạn nghĩ gì?`}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="flex-1 bg-secondary border-border resize-none text-sm min-h-[72px] focus:border-primary/40 transition-colors"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{newContent.length > 0 ? `${newContent.length} ký tự` : ""}</span>
              <Button
                size="sm"
                onClick={handlePost}
                disabled={!newContent.trim() || posting}
                className="gap-1.5 hover:scale-105 transition-transform"
              >
                {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Đăng bài
              </Button>
            </div>
          </div>

          {/* Posts */}
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
              <PostCard
                key={post._id} post={post} myId={myId}
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

      {/* ══════════ PEOPLE ══════════ */}
      {tab === "people" && (
        <div className="space-y-2.5 animate-slide-up">
          {usersLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">Chưa có người dùng nào khác.</p>
            </div>
          ) : (
            users.map((user) => (
              <div key={user.userId}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-primary/3 transition-all duration-200"
              >
                <UserAvatar name={user.displayName} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[user.major, user.class].filter(Boolean).join(" · ") || "FPT University"}
                  </p>
                </div>
                {sentRequests.has(user.userId) ? (
                  <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs text-muted-foreground">
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
            ))
          )}
        </div>
      )}

      {/* ══════════ FRIENDS ══════════ */}
      {tab === "friends" && (
        <div className="space-y-4 animate-slide-up">
          {/* Pending requests */}
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

          {/* Friends list */}
          {friendsLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground">Chưa có bạn bè</p>
              <p className="text-xs text-muted-foreground">Vào tab &ldquo;Mọi người&rdquo; để gửi lời mời kết bạn.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {friends.map((friend) => (
                <div key={friend.userId}
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:bg-primary/3 transition-all duration-200"
                >
                  <UserAvatar name={friend.displayName} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{friend.displayName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <UserCheck className="h-2.5 w-2.5 text-green-400" /> Bạn bè
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openChat(friend)}
                    className="gap-1.5 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 transition-all">
                    <MessageCircleMore className="h-3.5 w-3.5" /> Nhắn tin
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ CHAT PANEL ══════════ */}
      {activeChat && (
        <div className={cn(
          "fixed z-50 right-4 w-full max-w-sm bottom-[80px] lg:bottom-4 animate-slide-up"
        )}>
          <div
            className="flex flex-col rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 overflow-hidden"
            style={{ height: "min(70vh, calc(100dvh - 160px))" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-secondary/50">
              <button onClick={closeChat} className="text-muted-foreground hover:text-foreground hover:scale-110 transition-all rounded-lg p-1">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <UserAvatar name={activeChat.displayName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{activeChat.displayName}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                  Cập nhật mỗi 5 giây
                </p>
              </div>
              <button onClick={closeChat} className="text-muted-foreground hover:text-destructive hover:scale-110 transition-all rounded-lg p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">Bắt đầu cuộc trò chuyện...</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg._id} className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm transition-all",
                  msg.fromUserId === myId
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                    : "mr-auto bg-secondary text-foreground rounded-bl-sm"
                )}>
                  {msg.content}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 flex gap-2 bg-secondary/30">
              <Input
                placeholder="Nhắn tin..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMsg()}
                className="flex-1 bg-card border-border text-sm focus:border-primary/40"
              />
              <Button
                size="sm"
                onClick={handleSendMsg}
                disabled={!chatInput.trim() || chatSending}
                className="hover:scale-105 active:scale-95 transition-transform"
              >
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

  return (
    <div className="group rounded-2xl border border-border bg-card p-4 space-y-3 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <UserAvatar name={post.displayName} />
          <div>
            <p className="text-sm font-semibold text-foreground">{post.displayName}</p>
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

      {/* Content */}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Actions */}
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

      {/* Comments */}
      {showComments && (
        <div className="space-y-2 pt-1 animate-slide-up">
          {post.comments.map((c, i) => (
            <div key={i} className="flex gap-2.5">
              <UserAvatar name={c.displayName} size="sm" />
              <div className="flex-1 rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-[11px] font-semibold text-foreground">{c.displayName}</p>
                <p className="text-xs text-foreground/80 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <UserAvatar name={myId.slice(-4)} size="sm" />
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
