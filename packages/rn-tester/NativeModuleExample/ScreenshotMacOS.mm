/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ScreenshotMacOS.h"

#import <React/RCTUtils.h>

static NSImage* TakeScreenshotAsImage()
{
  // find the key window
  NSWindow* keyWindow;
  for (NSWindow* window in NSApp.windows) {
    if (window.keyWindow) {
      keyWindow = window;
      break;
    }
  }

  // take a snapshot of the key window
  CGWindowID windowID = (CGWindowID)[keyWindow windowNumber];
  CGWindowImageOption imageOptions = kCGWindowImageDefault;
  CGWindowListOption listOptions = kCGWindowListOptionIncludingWindow;
  CGRect imageBounds = CGRectNull;
  CGImageRef windowImage = CGWindowListCreateImage(
    imageBounds,
    listOptions,
    windowID,
    imageOptions);
  NSImage* image = [[NSImage alloc] initWithCGImage:windowImage size:[keyWindow frame].size];
  CGImageRelease(windowImage);

  return image;
}

static NSString* SaveScreenshotToTempFile(NSImage* image)
{
  // save to a temp file
  NSError *error = nil;
  NSString *tempFilePath = RCTTempFilePath(@"jpeg", &error);
  NSData* imageData = [image TIFFRepresentation];
  NSBitmapImageRep* imageRep = [NSBitmapImageRep imageRepWithData:imageData];
  NSDictionary* imageProps =
    [NSDictionary
    dictionaryWithObject:@0.8
    forKey:NSImageCompressionFactor
    ];
  imageData = [imageRep representationUsingType:NSBitmapImageFileTypeJPEG properties:imageProps];
  [imageData writeToFile:tempFilePath atomically:NO];

  return tempFilePath;
}

void ScreenshotManagerCxx::TakeScreenshot(
    std::string,
    ScreenshotArguments &&,
    winrt::Microsoft::ReactNative::ReactPromise<std::string> result) noexcept
{
  _reactContext.UIDispatcher().Post([this, result] {
    NSImage *screenshotImage = TakeScreenshotAsImage();
    _reactContext.JSDispatcher().Post([screenshotImage, result]() {
      NSString *tempFilePath = SaveScreenshotToTempFile(screenshotImage);
      result.Resolve([tempFilePath UTF8String]);
    });
  });
}
