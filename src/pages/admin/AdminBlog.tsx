import { useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AdminEmpty,
  AdminModal,
  AdminShell,
  AdminToolbar,
  useAdminSeo,
  useConfirm,
} from '@/components/admin/AdminShell';
import { IconButton } from './AdminPackages';
import { Button } from '@/components/common/Button';
import { SelectField, TextAreaField, TextField } from '@/components/common/Form';
import { Badge } from '@/components/common/Primitives';
import { useContent } from '@/store/content';
import { createId, formatDate, slugify } from '@/lib/format';
import { BLOG_CATEGORIES } from '@/data/blogs';
import type { BlogCategory, BlogPost } from '@/types';

const BLANK: BlogPost = {
  id: '',
  slug: '',
  title: '',
  excerpt: '',
  category: 'Preventive Health',
  author: 'Healthcare Labs Editorial Team',
  publishedAt: new Date().toISOString().slice(0, 10),
  readingMinutes: 5,
  featured: false,
  sections: [],
};

/**
 * Article bodies are edited as plain text. `## ` starts a new section heading
 * and `- ` starts a bullet; everything else is a paragraph. That keeps the
 * editor simple without needing a rich-text dependency.
 */
function sectionsToText(post: BlogPost): string {
  return post.sections
    .map((s) => {
      const lines: string[] = [];
      if (s.heading) lines.push(`## ${s.heading}`);
      s.paragraphs?.forEach((p) => lines.push(p));
      s.bullets?.forEach((b) => lines.push(`- ${b}`));
      return lines.join('\n\n');
    })
    .join('\n\n');
}

function textToSections(text: string): BlogPost['sections'] {
  const sections: BlogPost['sections'] = [];
  let current: BlogPost['sections'][number] = {};

  const push = () => {
    if (current.heading || current.paragraphs?.length || current.bullets?.length) {
      sections.push(current);
    }
    current = {};
  };

  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (line.startsWith('## ')) {
        push();
        current = { heading: line.slice(3).trim() };
      } else if (line.startsWith('- ')) {
        current.bullets = [...(current.bullets ?? []), line.slice(2).trim()];
      } else {
        current.paragraphs = [...(current.paragraphs ?? []), line];
      }
    });
  push();
  return sections;
}

export default function AdminBlog() {
  useAdminSeo('Blog');
  const { posts, savePost, deletePost } = useContent();
  const { confirm, dialog } = useConfirm();

  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) => (showArchived ? true : !p.archived))
      .filter((p) => !q || `${p.title} ${p.excerpt} ${p.category}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [posts, query, showArchived]);

  return (
    <AdminShell
      title="Blog"
      description="Articles published at /blog. Bodies use a light syntax: “## ” for a heading, “- ” for a bullet, anything else is a paragraph."
      actions={
        <Button size="md" onClick={() => setEditing({ ...BLANK })}>
          <Plus className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
          New article
        </Button>
      }
    >
      <AdminToolbar
        query={query}
        onQuery={setQuery}
        placeholder="Search articles…"
        right={
          <label className="flex cursor-pointer items-center gap-2 text-[13.5px] font-medium text-ink-muted">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 rounded border-ink-line text-brand-500 focus:ring-2 focus:ring-brand-300"
            />
            Show archived
          </label>
        }
      />

      {rows.length === 0 ? (
        <AdminEmpty message="No articles match that search." />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-soft ring-1 ring-brand-50">
          <table className="w-full min-w-[720px] text-left">
            <caption className="sr-only">Blog articles</caption>
            <thead>
              <tr className="border-b border-ink-line text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                <th scope="col" className="px-5 py-3.5">Article</th>
                <th scope="col" className="px-5 py-3.5">Category</th>
                <th scope="col" className="px-5 py-3.5">Published</th>
                <th scope="col" className="px-5 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-line">
              {rows.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-mist">
                  <td className="px-5 py-4">
                    <span className="block text-[14.5px] font-semibold text-ink">{p.title}</span>
                    <span className="mt-0.5 block font-mono text-[11.5px] text-ink-soft">
                      /blog/{p.slug}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[14px] text-ink-muted">{p.category}</td>
                  <td className="px-5 py-4 text-[14px] text-ink-muted">
                    {formatDate(p.publishedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {p.featured && <Badge tone="brand">Featured</Badge>}
                      {p.archived && <Badge tone="warn">Archived</Badge>}
                      {!p.featured && !p.archived && <Badge tone="neutral">Live</Badge>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5">
                      <IconButton label={`Edit ${p.title}`} onClick={() => setEditing({ ...p })}>
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </IconButton>
                      <IconButton
                        label={p.archived ? `Restore ${p.title}` : `Archive ${p.title}`}
                        onClick={() => savePost({ ...p, archived: !p.archived })}
                      >
                        {p.archived ? (
                          <ArchiveRestore className="h-4 w-4" strokeWidth={2} />
                        ) : (
                          <Archive className="h-4 w-4" strokeWidth={2} />
                        )}
                      </IconButton>
                      <IconButton
                        label={`Delete ${p.title}`}
                        danger
                        onClick={() =>
                          confirm(`Delete “${p.title}” permanently?`, () => deletePost(p.id))
                        }
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <PostEditor
          value={editing}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            savePost(next);
            setEditing(null);
          }}
        />
      )}

      {dialog}
    </AdminShell>
  );
}

function PostEditor({
  value,
  onClose,
  onSave,
}: {
  value: BlogPost;
  onClose: () => void;
  onSave: (p: BlogPost) => void;
}) {
  const [draft, setDraft] = useState<BlogPost>(value);
  const [body, setBody] = useState(() => sectionsToText(value));
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof BlogPost>(key: K, v: BlogPost[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));

  const submit = () => {
    if (!draft.title.trim()) {
      setError('An article needs a title.');
      return;
    }
    onSave({
      ...draft,
      id: draft.id || createId('post'),
      slug: draft.slug.trim() || slugify(draft.title),
      title: draft.title.trim(),
      sections: textToSections(body),
    });
  };

  return (
    <AdminModal
      open
      onClose={onClose}
      title={value.id ? `Edit ${value.title}` : 'New article'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-ink-line px-4 text-[14px] font-semibold text-ink transition-colors hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Cancel
          </button>
          <Button size="md" onClick={submit}>
            Save article
          </Button>
        </>
      }
    >
      {error && (
        <p role="alert" className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-[13.5px] font-medium text-rose-700">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Title"
          required
          className="sm:col-span-2"
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
        />
        <TextField
          label="Slug"
          className="sm:col-span-2"
          hint="Leave blank to generate from the title."
          value={draft.slug}
          onChange={(e) => set('slug', e.target.value)}
        />
        <TextAreaField
          label="Excerpt"
          className="sm:col-span-2"
          rows={2}
          value={draft.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
        />
        <SelectField
          label="Category"
          value={draft.category}
          onValueChange={(v) => set('category', v as BlogCategory)}
          options={BLOG_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <TextField
          label="Author"
          value={draft.author}
          onChange={(e) => set('author', e.target.value)}
        />
        <TextField
          label="Published date"
          type="date"
          value={draft.publishedAt}
          onChange={(e) => set('publishedAt', e.target.value)}
        />
        <TextField
          label="Reading time (minutes)"
          type="number"
          inputMode="numeric"
          value={draft.readingMinutes}
          onChange={(e) => set('readingMinutes', Number(e.target.value) || 1)}
        />
        <TextAreaField
          label="Article body"
          className="sm:col-span-2"
          rows={14}
          hint="“## Heading” starts a section · “- item” makes a bullet · anything else is a paragraph."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-medium text-ink sm:col-span-2">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="h-4 w-4 rounded border-ink-line text-brand-500 focus:ring-2 focus:ring-brand-300"
          />
          Feature at the top of the blog
        </label>
      </div>
    </AdminModal>
  );
}
