import React from 'react';
import { GroundingChunk } from '../types';

interface AttributionLinksProps {
  chunks: GroundingChunk[] | undefined;
}

const AttributionLinks: React.FC<AttributionLinksProps> = ({ chunks }) => {
  if (!chunks || chunks.length === 0) {
    return null;
  }

  const validLinks = chunks.filter(chunk => chunk.web && chunk.web.uri && chunk.web.title);

  if (validLinks.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 p-4 rounded-lg max-w-xl mx-auto w-full border" 
        style={{backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)'}}>
      <h3 className="text-sm font-semibold mb-2" style={{color: 'var(--primary-accent)'}}>Sources:</h3>
      <ul className="space-y-1.5">
        {validLinks.map((chunk, index) => (
          <li key={index} className="text-xs">
            <a
              href={chunk.web!.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors"
              style={{color: 'var(--text-muted)'}}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary-accent)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              title={chunk.web!.title}
            >
              {chunk.web!.title || chunk.web!.uri}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttributionLinks;