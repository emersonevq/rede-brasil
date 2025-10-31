export type Position = {
  company: string;
  title: string;
  start: string;
  end?: string;
};
export type Education = {
  institution: string;
  degree: string;
  start: string;
  end?: string;
};
export type Group = { id: string; name: string; members: number };
export type Friend = { id: string; name: string; avatar: string };
export type Testimonial = {
  id: string;
  author: string;
  text: string;
  date: string;
};

export type UserProfile = {
  name: string;
  username: string;
  avatar: string;
  cover: string;
  bio: string;
  hometown: string;
  currentCity: string;
  relationshipStatus: string;
  workplace: string;
  connectionsCount: number;
  highlights: string[];
  positions: Position[];
  education: Education[];
  groups: Group[];
  recentFriends: Friend[];
  testimonials: Testimonial[];
  hasStory?: boolean;
  contact_email?: string;
  show_hometown?: boolean;
  show_current_city?: boolean;
  show_relationship_status?: boolean;
  show_contact_email?: boolean;
  show_contact_phone?: boolean;
  show_workplace?: boolean;
};

export const profileData: UserProfile = {
  name: 'Ana Souza',
  username: 'anasouza',
  avatar: '',
  cover: '',
  bio: 'Criadora, dev mobile e fã de café. Compartilho projetos, ideias e bastidores do que estou construindo. ✨',
  hometown: 'Belo Horizonte, MG',
  currentCity: 'São Paulo, SP',
  relationshipStatus: 'Em um relacionamento',
  workplace: 'Vibe • Engenheira de Software',
  connectionsCount: 248,
  highlights: [],
  positions: [
    {
      company: 'Vibe',
      title: 'Engenheira de Software',
      start: '2023',
      end: 'Presente',
    },
    {
      company: 'TechSpark',
      title: 'Desenvolvedora Mobile',
      start: '2021',
      end: '2023',
    },
  ],
  education: [
    {
      institution: 'UFMG',
      degree: 'Sistemas de Informação',
      start: '2017',
      end: '2021',
    },
  ],
  groups: [
    { id: 'g1', name: 'React Native Brasil', members: 12340 },
    { id: 'g2', name: 'Design Systems', members: 6421 },
    { id: 'g3', name: 'Café e Código', members: 2204 },
  ],
  hasStory: true,
  recentFriends: [
    {
      id: 'f1',
      name: 'Bruno Lima',
      avatar: '',
    },
    {
      id: 'f2',
      name: 'Carla Mendes',
      avatar: '',
    },
    {
      id: 'f3',
      name: 'Diego Rocha',
      avatar: '',
    },
  ],
  testimonials: [
    {
      id: 't1',
      author: 'Bruno Lima',
      text: 'Profissional excepcional, entrega sempre com qualidade!',
      date: '2 sem',
    },
    {
      id: 't2',
      author: 'Carla Mendes',
      text: 'Trabalhar com a Ana é incrível, muita atenção aos detalhes.',
      date: '3 sem',
    },
  ],
  contact_email: 'ana@example.com',
  show_hometown: true,
  show_current_city: true,
  show_relationship_status: true,
  show_contact_email: false,
  show_contact_phone: false,
  show_workplace: true,
};
