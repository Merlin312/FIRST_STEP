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

// Мінімальний відступ перед повторним показом неправильно відповіданого слова
const MIN_RETRY_GAP = 4;
const MAX_RETRY_GAP = 10;

export type QuizDirection = 'en-ua' | 'ua-en';

/** Generates N options: 1 correct + (N-1) from the full word pool (for variety). */
function generateOptions(correct: Word, count: number, direction: QuizDirection): string[] {
  const key = direction === 'en-ua' ? 'ua' : 'en';
  const wrongPool = WORDS.filter((w) => w[key] !== correct[key]);
  const wrong = shuffle(wrongPool)
    .slice(0, count - 1)
    .map((w) => w[key]);
  return shuffle([correct[key], ...wrong]);
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

function createInitialState(
  wordPool: Word[],
  optionsCount: number,
  direction: QuizDirection,
): State {
  const pool = wordPool.length > 0 ? wordPool : WORDS;
  const queue = shuffle(pool);
  const currentWord = queue[0];
  return {
    queue,
    queueIndex: 0,
    currentWord,
    options: generateOptions(currentWord, optionsCount, direction),
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

export function useQuiz(
  category?: WordCategory,
  optionsCount: 4 | 6 | 8 = 6,
  direction: QuizDirection = 'en-ua',
) {
  const wordPool = category ? (WORDS_BY_CATEGORY[category] ?? WORDS) : WORDS;
  // Keep pool reference stable for callbacks
  const wordPoolRef = useRef(wordPool);
  const prevCategoryRef = useRef(category);
  const optionsCountRef = useRef(optionsCount);
  const directionRef = useRef(direction);

  const [state, setState] = useState<State>(() =>
    createInitialState(wordPool, optionsCount, direction),
  );

  // Reset quiz and word pool when category changes
  useEffect(() => {
    if (category === prevCategoryRef.current) return;
    prevCategoryRef.current = category;
    const newPool = category ? WORDS_BY_CATEGORY[category] : WORDS;
    wordPoolRef.current = newPool;
    setState(createInitialState(newPool, optionsCountRef.current, directionRef.current));
  }, [category]);

  // Regenerate options when optionsCount changes
  useEffect(() => {
    if (optionsCount === optionsCountRef.current) return;
    optionsCountRef.current = optionsCount;
    setState((prev) => ({
      ...prev,
      options: generateOptions(prev.currentWord, optionsCount, directionRef.current),
      selected: null,
      isCorrect: null,
    }));
  }, [optionsCount]);

  // Reset quiz when direction changes
  useEffect(() => {
    if (direction === directionRef.current) return;
    directionRef.current = direction;
    setState(createInitialState(wordPoolRef.current, optionsCountRef.current, direction));
  }, [direction]);

  const selectAnswer = useCallback((answer: string) => {
    setState((prev) => {
      if (prev.selected !== null) return prev;
      const correctAnswer =
        directionRef.current === 'en-ua' ? prev.currentWord.ua : prev.currentWord.en;
      const isCorrect = answer === correctAnswer;

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
        options: generateOptions(currentWord, optionsCountRef.current, directionRef.current),
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
        options: generateOptions(currentWord, optionsCountRef.current, directionRef.current),
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
    setState(
      createInitialState(wordPoolRef.current, optionsCountRef.current, directionRef.current),
    );
  }, []);

  // Будь-яка відповідь → auto-advance через 1.5 с
  const readyToAdvance = state.selected !== null;

  // Підказка: перша літера + многокрапка (для правильної відповіді залежно від напряму)
  const correctKey = direction === 'en-ua' ? 'ua' : 'en';
  const hint = state.hintRevealed ? (state.currentWord[correctKey][0] ?? '?') + '…' : null;

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
