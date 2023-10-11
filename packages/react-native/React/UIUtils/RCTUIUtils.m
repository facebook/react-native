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
#else // [macOS
RCTDimensions RCTGetDimensions(RCTPlatformView *rootView)
#endif // macOS]
{
#if !TARGET_OS_OSX // [macOS]
  UIScreen *mainScreen = UIScreen.mainScreen;
  CGSize screenSize = mainScreen.bounds.size;

  UIView *mainWindow;
  mainWindow = RCTKeyWindow();
  // We fallback to screen size if a key window is not found.
  CGSize windowSize = mainWindow ? mainWindow.bounds.size : screenSize;
#else // [macOS
  NSWindow *window = nil;
  NSSize windowSize;
  NSSize screenSize;
  if (rootView != nil) {
	  window = [rootView window];
	  windowSize = [window frame].size;
  } else {
    // We don't have a root view so fall back to the app's key window
    window = [NSApp keyWindow];
    windowSize = [window frame].size;
  }
  screenSize = [[window screen] frame].size;
#endif

  RCTDimensions result;
#if !TARGET_OS_OSX // [macOS]
  typeof(result.screen) dimsScreen = {
      .width = screenSize.width, .height = screenSize.height, .scale = mainScreen.scale, .fontScale = fontScale};
  typeof(result.window) dimsWindow = {
      .width = windowSize.width, .height = windowSize.height, .scale = mainScreen.scale, .fontScale = fontScale};
#else // [macOS
  typeof(result.screen) dimsScreen = {
      .width = screenSize.width, 
      .height = screenSize.height, 
      .scale = [[window screen] backingScaleFactor],
      .fontScale = 1};
  typeof(result.window) dimsWindow = {
      .width = windowSize.width, 
      .height = windowSize.height, 
      .scale = [[window screen] backingScaleFactor], 
      .fontScale = 1};
#endif // macOS]
  result.screen = dimsScreen;
  result.window = dimsWindow;

  return result;
}
