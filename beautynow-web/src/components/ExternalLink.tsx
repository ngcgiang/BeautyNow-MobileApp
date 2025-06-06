import React from 'react';

export function ExternalLink(props: React.ComponentProps<'a'> & { href: string }) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      href={props.href}
    >
      {props.children}
    </a>
  );
} 