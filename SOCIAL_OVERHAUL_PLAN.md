# Social Media Overhaul Plan
## Cultural Exchange App - World Facebook POC → Production

---

## Executive Summary

Transform the current POC social features into a polished, efficient, and delightful user experience. Focus on **good UX**, clean architecture, and scalability.

---

## Phase 1: Critical UX Fixes (Week 1)
**Goal**: Make existing features actually usable and delightful

### 1.1 Feed Interactions (2 days)
**Problem**: Posts are read-only cards with no interaction
**Solution**: Add interactive elements with micro-animations

```tsx
// NEW: PostCard component with interactions
<PostCard>
  <PostHeader user={post.userId} city={post.cityId} timestamp={post.createdAt} />
  <PostContent title={post.title} description={post.description} photos={post.photos} />
  <PostActions>
    <LikeButton
      count={post.likes.length}
      isLiked={post.likes.includes(currentUserId)}
      onToggle={() => handleLike(post._id)}
      // Animate heart bounce on like
    />
    <CommentButton
      count={post.comments.length}
      onClick={() => setShowComments(!showComments)}
    />
    <ShareButton
      onShare={() => copyPostLink(post._id)}
    />
    <BookmarkButton
      isSaved={user.savedPosts.includes(post._id)}
      onToggle={() => handleBookmark(post._id)}
    />
  </PostActions>

  {showComments && (
    <CommentSection
      comments={post.comments}
      onAdd={(text) => addComment(post._id, text)}
      onEdit={(commentId, text) => editComment(post._id, commentId, text)}
      onDelete={(commentId) => deleteComment(post._id, commentId)}
    />
  )}
</PostCard>
```

**UX Details**:
- Heart animation on like (scale + color change)
- Comment count badge pulses when new comment added
- Inline comment composer with auto-focus
- Show "X and Y others liked this" text under post
- Optimistic UI updates (instant feedback, rollback on error)

### 1.2 Infinite Scroll + Pull to Refresh (1 day)
**Problem**: Feed loads once, no pagination, stale content
**Solution**: React Query + intersection observer

```tsx
const {
  data,
  fetchNextPage,
  hasNextPage,
  refetch,
  isRefetching
} = useInfiniteQuery({
  queryKey: ['feed', feedType],
  queryFn: ({ pageParam = 0 }) => fetchFeed(feedType, pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor
});

// Pull-to-refresh on mobile
<PullToRefresh onRefresh={refetch} isRefreshing={isRefreshing}>
  <FeedList>
    {data.pages.map(page => page.posts.map(post => ...))}
    {hasNextPage && <InfiniteScrollTrigger onVisible={fetchNextPage} />}
  </FeedList>
</PullToRefresh>
```

### 1.3 Rich Comment UI (1 day)
**Problem**: Comments hidden, no inline replies, no editing
**Solution**: Nested comment threads with rich interactions

```tsx
<CommentThread>
  <Comment
    user={comment.user}
    text={comment.text}
    timestamp={comment.createdAt}
    edited={comment.editedAt}
    onReply={() => setReplyingTo(comment._id)}
    onEdit={() => setEditingComment(comment)}
    onLike={() => likeComment(comment._id)}
    likes={comment.likes?.length || 0}
  />

  {comment.replies?.map(reply => (
    <CommentReply key={reply._id} {...reply} />
  ))}

  {replyingTo === comment._id && (
    <CommentComposer
      placeholder={`Reply to ${comment.user.username}...`}
      onSubmit={(text) => addReply(comment._id, text)}
      onCancel={() => setReplyingTo(null)}
    />
  )}
</CommentThread>
```

**UX Details**:
- Show "Reply" link under each comment
- Indent replies visually (max 2 levels deep)
- Click "View X replies" to expand thread
- Edit shows pencil icon, saves with "Edited" label
- Relative timestamps ("2 min ago", "Yesterday at 3:14 PM")

### 1.4 Typing Indicators + Read Receipts (1 day)
**Problem**: Socket events exist but no UI feedback
**Solution**: WhatsApp-style conversation UI

```tsx
<MessageThread>
  {messages.map(msg => (
    <MessageBubble
      text={msg.content}
      timestamp={msg.createdAt}
      isSent={msg.sender === currentUserId}
      status={msg.read ? 'read' : 'delivered'}
      // Show double checkmark when read
    />
  ))}

  {isTyping && (
    <TypingIndicator user={otherUser}>
      <TypingDots /> {/* Animated ... dots */}
    </TypingIndicator>
  )}

  <MessageComposer
    onType={() => socket.emit('typing', { receiver: otherUserId })}
    onStopType={() => socket.emit('stop_typing', { receiver: otherUserId })}
    onSend={(text) => sendMessage(text)}
  />
</MessageThread>
```

**UX Details**:
- Typing indicator appears below last message
- Debounce typing events (500ms)
- Auto-scroll to bottom when new message
- Checkmarks: single (sent), double (delivered), blue double (read)
- Show timestamp on hover

### 1.5 Real-time Updates Everywhere (1 day)
**Problem**: Feed/notifications don't update live
**Solution**: Socket.io subscriptions + React Query invalidation

```tsx
useEffect(() => {
  // Subscribe to real-time events
  socket.on('new_post', (post) => {
    queryClient.invalidateQueries(['feed']);
    toast.info(`${post.userId.username} posted in ${post.cityId.name}`);
  });

  socket.on('post_liked', ({ postId, userId }) => {
    queryClient.setQueryData(['post', postId], (old) => ({
      ...old,
      likes: [...old.likes, userId]
    }));
  });

  socket.on('new_comment', ({ postId, comment }) => {
    queryClient.setQueryData(['post', postId], (old) => ({
      ...old,
      comments: [...old.comments, comment]
    }));
    if (comment.userId !== currentUserId) {
      showNotificationToast('New comment on your post');
    }
  });

  return () => {
    socket.off('new_post');
    socket.off('post_liked');
    socket.off('new_comment');
  };
}, []);
```

---

## Phase 2: Architecture Refactor (Week 2)
**Goal**: Clean, efficient, scalable code

### 2.1 Separate Comments Collection
**Problem**: Comments array in Post gets huge (10k+ comments = slow queries)
**Solution**: New Comment model with references

```typescript
// NEW: server/src/models/Comment.ts
interface IComment {
  postId: ObjectId;
  userId: ObjectId;
  text: string;
  parentId?: ObjectId; // For nested replies
  likes: ObjectId[];
  editedAt?: Date;
  deletedAt?: Date; // Soft delete
  createdAt: Date;
}

// Index: { postId: 1, createdAt: -1 } for fast post comment queries
// Index: { parentId: 1 } for nested replies
```

**Migration Strategy**:
- Create script to move existing comments to new collection
- Keep old field for 1 week (backwards compatibility)
- Update all routes to use new Comment model
- Remove old field after migration confirmed

### 2.2 Pagination Everywhere
**Backend**: Cursor-based pagination for infinite scroll

```typescript
// NEW: server/src/utils/pagination.ts
export interface PaginationParams {
  cursor?: string; // Last item ID from previous page
  limit?: number;  // Default 20
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function paginateQuery<T>(
  model: Model<T>,
  query: FilterQuery<T>,
  { cursor, limit = 20 }: PaginationParams
): Promise<PaginatedResponse<T>> {
  const filter = cursor
    ? { ...query, _id: { $lt: new ObjectId(cursor) } }
    : query;

  const data = await model
    .find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1);

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, -1) : data;
  const nextCursor = hasMore ? items[items.length - 1]._id.toString() : null;

  return { data: items, nextCursor, hasMore };
}
```

**Apply to**:
- Feed posts (20 per page)
- Comments (50 per page)
- Messages (50 per page)
- Connections (30 per page)
- Notifications (25 per page)

### 2.3 Fix Legacy Field Inconsistencies
**Problem**: Mixed `userId` vs `author`, duplicate User fields

```typescript
// REMOVE from Post model
author?: string;      // Legacy
content?: string;     // Legacy (use description)
category?: string;    // Legacy (use type)
images?: string[];    // Legacy (use photos)

// STANDARDIZE User model
interface IUser {
  // Keep only one location for profile data
  username: string;
  email: string;
  password: string;
  role: 'user' | 'moderator' | 'admin';

  // Move everything else to profile
  profile: {
    name?: string;
    bio?: string;
    country?: string;
    languages?: string[];
    languagesToLearn?: string[];
    interests?: string[];
    photos?: string[];
    cityLocation?: ObjectId;
    age?: number;
  };

  // Social
  blockedUsers: ObjectId[];
  savedPosts: ObjectId[];

  // Settings
  settings: {
    emailNotifications: boolean;
    messagingPrivacy: 'open' | 'friendsOnly';
    profileVisibility: 'public' | 'friendsOnly' | 'private';
  };

  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Migration Script**:
```typescript
// migrations/01-standardize-user-fields.ts
async function migrateUsers() {
  const users = await User.find({ name: { $exists: true } });

  for (const user of users) {
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          'profile.name': user.name,
          'profile.country': user.country,
          'profile.languages': user.languages,
        },
        $unset: {
          name: '',
          country: '',
          languages: '',
        }
      }
    );
  }
}
```

### 2.4 Optimize Queries with Aggregation
**Problem**: N+1 queries in feed (fetch posts, then populate each user/city)

```typescript
// NEW: Optimized feed query
router.get('/feed/activity', authMiddleware, async (req: AuthRequest, res) => {
  const { cursor, limit = 20 } = req.query;

  // Get accepted connections
  const connections = await Connection.find({
    $or: [{ user1: req.userId }, { user2: req.userId }],
    status: 'accepted'
  });

  const friendIds = connections.map(conn =>
    conn.user1.equals(req.userId) ? conn.user2 : conn.user1
  );

  // Single aggregation pipeline
  const posts = await Post.aggregate([
    // Filter by friends' posts
    { $match: {
      userId: { $in: friendIds },
      status: 'approved',
      ...(cursor && { _id: { $lt: new ObjectId(cursor) } })
    }},

    // Sort and limit
    { $sort: { _id: -1 } },
    { $limit: limit + 1 },

    // Join user data
    { $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'user',
      pipeline: [
        { $project: { username: 1, 'profile.photos': 1, lastActive: 1 } }
      ]
    }},
    { $unwind: '$user' },

    // Join city data
    { $lookup: {
      from: 'cities',
      localField: 'cityId',
      foreignField: '_id',
      as: 'city',
      pipeline: [
        { $project: { name: 1, country: 1 } }
      ]
    }},
    { $unwind: '$city' },

    // Add comment count (from new Comment collection)
    { $lookup: {
      from: 'comments',
      localField: '_id',
      foreignField: 'postId',
      pipeline: [
        { $match: { deletedAt: { $exists: false } } },
        { $count: 'count' }
      ],
      as: 'commentCount'
    }},
    { $addFields: {
      commentCount: { $arrayElemAt: ['$commentCount.count', 0] }
    }},

    // Add like count
    { $addFields: {
      likeCount: { $size: '$likes' },
      isLiked: { $in: [req.userId, '$likes'] }
    }},

    // Remove sensitive fields
    { $project: { likes: 0 } }
  ]);

  const hasMore = posts.length > limit;
  const data = hasMore ? posts.slice(0, -1) : posts;
  const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null;

  res.json({ data, nextCursor, hasMore });
});
```

### 2.5 Add Redis Caching
**Problem**: Wikipedia/YouTube/News API calls on every tab switch

```typescript
// NEW: server/src/utils/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600 // 1 hour default
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Usage in external API routes
router.get('/wiki/:cityId', async (req, res) => {
  const { cityId } = req.params;
  const city = await City.findById(cityId);

  const data = await getCached(
    `wiki:${city.name}:${city.country}`,
    () => fetchWikipediaData(city.name, city.country),
    86400 // Cache for 24 hours
  );

  res.json(data);
});
```

---

## Phase 3: New Features (Week 3-4)
**Goal**: Add missing social features with great UX

### 3.1 Rich Notifications System
**Problem**: Basic notifications, no grouping, no preferences

```tsx
// NEW: Notification feed with smart grouping
<NotificationFeed>
  {notificationGroups.map(group => (
    group.type === 'likes' ? (
      // Group: "John and 5 others liked your post"
      <NotificationGroup key={group.key}>
        <NotificationIcon type="like" />
        <NotificationText>
          <strong>{group.users.slice(0, 2).map(u => u.username).join(', ')}</strong>
          {group.count > 2 && ` and ${group.count - 2} others`}
          {' '}liked your post
          <strong>"{truncate(group.post.title, 40)}"</strong>
        </NotificationText>
        <NotificationTime>{group.latestTime}</NotificationTime>
        <NotificationActions>
          <button onClick={() => viewPost(group.post._id)}>View</button>
          <button onClick={() => dismissGroup(group.key)}>Dismiss</button>
        </NotificationActions>
      </NotificationGroup>
    ) : group.type === 'comments' ? (
      // Group: "3 new comments on your post"
      <NotificationGroup key={group.key}>
        <NotificationIcon type="comment" />
        <NotificationText>
          <strong>{group.count} new comments</strong>
          {' '}on your post
          <strong>"{truncate(group.post.title, 40)}"</strong>
        </NotificationText>
        <NotificationPreview>
          {group.latestComment.text}
        </NotificationPreview>
        <NotificationActions>
          <button onClick={() => viewPost(group.post._id)}>Reply</button>
        </NotificationActions>
      </NotificationGroup>
    ) : (
      // Standard notification
      <Notification key={group._id} {...group} />
    )
  ))}
</NotificationFeed>

// Backend: Deduplication logic
async function getGroupedNotifications(userId: ObjectId) {
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(100);

  const groups = new Map();

  for (const notif of notifications) {
    if (notif.type === 'postLike') {
      const key = `like:${notif.relatedId}`;
      if (!groups.has(key)) {
        groups.set(key, {
          type: 'likes',
          key,
          postId: notif.relatedId,
          users: [],
          count: 0,
          latestTime: notif.createdAt
        });
      }
      const group = groups.get(key);
      group.users.push(notif.triggerUser);
      group.count++;
    }
    // Similar logic for comments, connections, etc.
  }

  return Array.from(groups.values());
}
```

### 3.2 User Mentions (@username)
**Problem**: Can't mention users in comments/posts

```typescript
// NEW: Mention parsing and linking
function parseMentions(text: string): {
  text: string;
  mentions: string[];
} {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];

  const parsedText = text.replace(mentionRegex, (match, username) => {
    mentions.push(username);
    return `<a href="/profile/${username}" class="mention">@${username}</a>`;
  });

  return { text: parsedText, mentions };
}

// In comment creation
router.post('/:id/comment', authMiddleware, async (req, res) => {
  const { text } = req.body;
  const { text: parsedText, mentions } = parseMentions(text);

  const comment = await Comment.create({
    postId: req.params.id,
    userId: req.userId,
    text: parsedText,
    mentions: mentions
  });

  // Send notifications to mentioned users
  const mentionedUsers = await User.find({ username: { $in: mentions } });
  for (const user of mentionedUsers) {
    await Notification.create({
      userId: user._id,
      type: 'mention',
      relatedId: req.params.id,
      content: `${req.user.username} mentioned you in a comment`
    });
    socket.to(user._id).emit('new_notification', { type: 'mention' });
  }

  res.json(comment);
});
```

**Frontend**: Autocomplete mentions

```tsx
<CommentComposer>
  <MentionTextarea
    value={text}
    onChange={setText}
    onMentionSearch={(query) => searchUsers(query)}
    renderSuggestion={(user) => (
      <UserSuggestion>
        <Avatar src={user.profile.photos[0]} />
        <Username>{user.username}</Username>
      </UserSuggestion>
    )}
  />
</CommentComposer>
```

### 3.3 Emoji Reactions
**Problem**: Only "like" (heart) supported

```tsx
// NEW: Multi-reaction picker (Facebook-style)
<Post>
  <ReactionBar>
    {reactions.map(reaction => (
      <ReactionButton
        key={reaction.type}
        emoji={reaction.emoji}
        count={post.reactions[reaction.type]?.length || 0}
        isActive={post.reactions[reaction.type]?.includes(currentUserId)}
        onClick={() => toggleReaction(post._id, reaction.type)}
      />
    ))}

    <ReactionPicker
      trigger={<AddReactionButton>+</AddReactionButton>}
      onSelect={(type) => addReaction(post._id, type)}
    >
      {REACTIONS.map(r => (
        <ReactionOption key={r.type} emoji={r.emoji} label={r.label} />
      ))}
    </ReactionPicker>
  </ReactionBar>

  <ReactionSummary>
    {/* "😍 Sarah and 12 others" */}
    {topReactions.map((r, i) => (
      <span key={r.type}>
        {r.emoji} {r.users.slice(0, 2).map(u => u.username).join(', ')}
        {r.count > 2 && ` and ${r.count - 2} others`}
      </span>
    ))}
  </ReactionSummary>
</Post>

// Backend: Update Post model
interface IPost {
  // ... existing fields
  reactions: {
    like: ObjectId[];
    love: ObjectId[];
    haha: ObjectId[];
    wow: ObjectId[];
    sad: ObjectId[];
    angry: ObjectId[];
  };
}

// Maintain backwards compatibility
get likes() {
  return this.reactions.like || [];
}
```

### 3.4 Friend Suggestions
**Problem**: No way to discover connections

```typescript
// NEW: Smart friend suggestion algorithm
async function getSuggestedConnections(userId: ObjectId, limit = 10) {
  // Get user's existing connections
  const existingConnections = await Connection.find({
    $or: [{ user1: userId }, { user2: userId }]
  });

  const connectedUserIds = existingConnections.map(c =>
    c.user1.equals(userId) ? c.user2 : c.user1
  );

  // Algorithm: Mutual friends + shared interests + same city
  const suggestions = await User.aggregate([
    // Exclude self and existing connections
    { $match: {
      _id: {
        $nin: [userId, ...connectedUserIds]
      }
    }},

    // Find mutual friends
    { $lookup: {
      from: 'connections',
      let: { suggestedUserId: '$_id' },
      pipeline: [
        { $match: {
          $expr: {
            $and: [
              { $or: [
                { $eq: ['$user1', '$$suggestedUserId'] },
                { $eq: ['$user2', '$$suggestedUserId'] }
              ]},
              { $or: [
                { $in: ['$user1', connectedUserIds] },
                { $in: ['$user2', connectedUserIds] }
              ]},
              { $eq: ['$status', 'accepted'] }
            ]
          }
        }}
      ],
      as: 'mutualConnections'
    }},

    // Get user's interests for matching
    { $addFields: {
      mutualFriendCount: { $size: '$mutualConnections' },
      // Score based on multiple factors
      suggestionScore: {
        $add: [
          { $multiply: [{ $size: '$mutualConnections' }, 10] }, // 10 points per mutual friend
          // Bonus for shared interests/city (would need current user's data)
        ]
      }
    }},

    // Only show if score > 0 (has mutual friends)
    { $match: { mutualFriendCount: { $gt: 0 } } },

    // Sort by score
    { $sort: { suggestionScore: -1 } },
    { $limit: limit },

    // Project relevant fields
    { $project: {
      username: 1,
      'profile.name': 1,
      'profile.photos': 1,
      'profile.country': 1,
      'profile.cityLocation': 1,
      mutualFriendCount: 1,
      mutualConnections: { $slice: ['$mutualConnections', 3] } // Show up to 3 mutual friends
    }}
  ]);

  return suggestions;
}
```

**Frontend**: Suggestions page

```tsx
<SuggestionsPage>
  <SectionHeader>People You May Know</SectionHeader>

  {suggestions.map(user => (
    <SuggestionCard key={user._id}>
      <UserAvatar src={user.profile.photos[0]} />
      <UserInfo>
        <Username>{user.username}</Username>
        <MutualFriends>
          {user.mutualFriendCount} mutual friends
          {user.mutualConnections.length > 0 && (
            <MutualList>
              including {user.mutualConnections.map(c => c.username).join(', ')}
            </MutualList>
          )}
        </MutualFriends>
      </UserInfo>
      <ConnectButton onClick={() => sendConnectionRequest(user._id)}>
        Add Friend
      </ConnectButton>
    </SuggestionCard>
  ))}
</SuggestionsPage>
```

### 3.5 Post Drafts & Auto-save
**Problem**: Lose work if browser crashes

```typescript
// NEW: Draft model
interface IDraft {
  userId: ObjectId;
  type: PostType;
  title?: string;
  description?: string;
  cityId?: ObjectId;
  tags?: string[];
  metadata?: any;
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Frontend: Auto-save with debounce
function useAutosave(draftId: string | null) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const debouncedSave = useDebouncedCallback(
    async (data: Partial<Draft>) => {
      if (draftId) {
        await api.put(`/drafts/${draftId}`, data);
      } else {
        const response = await api.post('/drafts', data);
        setDraft(response.data);
      }
    },
    1000 // Save after 1 second of no typing
  );

  return { draft, saveDraft: debouncedSave };
}

// Usage in CreatePost
function CreatePost() {
  const { draft, saveDraft } = useAutosave(draftId);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    saveDraft({ [field]: value });
  };

  return (
    <Form>
      {draft && <DraftIndicator>Draft saved {formatTime(draft.updatedAt)}</DraftIndicator>}
      {/* ... form fields ... */}
    </Form>
  );
}
```

---

## Phase 4: UX Polish (Week 5)
**Goal**: Delight users with smooth, intuitive interactions

### 4.1 Skeleton Loading States
**Problem**: Blank screens while loading

```tsx
// NEW: Content skeletons
<FeedSkeleton>
  {Array(5).fill(0).map((_, i) => (
    <PostCardSkeleton key={i}>
      <SkeletonHeader>
        <SkeletonAvatar />
        <SkeletonText width="40%" height="16px" />
        <SkeletonText width="30%" height="14px" />
      </SkeletonHeader>
      <SkeletonText width="90%" height="20px" />
      <SkeletonText width="100%" height="16px" />
      <SkeletonText width="80%" height="16px" />
      <SkeletonImage height="300px" />
      <SkeletonActions />
    </PostCardSkeleton>
  ))}
</FeedSkeleton>
```

### 4.2 Optimistic UI Updates
**Problem**: Actions feel slow, require server response

```tsx
function useLikePost(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post(`/posts/${postId}/like`),

    // Optimistic update - instant feedback
    onMutate: async () => {
      await queryClient.cancelQueries(['post', postId]);

      const previous = queryClient.getQueryData(['post', postId]);

      queryClient.setQueryData(['post', postId], (old: Post) => ({
        ...old,
        likes: [...old.likes, currentUserId],
        likeCount: old.likeCount + 1,
        isLiked: true
      }));

      return { previous };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      queryClient.setQueryData(['post', postId], context.previous);
      toast.error('Failed to like post');
    },

    // Sync with server response
    onSuccess: (data) => {
      queryClient.setQueryData(['post', postId], data);
    }
  });
}
```

### 4.3 Smart Error Messages
**Problem**: Generic "Failed to..." errors

```typescript
// NEW: Error handler with context
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public userMessage?: string
  ) {
    super(message);
  }
}

// Usage in routes
if (!post) {
  throw new AppError(
    'Post not found in database',
    'POST_NOT_FOUND',
    404,
    'This post has been deleted or is no longer available.'
  );
}

if (!canEditPost(req.userId, post)) {
  throw new AppError(
    `User ${req.userId} attempted to edit post ${post._id} without permission`,
    'FORBIDDEN',
    403,
    'You don\'t have permission to edit this post.'
  );
}

// Frontend error display
function ErrorToast({ error }: { error: ApiError }) {
  return (
    <Toast variant="error">
      <ErrorIcon />
      <ErrorContent>
        <ErrorTitle>{getErrorTitle(error.code)}</ErrorTitle>
        <ErrorMessage>{error.userMessage || error.message}</ErrorMessage>
        {error.code === 'NETWORK_ERROR' && (
          <ErrorAction onClick={retry}>Retry</ErrorAction>
        )}
      </ErrorContent>
    </Toast>
  );
}
```

### 4.4 Keyboard Shortcuts
**Problem**: Mouse-only navigation is slow

```tsx
// NEW: Global keyboard shortcuts
useKeyboardShortcuts({
  'g h': () => navigate('/feed'),           // Go home
  'g n': () => navigate('/notifications'),  // Go notifications
  'g m': () => navigate('/messages'),       // Go messages
  'n': () => openCreatePost(),              // New post
  '/': () => focusSearch(),                 // Focus search
  'Escape': () => closeModal(),             // Close modals
  '?': () => showShortcutsHelp(),          // Show help
});

// In message composer
<MessageInput
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Shift+Enter for newline
  }}
/>
```

### 4.5 Micro-interactions & Animations
**Problem**: Static UI feels lifeless

```scss
// Like button animation
@keyframes heartBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.like-button.active {
  animation: heartBounce 0.3s ease-out;
  color: #ff0000;
}

// Comment slide-in
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.comment {
  animation: slideIn 0.2s ease-out;
}

// Notification badge pulse
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.notification-badge.has-new {
  animation: pulse 2s infinite;
}
```

---

## Phase 5: Seed Data Generation (Week 6)
**Goal**: Populate cities with realistic content for testing/demo

### 5.1 Seed Data Structure

```typescript
// NEW: server/src/data/seedPosts.ts
export const SEED_POSTS = [
  // Paris posts
  {
    cityName: 'Paris',
    country: 'France',
    posts: [
      {
        type: 'insight',
        title: 'Hidden Gem: Canal Saint-Martin',
        description: 'This canal in the 10th arrondissement is perfect for picnics and people-watching. Locals gather here on sunny days. Much less touristy than the Eiffel Tower area!',
        tags: ['hidden-gems', 'local-life', 'outdoors'],
        photos: []
      },
      {
        type: 'food',
        title: 'Best Croissant in the Marais',
        description: 'After trying dozens, Boulangerie Bo on Rue de Turenne has the most buttery, flaky croissants. Get there before 9am - they sell out!',
        tags: ['bakery', 'breakfast', 'le-marais'],
        metadata: {
          foodType: 'Bakery',
          locationDetails: 'Rue de Turenne, Le Marais'
        }
      },
      {
        type: 'recipe',
        title: 'Authentic Ratatouille',
        description: 'A classic Provençal dish that every Parisian grandma makes differently. Here\'s my version.',
        tags: ['french-cuisine', 'vegetarian', 'traditional'],
        metadata: {
          servings: 6,
          prepTime: 20,
          cookTime: 45,
          ingredients: [
            '2 eggplants, sliced',
            '2 zucchinis, sliced',
            '4 tomatoes, sliced',
            '1 onion, diced',
            '4 cloves garlic, minced',
            'Fresh basil',
            'Olive oil',
            'Salt & pepper'
          ],
          instructions: [
            'Preheat oven to 375°F (190°C)',
            'Sauté onion and garlic in olive oil until soft',
            'Layer vegetables in a baking dish, alternating types',
            'Drizzle with olive oil, season with salt and pepper',
            'Bake for 45 minutes until vegetables are tender',
            'Garnish with fresh basil'
          ]
        }
      },
      {
        type: 'story',
        title: 'The Legend of Pont Neuf',
        description: 'Despite its name meaning "New Bridge," Pont Neuf is actually the oldest standing bridge in Paris. Built in 1607, it was revolutionary for being the first bridge without houses built on it, allowing Parisians to see the Seine for the first time.',
        tags: ['history', 'architecture', 'legend']
      },
      {
        type: 'music',
        title: 'Édith Piaf - La Vie en Rose',
        description: 'The most iconic French song of all time. Piaf\'s voice captures the romance of Paris like nothing else.',
        tags: ['chanson', 'classic', 'romance'],
        metadata: {
          artist: 'Édith Piaf',
          musicType: 'Chanson française',
          audioLink: 'https://www.youtube.com/watch?v=kFzViYkZAz4'
        }
      },
      {
        type: 'workExchange',
        title: 'Help at English Bookshop',
        description: 'Shakespeare and Company bookstore offers room & board in exchange for helping in the shop and with events. A dream opportunity for book lovers!',
        tags: ['books', 'cultural-exchange', 'accommodation'],
        metadata: {
          workType: 'Retail/Events',
          duration: '1-3 months',
          offered: 'Private room, meals, book discount',
          requirements: 'English fluency, love of literature, minimum 1 month commitment'
        }
      },
      {
        type: 'forum',
        title: 'Meetup for expats?',
        description: 'Looking for English-speaking expats to grab drinks and explore the city. Anyone interested in meeting up this weekend?',
        tags: ['expats', 'meetup', 'social']
      }
    ]
  },

  // Tokyo posts
  {
    cityName: 'Tokyo',
    country: 'Japan',
    posts: [
      {
        type: 'insight',
        title: 'Navigating Tokyo Trains',
        description: 'Get a Suica or Pasmo card immediately. The trains are incredibly efficient but can be confusing. Download the Google Maps app - it has perfect transit directions. Avoid rush hour (7-9am, 5-7pm) if possible.',
        tags: ['transportation', 'tips', 'first-time']
      },
      {
        type: 'food',
        title: 'Tsukiji Outer Market Breakfast',
        description: 'Even though the inner market moved, the outer market is still amazing. Get fresh sushi for breakfast at Sushi Dai - worth the wait!',
        tags: ['sushi', 'market', 'breakfast'],
        metadata: {
          foodType: 'Seafood/Sushi',
          locationDetails: 'Tsukiji Outer Market, Chuo'
        }
      },
      {
        type: 'photo',
        title: 'Cherry Blossoms at Meguro River',
        description: 'Peak sakura season! The tunnel of cherry blossoms along this river is breathtaking.',
        tags: ['cherry-blossoms', 'spring', 'nature']
      },
      {
        type: 'story',
        title: 'The 47 Ronin',
        description: 'One of Japan\'s most famous tales of loyalty and honor. In 1701, 47 samurai avenged their master\'s death and became national heroes. Their graves are at Sengaku-ji Temple.',
        tags: ['samurai', 'history', 'honor']
      },
      {
        type: 'music',
        title: 'City Pop: Mariya Takeuchi - Plastic Love',
        description: 'This 1984 song became a global phenomenon decades later. The sound of 80s Tokyo nightlife.',
        tags: ['city-pop', '80s', 'retro'],
        metadata: {
          artist: 'Mariya Takeuchi',
          musicType: 'City Pop',
          audioLink: 'https://www.youtube.com/watch?v=3bNITQR4Uso'
        }
      }
    ]
  },

  // New York posts
  {
    cityName: 'New York',
    country: 'USA',
    posts: [
      {
        type: 'insight',
        title: 'Free Activities in NYC',
        description: 'Brooklyn Bridge walk at sunset, Staten Island Ferry (free with incredible views), High Line park, free museum hours on Friday nights, comedy shows in parks during summer.',
        tags: ['budget', 'free', 'activities']
      },
      {
        type: 'food',
        title: 'Best Pizza: Joe\'s in Greenwich Village',
        description: 'Classic NYC slice. $3, perfect fold, greasy delicious cheese. This is what people mean by "New York pizza."',
        tags: ['pizza', 'cheap-eats', 'village'],
        metadata: {
          foodType: 'Pizza',
          locationDetails: 'Carmine St, Greenwich Village'
        }
      },
      {
        type: 'recipe',
        title: 'New York Cheesecake',
        description: 'The real deal - dense, rich, and creamy. Not the light Japanese version.',
        tags: ['dessert', 'baking', 'american'],
        metadata: {
          servings: 12,
          prepTime: 30,
          cookTime: 60,
          ingredients: [
            '5 packages (8oz each) cream cheese, softened',
            '1 3/4 cups sugar',
            '3 tablespoons flour',
            '5 eggs',
            '2 egg yolks',
            '1/4 cup heavy cream',
            '1 teaspoon vanilla',
            'Graham cracker crust'
          ],
          instructions: [
            'Preheat oven to 325°F',
            'Beat cream cheese until fluffy',
            'Add sugar and flour, mix well',
            'Add eggs one at a time',
            'Add cream and vanilla',
            'Pour into springform pan with crust',
            'Bake 60-70 minutes until set',
            'Cool completely, refrigerate overnight'
          ]
        }
      }
    ]
  },

  // Barcelona posts
  {
    cityName: 'Barcelona',
    country: 'Spain',
    posts: [
      {
        type: 'insight',
        title: 'Skip La Rambla',
        description: 'La Rambla is overrated and full of pickpockets. Instead, explore Gràcia neighborhood for authentic Barcelona vibes. Amazing plazas, local bars, and way fewer tourists.',
        tags: ['neighborhoods', 'local-life', 'avoid-tourists']
      },
      {
        type: 'food',
        title: 'Authentic Paella Experience',
        description: 'Real paella is from Valencia, but Barcelona does it well. Go on Sundays - it\'s a tradition. Try Can Majó in Barceloneta, right by the beach.',
        tags: ['paella', 'seafood', 'sunday-tradition'],
        metadata: {
          foodType: 'Paella/Seafood',
          locationDetails: 'Can Majó, Barceloneta'
        }
      },
      {
        type: 'story',
        title: 'Gaudí\'s Unfinished Masterpiece',
        description: 'La Sagrada Família has been under construction since 1882. Gaudí knew he wouldn\'t finish it, saying "My client is not in a hurry." Expected completion: 2026.',
        tags: ['gaudi', 'architecture', 'history']
      }
    ]
  },

  // Bangkok posts
  {
    cityName: 'Bangkok',
    country: 'Thailand',
    posts: [
      {
        type: 'insight',
        title: 'Beat the Heat',
        description: 'Bangkok is HOT. Carry a small towel, stay hydrated, and plan indoor activities (malls, temples) during peak heat (12-3pm). Night markets are cooler and more fun.',
        tags: ['weather', 'tips', 'survival-guide']
      },
      {
        type: 'food',
        title: 'Street Food at Yaowarat Road',
        description: 'Chinatown\'s street food scene is legendary. Go hungry and try everything: pad thai, mango sticky rice, satay, fresh fruit smoothies.',
        tags: ['street-food', 'chinatown', 'night-market'],
        metadata: {
          foodType: 'Street Food',
          locationDetails: 'Yaowarat Road, Chinatown'
        }
      },
      {
        type: 'recipe',
        title: 'Quick Pad Thai at Home',
        description: 'Easier than you think! The key is having all ingredients prepped before you start cooking.',
        tags: ['thai', 'noodles', 'quick-meal'],
        metadata: {
          servings: 2,
          prepTime: 20,
          cookTime: 10,
          ingredients: [
            '200g rice noodles',
            '2 eggs',
            '200g shrimp or tofu',
            '3 tbsp tamarind paste',
            '2 tbsp fish sauce',
            '2 tbsp sugar',
            'Bean sprouts',
            'Peanuts, crushed',
            'Lime wedges',
            'Green onions'
          ],
          instructions: [
            'Soak rice noodles in warm water 30 min',
            'Mix tamarind, fish sauce, and sugar for sauce',
            'Heat wok, scramble eggs, set aside',
            'Cook shrimp/tofu until done',
            'Add drained noodles and sauce',
            'Toss until noodles are tender',
            'Add eggs back in, toss',
            'Serve with bean sprouts, peanuts, lime'
          ]
        }
      }
    ]
  }

  // Continue for all 76 cities...
];

// Utility to seed posts
export async function seedPostsForCity(cityName: string, country: string) {
  const city = await City.findOne({ name: cityName, country });
  if (!city) {
    console.log(`City ${cityName}, ${country} not found`);
    return;
  }

  const cityData = SEED_POSTS.find(c => c.cityName === cityName && c.country === country);
  if (!cityData) {
    console.log(`No seed data for ${cityName}`);
    return;
  }

  for (const postData of cityData.posts) {
    await Post.create({
      ...postData,
      cityId: city._id,
      userId: DEMO_USER_ID, // Create demo users first
      status: 'approved',
      likes: [],
      createdAt: faker.date.recent(30) // Random date in last 30 days
    });
  }

  console.log(`Seeded ${cityData.posts.length} posts for ${cityName}`);
}
```

### 5.2 Generate All Seed Data

```typescript
// server/src/scripts/seedSocialData.ts
import faker from 'faker';

async function seedAllSocialData() {
  console.log('Creating demo users...');

  // Create 20 demo users with varied profiles
  const demoUsers = await Promise.all(
    Array(20).fill(0).map(async (_, i) => {
      const username = faker.internet.userName().toLowerCase();
      const user = await User.create({
        username,
        email: `${username}@demo.com`,
        password: await bcrypt.hash('demo123', 10),
        profile: {
          name: faker.name.findName(),
          bio: faker.lorem.sentence(),
          country: faker.address.country(),
          languages: [faker.random.arrayElement(['English', 'Spanish', 'French', 'German', 'Japanese'])],
          interests: faker.random.arrayElements(
            ['Travel', 'Food', 'Photography', 'Music', 'Art', 'Hiking', 'Culture'],
            faker.datatype.number({ min: 2, max: 5 })
          ),
          cityLocation: null // Will be assigned
        },
        lastActive: faker.date.recent(7)
      });
      return user;
    })
  );

  console.log(`Created ${demoUsers.length} demo users`);

  // Seed posts for each city
  console.log('Seeding posts...');
  for (const cityData of SEED_POSTS) {
    await seedPostsForCity(cityData.cityName, cityData.country);
  }

  // Create connections between users
  console.log('Creating connections...');
  for (let i = 0; i < demoUsers.length; i++) {
    const numConnections = faker.datatype.number({ min: 3, max: 8 });
    for (let j = 0; j < numConnections; j++) {
      const friendIndex = faker.datatype.number({ min: 0, max: demoUsers.length - 1 });
      if (friendIndex !== i) {
        await Connection.findOneAndUpdate(
          {
            $or: [
              { user1: demoUsers[i]._id, user2: demoUsers[friendIndex]._id },
              { user1: demoUsers[friendIndex]._id, user2: demoUsers[i]._id }
            ]
          },
          {
            user1: demoUsers[i]._id,
            user2: demoUsers[friendIndex]._id,
            status: 'accepted',
            requestedBy: demoUsers[i]._id
          },
          { upsert: true }
        );
      }
    }
  }

  // Add comments to posts
  console.log('Adding comments...');
  const posts = await Post.find({ status: 'approved' }).limit(100);
  for (const post of posts) {
    const numComments = faker.datatype.number({ min: 0, max: 8 });
    for (let i = 0; i < numComments; i++) {
      const commenter = faker.random.arrayElement(demoUsers);
      await Comment.create({
        postId: post._id,
        userId: commenter._id,
        text: faker.lorem.sentences(faker.datatype.number({ min: 1, max: 3 })),
        createdAt: faker.date.recent(20)
      });
    }
  }

  // Add likes to posts
  console.log('Adding likes...');
  for (const post of posts) {
    const numLikes = faker.datatype.number({ min: 0, max: 15 });
    const likers = faker.random.arrayElements(demoUsers, numLikes);
    await Post.updateOne(
      { _id: post._id },
      { $set: { likes: likers.map(u => u._id) } }
    );
  }

  console.log('Social data seeding complete!');
}

// Run: npm run seed:social
seedAllSocialData().catch(console.error).finally(() => process.exit());
```

---

## Implementation Priority Matrix

| Phase | Feature | Impact | Effort | Priority |
|-------|---------|--------|--------|----------|
| 1 | Feed Interactions | 🔥 High | Low | **Do First** |
| 1 | Infinite Scroll | 🔥 High | Low | **Do First** |
| 1 | Comment UI | 🔥 High | Medium | **Do First** |
| 1 | Typing Indicators | Medium | Low | Do First |
| 1 | Real-time Updates | High | Medium | Do First |
| 2 | Separate Comments Collection | High | Medium | **Do Second** |
| 2 | Pagination | 🔥 High | Medium | **Do Second** |
| 2 | Fix Legacy Fields | High | Medium | Do Second |
| 2 | Query Optimization | High | High | Do Second |
| 2 | Redis Caching | Medium | Medium | Do Second |
| 3 | Rich Notifications | High | High | Do Third |
| 3 | User Mentions | High | Medium | Do Third |
| 3 | Emoji Reactions | Medium | Medium | Do Third |
| 3 | Friend Suggestions | High | High | Do Third |
| 3 | Post Drafts | Medium | Low | Do Third |
| 4 | Skeleton Loading | Medium | Low | Polish |
| 4 | Optimistic UI | Medium | Medium | Polish |
| 4 | Smart Errors | Medium | Low | Polish |
| 4 | Keyboard Shortcuts | Low | Low | Polish |
| 4 | Animations | Low | Low | Polish |
| 5 | Seed Data | Low | High | Optional |

---

## Success Metrics

### Technical
- [ ] All queries < 100ms (95th percentile)
- [ ] Lighthouse Performance score > 90
- [ ] Zero N+1 queries
- [ ] API response times < 200ms
- [ ] Real-time events < 50ms latency

### UX
- [ ] Users spend > 10 min per session
- [ ] > 80% of posts get interactions
- [ ] < 5% user-reported bugs
- [ ] > 4.5★ average UX rating
- [ ] Time to first interaction < 3 seconds

### Product
- [ ] 5+ posts per user per week
- [ ] 50+ comments per day
- [ ] 10+ connections per user
- [ ] 20+ messages per user per week
- [ ] User retention > 60% (Week 2)

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Set up project board** (GitHub Projects / Jira)
3. **Create feature branches** for each phase
4. **Write E2E tests** before refactoring
5. **Start with Phase 1** - quick wins for immediate UX improvement
6. **Deploy incrementally** - don't wait for all phases

**Estimated Total Time**: 5-6 weeks for Phases 1-4, +1 week for seed data

Would you like me to start implementing Phase 1 immediately?
