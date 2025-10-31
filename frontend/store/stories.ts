import { StorySegment, StoryUser } from '../components/StoryViewer';

export type StoryListItem = {
  id: string;
  user: StoryUser;
  postedAt: string;
  postedAtHours: number;
  caption: string;
  cover: string;
  views: number;
  likes: number;
  segments: StorySegment[];
  category?: string;
  isPremium?: boolean;
};

let stories: StoryListItem[] = [];
const listeners = new Set<(items: StoryListItem[]) => void>();

export function addStory(item: StoryListItem) {
  stories = [item, ...stories];
  listeners.forEach((cb) => cb(stories));
}

export function getStories() {
  return stories;
}

export function subscribeStories(cb: (items: StoryListItem[]) => void) {
  listeners.add(cb);
  cb(stories);
  return () => listeners.delete(cb);
}
