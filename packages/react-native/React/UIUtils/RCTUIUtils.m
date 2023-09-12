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
#if TARGET_OS_VISION
  CGSize screenSize = RCTForegroundWindow().bounds.size;
#else
  UIScreen *mainScreen = UIScreen.mainScreen;
  CGSize screenSize = mainScreen.bounds.size;
#endif
  UIView *mainWindow = RCTKeyWindow();
  // We fallback to screen size if a key window is not found.
  CGSize windowSize = mainWindow ? mainWindow.bounds.size : screenSize;
  CGFloat scale;
#if TARGET_OS_VISION
    scale = 2;
#else
    scale = mainScreen.scale;
#endif

  RCTDimensions result;
  typeof(result.screen) dimsScreen = {
      .width = screenSize.width, .height = screenSize.height, .scale = scale, .fontScale = fontScale};
  typeof(result.window) dimsWindow = {
      .width = windowSize.width, .height = windowSize.height, .scale = scale, .fontScale = fontScale};
  result.screen = dimsScreen;
  result.window = dimsWindow;

  return result;
}
