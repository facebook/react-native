# How React Native macOS differs from React Native

React Native macOS elected to implement our fork via inline diffs of existing React Native code. This means additions and changes of extra code to support macOS, usually in the same file as the existing iOS or JS implementation.

# Rationale

UIKit (The native iOS framework that React Native's iOS implementation is built off) is quite similar to Appkit (the macOS equivalent) which encourages a lot of code sharing and re-use. We found that to encourage maximum code sharing, the use of preprocessor `#ifdef` blocks was best to modify the existing iOS implementation to compile on macOS. This also aides in merging upstream changes from React Native, as it's easier to compare and update our diffs when they're in the same file than if macOS was in a separate implementation file altogether.

# How do we track diffs?

We track diffs through the use of "diff tags" in code comments. Wherever we add or modify code, we try to add a diff tag to mark the beginning and end of the modified code. The diff tags are designed so that you can easily do a search of the string "[macOS" across the entire repository and collect a list of all of our diffs.

## Diff tag format

- Single Line diff
```
// [macOS]
```
- Single Line diff with comment
```
// [macOS] comment explaining change
```
- Block Diff
```
...
// [macOS
...
// macOS]
...
```
- Block Diff with comment
```
...
// [macOS comment explaining change
...
// macOS]
...
```
- Inline diff
```
/* blah blah blah `RCTUIView` [macOS] blah blah */
```

## Forked files

We try to make changes in the same file where possible. However, we sometimes find the need to make completely new files for macOS only code, or for a parallel implementation to the iOS and Android implementations. For these entirely new files, we find it sufficient to simply add a single line diff tag near the top to show that the _file_ is an addition by React Native macOS.

```
Foo.macos.js
====================
/**
 * Copyright notice
 */

// [macOS]

... rest of file
=====================
```

## ifdef blocks

Oftentimes we add a few types of ifdef blocks to React Native's iOS code. We follow a few guidelines to keep these consistent and manageable between merges.

1. ifdef macOS only code 

```
#if TARGET_OS_OSX // [macOS
  ...macOS only code
#endif // macOS]
```
Here, we used the block start and end tags to signify the code inside the ifdef is an _addition_ from React Native macOS. 


2. ifdef iOS only code

```
#if !TARGET_OS_OSX // [macOS]
  ...iOS only code
#endif // [macOS]
```
Here, we used single line diff tags to show that the code inside the tags is the original React Native code (as opposed to an iOS block added by React Native macOS)


3. ifdef between an iOS and macOS block

```
#if !TARGET_OS_OSX // [macOS]
  ...original iOS only code
#else // [macOS
  ...macOS only code
#endif // macOS]
```
This case is a mix of the earlier two cases. We use a single line tag for the starting if tag to show that the first block of iOS only code is the original code from React Native. Then, we use block tags with the else/endif to show that the macOS code is an addition by React Native macOS.



