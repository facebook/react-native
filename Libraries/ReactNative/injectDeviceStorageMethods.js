/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {MMKV} from 'react-native-mmkv';

const storage = new MMKV();

// Keep in sync with /packages/react-devtools-shared/src/constants.js in the react repo
const LOCAL_STORAGE_SHOULD_APPEND_COMPONENT_STACK_KEY =
  'React::DevTools::appendComponentStack';
const LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS =
  'React::DevTools::breakOnConsoleErrors';
const LOCAL_STORAGE_SHOW_INLINE_WARNINGS_AND_ERRORS_KEY =
  'React::DevTools::showInlineWarningsAndErrors';
const LOCAL_STORAGE_HIDE_CONSOLE_LOGS_IN_STRICT_MODE =
  'React::DevTools::hideConsoleLogsInStrictMode';
const LOCAL_STORAGE_BROWSER_THEME = 'React::DevTools::theme';

function maybeInjectDeviceStorageMethods() {
  if (
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ &&
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.injectDeviceStorageMethods
  ) {
    try {
      window.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ =
        parseBool(
          storage.get(LOCAL_STORAGE_SHOULD_APPEND_COMPONENT_STACK_KEY),
        ) ?? true;
      window.__REACT_DEVTOOLS_BREAK_ON_CONSOLE_ERRORS__ =
        parseBool(storage.get(LOCAL_STORAGE_SHOULD_BREAK_ON_CONSOLE_ERRORS)) ??
        false;
      window.__REACT_DEVTOOLS_SHOW_INLINE_WARNINGS_AND_ERRORS__ =
        parseBool(
          storage.get(LOCAL_STORAGE_SHOW_INLINE_WARNINGS_AND_ERRORS_KEY),
        ) ?? true;
      window.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ =
        parseBool(
          storage.get(LOCAL_STORAGE_HIDE_CONSOLE_LOGS_IN_STRICT_MODE),
        ) ?? false;
      window.__REACT_DEVTOOLS_BROWSER_THEME__ =
        parseBrowserTheme(storage.get(LOCAL_STORAGE_BROWSER_THEME)) ?? 'light';
    } catch {}
    try {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.injectDeviceStorageMethods({
        setValueOnDevice: (key, value) => {
          storage.set(key, value);
        },
      });
    } catch (e) {
      console.warn('injectDeviceStorageMethods was found, but threw.', e);
    }
  }
}

function parseBool(s: string): ?boolean {
  if (s === 'true') {
    return true;
  }
  if (s === 'false') {
    return false;
  }
}

type BrowserTheme = 'dark' | 'light';
function parseBrowserTheme(s: string): ?BrowserTheme {
  if (s === 'light') {
    return 'light';
  }
  if (s === 'dark') {
    return 'dark';
  }
}

module.exports = maybeInjectDeviceStorageMethods;
