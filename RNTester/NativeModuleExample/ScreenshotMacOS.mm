/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ScreenshotMacOS.h"
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <ReactCommon/TurboModuleUtils.h>

static NSImage* TakeScreenshot()
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

class ScreenshotManagerTurboModule : public facebook::react::TurboModule
{
public:
  ScreenshotManagerTurboModule(std::shared_ptr<facebook::react::CallInvoker> jsInvoker)
    :facebook::react::TurboModule("ScreenshotManager", jsInvoker)
  {
  }
  
  facebook::jsi::Value get(
    facebook::jsi::Runtime& runtime,
    const facebook::jsi::PropNameID& propName
  ) override
  {
    auto jsInvoker = jsInvoker_;
    auto key = propName.utf8(runtime);
    if (key == "takeScreenshot")
    {
      return facebook::jsi::Function::createFromHostFunction(
        runtime,
        propName,
        0,
        [jsInvoker](
          facebook::jsi::Runtime& runtime,
          const facebook::jsi::Value& thisVal,
          const facebook::jsi::Value *args,
          size_t count)
        {
          return facebook::react::createPromiseAsJSIValue(
            runtime,
            [jsInvoker](facebook::jsi::Runtime& runtime, std::shared_ptr<facebook::react::Promise> promise)
            {
              // ignore arguments, assume to be ('window', {format: 'jpeg', quality: 0.8})

              dispatch_async(dispatch_get_main_queue(), ^{
                NSImage* screenshotImage = TakeScreenshot();
                jsInvoker->invokeAsync([screenshotImage, &runtime, promise]()
                {
                  NSString* tempFilePath = SaveScreenshotToTempFile(screenshotImage);
                  promise->resolve(facebook::jsi::Value(
                    runtime,
                    facebook::jsi::String::createFromUtf8(
                      runtime,
                      std::string([tempFilePath UTF8String])
                      )
                    ));
                });
              });
            }
          );
        }
      );
    }
    else
    {
      return facebook::jsi::Value::undefined();
    }
  }
};

@implementation ScreenshotManagerTurboModuleManagerDelegate

- (std::shared_ptr<facebook::react::TurboModule>)
  getTurboModule:(const std::string &)name
  jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if (name == "ScreenshotManager")
  {
    return std::make_shared<ScreenshotManagerTurboModule>(jsInvoker);
  }
  return nullptr;
}


- (std::shared_ptr<facebook::react::TurboModule>)
  getTurboModule:(const std::string &)name
  instance:(id<RCTTurboModule>)instance
  jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if (name == "ScreenshotManager")
  {
    return std::make_shared<ScreenshotManagerTurboModule>(jsInvoker);
  }
  return nullptr;
}

@end
