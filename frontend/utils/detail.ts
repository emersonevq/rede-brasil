import { ApiPost, getPostById, getUserById } from './api';

export type DetailType =
  | 'post'
  | 'profile_photo'
  | 'profile_cover'
  | 'video'
  | 'story'
  | 'unknown';

export type ParsedId = {
  original: string;
  type: DetailType;
  id: string;
  uniqueId?: string;
};

export function parseDetailId(input: string): ParsedId {
  if (!input) return { original: input, type: 'unknown', id: input };

  const v = String(input);

  // Support format: "type-id-uniqueId" or "type-id"
  // Example: "photo-id-0912345678" or "post-123456"
  const newFormatMatch = v.match(/^(post|photo|cover|video|story)[-_]([^-_]+)(?:[-_](\d{10}))?$/i);
  if (newFormatMatch) {
    const p = newFormatMatch[1].toLowerCase();
    const idPart = newFormatMatch[2];
    const uniqueId = newFormatMatch[3];

    let type: DetailType = 'unknown';
    if (p === 'post') type = 'post';
    else if (p === 'photo') type = 'profile_photo';
    else if (p === 'cover') type = 'profile_cover';
    else if (p === 'video') type = 'video';
    else if (p === 'story') type = 'story';

    return { original: v, type, id: idPart, uniqueId };
  }

  // Legacy format support: "type:id"
  if (v.includes(':')) {
    const [prefix, rest] = v.split(':');
    const p = prefix.toLowerCase();
    let type: DetailType = 'unknown';
    if (p === 'post') type = 'post';
    else if (p === 'photo') type = 'profile_photo';
    else if (p === 'cover') type = 'profile_cover';
    else if (p === 'video') type = 'video';
    else if (p === 'story') type = 'story';
    return { original: v, type, id: rest };
  }

  // Numeric only -> assume post
  if (/^\d+$/.test(v)) return { original: v, type: 'post', id: v };

  // String only -> could be username; default to profile_photo
  return { original: v, type: 'profile_photo', id: v };
}

export async function fetchDetailData(
  parsed: ParsedId,
): Promise<{ post?: ApiPost | null; originalId: string }> {
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
        media_url:
          parsed.type === 'profile_photo'
            ? (user.profile_photo ?? null)
            : (user.cover_photo ?? null),
        created_at: user.created_at || new Date().toISOString(),
        user_id: user.id,
        user_name:
          user.username ||
          `${user.first_name || ''} ${user.last_name || ''}`.trim(),
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
