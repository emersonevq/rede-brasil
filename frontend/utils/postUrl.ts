import type { ApiPost } from './api';

export type PostType = 'post' | 'photo' | 'cover' | 'video' | 'story';

interface PostUrlParams {
  type: PostType;
  id: string | number;
  uniqueId: string;
  identifier?: string;
}

export function buildPostUrl(params: PostUrlParams): string {
  const { type, id, uniqueId, identifier } = params;

  switch (type) {
    case 'post':
      return `/detail/post-${id}-${uniqueId}`;
    case 'photo':
      return identifier
        ? `/detail/photo-${identifier}-${uniqueId}`
        : `/detail/photo-id-${uniqueId}`;
    case 'cover':
      return identifier
        ? `/detail/cover-${identifier}-${uniqueId}`
        : `/detail/cover-id-${uniqueId}`;
    case 'video':
      return `/detail/video-${id}-${uniqueId}`;
    case 'story':
      return `/detail/story-${id}-${uniqueId}`;
    default:
      return `/detail/${id}`;
  }
}

export function buildPostTypeUrl(
  post: ApiPost,
  type: PostType = 'post',
  identifier?: string,
): string {
  return buildPostUrl({
    type,
    id: post.id,
    uniqueId: post.unique_id,
    identifier,
  });
}

export function getPostDetailUrl(post: ApiPost): string {
  return buildPostTypeUrl(post, 'post');
}

export function getProfilePhotoUrl(
  userId: number | string,
  uniqueId: string,
  userName?: string,
): string {
  return buildPostUrl({
    type: 'photo',
    id: userId,
    uniqueId,
    identifier: typeof userName === 'string' ? userName.replace(/\s+/g, '').toLowerCase() : undefined,
  });
}

export function getProfileCoverUrl(
  userId: number | string,
  uniqueId: string,
  userName?: string,
): string {
  return buildPostUrl({
    type: 'cover',
    id: userId,
    uniqueId,
    identifier: typeof userName === 'string' ? userName.replace(/\s+/g, '').toLowerCase() : undefined,
  });
}

export function getVideoUrl(
  videoId: number | string,
  uniqueId: string,
): string {
  return buildPostUrl({
    type: 'video',
    id: videoId,
    uniqueId,
  });
}

export function getStoryUrl(
  storyId: number | string,
  uniqueId: string,
): string {
  return buildPostUrl({
    type: 'story',
    id: storyId,
    uniqueId,
  });
}
