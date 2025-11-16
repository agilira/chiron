/**
 * Blog Feed Generator
 * 
 * Generates RSS 2.0 and Atom 1.0 feeds for blog posts
 * 
 * @module blog/generators/feed-generator
 */

const path = require('path');
const fs = require('fs');

class FeedGenerator {
  constructor(context, config) {
    this.context = context;
    this.logger = context.logger;
    this.config = config || {};
    this.siteUrl = context.config.site?.url || 'https://example.com';
    this.siteName = context.config.site?.name || 'Blog';
    this.siteDescription = context.config.site?.description || '';
  }

  /**
   * Generate both RSS and Atom feeds
   */
  async generateFeeds(posts) {
    const results = {
      rss: null,
      atom: null
    };

    // Filter and sort posts (latest 20)
    const feedPosts = posts
      .filter(post => post.date && !isNaN(post.date.getTime()))
      .sort((a, b) => b.date - a.date)
      .slice(0, 20);

    if (feedPosts.length === 0) {
      this.logger.warn('No posts available for feed generation');
      return results;
    }

    // Generate RSS feed
    if (this.config.enableRSS !== false) {
      try {
        const rssContent = this.generateRSS(feedPosts);
        const rssPath = path.join(this.context.config.build.output_dir, 'blog', 'feed.xml');
        fs.mkdirSync(path.dirname(rssPath), { recursive: true });
        fs.writeFileSync(rssPath, rssContent, 'utf8');
        results.rss = rssPath;
        this.logger.info('RSS feed generated', { path: rssPath, posts: feedPosts.length });
      } catch (error) {
        this.logger.error('Failed to generate RSS feed', { error: error.message });
      }
    }

    // Generate Atom feed
    if (this.config.enableAtom !== false) {
      try {
        const atomContent = this.generateAtom(feedPosts);
        const atomPath = path.join(this.context.config.build.output_dir, 'blog', 'atom.xml');
        fs.mkdirSync(path.dirname(atomPath), { recursive: true });
        fs.writeFileSync(atomPath, atomContent, 'utf8');
        results.atom = atomPath;
        this.logger.info('Atom feed generated', { path: atomPath, posts: feedPosts.length });
      } catch (error) {
        this.logger.error('Failed to generate Atom feed', { error: error.message });
      }
    }

    return results;
  }

  /**
   * Generate RSS 2.0 feed
   */
  generateRSS(posts) {
    const feedUrl = `${this.siteUrl}/blog/feed.xml`;
    const blogUrl = `${this.siteUrl}/blog/`;
    const buildDate = new Date().toUTCString();
    const lastPost = posts[0];
    const lastBuildDate = lastPost ? lastPost.date.toUTCString() : buildDate;

    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${this.escapeXml(this.siteName)}</title>
    <link>${this.escapeXml(blogUrl)}</link>
    <description>${this.escapeXml(this.siteDescription)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <pubDate>${lastBuildDate}</pubDate>
    <atom:link href="${this.escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <generator>Chiron SSG</generator>
`;

    // Add items
    for (const post of posts) {
      const postUrl = `${this.siteUrl}/blog/${post.slug}.html`;
      const pubDate = post.date.toUTCString();
      
      // Build categories
      let categories = '';
      if (post.categories && post.categories.length > 0) {
        categories = post.categories
          .map(cat => `    <category>${this.escapeXml(cat)}</category>`)
          .join('\n');
      }

      // Build description (use excerpt or description)
      const description = this.escapeXml(
        post.excerpt || post.description || this.stripHtml(post.content).substring(0, 200) + '...'
      );

      // Build content (full HTML content)
      const content = this.escapeXml(post.content || '');

      rss += `
    <item>
      <title>${this.escapeXml(post.title)}</title>
      <link>${this.escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${this.escapeXml(postUrl)}</guid>
      <pubDate>${pubDate}</pubDate>
${post.author ? `      <dc:creator>${this.escapeXml(post.author)}</dc:creator>\n` : ''}      <description>${description}</description>
      <content:encoded><![CDATA[${post.content || ''}]]></content:encoded>
${categories}
    </item>
`;
    }

    rss += `  </channel>
</rss>`;

    return rss;
  }

  /**
   * Generate Atom 1.0 feed
   */
  generateAtom(posts) {
    const feedUrl = `${this.siteUrl}/blog/atom.xml`;
    const blogUrl = `${this.siteUrl}/blog/`;
    const updated = posts[0] ? posts[0].date.toISOString() : new Date().toISOString();

    let atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${this.escapeXml(this.siteName)}</title>
  <link href="${this.escapeXml(blogUrl)}" rel="alternate" />
  <link href="${this.escapeXml(feedUrl)}" rel="self" />
  <id>${this.escapeXml(blogUrl)}</id>
  <updated>${updated}</updated>
  <subtitle>${this.escapeXml(this.siteDescription)}</subtitle>
  <generator>Chiron SSG</generator>
`;

    // Add entries
    for (const post of posts) {
      const postUrl = `${this.siteUrl}/blog/${post.slug}.html`;
      const published = post.createdAt ? post.createdAt.toISOString() : post.date.toISOString();
      const updated = post.date.toISOString();

      // Build categories
      let categories = '';
      if (post.categories && post.categories.length > 0) {
        categories = post.categories
          .map(cat => `    <category term="${this.escapeXml(cat)}" />`)
          .join('\n');
      }

      // Build summary (use excerpt or description)
      const summary = this.escapeXml(
        post.excerpt || post.description || this.stripHtml(post.content).substring(0, 200) + '...'
      );

      atom += `
  <entry>
    <title>${this.escapeXml(post.title)}</title>
    <link href="${this.escapeXml(postUrl)}" rel="alternate" />
    <id>${this.escapeXml(postUrl)}</id>
    <published>${published}</published>
    <updated>${updated}</updated>
${post.author ? `    <author>\n      <name>${this.escapeXml(post.author)}</name>\n    </author>\n` : ''}    <summary>${summary}</summary>
    <content type="html"><![CDATA[${post.content || ''}]]></content>
${categories}
  </entry>
`;
    }

    atom += `</feed>`;

    return atom;
  }

  /**
   * Escape XML special characters
   */
  escapeXml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Strip HTML tags from content
   */
  stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  }
}

module.exports = FeedGenerator;
