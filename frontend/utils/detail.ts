import { ApiPost, getPostById, getUserById } from './api';

export type DetailType = 'post' | 'profile_photo' | 'profile_cover' | 'video' | 'unknown';

export type ParsedId = {
  original: string;
  type: DetailType;
  id: string; // numeric id or username depending on type
};

export function parseDetailId(input: string): ParsedId {
  if (!input) return { original: input, type: 'unknown', id: input };

  // normalize
  const v = String(input);
  if (v.includes(':')) {
    const [prefix, rest] = v.split(':');
    const p = prefix.toLowerCase();
    if (p === 'post') return { original: v, type: 'post', id: rest };
    if (p === 'photo') return { original: v, type: 'profile_photo', id: rest };
    if (p === 'cover') return { original: v, type: 'profile_cover', id: rest };
    if (p === 'video') return { original: v, type: 'video', id: rest };
    // fallback
    return { original: v, type: 'unknown', id: rest };
  }

  // support qualified strings like 'photo-123' or 'cover-456'
  const dashMatch = v.match(/^(photo|cover|post|video)[-_](.+)$/i);
  if (dashMatch) {
    const p = dashMatch[1].toLowerCase();
    const rest = dashMatch[2];
    if (p === 'post') return { original: v, type: 'post', id: rest };
    if (p === 'photo') return { original: v, type: 'profile_photo', id: rest };
    if (p === 'cover') return { original: v, type: 'profile_cover', id: rest };
    if (p === 'video') return { original: v, type: 'video', id: rest };
  }

  // numeric only -> assume post
  if (/^\d+$/.test(v)) return { original: v, type: 'post', id: v };

  // string only -> could be username reference to photo/cover; default to profile_photo
  return { original: v, type: 'profile_photo', id: v };
}

export async function fetchDetailData(parsed: ParsedId): Promise<{ post?: ApiPost | null; originalId: string }> {
  // Try to resolve into an ApiPost object for the detail view
  try {
    if (parsed.type === 'post') {
      const p = await getPostById(parsed.id);
      return { post: p as ApiPost, originalId: parsed.original };
    }

    if (parsed.type === 'video') {
      // try as post first
      try {
        const p = await getPostById(parsed.id);
        return { post: p as ApiPost, originalId: parsed.original };
      } catch (e) {
        // video might be a user media; map to pseudo-post
      }
    }

    if (parsed.type === 'profile_photo' || parsed.type === 'profile_cover') {
      // If id looks numeric try fetching post by id, otherwise fetch user by username
      if (/^\d+$/.test(parsed.id)) {
        try {
          const p = await getPostById(parsed.id);
          return { post: p as ApiPost, originalId: parsed.original };
        } catch (e) {
          // fallthrough
        }
      }

      // treat id as username
      const user = await getUserById(parsed.id);
      const pseudo: ApiPost = {
        id: 0,
        content: '',
        media_url: parsed.type === 'profile_photo' ? user.profile_photo ?? null : user.cover_photo ?? null,
        created_at: user.created_at || new Date().toISOString(),
        user_id: user.id,
        user_name: user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        user_profile_photo: user.profile_photo || null,
      };
      return { post: pseudo, originalId: parsed.original };
    }
  } catch (e) {
    // ignore and return null
  }

  // fallback: try fetching as post
  try {
    const p = await getPostById(parsed.id);
    return { post: p as ApiPost, originalId: parsed.original };
  } catch (e) {
    return { post: null, originalId: parsed.original };
  }
}
