import React, { useState } from 'react';
import { Languages } from 'lucide-react';

interface ClickToTranslateProps {
  es: string;
  hy: string;
  className?: string;
  esClassName?: string;
  hyClassName?: string;
  showHintLabel?: boolean;
  defaultOpen?: boolean;
}

export const ClickToTranslate: React.FC<ClickToTranslateProps> = ({
  es,
  hy,
  className = '',
  esClassName = 'text-base sm:text-lg font-medium text-[#1E1417]',
  hyClassName = 'mt-2 text-sm sm:text-base text-[#6B1029] bg-[#FFF8EE] border border-[#F28C28]/35 rounded-xl px-4 py-2.5 leading-relaxed',
  showHintLabel = true,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] rounded-lg transition-colors"
        aria-expanded={open}
        title={open ? 'Ocultar traducción al armenio' : 'Ver traducción al armenio'}
      >
        <span
          className={`${esClassName} group-hover:text-[#6B1029] transition-colors block`}
        >
          {es}
        </span>
        {showHintLabel && (
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#6A585D] group-hover:text-[#9F1835] transition-colors">
            <Languages className="w-3.5 h-3.5 shrink-0" />
            <span>
              {open ? 'Ocultar traducción' : 'Toca para traducir al armenio'}
            </span>
          </span>
        )}
      </button>
      {open && <div className={hyClassName}>{hy}</div>}
    </div>
  );
};

interface TranslationToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  compact?: boolean;
  labelOpen?: string;
  labelClosed?: string;
}

export const TranslationToggleButton: React.FC<TranslationToggleButtonProps> = ({
  isOpen,
  onToggle,
  compact = false,
  labelOpen = 'Ocultar',
  labelClosed = 'Traducir',
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-expanded={isOpen}
      title={isOpen ? 'Ocultar traducción al armenio' : 'Ver traducción al armenio'}
      className={`inline-flex items-center gap-1.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] ${
        compact ? 'px-2.5 py-1.5 text-xs sm:text-sm min-h-[38px]' : 'px-3.5 py-2 text-xs sm:text-sm min-h-[42px]'
      } ${
        isOpen
          ? 'bg-[#6B1029] text-white border-[#6B1029]'
          : 'bg-[#FFF8EE] text-[#6B1029] border-[#F28C28]/45 hover:bg-[#FFD166]/40'
      }`}
    >
      <Languages className="w-3.5 h-3.5 shrink-0" />
      <span>{isOpen ? labelOpen : labelClosed}</span>
    </button>
  );
};
