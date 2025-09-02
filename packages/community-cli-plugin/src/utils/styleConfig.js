/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import { styleText } from 'util';
import type { ForegroundColors, BackgroundColors, Modifiers } from 'util';

export function compatibleStyleText(
  text: string,
  styles: ForegroundColors | BackgroundColors | Modifiers | $ReadOnlyArray<ForegroundColors | BackgroundColors | Modifiers>
): string {
  const nodeVersion = parseInt(process.version.slice(1).split('.')[0], 10);

  if (nodeVersion >= 20 && Array.isArray(styles)) {
    // Node 20+ doesn't support array of styles, apply them individually - Sahi
    let styledText = text;
    for (const style of styles) {
      styledText = styleText(style, styledText);
    }
    return styledText;
  }

  // For older Node versions or single style strings, use original behavior
  return styleText(styles, text);
}
