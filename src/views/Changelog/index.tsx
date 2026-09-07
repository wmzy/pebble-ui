import { useEffect, useState } from 'react';
import { css } from '@linaria/core';

import {
  Badge,
  ButtonLink,
  Card,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  MarkdownRenderer,
  Skeleton,
} from '@/lib';
import { page, intro } from '@/views/ComponentDetail/styles';

const REPO = 'wmzy/haze-ui';
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases?per_page=30`;
const RELEASES_PAGE = `https://github.com/${REPO}/releases`;
const CACHE_KEY = 'haze-ui-releases';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

type Release = {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  html_url: string;
  body: string | null;
};

type CacheEntry = { fetchedAt: number; releases: Release[] };

function readCache(): Release[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.fetchedAt > CACHE_TTL) return null;
    return entry.releases;
  } catch {
    return null;
  }
}

function writeCache(releases: Release[]) {
  try {
    const entry: CacheEntry = { fetchedAt: Date.now(), releases };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Private mode / quota — cache is best-effort only.
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const releaseList = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-3);
  max-width: 860px;
`;

const releaseCard = css`
  padding: var(--haze-space-3) var(--haze-space-4);
`;

const releaseHead = css`
  display: flex;
  align-items: center;
  gap: var(--haze-space-2);
  cursor: pointer;
  font-size: var(--haze-text-sm);
  color: var(--haze-color-text);
`;

const releaseName = css`
  font-weight: var(--haze-weight-semibold);
`;

const releaseDate = css`
  color: var(--haze-color-text-muted);
  font-size: var(--haze-text-xs);
  margin-inline-start: auto;
`;

const releaseBody = css`
  padding-top: var(--haze-space-2);
`;

const skeletonBlock = css`
  display: flex;
  flex-direction: column;
  gap: var(--haze-space-2);
  max-width: 860px;
`;

const skeletonRow = css`
  height: var(--haze-space-8);
`;

const errorBlock = css`
  color: var(--haze-color-text-muted);
  margin-bottom: var(--haze-space-3);
`;

export default function Changelog() {
  const [releases, setReleases] = useState<Release[] | null>(() => readCache());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (releases) return;
    let disposed = false;
    fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        return res.json() as Promise<Release[]>;
      })
      .then((list) => {
        if (disposed) return;
        writeCache(list);
        setReleases(list);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
    };
  }, [releases]);

  return (
    <div className={page}>
      <h1>Changelog</h1>
      <p className={intro}>
        Releases are fully automated by semantic-release — every conventional
        commit on <code>main</code> ships a versioned npm release with notes.
      </p>
      {failed && (
        <div>
          <p className={errorBlock}>
            Failed to load the release list (GitHub API rate limit or network).
          </p>
          <ButtonLink href={RELEASES_PAGE} variant='outline' target='_blank'>
            View releases on GitHub
          </ButtonLink>
        </div>
      )}
      {!failed && !releases && (
        <div className={skeletonBlock} aria-label='Loading releases'>
          <Skeleton className={skeletonRow} />
          <Skeleton className={skeletonRow} />
          <Skeleton className={skeletonRow} />
        </div>
      )}
      {releases?.length === 0 && (
        <p className={errorBlock}>No releases published yet.</p>
      )}
      {releases && releases.length > 0 && (
        <div className={releaseList}>
          {releases.map((release) => (
            <Card key={release.tag_name} className={releaseCard}>
              <Collapsible>
                <CollapsibleTrigger className={releaseHead}>
                  <Badge>{release.tag_name}</Badge>
                  <span className={releaseName}>
                    {release.name ?? release.tag_name}
                  </span>
                  <span className={releaseDate}>
                    {formatDate(release.published_at)}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className={releaseBody}>
                    {release.body ? (
                      <MarkdownRenderer content={release.body} />
                    ) : (
                      <p className={errorBlock}>No notes for this release.</p>
                    )}
                    <ButtonLink
                      href={release.html_url}
                      variant='ghost'
                      target='_blank'
                    >
                      View on GitHub
                    </ButtonLink>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
