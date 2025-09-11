# Utilities

This directory contains utility functions and hooks for React Native.

## useDebouncedState

A hook that provides a debounced state setter to optimize updates for mobile performance.

```jsx
import { useDebouncedState } from 'react-native';

function SearchInput() {
  const [query, setQuery] = useDebouncedState('', 500);
  return <TextInput value={query} onChangeText={setQuery} />;
}