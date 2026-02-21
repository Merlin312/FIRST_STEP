import { act, renderHook } from '@testing-library/react-native';

import { useQuiz } from '@/hooks/use-quiz';

describe('useQuiz', () => {
  test('initializes with a current word', () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.currentWord).toBeDefined();
    expect(result.current.currentWord.en).toBeTruthy();
    expect(result.current.currentWord.ua).toBeTruthy();
  });

  test('generates exactly 6 options', () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.options).toHaveLength(6);
  });

  test('correct answer is always among options', () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.options).toContain(result.current.currentWord.ua);
  });

  test('options have no duplicates', () => {
    const { result } = renderHook(() => useQuiz());
    const unique = new Set(result.current.options);
    expect(unique.size).toBe(6);
  });

  test('selectAnswer marks correct answer', () => {
    const { result } = renderHook(() => useQuiz());
    const correct = result.current.currentWord.ua;
    act(() => { result.current.selectAnswer(correct); });
    expect(result.current.isCorrect).toBe(true);
    expect(result.current.selected).toBe(correct);
    expect(result.current.score).toBe(1);
    expect(result.current.total).toBe(1);
  });

  test('selectAnswer marks wrong answer', () => {
    const { result } = renderHook(() => useQuiz());
    const wrong = result.current.options.find((o) => o !== result.current.currentWord.ua)!;
    act(() => { result.current.selectAnswer(wrong); });
    expect(result.current.isCorrect).toBe(false);
    expect(result.current.score).toBe(0);
    expect(result.current.total).toBe(1);
  });

  test('cannot select answer twice', () => {
    const { result } = renderHook(() => useQuiz());
    const correct = result.current.currentWord.ua;
    const wrong = result.current.options.find((o) => o !== correct)!;
    act(() => { result.current.selectAnswer(correct); });
    act(() => { result.current.selectAnswer(wrong); });
    expect(result.current.score).toBe(1); // still 1, not 0
    expect(result.current.total).toBe(1);
  });

  test('readyToAdvance is true after selecting an answer', () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.readyToAdvance).toBe(false);
    act(() => { result.current.selectAnswer(result.current.currentWord.ua); });
    expect(result.current.readyToAdvance).toBe(true);
  });

  test('nextWord resets selection and moves to new word', () => {
    const { result } = renderHook(() => useQuiz());
    const firstWord = result.current.currentWord;
    act(() => { result.current.selectAnswer(result.current.currentWord.ua); });
    act(() => { result.current.nextWord(); });
    expect(result.current.selected).toBeNull();
    expect(result.current.isCorrect).toBeNull();
    // In a 518-word pool, almost certainly different
    expect(result.current.options).toHaveLength(6);
    // First word should NOT be current (statistically near certain)
    expect(result.current.currentWord).not.toEqual(firstWord);
  });

  test('skipWord moves to a different word without answering', () => {
    const { result } = renderHook(() => useQuiz());
    const firstWord = result.current.currentWord;
    act(() => { result.current.skipWord(); });
    expect(result.current.currentWord).not.toEqual(firstWord);
    expect(result.current.selected).toBeNull();
    expect(result.current.score).toBe(0);
  });

  test('skipWord does nothing after an answer is selected', () => {
    const { result } = renderHook(() => useQuiz());
    const correct = result.current.currentWord.ua;
    act(() => { result.current.selectAnswer(correct); });
    const wordAfterAnswer = result.current.currentWord;
    act(() => { result.current.skipWord(); });
    expect(result.current.currentWord).toEqual(wordAfterAnswer);
  });

  test('revealHint returns first letter + ellipsis', () => {
    const { result } = renderHook(() => useQuiz());
    expect(result.current.hint).toBeNull();
    act(() => { result.current.revealHint(); });
    const expectedHint = result.current.currentWord.ua[0] + '…';
    expect(result.current.hint).toBe(expectedHint);
  });

  test('hint resets on nextWord', () => {
    const { result } = renderHook(() => useQuiz());
    act(() => { result.current.revealHint(); });
    expect(result.current.hint).not.toBeNull();
    act(() => { result.current.selectAnswer(result.current.currentWord.ua); });
    act(() => { result.current.nextWord(); });
    expect(result.current.hint).toBeNull();
  });

  test('resetQuiz resets score and state', () => {
    const { result } = renderHook(() => useQuiz());
    act(() => { result.current.selectAnswer(result.current.currentWord.ua); });
    act(() => { result.current.resetQuiz(); });
    expect(result.current.score).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.selected).toBeNull();
    expect(result.current.hint).toBeNull();
  });

  test('category filter returns only words of that category', () => {
    const { result } = renderHook(() => useQuiz('verb'));
    expect(result.current.currentWord.category).toBe('verb');
  });

  test('category noun filter works', () => {
    const { result } = renderHook(() => useQuiz('noun'));
    expect(result.current.currentWord.category).toBe('noun');
  });
});
