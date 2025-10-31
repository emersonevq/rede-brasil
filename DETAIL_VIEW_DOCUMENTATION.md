# DetailView System - Documentação

## Visão Geral

Implementei um sistema completo e reutilizável de visualização de detalhes para todos os tipos de posts (perfil, posts, vídeos, histórias, etc.). O sistema garante IDs únicos de 10 dígitos com verificação automática de duplicação no banco de dados.

## Arquitetura

### Backend

#### 1. **Serviço de Geração de ID Único** (`backend/core/unique_id.py`)

- `generate_random_id()`: Gera um ID aleatório de 10 dígitos
- `generate_unique_post_id(db)`: Gera ID único para posts com verificação de duplicação
- `generate_unique_profile_id(db)`: Gera ID único para perfis com verificação de duplicação
- Máximo de 100 tentativas antes de falha (colisão praticamente impossível com 10 dígitos)

#### 2. **Modelos de Dados Atualizados**

**Post Model** (`backend/database/models/post.py`):

```python
unique_id: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
```

**UserProfile Model** (`backend/database/models/profile.py`):

```python
unique_id: Mapped[str | None] = mapped_column(String(10), unique=True, nullable=True, index=True)
```

#### 3. **Endpoints Atualizados**

- `POST /posts/` e `POST /posts/upload` - Geram automaticamente `unique_id`
- `POST /users/profile-photo` - Gera `unique_id` para perfil se não existir
- `POST /users/cover-photo` - Gera `unique_id` para perfil se não existir
- Todos os GET endpoints retornam `unique_id`

### Frontend

#### 1. **Componente DetailView Reutilizável** (`frontend/components/DetailView.tsx`)

Props:

```typescript
interface DetailViewProps {
  post: ApiPost | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  title?: string;
}
```

Características:

- Funciona para todos os tipos de posts (post, profile_photo, profile_cover, video, story)
- Mantém URL original (não redireciona)
- Suporta reações, comentários, compartilhamento e salvar
- Responsivo para web e mobile
- Media viewer embutido

#### 2. **Sistema de Parsing de IDs** (`frontend/utils/detail.ts`)

Suporta múltiplos formatos:

```
// Novo formato (recomendado)
"post-123456" ou "photo-id-0912345678"

// Legado
"post:123456" ou "photo-username"

// Apenas número
"123456"
```

#### 3. **Rotas Dinâmicas**

**Rota Universal** (`frontend/app/detail/[...params].tsx`):

- Aceita qualquer padrão de URL
- Determina tipo e ID automaticamente
- Define título apropriado por tipo

Exemplos de URLs:

```
/detail/post-123456
/detail/photo-id-0912345678
/detail/cover-username
/detail/video-987654321
/detail/story-111111
```

**Rotas Específicas** (backward compatibility):

- `/detail/[id].tsx` - Rota legada
- `/post/[id].tsx` - Posts diretos

## Como Usar

### Criar uma Publicação (Backend)

```python
# O ID único é gerado automaticamente
post = Post(
    user_id=current.id,
    content="Meu post incrível",
    media_url="/media/photo.jpg",
    # unique_id é gerado pelo endpoint
)
```

### Acessar Detalhes de um Post (Frontend)

```typescript
// Qualquer uma dessas rotas funciona:
router.push('/detail/post-123456');
router.push('/detail/photo-id-0912345678');
router.push('/detail/cover-username');

// Ou usar componente diretamente
<DetailView
  post={post}
  loading={false}
  error={null}
  onBack={() => router.back()}
  title="Post"
/>
```

## Fluxo de Criação de Publicação

1. Usuário clica "Criar Post"
2. Frontend faz upload de mídia e conteúdo
3. Backend recebe requisição
4. Backend gera `unique_id` de 10 dígitos
5. Backend verifica se `unique_id` já existe no DB
   - Se existir: gera novo ID (máximo 100 tentativas)
   - Se não existir: salva post com este ID
6. Tudo é rápido - usuário não percebe nada
7. Post salvo com `unique_id` único

## Padrão de URL Recomendado

```
/detail/[tipo]-[id-ou-username]/[10-digitos]

Exemplos:
/detail/post-123456
/detail/post-123456-0912345678
/detail/photo-id-0912345678
/detail/cover-username
/detail/video-987654
/detail/story-111111-1234567890
```

## Garantias

✅ **Unicidade**: Cada publicação tem um `unique_id` único verificado no BD  
✅ **Reutilizabilidade**: Um componente para todos os tipos  
✅ **Sem Redirecionamento**: URL permanece a mesma  
✅ **Transparência**: ID gerado automaticamente sem ação do usuário  
✅ **Performance**: Máximo 100 tentativas de geração (raro acontecer 2ª tentativa)  
✅ **Compatibilidade**: Suporta formatos legados

## Estrutura de Banco de Dados

### Posts

```
id (PK)
user_id (FK)
content
media_url
unique_id (UQ, INDEX)
created_at (INDEX)
```

### Profiles

```
id (PK)
user_id (FK, UQ)
...outros campos...
unique_id (UQ, INDEX, NULLABLE)
```

## Códigos de Erro

- `404`: Publicação não encontrada
- `403`: Acesso negado
- `500`: Erro ao gerar ID (raro - tente novamente)

## Próximas Melhorias (Opcional)

1. **Reações Persistentes**: Salvar reações no BD
2. **Comentários**: Implementar comentários persistentes
3. **Analytics**: Rastrear visualizações por `unique_id`
4. **Compartilhamento**: Gerar links compartilháveis com `unique_id`
5. **Cache**: Cache de detalhes por `unique_id`
