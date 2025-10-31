type LoginResponse = { access_token: string; token_type: string };

export const API_BASE_URL =
  (typeof process !== 'undefined' &&
    (process as any).env &&
    (process as any).env.EXPO_PUBLIC_API_URL) ||
  'http://localhost:8000';

let memoryToken: string | null = null;

export function setToken(t: string | null) {
  memoryToken = t;
  if (typeof window !== 'undefined' && (window as any).localStorage) {
    if (t) window.localStorage.setItem('token', t);
    else window.localStorage.removeItem('token');
  }
}

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window !== 'undefined' && (window as any).localStorage) {
    memoryToken = window.localStorage.getItem('token');
  }
  return memoryToken;
}

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
    if (!res.ok) {
      let msg = `HTTP ${res.status}: Request failed`;
      try {
        const data = await res.json();
        if (data?.detail) {
          msg =
            typeof data.detail === 'string'
              ? data.detail
              : JSON.stringify(data.detail);
        } else if (data?.message) {
          msg = data.message;
        } else if (typeof data === 'string') {
          msg = data;
        } else {
          msg = JSON.stringify(data);
        }
      } catch (e) {
        try {
          msg = await res.text();
        } catch {}
      }
      const error = new Error(msg);
      (error as any).status = res.status;
      throw error;
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`API request failed: ${String(error)}`);
  }
}

export async function login(email: string, password: string) {
  const data: LoginResponse = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data;
}

export async function checkUsernameAvailable(
  username: string,
): Promise<boolean> {
  try {
    await request('/auth/check-username', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function signup(payload: {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
}) {
  const data: LoginResponse = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setToken(data.access_token);
  return data;
}

export type ApiPost = {
  id: number;
  content: string;
  media_url?: string | null;
  created_at: string;
  user_id: number;
  user_name: string;
  user_profile_photo?: string | null;
  user_cover_photo?: string | null;
};

export async function getPosts(): Promise<ApiPost[]> {
  return request('/posts');
}

export async function getPostById(id: number | string): Promise<ApiPost> {
  return request(`/posts/${id}`);
}

export function absoluteUrl(input?: string | null): string | undefined {
  if (!input) return undefined;
  const s = String(input);
  if (/^https?:\/\//i.test(s)) return s;
  return `${API_BASE_URL}${s.startsWith('/') ? s : '/' + s}`;
}

export async function createPost(content: string, file?: File | Blob) {
  if (file) {
    const form = new FormData();
    form.append('content', content);
    form.append('file', file);
    return request('/posts/upload', { method: 'POST', body: form });
  }
  return request('/posts', {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

// React Native helper: upload image from local URI
export async function createPostWithImage(
  content: string,
  file: { uri: string; type: string; name?: string },
) {
  const form = new FormData();
  form.append('content', content);
  form.append('file', {
    uri: file.uri,
    type: file.type,
    name: file.name || 'upload.jpg',
  } as any);
  return request('/posts/upload', { method: 'POST', body: form });
}

export async function uploadProfilePhoto(
  file: { uri: string; type: string; name?: string },
  caption?: string,
) {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    type: file.type,
    name: file.name || 'profile.jpg',
  } as any);
  if (typeof caption === 'string') form.append('caption', caption);
  return request('/users/profile-photo', { method: 'POST', body: form });
}

export async function uploadCoverPhoto(
  file: { uri: string; type: string; name?: string },
  caption?: string,
) {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    type: file.type,
    name: file.name || 'cover.jpg',
  } as any);
  if (typeof caption === 'string') form.append('caption', caption);
  return request('/users/cover-photo', { method: 'POST', body: form });
}

export type ApiUser = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo?: string | null;
  cover_photo?: string | null;
  created_at: string;
};

export async function getCurrentUser(): Promise<ApiUser> {
  return request('/users/me');
}

export async function getUserById(id: number | string): Promise<ApiUser> {
  return request(`/users/${id}`);
}

export async function getUserPosts(id: number | string): Promise<ApiPost[]> {
  return request(`/users/${id}/posts`);
}

export async function searchUsers(query: string): Promise<ApiUser[]> {
  const params = new URLSearchParams();
  if (query && query.trim()) {
    params.append('q', query.trim());
  }
  return request(`/users/search?${params.toString()}`);
}

export async function deletePost(postId: number | string): Promise<any> {
  return request(`/posts/${postId}`, { method: 'DELETE' });
}

export async function updatePost(
  postId: number | string,
  content: string,
  mediaUrl?: string | null,
): Promise<ApiPost> {
  return request(`/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify({ content, media_url: mediaUrl }),
  });
}

export async function getHighlights(): Promise<any[]> {
  return request('/highlights');
}

export async function getMyProfile(): Promise<any> {
  return request('/users/me/profile');
}

export async function getProfileById(id: number | string): Promise<any> {
  return request(`/users/${id}/profile`);
}

export async function updateMyProfile(payload: any): Promise<any> {
  return request('/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function createHighlight(payload: {
  name: string;
  cover: string;
  photos: string[];
}): Promise<any> {
  return request('/highlights', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateHighlight(
  id: number,
  payload: {
    name?: string;
    cover?: string;
    photos?: string[];
  },
): Promise<any> {
  return request(`/highlights/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteHighlight(id: number): Promise<any> {
  return request(`/highlights/${id}`, { method: 'DELETE' });
}

// Stories API
export type ApiStory = {
  id: number;
  content?: string | null;
  media_url?: string | null;
  created_at: string;
  user_id: number;
  user_name: string;
  user_profile_photo?: string | null;
};

export async function getStories(): Promise<ApiStory[]> {
  return request('/stories');
}

export async function getStoryById(id: number | string): Promise<ApiStory> {
  return request(`/stories/${id}`);
}

export async function createStory(content?: string, file?: File | Blob) {
  if (file) {
    const form = new FormData();
    if (typeof content === 'string') form.append('content', content);
    form.append('file', file as any);
    return request('/stories/upload', { method: 'POST', body: form });
  }
  return request('/stories', {
    method: 'POST',
    body: JSON.stringify({ content: content || '' }),
  });
}

// React Native helper: upload image/video from local URI
export async function createStoryWithImage(
  content: string,
  file: { uri: string; type: string; name?: string },
) {
  const form = new FormData();
  form.append('content', content);
  form.append('file', {
    uri: file.uri,
    type: file.type,
    name: file.name || 'story.jpg',
  } as any);
  return request('/stories/upload', { method: 'POST', body: form });
}

// Friends APIs
export type FriendStatus =
  | 'none'
  | 'outgoing_pending'
  | 'incoming_pending'
  | 'friends';

export type IncomingFriendRequest = {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_profile_photo?: string | null;
  created_at: string;
};

export async function getIncomingFriendRequests(): Promise<
  IncomingFriendRequest[]
> {
  return request('/friends/requests/incoming');
}

export async function getFriendStatus(
  userId: number | string,
): Promise<{ status: FriendStatus; request_id?: number | null }> {
  return request(`/friends/status/${userId}`);
}
export async function sendFriendRequest(userId: number | string) {
  return request('/friends/requests', {
    method: 'POST',
    body: JSON.stringify({ user_id: Number(userId) }),
  });
}
export async function cancelFriendRequest(requestId: number) {
  return request(`/friends/requests/${requestId}`, { method: 'DELETE' });
}
export async function acceptFriendRequest(requestId: number) {
  return request(`/friends/requests/${requestId}/accept`, { method: 'POST' });
}
export async function declineFriendRequest(requestId: number) {
  return request(`/friends/requests/${requestId}/decline`, { method: 'POST' });
}
export async function getUserFriends(
  userId: number | string,
): Promise<{ id: number; name: string; avatar?: string | null }[]> {
  return request(`/users/${userId}/friends`);
}

// Visits API
export type VisitorInfo = {
  id: number;
  visitor_id: number;
  visitor_name: string;
  visitor_profile_photo?: string | null;
  visited_at: string;
  is_friend: boolean;
  has_sent_friend_request: boolean;
};

export async function recordProfileVisit(
  visited_user_id: number,
): Promise<any> {
  return request('/visits', {
    method: 'POST',
    body: JSON.stringify({ visited_user_id }),
  });
}

export async function getProfileVisits(
  userId: number | string,
  timeFilter: 'all' | 'today' | 'week' | 'month' = 'all',
): Promise<VisitorInfo[]> {
  return request(`/visits/profile/${userId}?time_filter=${timeFilter}`);
}

export async function getVisitCount(
  userId: number | string,
): Promise<{ total_visits: number; today_visits: number }> {
  return request(`/visits/count/${userId}`);
}

export async function getUnreadVisitCount(): Promise<{
  unread_visits: number;
}> {
  return request('/visits/unread-count');
}

// Notifications API
export type NotificationData = {
  id: number;
  type: string;
  actor_id?: number;
  related_id?: number;
  data?: any;
  read: boolean;
  created_at: string;
};

export async function getNotifications(
  limit: number = 50,
): Promise<NotificationData[]> {
  return request(`/notifications?limit=${limit}`);
}

export async function getUnreadNotificationsCount(): Promise<{
  unread_count: number;
}> {
  return request('/notifications/unread-count');
}

export async function markNotificationAsRead(
  notificationId: number,
): Promise<any> {
  return request(`/notifications/${notificationId}/read`, { method: 'POST' });
}

export async function markAllNotificationsAsRead(): Promise<any> {
  return request('/notifications/read-all', { method: 'POST' });
}

export async function deleteNotification(notificationId: number): Promise<any> {
  return request(`/notifications/${notificationId}`, { method: 'DELETE' });
}

// Chat API
export type ChatConversation = {
  id: number;
  name?: string | null;
  is_group: boolean;
  participants: Array<{
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_photo?: string | null;
  }>;
  latest_message?: {
    id: number;
    content: string;
    content_type?: string;
    media_url?: string | null;
    is_read: boolean;
    created_at: string;
    sender: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      profile_photo?: string | null;
    };
  };
  unread_count: number;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: number;
  conversation_id: number;
  content: string;
  content_type?: string;
  media_url?: string | null;
  is_read: boolean;
  created_at: string;
  sender: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_photo?: string | null;
  };
};

export async function getConversations(
  limit: number = 50,
  offset: number = 0,
): Promise<ChatConversation[]> {
  return request(`/chat/conversations?limit=${limit}&offset=${offset}`);
}

export async function createConversation(
  participantIds: number[],
  name?: string,
): Promise<ChatConversation> {
  return request('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({
      participant_ids: participantIds,
      name: name || null,
    }),
  });
}

export async function getConversationMessages(
  conversationId: number,
  limit: number = 50,
  offset: number = 0,
): Promise<ChatMessage[]> {
  return request(
    `/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
  );
}

export async function getOrCreateDMConversation(
  userId: number,
): Promise<ChatConversation> {
  return request(`/chat/conversations/${userId}/dm`);
}

export async function deleteConversation(conversationId: number): Promise<any> {
  return request(`/chat/conversations/${conversationId}`, { method: 'DELETE' });
}

export async function searchConversations(
  query: string,
  limit: number = 20,
): Promise<ChatConversation[]> {
  return request(
    `/chat/conversations/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  );
}

export async function sendChatMessage(
  conversationId: number,
  content: string,
  contentType: string = 'text',
  mediaUrl?: string,
): Promise<any> {
  return request('/chat/messages', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: conversationId,
      content,
      content_type: contentType,
      media_url: mediaUrl,
    }),
  });
}

export async function markMessageAsRead(messageId: number): Promise<any> {
  return request(`/chat/messages/${messageId}/read`, { method: 'POST' });
}

export async function editMessage(
  messageId: number,
  content: string,
): Promise<any> {
  return request(`/chat/messages/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export async function deleteMessage(messageId: number): Promise<any> {
  return request(`/chat/messages/${messageId}`, { method: 'DELETE' });
}

export async function reactToMessage(
  messageId: number,
  emoji: string,
): Promise<any> {
  return request(`/chat/messages/${messageId}/react`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });
}

export async function uploadChatFile(file: {
  uri: string;
  type: string;
  name?: string;
}): Promise<{ media_url: string }> {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    type: file.type,
    name: file.name || 'file',
  } as any);
  return request('/chat/upload', { method: 'POST', body: form });
}

export function logout() {
  setToken(null);
}
