import '../../../styles/content-pages.css';

import { notFound } from 'next/navigation';

import { contentCopy } from '../../../lib/content/copy.ts';
import { isLocale } from '../../../lib/i18n';

export default async function DocumentationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const copy = contentCopy[locale].docs;

  return (
    <article className="content-page content-page--docs" aria-labelledby="docs-title">
      <header className="content-hero content-hero--compact">
        <div className="content-hero__copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="docs-title">{copy.heading}</h1>
          <p className="content-lead">{copy.lead}</p>
        </div>
      </header>

      <nav className="content-toc" aria-label={copy.onThisPage}>
        <ol>
          {copy.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.title}</a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="content-docs">
        {copy.sections.map((section, index) => (
          <section
            className={section.id === 'translations' ? 'content-doc-section content-doc-section--notice' : 'content-doc-section'}
            id={section.id}
            key={section.id}
            aria-labelledby={`${section.id}-heading`}
            data-doc-section
          >
            <span className="content-doc-section__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h2 id={`${section.id}-heading`}>{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
