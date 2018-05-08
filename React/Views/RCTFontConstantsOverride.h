/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// NOTE: Include this header file to ensure consistency of the constants defined here.
// The values are the ones used in RCTFont.mm.
// Example: import it for testing RCTFont internals in a unit test.

#if !defined(__IPHONE_8_2) || __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_2

// These constants are defined in iPhone SDK 8.2, but the app cannot run on
// iOS < 8.2 unless we redefine them here. If you target iOS 8.2 or above
// as a base target, the standard constants will be used instead.
// These constants can only be removed when React Native drops iOS8 support.

#define UIFontWeightUltraLight -0.8
#define UIFontWeightThin -0.6
#define UIFontWeightLight -0.4
#define UIFontWeightRegular 0
#define UIFontWeightMedium 0.23
#define UIFontWeightSemibold 0.3
#define UIFontWeightBold 0.4
#define UIFontWeightHeavy 0.56
#define UIFontWeightBlack 0.62

#endif
