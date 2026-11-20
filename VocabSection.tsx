import React, { useEffect, useMemo, useState } from 'react';
import { Check, Languages, Search, Star, X } from 'lucide-react';
import { CEFRLevel, EpisodeData, EpisodeProgress } from './types';
import { ClickToTranslate } from './TranslatableText';

interface VocabSectionProps {
  episode: EpisodeData;
  progress: EpisodeProgress;
  onToggleFavorite: (vocabId: string) => void;
  onToggleLearned: (vocabId: string) => void;
}

type CategoryFilter = 'all' | 'vocab' | 'expression' | 'argentine' | 'favorites';

export const VocabSection: React.FC<VocabSectionProps> = ({
  episode,
  progress,
  onToggleFavorite,
  onToggleLearned,
}) => {
  const [catFilter, setCatFilter] = useState<CategoryFilter>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | CEFRLevel>('all');
  const [search, setSearch] = useState('');
  const [openCardIds, setOpenCardIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCatFilter('all');
    setLevelFilter('all');
    setSearch('');
    setOpenCardIds({});
  }, [episode.id]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return episode.vocabulary.filter((item) => {
      if (catFilter === 'vocab' && item.category !== 'vocab') return false;
      if (catFilter === 'expression' && item.category !== 'expression') return false;
      if (catFilter === 'argentine' && !item.isArgentine) return false;
      if (catFilter === 'favorites' && !progress.favoriteVocabIds.includes(item.id)) return false;
      if (levelFilter !== 'all' && item.level !== levelFilter) return false;
      if (q) {
        const matchEs = item.termEs.toLowerCase().includes(q);
        const matchEx = item.example?.es.toLowerCase().includes(q) ?? false;
        const matchHy = item.translationHy.toLowerCase().includes(q);
        if (!matchEs && !matchEx && !matchHy) return false;
      }
      return true;
    });
  }, [episode.vocabulary, catFilter, levelFilter, search, progress.favoriteVocabIds]);

  const toggleOpen = (id: string) => {
    setOpenCardIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-[#FFFDF9]/96 border border-[#FFD166]/65 shadow-lg shadow-[#6B1029]/15 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-[#584449]">
              Capítulo {episode.number} · {episode.vocabulary.length} entradas · Aprendidas:{' '}
              <span className="font-mono-tabular font-semibold text-[#6B1029]">
                {progress.learnedVocabIds.length}/{episode.vocabulary.length}
              </span>{' '}
              · Favoritas:{' '}
              <span className="font-mono-tabular font-semibold text-[#F28C28]">
                {progress.favoriteVocabIds.length}
              </span>
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#6B1029]">
              Vocabulario y expresiones útiles
            </h2>
            <ClickToTranslate
              es="Toca cualquier palabra o expresión en español para abrir su traducción al armenio, explicación y ejemplo del capítulo."
              hy="Սեղմեք իսպաներեն բառի կամ արտահայտության վրա՝ տեսնելու արևելահայերեն թարգմանությունը, բացատրությունը և օրինակը սերիայից։"
              esClassName="text-sm sm:text-base text-[#584449]"
              showHintLabel={false}
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#6A585D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar palabra o expresión en español..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#EAE0DC] bg-[#FAF7F5] text-sm sm:text-base text-[#1E1417] placeholder:text-[#6A585D]/70 focus:outline-none focus:bg-white focus:border-[#9F1835] focus:ring-2 focus:ring-[#F28C28]/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#6A585D] hover:text-[#1E1417] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'Todo' },
                { id: 'vocab', label: 'Vocabulario' },
                { id: 'expression', label: 'Expresiones' },
                { id: 'argentine', label: 'Argentino' },
                { id: 'favorites', label: `Favoritas (${progress.favoriteVocabIds.length})` },
              ] as { id: CategoryFilter; label: string }[]
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setCatFilter(btn.id)}
                className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  catFilter === btn.id
                    ? 'bg-[#6B1029] text-white'
                    : 'bg-[#FFF8EE] text-[#584449] hover:bg-[#FFD166]/35 hover:text-[#6B1029]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-[#FFF8EE] p-1 rounded-xl border border-[#F28C28]/25">
            {(['all', 'A1', 'A2', 'B1', 'B2'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  levelFilter === lvl
                    ? 'bg-white text-[#6B1029] shadow-xs'
                    : 'text-[#584449] hover:text-[#1E1417]'
                }`}
              >
                {lvl === 'all' ? 'A1–B2' : lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#FFFDF9]/96 border border-[#FFD166]/65 rounded-2xl p-10 text-center text-sm text-[#584449]">
          No hay palabras ni expresiones con estos filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
          {filteredItems.map((item) => {
            const isOpen = !!openCardIds[item.id];
            const isFav = progress.favoriteVocabIds.includes(item.id);
            const isLearned = progress.learnedVocabIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`bg-[#FFFDF9]/96 border rounded-2xl p-5 shadow-md shadow-[#6B1029]/12 flex flex-col justify-between gap-4 transition-colors ${
                  isLearned ? 'border-emerald-400 bg-emerald-50/90' : 'border-[#FFD166]/65'
                }`}
              >
                <div className="space-y-3">
                  {/* Quiet unboxed metadata line */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#584449]">
                      <span className="font-semibold text-[#6B1029]">{item.level}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {item.category === 'vocab' ? 'Vocabulario' : 'Expresión útil'}
                      </span>
                      {item.isArgentine && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#F28C28]">Argentino</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(item.id)}
                        aria-label={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                        title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                        className={`p-2 min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          isFav
                            ? 'text-[#F28C28] bg-[#FFF8EE]'
                            : 'text-[#6A585D] hover:bg-[#FAF7F5] hover:text-[#F28C28]'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-[#F28C28]' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleLearned(item.id)}
                        aria-label={isLearned ? 'Marcada como aprendida' : 'Marcar como aprendida'}
                        title={isLearned ? 'Aprendida' : 'Marcar como aprendida'}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[40px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isLearned
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#FFF8EE] text-[#584449] hover:bg-[#FFD166]/35 hover:text-[#6B1029]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{isLearned ? 'Aprendida' : 'Aprender'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Clickable Spanish Term */}
                  <button
                    type="button"
                    onClick={() => toggleOpen(item.id)}
                    aria-expanded={isOpen}
                    className="w-full text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] rounded-lg"
                  >
                    <h3 className="font-display text-xl font-bold text-[#1E1417] group-hover:text-[#6B1029] transition-colors">
                      {item.termEs}
                    </h3>
                    <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-[#9F1835] font-medium">
                      <Languages className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isOpen
                          ? 'Ocultar traducción y detalles'
                          : 'Toca para ver la traducción al armenio'}
                      </span>
                    </span>
                  </button>

                  {/* Translation & Meaning Revealed on Click */}
                  {isOpen && (
                    <div className="space-y-3 pt-2 border-t border-[#F0E7E3]">
                      <div className="rounded-xl bg-[#FFF8EE] border border-[#F28C28]/40 px-3.5 py-2.5">
                        <p className="text-base font-bold text-[#6B1029]">{item.translationHy}</p>
                        <p className="text-sm text-[#1E1417] mt-1 leading-relaxed">
                          {item.meaningHy}
                        </p>
                      </div>

                      {item.grammarNoteHy && (
                        <p className="text-xs sm:text-sm text-[#584449]">
                          <span className="font-semibold text-[#9F1835]">Nota gramatical:</span>{' '}
                          {item.grammarNoteHy}
                        </p>
                      )}

                      {item.example && (
                        <div className="rounded-xl bg-[#FAF7F5] border border-[#EAE0DC] p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-[#584449]">
                            <span>Ejemplo del capítulo</span>
                            <span className="font-mono-tabular text-[#9F1835]">
                              [{item.example.timestamp}]
                            </span>
                          </div>
                          <ClickToTranslate
                            es={`«${item.example.es}»`}
                            hy={item.example.hy}
                            esClassName="text-sm sm:text-base font-medium text-[#1E1417]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
