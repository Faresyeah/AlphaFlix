# AlphaFlix — Phase 1 repair report

## Project direction
- Product name: AlphaFlix
- Visual direction: Netflix-inspired dark/red streaming UI
- Target platforms: Android phones/tablets and Android TV
- Scope: cinema, series, anime, manga, manhwa, books, and novels
- Preservation rule: retain existing API endpoints, parsers, player stack, routes, and source allowlists unless a documented defect requires a change.

## Repairs applied in this pass

### 1. Cinema home cards and hero data
- `ContentCard` requires a complete `MediaItem` in its `item` prop. The cinema home screen had passed unsupported `title` and `poster` props in search results and shelf rows.
- Cinema parser output stores the source URL in `MediaItem.id`, not `url`. Hero construction, card keys, and detail navigation now use `id` consistently.
- The homepage's locally assembled row was labelled `Top 10` and visually ranked despite not being backed by a ranking endpoint. It is now labelled `اكتشف السينما` and no longer invents ranking positions.
- Search now lets the user switch between movies and series using the existing API `type` parameter.
- Search results from older requests are ignored after the query or selected content type changes.

### 2. Continue Watching metadata
- Added a local `progressItems` store so an item can appear in Continue Watching even when it was not separately added to Favorites or Watch Later.
- Cinema playback now records the item metadata alongside its progress, allowing the library to show the work and navigate back to its details/episode route.
- Cinema playback now saves the playback position in seconds and attempts to restore it when the player becomes ready.

### 3. Preserved integrations
- No existing API base URL or endpoint was changed.
- No source IDs or server allowlist was changed.
- The existing `expo-video` player and Expo Router navigation remain in use.
- Existing local storage keys and data are retained; one new key was added for progress item metadata.

## Validation
- TypeScript/TSX syntax transpilation: **133 files checked, zero syntax errors**.
- Full `tsc --noEmit`: **not completed** because dependencies are not installed in this environment (`expo/tsconfig.base`, `expo/types`, `nativewind/types`, and `@types/node` are unavailable).
- Vitest suite: **not run** because project dependencies are not installed and package registry access was unavailable.
- No APK or Android TV build was produced in this pass.

## Remaining Phase 1 work
- Install dependencies in the normal development environment and run `pnpm check`, `pnpm lint`, and `pnpm test`.
- Fix all remaining compiler, lint, and test failures before starting visual redesign work.
- Verify player seeking/restoration on a real Android device against each supported stream format.
- Verify current API responses and source availability without changing the source contracts.

## Important product limitations found in the current project
- Download history is currently a list of saved URLs, not verified offline media files.
- User library and playback progress are currently device-local; cross-device account sync is not implemented.
- Android TV navigation/focus and TV-specific native packaging still need implementation and device testing.
- Manga/manhwa/novel/book sections must keep their current documented API availability; do not invent endpoints where no source is configured.
