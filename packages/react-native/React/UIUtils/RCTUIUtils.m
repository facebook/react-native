/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUIUtils.h"

#import "RCTUtils.h"

RCTDimensions RCTGetDimensions(CGFloat fontScale)
{
#if !TARGET_OS_OSX // [macOS]
  UIScreen *mainScreen = UIScreen.mainScreen;
  CGSize screenSize = mainScreen.bounds.size;

  UIView *mainWindow;
  mainWindow = RCTKeyWindow();
  // We fallback to screen size if a key window is not found.
  CGSize windowSize = mainWindow ? mainWindow.bounds.size : screenSize;
#else // [macOS
  RCTUIWindow *window = RCTKeyWindow();
  NSSize windowSize = window ? [window frame].size : CGSizeMake(0, 0);
  NSSize screenSize = window ? [[window screen] frame].size : CGSizeMake(0, 0);
  CGFloat scale = window ? [[window screen] backingScaleFactor] : 1.0; // Default scale to 1.0 if window is nil
#endif // macOS
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
      .scale = scale,
      .fontScale = fontScale};
  typeof(result.window) dimsWindow = {
      .width = windowSize.width, 
      .height = windowSize.height, 
      .scale = scale,
      .fontScale = fontScale};
#endif // macOS]
  result.screen = dimsScreen;
  result.window = dimsWindow;

  return result;
}
