'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps { value?: number; onChange?: (value: number) => void; readonly?: boolean; size?: 'sm' | 'md' | 'lg'; }
const sizeMap = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-6 h-6' };

export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)} disabled={readonly}
        >
          <Star className={`${sizeMap[size]} ${star <= (hover || value) ? 'text-[#3ecf8e] fill-[#3ecf8e]' : 'text-[#444444]'}`} />
        </button>
      ))}
    </div>
  );
}
