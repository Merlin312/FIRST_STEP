import { useState, useCallback } from 'react';

import { WORDS, Word } from '@/constants/words';

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

function generateOptions(correct: Word, allWords: Word[]): string[] {
  const wrongPool = allWords.filter((w) => w.ua !== correct.ua);
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
  score: number;
  total: number;
}

function createInitialState(): State {
  const queue = shuffle(WORDS);
  const currentWord = queue[0];
  return {
    queue,
    queueIndex: 0,
    currentWord,
    options: generateOptions(currentWord, WORDS),
    selected: null,
    isCorrect: null,
    score: 0,
    total: 0,
  };
}

/**
 * Вставляє слово у випадкову позицію у залишку черги.
 * Якщо залишку недостатньо для відступу — слово природно з'явиться
 * у наступному перемішаному циклі (WORDS його містить).
 */
function reinsertWord(queue: Word[], afterIndex: number, word: Word): Word[] {
  const remaining = queue.length - afterIndex - 1;
  if (remaining <= MIN_RETRY_GAP) return queue; // з'явиться в наступному циклі

  const maxGap = Math.min(MAX_RETRY_GAP, remaining - 1);
  const gap = MIN_RETRY_GAP + Math.floor(Math.random() * (maxGap - MIN_RETRY_GAP + 1));
  const insertAt = afterIndex + 1 + gap;

  const newQueue = [...queue];
  newQueue.splice(insertAt, 0, word);
  return newQueue;
}

export function useQuiz() {
  const [state, setState] = useState<State>(createInitialState);

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
        queue = shuffle(WORDS);
        nextIndex = 0;
      }

      const currentWord = queue[nextIndex];
      return {
        ...prev,
        queue,
        queueIndex: nextIndex,
        currentWord,
        options: generateOptions(currentWord, WORDS),
        selected: null,
        isCorrect: null,
      };
    });
  }, []);

  const resetQuiz = useCallback(() => {
    setState(createInitialState());
  }, []);

  // Будь-яка відповідь → auto-advance через 1.5 с
  const readyToAdvance = state.selected !== null;

  return {
    currentWord: state.currentWord,
    options: state.options,
    selected: state.selected,
    isCorrect: state.isCorrect,
    score: state.score,
    total: state.total,
    readyToAdvance,
    selectAnswer,
    nextWord,
    resetQuiz,
  };
}
