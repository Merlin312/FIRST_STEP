import { useCallback, useEffect, useRef, useState } from 'react';

import {
  WORDS,
  WORDS_BY_CATEGORY,
  type Word,
  type WordCategory,
  type TargetLanguage,
} from '@/constants/words';
import { WORDS_ES, WORDS_ES_BY_CATEGORY } from '@/constants/words-es';
import { WORDS_DE, WORDS_DE_BY_CATEGORY } from '@/constants/words-de';

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

/** 'forward': show target-language word, pick Ukrainian answer.
 *  'reverse': show Ukrainian word, pick target-language answer. */
export type QuizDirection = 'forward' | 'reverse';

/** Maps old storage values to new QuizDirection. */
export function normalizeDirection(raw: string | null | undefined): QuizDirection {
  if (raw === 'ua-en' || raw === 'reverse') return 'reverse';
  return 'forward';
}

/** Returns the full word list (and by-category map) for the given target language. */
function getWordSource(lang: TargetLanguage): {
  all: Word[];
  byCategory: Record<WordCategory, Word[]>;
} {
  switch (lang) {
    case 'es':
      return { all: WORDS_ES, byCategory: WORDS_ES_BY_CATEGORY };
    case 'de':
      return { all: WORDS_DE, byCategory: WORDS_DE_BY_CATEGORY };
    default:
      return { all: WORDS, byCategory: WORDS_BY_CATEGORY };
  }
}

/** Generates N options: 1 correct + (N-1) from the full word pool (for variety). */
function generateOptions(
  correct: Word,
  count: number,
  direction: QuizDirection,
  allWords: Word[],
): string[] {
  const correctKey = direction === 'forward' ? 'ua' : 'target';
  const wrongPool = allWords.filter((w) => w[correctKey] !== correct[correctKey]);
  const wrong = shuffle(wrongPool)
    .slice(0, count - 1)
    .map((w) => w[correctKey]);
  return shuffle([correct[correctKey], ...wrong]);
}

interface State {
  queue: Word[];
  queueIndex: number;
  currentWord: Word;
  options: string[];
  selected: string | null;
  isCorrect: boolean | null;
  hintedOutOptions: string[];
  score: number;
  total: number;
}

function createInitialState(
  wordPool: Word[],
  allWords: Word[],
  optionsCount: number,
  direction: QuizDirection,
): State {
  const pool = wordPool.length > 0 ? wordPool : allWords;
  const queue = shuffle(pool);
  const currentWord = queue[0];
  return {
    queue,
    queueIndex: 0,
    currentWord,
    options: generateOptions(currentWord, optionsCount, direction, allWords),
    selected: null,
    isCorrect: null,
    hintedOutOptions: [],
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
  direction: QuizDirection = 'forward',
  targetLanguage: TargetLanguage = 'en',
) {
  const source = getWordSource(targetLanguage);
  const wordPool = category ? (source.byCategory[category] ?? source.all) : source.all;
  const allWordsRef = useRef(source.all);

  // Keep pool reference stable for callbacks
  const wordPoolRef = useRef(wordPool);
  const prevCategoryRef = useRef(category);
  const prevTargetLangRef = useRef(targetLanguage);
  const optionsCountRef = useRef(optionsCount);
  const directionRef = useRef(direction);

  const [state, setState] = useState<State>(() =>
    createInitialState(wordPool, source.all, optionsCount, direction),
  );

  // Reset quiz when targetLanguage changes
  useEffect(() => {
    if (targetLanguage === prevTargetLangRef.current) return;
    prevTargetLangRef.current = targetLanguage;
    const newSource = getWordSource(targetLanguage);
    allWordsRef.current = newSource.all;
    const newPool = category ? (newSource.byCategory[category] ?? newSource.all) : newSource.all;
    wordPoolRef.current = newPool;
    setState(
      createInitialState(newPool, newSource.all, optionsCountRef.current, directionRef.current),
    );
  }, [targetLanguage, category]);

  // Reset quiz and word pool when category changes
  useEffect(() => {
    if (category === prevCategoryRef.current) return;
    prevCategoryRef.current = category;
    const src = getWordSource(prevTargetLangRef.current);
    const newPool = category ? (src.byCategory[category] ?? src.all) : src.all;
    wordPoolRef.current = newPool;
    setState(
      createInitialState(
        newPool,
        allWordsRef.current,
        optionsCountRef.current,
        directionRef.current,
      ),
    );
  }, [category]);

  // Regenerate options when optionsCount changes
  useEffect(() => {
    if (optionsCount === optionsCountRef.current) return;
    optionsCountRef.current = optionsCount;
    setState((prev) => ({
      ...prev,
      options: generateOptions(
        prev.currentWord,
        optionsCount,
        directionRef.current,
        allWordsRef.current,
      ),
      selected: null,
      isCorrect: null,
    }));
  }, [optionsCount]);

  // Reset quiz when direction changes
  useEffect(() => {
    if (direction === directionRef.current) return;
    directionRef.current = direction;
    setState(
      createInitialState(
        wordPoolRef.current,
        allWordsRef.current,
        optionsCountRef.current,
        direction,
      ),
    );
  }, [direction]);

  const selectAnswer = useCallback((answer: string) => {
    setState((prev) => {
      if (prev.selected !== null) return prev;
      const correctAnswer =
        directionRef.current === 'forward' ? prev.currentWord.ua : prev.currentWord.target;
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
        options: generateOptions(
          currentWord,
          optionsCountRef.current,
          directionRef.current,
          allWordsRef.current,
        ),
        selected: null,
        isCorrect: null,
        hintedOutOptions: [],
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
        options: generateOptions(
          currentWord,
          optionsCountRef.current,
          directionRef.current,
          allWordsRef.current,
        ),
        selected: null,
        isCorrect: null,
        hintedOutOptions: [],
      };
    });
  }, []);

  /** Прибирає половину неправильних варіантів відповіді. */
  const revealHint = useCallback(() => {
    setState((prev) => {
      const correctAnswer =
        directionRef.current === 'forward' ? prev.currentWord.ua : prev.currentWord.target;
      const wrongOptions = prev.options.filter((opt) => opt !== correctAnswer);
      const elimCount = Math.floor(wrongOptions.length / 2);
      const hintedOutOptions = shuffle(wrongOptions).slice(0, elimCount);
      return { ...prev, hintedOutOptions };
    });
  }, []);

  const resetQuiz = useCallback(() => {
    setState(
      createInitialState(
        wordPoolRef.current,
        allWordsRef.current,
        optionsCountRef.current,
        directionRef.current,
      ),
    );
  }, []);

  // Будь-яка відповідь → auto-advance через 1.5 с
  const readyToAdvance = state.selected !== null;

  // Загальна кількість слів у поточній категорії / пулі
  const poolSize = wordPoolRef.current.length;

  return {
    currentWord: state.currentWord,
    options: state.options,
    selected: state.selected,
    isCorrect: state.isCorrect,
    hintedOutOptions: state.hintedOutOptions,
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
