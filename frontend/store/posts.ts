export type Comment = { id: string; user: string; text: string };
export type Post = {
  id: string;
  userId: number;
  user: string;
  avatar?: string;
  cover?: string;
  content: string;
  time: string;
  image?: string;
  likes?: number;
  liked?: boolean;
  comments: Comment[];
};

// In-memory store for demo purposes. Replace with backend (e.g., Supabase) later.
let posts: Post[] = [
  {
    id: '1',
    user: 'Alice',
    content:
      'Olá, esta é minha primeira postagem! Adoro construir coisas com React Native ❤️',
    time: '2h',
    image: 'https://picsum.photos/800/600?random=1',
    likes: 12,
    liked: false,
    comments: [{ id: 'c1', user: 'Bruno', text: 'Que massa!' }],
  },
  {
    id: '2',
    user: 'Bruno',
    content: 'Curtindo o dia e construindo um app incrível. #dev',
    time: '3h',
    likes: 4,
    liked: false,
    comments: [
      { id: 'c2', user: 'Alice', text: 'Bora!' },
      { id: 'c3', user: 'Carla', text: 'Top' },
    ],
  },
  {
    id: '3',
    user: 'Carla',
    content: 'Compartilhando uma foto do meu café ☕️',
    time: '4h',
    image: 'https://picsum.photos/800/600?random=2',
    likes: 21,
    liked: false,
    comments: [],
  },
  {
    id: '4',
    user: 'Daniel',
    content: 'Foto quadrada do meu novo projeto!',
    time: '1h',
    image: 'https://picsum.photos/400/400?random=3',
    likes: 15,
    liked: false,
    comments: [{ id: 'c4', user: 'Eva', text: 'Lindo demais!' }],
  },
  {
    id: '5',
    user: 'Eva',
    content: 'Story vertical do meu dia 📱',
    time: '45m',
    image: 'https://picsum.photos/400/700?random=4',
    likes: 8,
    liked: false,
    comments: [],
  },
  {
    id: '6',
    user: 'Felipe',
    content: 'Paisagem panor��mica perfeita!',
    time: '30m',
    image: 'https://picsum.photos/1200/400?random=5',
    likes: 25,
    liked: false,
    comments: [
      { id: 'c5', user: 'Grace', text: 'Que vista!' },
      { id: 'c6', user: 'Henry', text: 'Incrível 🔥' },
    ],
  },
];

const listeners = new Set<() => void>();

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}

export function getPosts() {
  return posts;
}

export function getPost(id: string) {
  return posts.find((p) => p.id === String(id));
}

export function setPosts(next: Post[]) {
  posts = next;
  notify();
}

export function addPost(content: string, media?: { image?: string }) {
  const newPost: Post = {
    id: `${Date.now()}`,
    user: 'Você',
    content,
    time: 'agora',
    image: media?.image,
    likes: 0,
    liked: false,
    comments: [],
  };
  posts = [newPost, ...posts];
  notify();
  return newPost;
}

export function toggleLike(id: string) {
  posts = posts.map((p) =>
    p.id === id
      ? {
          ...p,
          liked: !p.liked,
          likes: p.liked ? Math.max((p.likes || 0) - 1, 0) : (p.likes || 0) + 1,
        }
      : p,
  );
  notify();
}

export function addComment(postId: string, text: string, user = 'Você') {
  const comment: Comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user,
    text,
  };
  posts = posts.map((p) =>
    p.id === postId ? { ...p, comments: [...p.comments, comment] } : p,
  );
  notify();
  return comment;
}
