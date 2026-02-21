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

export function useQuiz() {
  const [state, setState] = useState<State>(createInitialState);

  const selectAnswer = useCallback((answer: string) => {
    setState((prev) => {
      if (prev.selected !== null) return prev;
      const isCorrect = answer === prev.currentWord.ua;
      return {
        ...prev,
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

  return {
    currentWord: state.currentWord,
    options: state.options,
    selected: state.selected,
    isCorrect: state.isCorrect,
    score: state.score,
    total: state.total,
    selectAnswer,
    nextWord,
  };
}
