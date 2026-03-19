"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"
import {
  Heart, MessageSquare, Send, UserPlus, UserCheck, Users,
  Newspaper, MessageCircle, X, Trash2, Check, Clock, ChevronLeft,
  Loader2,
} from "lucide-react"
import * as api from "@/lib/community-api"
import type {
  CommunityPost, CommunityUser, FriendUser,
  FriendRequest, ChatMessage,
} from "@/lib/community-api"

// ─── Tab keys ─────────────────────────────────────────────────────────────────
type Tab = "feed" | "people" | "friends"

// ─── Component ────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { state } = useApp()
  const myUserId = state.profile?.name
    ? undefined  // profile name is not userId, so we read from localStorage
    : undefined
  const [myId, setMyId] = useState<string>("")

  useEffect(() => {
    const uid = localStorage.getItem("unitracker_userId") ?? ""
    setMyId(uid)
  }, [])

  const myDisplayName = state.profile?.name || `Người dùng ${myId.slice(-4)}`

  const [tab, setTab] = useState<Tab>("feed")

  // ─── Feed state ─────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [postLoading, setPostLoading] = useState(false)
  const [newContent, setNewContent] = useState("")
  const [posting, setPosting] = useState(false)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})

  // ─── People state ───────────────────────────────────────────────────────────
  const [users, setUsers] = useState<CommunityUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())

  // ─── Friends state ──────────────────────────────────────────────────────────
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])

  // ─── Chat state ─────────────────────────────────────────────────────────────
  const [activeChat, setActiveChat] = useState<FriendUser | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatSending, setChatSending] = useState(false)
  const lastMsgTimestampRef = useRef<string>("")
  const chatEndRef = useRef<HTMLDivElement>(null)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ─── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab === "feed") loadPosts()
    if (tab === "people") loadUsers()
    if (tab === "friends") loadFriends()
  }, [tab])

  const loadPosts = async () => {
    setPostLoading(true)
    try {
      const data = await api.getPosts()
      setPosts(data)
    } catch { /* ignore */ } finally { setPostLoading(false) }
  }

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const [data, reqData] = await Promise.all([
        api.getCommunityUsers(),
        api.getFriendRequests(),
      ])
      setUsers(data)
      const sentSet = new Set(reqData.sent.map((r) => r.toUserId))
      setSentRequests(sentSet)
    } catch { /* ignore */ } finally { setUsersLoading(false) }
  }

  const loadFriends = async () => {
    setFriendsLoading(true)
    try {
      const [frds, reqs] = await Promise.all([
        api.getFriends(),
        api.getFriendRequests(),
      ])
      setFriends(frds)
      setPendingRequests(reqs.received)
    } catch { /* ignore */ } finally { setFriendsLoading(false) }
  }

  // ─── Post actions ────────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!newContent.trim() || posting) return
    setPosting(true)
    try {
      const post = await api.createPost(newContent.trim(), myDisplayName)
      setPosts((prev) => [post, ...prev])
      setNewContent("")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lỗi đăng bài")
    } finally { setPosting(false) }
  }

  const handleLike = async (postId: string) => {
    try {
      await api.toggleLike(postId)
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id !== postId) return p
          const liked = p.likes.includes(myId)
          return {
            ...p,
            likes: liked
              ? p.likes.filter((id) => id !== myId)
              : [...p.likes, myId],
          }
        })
      )
    } catch { /* ignore */ }
  }

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim()
    if (!content) return
    try {
      const comment = await api.addComment(postId, content, myDisplayName)
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, comments: [...p.comments, comment] } : p
        )
      )
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }))
    } catch { /* ignore */ }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Xóa bài viết này?")) return
    try {
      await api.deletePost(postId)
      setPosts((prev) => prev.filter((p) => p._id !== postId))
    } catch { /* ignore */ }
  }

  // ─── Friend actions ──────────────────────────────────────────────────────────
  const handleAddFriend = async (toUserId: string) => {
    try {
      await api.sendFriendRequest(toUserId)
      setSentRequests((prev) => new Set([...prev, toUserId]))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lỗi gửi lời mời")
    }
  }

  const handleRespond = async (reqId: string, action: "accept" | "reject") => {
    try {
      await api.respondFriendRequest(reqId, action)
      setPendingRequests((prev) => prev.filter((r) => r._id !== reqId))
      if (action === "accept") loadFriends()
    } catch { /* ignore */ }
  }

  // ─── Chat ────────────────────────────────────────────────────────────────────
  const openChat = useCallback(async (friend: FriendUser) => {
    setActiveChat(friend)
    setChatInput("")
    try {
      const msgs = await api.getMessages(friend.userId)
      setMessages(msgs)
      if (msgs.length > 0)
        lastMsgTimestampRef.current = msgs[msgs.length - 1].createdAt
    } catch { setMessages([]) }
  }, [])

  const closeChat = useCallback(() => {
    setActiveChat(null)
    setMessages([])
    if (pollTimerRef.current) clearInterval(pollTimerRef.current)
  }, [])

  // Long-poll mỗi 5s khi đang mở chat (chỉ khi panel đang mở để tránh quá tải server)
  useEffect(() => {
    if (!activeChat) return

    let running = true  // flag để tránh setState sau khi unmount

    const poll = async () => {
      if (!running || !lastMsgTimestampRef.current) return
      try {
        const newMsgs = await api.pollNewMessages(
          activeChat.userId,
          lastMsgTimestampRef.current
        )
        if (!running) return
        if (newMsgs.length > 0) {
          setMessages((prev) => [...prev, ...newMsgs])
          lastMsgTimestampRef.current = newMsgs[newMsgs.length - 1].createdAt
        }
      } catch { /* ignore */ }
    }

    pollTimerRef.current = setInterval(poll, 5000)   // ping mỗi 5 giây
    return () => {
      running = false
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [activeChat])

  // Auto scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMsg = async () => {
    if (!chatInput.trim() || !activeChat || chatSending) return
    setChatSending(true)
    const content = chatInput.trim()
    setChatInput("")
    try {
      const msg = await api.sendChatMessage(activeChat.userId, content)
      setMessages((prev) => [...prev, msg])
      lastMsgTimestampRef.current = msg.createdAt
    } catch { /* ignore */ } finally { setChatSending(false) }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "feed", label: "Bảng tin", icon: <Newspaper className="h-4 w-4" /> },
    { key: "people", label: "Mọi người", icon: <Users className="h-4 w-4" /> },
    { key: "friends", label: "Bạn bè", icon: <UserCheck className="h-4 w-4" /> },
  ]

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Cộng đồng</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kết nối với bạn học, chia sẻ trải nghiệm
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              tab === t.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Feed Tab ───────────────────────────────────────────────────────── */}
      {tab === "feed" && (
        <div className="space-y-4 animate-slide-up">
          {/* Create post */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <Textarea
              placeholder="Chia sẻ điều gì đó với cộng đồng..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="bg-secondary border-border resize-none text-sm min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handlePost}
                disabled={!newContent.trim() || posting}
                className="gap-1.5"
              >
                {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Đăng bài
              </Button>
            </div>
          </div>

          {/* Posts */}
          {postLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Chưa có bài viết nào. Hãy là người đầu tiên!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                myId={myId}
                commentInput={commentInputs[post._id] ?? ""}
                showComments={openComments[post._id] ?? false}
                onLike={() => handleLike(post._id)}
                onToggleComments={() =>
                  setOpenComments((prev) => ({ ...prev, [post._id]: !prev[post._id] }))
                }
                onCommentChange={(v) =>
                  setCommentInputs((prev) => ({ ...prev, [post._id]: v }))
                }
                onCommentSubmit={() => handleComment(post._id)}
                onDelete={() => handleDeletePost(post._id)}
              />
            ))
          )}
        </div>
      )}

      {/* ── People Tab ─────────────────────────────────────────────────────── */}
      {tab === "people" && (
        <div className="space-y-3 animate-slide-up">
          {usersLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Chưa có người dùng nào khác.</p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.userId}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-sm">
                  {user.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[user.major, user.class].filter(Boolean).join(" · ") || "FPT University"}
                  </p>
                </div>
                {sentRequests.has(user.userId) ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Đã gửi
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddFriend(user.userId)}
                    className="gap-1.5 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Kết bạn
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Friends Tab ────────────────────────────────────────────────────── */}
      {tab === "friends" && (
        <div className="space-y-4 animate-slide-up">
          {/* Pending requests */}
          {pendingRequests.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Lời mời kết bạn ({pendingRequests.length})
              </h3>
              {pendingRequests.map((req) => (
                <div key={req._id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                      {req.fromUserId.slice(-2)}
                    </div>
                    <p className="text-sm text-foreground truncate">
                      {req.fromUserId}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleRespond(req._id, "accept")}
                      className="h-7 px-2 gap-1 text-xs"
                    >
                      <Check className="h-3 w-3" /> Đồng ý
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespond(req._id, "reject")}
                      className="h-7 px-2 gap-1 text-xs"
                    >
                      <X className="h-3 w-3" /> Từ chối
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Friends list */}
          {friendsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Chưa có bạn bè. Hãy gửi lời mời kết bạn!</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.userId}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-sm">
                  {friend.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {friend.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">Bạn bè</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openChat(friend)}
                  className="gap-1.5 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Nhắn tin
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Chat Panel (slide-in) ─────────────────────────────────────────── */}
      {activeChat && (
        <div
          className={cn(
            "fixed z-50 right-4 w-full max-w-sm",
            // Trên mobile: cách footer nav (~64px) + 8px padding
            // Trên desktop (lg+): không có footer nav, chỉ cần 1rem
            "bottom-[80px] lg:bottom-4",
            "animate-slide-up"
          )}
        >
          <div
            className="flex flex-col rounded-2xl border border-border bg-card shadow-2xl"
            style={{ height: "min(70vh, calc(100dvh - 160px))" }}
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <button
                onClick={closeChat}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                {activeChat.displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{activeChat.displayName}</p>
                  <p className="text-xs text-muted-foreground">Cập nhật mỗi 5 giây</p>
              </div>
              <button
                onClick={closeChat}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Bắt đầu cuộc trò chuyện...
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    msg.fromUserId === myId
                      ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                      : "mr-auto bg-secondary text-foreground rounded-bl-sm"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 flex gap-2">
              <Input
                placeholder="Nhắn tin..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMsg()}
                className="flex-1 bg-secondary border-border text-sm"
              />
              <Button
                size="sm"
                onClick={handleSendMsg}
                disabled={!chatInput.trim() || chatSending}
                className="gap-1"
              >
                {chatSending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PostCard component ───────────────────────────────────────────────────────
function PostCard({
  post,
  myId,
  commentInput,
  showComments,
  onLike,
  onToggleComments,
  onCommentChange,
  onCommentSubmit,
  onDelete,
}: {
  post: CommunityPost
  myId: string
  commentInput: string
  showComments: boolean
  onLike: () => void
  onToggleComments: () => void
  onCommentChange: (v: string) => void
  onCommentSubmit: () => void
  onDelete: () => void
}) {
  const liked = post.likes.includes(myId)
  const isOwner = post.userId === myId

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-border/80 transition-colors animate-fade-in">
      {/* Post header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
            {post.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{post.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1 border-t border-border/50">
        <button
          onClick={onLike}
          className={cn(
            "flex items-center gap-1.5 text-sm transition-colors",
            liked
              ? "text-red-400 hover:text-red-300"
              : "text-muted-foreground hover:text-red-400"
          )}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {post.likes.length > 0 && <span>{post.likes.length}</span>}
        </button>
        <button
          onClick={onToggleComments}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          {post.comments.length > 0 && <span>{post.comments.length}</span>}
          <span className="text-xs">Bình luận</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="space-y-2 pt-1">
          {post.comments.map((c, i) => (
            <div key={i} className="flex gap-2">
              <div className="h-6 w-6 shrink-0 rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                {c.displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 rounded-lg bg-secondary px-3 py-1.5">
                <p className="text-xs font-medium text-foreground">{c.displayName}</p>
                <p className="text-xs text-foreground/80">{c.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Input
              placeholder="Viết bình luận..."
              value={commentInput}
              onChange={(e) => onCommentChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onCommentSubmit()}
              className="flex-1 h-8 text-xs bg-secondary border-border"
            />
            <Button
              size="sm"
              className="h-8 px-2"
              onClick={onCommentSubmit}
              disabled={!commentInput.trim()}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
