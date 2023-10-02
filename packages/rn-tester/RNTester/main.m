/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

#import "AppDelegate.h"

#if !TARGET_OS_OSX // [macOS]
int main(int argc, char *argv[])
{
  @autoreleasepool {
    return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
  }
}
#else // [macOS
int main(int argc, const char *argv[])
{
  return NSApplicationMain(argc, argv);
}
#endif // macOS]


