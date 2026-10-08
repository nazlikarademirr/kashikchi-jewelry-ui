import { useEffect } from 'react';
import { APP_NAME } from '@/constants';

interface Meta {
  title?: string;
  description?: string;
  image?: string;
  jsonLd?: Record<string, unknown>;
  noindex?: boolean;
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useDocumentMeta({ title, description, image, jsonLd, noindex }: Meta): void {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
    document.title = fullTitle;
    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description);
      setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    }
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:type"]', 'property', 'og:type', jsonLd ? 'product' : 'website');
    if (image) setMeta('meta[property="og:image"]', 'property', 'og:image', image);
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      
      script.text = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
      document.head.appendChild(script);
    }
    return () => {
      script?.remove();
    };
  }, [title, description, image, jsonLd, noindex]);
}
