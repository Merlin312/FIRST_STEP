# CLAUDE.md — First Step (Vocabulary Learning App)

## Philosophy & Vision

> **First Step — це перший крок у вивченні мови.**
> Коли людина вирішує почати вивчати нову мову, цей додаток має бути її першою точкою входу.

Це визначає всі рішення щодо продукту:

- **Нульове тертя** — без реєстрації, без складного налаштування; запустив → одразу практикуєш
- **Тільки найважливіше** — 500 найуживаніших слів покривають 90% реальних текстів; краще менше, але суттєвого
- **Маленькі щоденні кроки** — ціль 10–20 слів/день будує звичку без перевантаження
- **Відчутний прогрес** — користувач має відчути, що рухається вперед вже з першого дня
- **Конфіденційність за замовчуванням** — всі дані локально, нульовий поріг довіри до додатку
- **Питання перед кожною фічею**: _"Чи це допомагає людині зробити перший крок? Чи не перетворюємо ми це на другий або третій крок?"_

Детальніше: [`docs/PHILOSOPHY.md`](docs/PHILOSOPHY.md)

---

## Project Overview

**First Step** is a React Native / Expo mobile app for learning English vocabulary through spaced-repetition quizzes. Users choose the correct Ukrainian translation from 6 options. The app targets phones and tablets (iOS + Android + Web).

---

## Tech Stack

| Layer               | Technology                                               |
| ------------------- | -------------------------------------------------------- |
| Framework           | Expo SDK 54, React Native 0.81.5, React 19               |
| Routing             | expo-router v6 (file-based routing)                      |
| Navigation          | @react-navigation/native + @react-navigation/bottom-tabs |
| Storage             | @react-native-async-storage/async-storage                |
| Animation           | react-native-reanimated v4                               |
| Gestures            | react-native-gesture-handler                             |
| Icons (iOS)         | expo-symbols (SF Symbols)                                |
| Icons (Android/Web) | @expo/vector-icons (MaterialIcons)                       |
| Language            | TypeScript (strict)                                      |

---

## File Structure

```
app/
├── _layout.tsx          Root Stack; AsyncStorage onboarding gate; AppThemeProvider
├── onboarding.tsx       3-slide onboarding (FlatList + pagingEnabled)
└── (tabs)/
    ├── _layout.tsx      Bottom tab navigator (single tab: Home)
    └── index.tsx        Main quiz screen

components/
├── answer-button.tsx    Quiz answer button (idle/correct/wrong/disabled states)
├── drawer-panel.tsx     Animated side panel (stats, theme, auth+lang placeholders)
├── haptic-tab.tsx       Tab bar button with iOS haptic feedback
├── themed-text.tsx      Text with theme support
└── ui/
    ├── icon-symbol.tsx       Android/Web icon fallback (MaterialIcons)
    └── icon-symbol.ios.tsx   iOS SF Symbols via expo-symbols

contexts/
├── theme-context.tsx    AppThemeProvider + useAppTheme() (system/light/dark)
└── stats-context.tsx    StatsProvider + useStatsContext() (all-time stats, daily progress, streak)

hooks/
├── use-device.ts          Responsive layout: isTablet, contentWidth, horizontalPadding
├── use-drawer.ts          isOpen / open / close / toggle state
├── use-quiz.ts            Quiz state machine (queue, options, score)
├── use-color-scheme.ts    Re-export of RN useColorScheme (legacy, prefer useAppTheme)
└── use-theme-color.ts     Resolves theme color by key

constants/
├── storage-keys.ts  All AsyncStorage key constants (STORAGE_KEYS)
├── theme.ts         Blue palette (Tailwind), Colors light/dark, Fonts
└── words.ts         518 English-Ukrainian word pairs (Word: { en, ua })
```

---

## Architecture Decisions

### Theme

- `useAppTheme()` (from `contexts/theme-context.tsx`) — use this everywhere instead of `useColorScheme()`
- Stores preference in AsyncStorage key `'themeMode'` (`'system' | 'light' | 'dark'`)
- `AppThemeProvider` wraps the entire app in `_layout.tsx`

### Responsive Layout

- `useDevice()` hook returns `horizontalPadding` and `contentWidth`
- Tablet threshold: `width >= 768dp`; max content width: `520px`
- Use `useWindowDimensions()` inside components (not `Dimensions.get()` at module level)

### AsyncStorage Keys

| Key                    | Type                                                | Description                                                      |
| ---------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| `hasSeenOnboarding`    | `'true'` / null                                     | First-launch gate                                                |
| `dailyGoal`            | number string                                       | 10 / 20 / 50                                                     |
| `themeMode`            | `'system'`/`'light'`/`'dark'`                       | User theme preference                                            |
| `v2_stats`             | JSON blob                                           | All-time stats + daily progress + streak (see stats-context.tsx) |
| `wordCategory`         | `'verb'`/`'noun'`/`'adjective'`/`'adverb'` / absent | Active word category filter                                      |
| `autoAdvance`          | `'true'`/`'false'`                                  | Whether quiz auto-advances after answer                          |
| `celebrationShownDate` | `'YYYY-MM-DD'`                                      | Date when daily goal celebration was last shown                  |

### Side Panel (DrawerPanel)

- **Not** a navigation drawer — it's an animated absolute-position overlay
- Uses `react-native-reanimated` `useSharedValue` + `withSpring`
- Opened by ☰ button in the home screen header row
- Contains: auth placeholder, stats, language placeholder, theme switcher, reset actions
- `isOpen` state lives in `useDrawer()` hook inside `index.tsx`

### Quiz Logic (`use-quiz.ts`)

- 500+ words shuffled via Fisher-Yates into a queue
- 6 options per question: 1 correct + 5 random from full word pool
- Queue restarts (reshuffled) when exhausted
- **Stateless between app sessions** — score resets on restart (intentional for now)

---

## Coding Conventions

- **No `useColorScheme()`** — use `useAppTheme()` from `contexts/theme-context`
- **No `Dimensions.get('window')`** at module level — use `useWindowDimensions()` inside components
- `StyleSheet.create()` for static styles; inline objects only for dynamic (theme-dependent) values
- Colors: always use `Blue[X]` from `constants/theme` or `Colors.light/dark.*`
- `maxFontSizeMultiplier={1.2}` or `{1.3}` on all Text components inside buttons and cards
- `hitSlop` on small touch targets (< 44pt)
- `SafeAreaView` from `react-native-safe-area-context` (not from `react-native`)

---

## Placeholders (Future Features)

### Auth (in DrawerPanel)

- Buttons "Увійти" / "Реєстрація" show `Alert` "Скоро буде"
- When implementing: add auth screens under `app/auth/`
- Store auth token in SecureStore (not AsyncStorage)

### Language Selection (in DrawerPanel)

- Only Ukrainian shown; "Додати мову" button is disabled
- When implementing: add `targetLanguage` AsyncStorage key
- Add language-specific word lists to `constants/`
- `useQuiz` will need to accept `language` param

---

## Navigation Flow

```
Launch
  └─► _layout.tsx checks hasSeenOnboarding
        ├─► null → router.replace('/onboarding')
        └─► 'true' → stays on /(tabs) (default anchor)

Onboarding (app/onboarding.tsx)
  └─► 3 slides: intro → how it works → daily goal
  └─► On finish: writes hasSeenOnboarding + dailyGoal → router.replace('/(tabs)')

Home (app/(tabs)/index.tsx)
  └─► ☰ button → opens DrawerPanel (absolute overlay, no route change)
```

---

## Running the Project

```bash
# Install dependencies
npm install

# Start dev server
npx expo start

# Platform-specific
npx expo start --android
npx expo start --ios
npx expo start --web

# Lint
npx expo lint
```

---

## Known Limitations / Tech Debt

- Quiz score (`score`, `total` in `use-quiz.ts`) resets on app restart — not persisted to AsyncStorage yet
- Swipe-to-open gesture not implemented on DrawerPanel (only ☰ button opens it)
- No word categories/filtering yet (words.ts has no `category` field)
- No celebration modal when daily goal is reached
- Streak counts any answered word, not just correct ones
