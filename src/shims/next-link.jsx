import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

function formatHref(href) {
  if (href == null) return '';
  if (typeof href === 'string') return href;

  const pathname = href.pathname ?? '';
  const query = href.query
    ? `?${new URLSearchParams(href.query).toString()}`
    : '';
  const hash = href.hash ? String(href.hash) : '';

  return `${pathname}${query}${hash}`;
}

function isClientRoute(href) {
  return href.startsWith('/') && !href.startsWith('//');
}

export default function Link({
  href,
  as,
  replace,
  scroll,
  shallow,
  prefetch,
  locale,
  legacyBehavior,
  passHref,
  children,
  ...props
}) {
  const anchorHref = formatHref(as ?? href);

  if (legacyBehavior && React.isValidElement(children)) {
    return React.cloneElement(children, {
      href: passHref ? anchorHref : children.props.href ?? anchorHref,
      ...props,
    });
  }

  if (isClientRoute(anchorHref)) {
    return (
      <RouterLink to={anchorHref} replace={replace} {...props}>
        {children}
      </RouterLink>
    );
  }

  return (
    <a href={anchorHref} {...props}>
      {children}
    </a>
  );
}
