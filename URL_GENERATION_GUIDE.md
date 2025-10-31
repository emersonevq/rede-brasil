# URL Generation for Each Post Type

## Overview

O sistema agora gera URLs automáticas para cada tipo de postagem com ID único de 10 dígitos.

## URL Patterns by Post Type

### 1. **Posts Regulares**

```
Padrão: /detail/post-{id}-{unique_id}
Exemplo: /detail/post-123456-0912345678
Alternativa legada: /detail/123456

Rota: frontend/app/detail/[...params].tsx
```

### 2. **Fotos de Perfil**

```
Padrão: /profile/photo-id/{unique_id}
Ou: /profile/photo/{username}-{unique_id}
Exemplo:
  - /profile/photo-id/0912345678
  - /profile/photo/joao.silva-0912345678

Rota: frontend/app/profile/photo/[...params].tsx
```

### 3. **Capas de Perfil**

```
Padrão: /profile/cover-id/{unique_id}
Ou: /profile/cover/{username}-{unique_id}
Exemplo:
  - /profile/cover-id/0912345678
  - /profile/cover/joao.silva-0912345678

Rota: frontend/app/profile/cover/[...params].tsx
```

### 4. **Fotos em Posts**

```
Padrão: /post/photo-id-{unique_id}
Ou: /post/photo-{id}-{unique_id}
Exemplo:
  - /post/photo-id-0912345678
  - /post/photo-123456-0912345678

Rota: frontend/app/post/[...params].tsx
```

### 5. **Vídeos**

```
Padrão: /post/video-{id}-{unique_id}
Ou: /video/{id}-{unique_id}
Exemplo:
  - /post/video-123456-0912345678
  - /video/123456-0912345678

Rota: frontend/app/video/[...params].tsx ou frontend/app/post/[...params].tsx
```

### 6. **Histórias (Stories)**

```
Padrão: /detail/story-{id}-{unique_id}
Exemplo: /detail/story-789012-0912345678

Rota: frontend/app/detail/[...params].tsx
```

## Como Usar o URL Builder

### No Feed (Automático)

```typescript
// Feed.tsx já está usando automaticamente
const detailUrl = item.uniqueId
  ? `/detail/post-${item.id}-${item.uniqueId}`
  : `/detail/${item.id}`;

router.push(detailUrl);
```

### Em Componentes Customizados

```typescript
import { buildPostUrl, getPostDetailUrl } from '../../utils/postUrl';

// Opção 1: Usar helper específico
const postUrl = getPostDetailUrl(post);

// Opção 2: Usar builder genérico
const photoUrl = buildPostUrl({
  type: 'photo',
  id: post.id,
  uniqueId: post.unique_id,
  identifier: 'joao.silva',
});

// Opção 3: Construir manualmente
const videoUrl = `/post/video-${post.id}-${post.unique_id}`;
```

## Backend Response

O backend retorna agora o `unique_id` em todas as respostas de posts:

```json
{
  "id": 123456,
  "content": "Meu primeiro post!",
  "media_url": "/media/photo.jpg",
  "created_at": "2024-01-15T10:30:00",
  "user_id": 1,
  "user_name": "João Silva",
  "unique_id": "0912345678",
  "user_profile_photo": "/media/avatar.jpg"
}
```

## Componentes Atualizados

### DetailView Component

- Recebe `post: ApiPost` com `unique_id`
- Renderiza qualquer tipo de publicação
- Mantém URL original sem redirecionamento

### Feed Component

- Captura `unique_id` do backend
- Gera URL automática ao abrir post
- Passa `unique_id` para PostCard

### PostCard Component

- Aceita `uniqueId` na prop `Post`
- Pode ser usado com a URL gerada

### Route Handlers

- `/detail/[...params].tsx` - Rota universal
- `/post/[...params].tsx` - Posts com tipo
- `/photo/[...params].tsx` - Fotos de perfil
- `/cover/[...params].tsx` - Capas de perfil
- `/profile/photo/[...params].tsx` - Fotos com username
- `/profile/cover/[...params].tsx` - Capas com username
- `/video/[...params].tsx` - Vídeos

## Fluxo Completo Exemplo

### 1. Usuário cria um post com foto

```bash
POST /posts/upload
Content: "Olá mundo!"
File: photo.jpg
```

### 2. Backend gera unique_id

```python
unique_id = generate_unique_post_id(db)  # "0912345678"
post = Post(
    user_id=1,
    content="Olá mundo!",
    media_url="/media/photo.jpg",
    unique_id="0912345678"
)
```

### 3. Response do backend

```json
{
  "id": 123456,
  "content": "Olá mundo!",
  "media_url": "/media/photo.jpg",
  "unique_id": "0912345678",
  "user_name": "João Silva",
  ...
}
```

### 4. Frontend gera URL

```typescript
const postUrl = `/detail/post-123456-0912345678`;
```

### 5. Usuário clica no post

```
Navegação: /detail/post-123456-0912345678
     ↓
Router parsed: { params: ['post-123456-0912345678'] }
     ↓
DetailView renderiza o post
```

## Validação de URL

Todos os padrões de URL são validados em `frontend/utils/detail.ts`:

```typescript
const newFormatMatch = v.match(
  /^(post|photo|cover|video|story)[-_]([^-_]+)(?:[-_](\d{10}))?$/i,
);
```

Exemplos válidos:

- ✅ `post-123456-0912345678`
- ✅ `photo-id-0912345678`
- ✅ `cover-username-0912345678`
- ✅ `video-123456-0912345678`
- ✅ `story-789012-0912345678`

## Segurança

- Unique IDs são verificados no BD (sem duplicação)
- URLs são shareáveis e bookmarkáveis
- IDs numéricos são usados para buscar no BD
- Usernames são normalizados (minúsculas, sem espaços)

## Próximas Melhorias

- [ ] Link compartilhável com short URL
- [ ] OG tags com preview por type
- [ ] Analytics por unique_id
- [ ] Cache de detalhes
- [ ] Validação de permissões por tipo
