/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUIUtils.h"

#import "RCTUtils.h"

#if !TARGET_OS_OSX // [macOS]
RCTDimensions RCTGetDimensions(CGFloat fontScale)
{
  UIScreen *mainScreen = UIScreen.mainScreen;
  CGSize screenSize = mainScreen.bounds.size;

  UIView *mainWindow;
  mainWindow = RCTKeyWindow();
  // We fallback to screen size if a key window is not found.
  CGSize windowSize = mainWindow ? mainWindow.bounds.size : screenSize;

  RCTDimensions result;
  typeof(result.screen) dimsScreen = {
      .width = screenSize.width, .height = screenSize.height, .scale = mainScreen.scale, .fontScale = fontScale};
  typeof(result.window) dimsWindow = {
      .width = windowSize.width, .height = windowSize.height, .scale = mainScreen.scale, .fontScale = fontScale};
  result.screen = dimsScreen;
  result.window = dimsWindow;

  return result;
}

CGFloat RCTGetMultiplierForContentSizeCategory(UIContentSizeCategory category)
{
  static NSDictionary<NSString *, NSNumber *> *multipliers = nil;
  static dispatch_once_t token;
  dispatch_once(&token, ^{
    multipliers = @{
      UIContentSizeCategoryExtraSmall : @0.823,
      UIContentSizeCategorySmall : @0.882,
      UIContentSizeCategoryMedium : @0.941,
      UIContentSizeCategoryLarge : @1.0,
      UIContentSizeCategoryExtraLarge : @1.118,
      UIContentSizeCategoryExtraExtraLarge : @1.235,
      UIContentSizeCategoryExtraExtraExtraLarge : @1.353,
      UIContentSizeCategoryAccessibilityMedium : @1.786,
      UIContentSizeCategoryAccessibilityLarge : @2.143,
      UIContentSizeCategoryAccessibilityExtraLarge : @2.643,
      UIContentSizeCategoryAccessibilityExtraExtraLarge : @3.143,
      UIContentSizeCategoryAccessibilityExtraExtraExtraLarge : @3.571
    };
  });

  double value = multipliers[category].doubleValue;
  return value > 0.0 ? value : 1.0;
}

#else // [macOS

RCTDimensions RCTGetDimensions(RCTPlatformView *rootView) {
  RCTDimensions dimensions = {
    { 0, 0, 0, /*fontScale*/ 1 },
    { 0, 0, 0, /*fontScale*/ 1 }
  };
  NSScreen *screen = nil;
  NSWindow *window = nil;
  NSSize size;
  if (rootView != nil) {
    window = [rootView window];
    size = [rootView frame].size;
  } else {
    // We don't have a root view so fall back to the app's key window
    window = [NSApp keyWindow];
    size = [window frame].size;
  }

  if (window != nil) {
    screen = [window screen];
    dimensions.window.width = size.width;
    dimensions.window.height = size.height;
    dimensions.window.scale = [window backingScaleFactor];
  } else {
    // We don't have a window yet so make something up
    screen = [NSScreen mainScreen];
    NSSize screenSize = [screen frame].size;
    dimensions.window.width = screenSize.width;
    dimensions.window.height = screenSize.height;
    dimensions.window.scale = [screen backingScaleFactor];
  }

  NSSize screenSize = [screen frame].size;
  dimensions.screen.width = screenSize.width;
  dimensions.screen.height = screenSize.height;
  dimensions.screen.scale = [screen backingScaleFactor];

  return dimensions;
}

#endif // macOS]
