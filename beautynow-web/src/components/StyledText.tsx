import React from 'react';

export function MonoText(props: React.HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} style={{ ...(props.style || {}), fontFamily: 'monospace' }} />;
} 