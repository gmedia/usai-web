# Publishing

`usai.sakala.dev/blog` is the **canonical home** of everything long-form about Usai. Other platforms get copies that point back here.

## Writing a post

1. Create `src/content/blog/en/<slug>.md`. For a translation, create `src/content/blog/id/<slug>.md` with the **same file name** and the same `translationKey`.
2. Frontmatter is validated by `src/content.config.ts`:

   ```yaml
   title: …
   description: …            # ≤ 200 chars; used for meta, RSS, cards
   translationKey: my-post    # same across languages
   lang: en
   date: 2026-10-01
   draft: true                # visible in `pnpm dev` only
   tags: [lifetimes]
   series: { name: How Usai works, part: 2 }   # optional
   evidence:                  # required (or `false` for posts without measured claims)
     status: Usai v0.0.x, alpha …
     setup: hardware / workload / comparator
     supports: [ … ]
     doesNotSupport: [ … ]
     sources: [ { label: …, url: … } ]
   ```

3. The **evidence box** is the site's editorial signature. Every post states what its evidence supports and what it does not, and links the source data. If a claim is not in `supports`, it should not be in the post.
4. Follow `docs/CONTENT-RULES.md`: no "production-ready", no general "faster than …", no "sandbox". Show the cost next to the win. `pnpm verify` runs the claims check over posts too.
5. Quote runtime output from the runtime source or a real log, never from design docs. For example, the detached-work message is in `crates/usai-runtime/src/world.rs`.
6. Publish by setting `draft: false` and merging to `main`. The post then appears in `/blog/`, the RSS feed (`/blog/rss.xml`, `/id/blog/rss.xml`) and the sitemap, and gets its own OG image.

Corrections are published as edits with an `updated:` date. Say what changed at the end of the post.

## Cross-posting

- **DEV (dev.to):** import through the RSS feed or paste the post, and set the **canonical URL** to the post on `usai.sakala.dev`. Only cross-post articles that stand on their own and carry real technical content.
- **Reddit:** do not paste the same article into several subreddits. Pick one finding per community (runtime internals for systems readers, idle cost and small hosts for self-hosters, fresh worlds and ownership for backend developers). Read each subreddit's self-promotion rules first.
- **Show HN / Lobsters:** post the project, not a landing page. Do this only when a fresh machine can install and run the current release from public artifacts. The submission text should be **written by a maintainer in their own words**. Hacker News asks authors not to post LLM-generated text, so tools may check facts and critique a draft, but not write it.
- **Social (X, Bluesky, LinkedIn):** one chart, one finding or one diagram, plus a link to the post.

Stagger the channels. Leave time for feedback from each wave and fix what it finds before the next one.

## Keep research participants separate

Developers taking part in external validation (P7 in the runtime repository) are invited directly and build from the public docs alone. Do not send them blog posts that explain the model in depth before their session. That would contaminate what the session measures.
