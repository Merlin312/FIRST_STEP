import { useCallback, useEffect, useRef, useState } from 'react';

import { WORDS, WORDS_BY_CATEGORY, Word, WordCategory } from '@/constants/words';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const OPTIONS_COUNT = 6;
// Мінімальний відступ перед повторним показом неправильно відповіданого слова
const MIN_RETRY_GAP = 4;
const MAX_RETRY_GAP = 10;

/** Generates 6 options: 1 correct + 5 from the full word pool (for variety). */
function generateOptions(correct: Word): string[] {
  const wrongPool = WORDS.filter((w) => w.ua !== correct.ua);
  const wrong = shuffle(wrongPool)
    .slice(0, OPTIONS_COUNT - 1)
    .map((w) => w.ua);
  return shuffle([correct.ua, ...wrong]);
}

interface State {
  queue: Word[];
  queueIndex: number;
  currentWord: Word;
  options: string[];
  selected: string | null;
  isCorrect: boolean | null;
  hintRevealed: boolean;
  score: number;
  total: number;
}

function createInitialState(wordPool: Word[]): State {
  const pool = wordPool.length > 0 ? wordPool : WORDS;
  const queue = shuffle(pool);
  const currentWord = queue[0];
  return {
    queue,
    queueIndex: 0,
    currentWord,
    options: generateOptions(currentWord),
    selected: null,
    isCorrect: null,
    hintRevealed: false,
    score: 0,
    total: 0,
  };
}

/**
 * Вставляє слово у випадкову позицію у залишку черги.
 * Якщо залишку недостатньо для відступу — слово природно з'явиться
 * у наступному перемішаному циклі.
 */
function reinsertWord(queue: Word[], afterIndex: number, word: Word): Word[] {
  const remaining = queue.length - afterIndex - 1;
  if (remaining <= MIN_RETRY_GAP) return queue;

  const maxGap = Math.min(MAX_RETRY_GAP, remaining - 1);
  const gap = MIN_RETRY_GAP + Math.floor(Math.random() * (maxGap - MIN_RETRY_GAP + 1));
  const insertAt = afterIndex + 1 + gap;

  const newQueue = [...queue];
  newQueue.splice(insertAt, 0, word);
  return newQueue;
}

export function useQuiz(category?: WordCategory) {
  const wordPool = category ? (WORDS_BY_CATEGORY[category] ?? WORDS) : WORDS;
  // Keep pool reference stable for callbacks
  const wordPoolRef = useRef(wordPool);
  const prevCategoryRef = useRef(category);

  const [state, setState] = useState<State>(() => createInitialState(wordPool));

  // Reset quiz and word pool when category changes
  useEffect(() => {
    if (category === prevCategoryRef.current) return;
    prevCategoryRef.current = category;
    const newPool = category ? WORDS_BY_CATEGORY[category] : WORDS;
    wordPoolRef.current = newPool;
    setState(createInitialState(newPool));
  }, [category]);

  const selectAnswer = useCallback((answer: string) => {
    setState((prev) => {
      if (prev.selected !== null) return prev;
      const isCorrect = answer === prev.currentWord.ua;

      // Неправильна відповідь → вставляємо слово назад у чергу на випадкову позицію
      const queue = isCorrect
        ? prev.queue
        : reinsertWord(prev.queue, prev.queueIndex, prev.currentWord);

      return {
        ...prev,
        queue,
        selected: answer,
        isCorrect,
        score: isCorrect ? prev.score + 1 : prev.score,
        total: prev.total + 1,
      };
    });
  }, []);

  const nextWord = useCallback(() => {
    setState((prev) => {
      let queue = prev.queue;
      let nextIndex = prev.queueIndex + 1;

      if (nextIndex >= queue.length) {
        queue = shuffle(wordPoolRef.current);
        nextIndex = 0;
      }

      const currentWord = queue[nextIndex];
      return {
        ...prev,
        queue,
        queueIndex: nextIndex,
        currentWord,
        options: generateOptions(currentWord),
        selected: null,
        isCorrect: null,
        hintRevealed: false,
      };
    });
  }, []);

  /** Переміщує поточне слово на 4–10 позицій вперед без відповіді. */
  const skipWord = useCallback(() => {
    setState((prev) => {
      if (prev.selected !== null) return prev; // вже відповіли — нічого не робити

      // Insert current word later in queue (no-op if queue is too short)
      const queue = reinsertWord(prev.queue, prev.queueIndex, prev.currentWord);

      // Always advance to the next slot — skip means "show this word later, not now"
      let nextIndex = prev.queueIndex + 1;
      let nextQueue = queue;

      if (nextIndex >= queue.length) {
        nextQueue = shuffle(wordPoolRef.current);
        nextIndex = 0;
      }

      const currentWord = nextQueue[nextIndex];
      return {
        ...prev,
        queue: nextQueue,
        queueIndex: nextIndex,
        currentWord,
        options: generateOptions(currentWord),
        selected: null,
        isCorrect: null,
        hintRevealed: false,
      };
    });
  }, []);

  /** Відкриває першу літеру правильної відповіді. */
  const revealHint = useCallback(() => {
    setState((prev) => ({ ...prev, hintRevealed: true }));
  }, []);

  const resetQuiz = useCallback(() => {
    setState(createInitialState(wordPoolRef.current));
  }, []);

  // Будь-яка відповідь → auto-advance через 1.5 с
  const readyToAdvance = state.selected !== null;

  // Підказка: перша літера + многокрапка
  const hint = state.hintRevealed ? state.currentWord.ua[0] + '…' : null;

  // Загальна кількість слів у поточній категорії / пулі
  const poolSize = wordPoolRef.current.length;

  return {
    currentWord: state.currentWord,
    options: state.options,
    selected: state.selected,
    isCorrect: state.isCorrect,
    hint,
    score: state.score,
    total: state.total,
    queueIndex: state.queueIndex,
    poolSize,
    readyToAdvance,
    selectAnswer,
    nextWord,
    skipWord,
    revealHint,
    resetQuiz,
  };
}
