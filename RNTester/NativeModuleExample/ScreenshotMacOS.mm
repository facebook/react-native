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
#import <NativeModules.h>
#import <TurboModulesProvider.h>

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

REACT_STRUCT(ScreenshotArguments)
struct ScreenshotArguments
{
};

REACT_MODULE(ScreenshotManagerCxx, L"ScreenshotManager")
struct ScreenshotManagerCxx
{
  winrt::Microsoft::ReactNative::ReactContext _reactContext;
  
  REACT_INIT(Initialize)
  void Initialize(const winrt::Microsoft::ReactNative::ReactContext& reactContext) noexcept
  {
    _reactContext = reactContext;
  }
  
  REACT_METHOD(TakeScreenshot, L"takeScreenshot")
  void TakeScreenshot(
                      std::string,
                      ScreenshotArguments&&,
                      winrt::Microsoft::ReactNative::ReactPromise<std::string> result
                      ) noexcept
  {
    _reactContext.UIDispatcher().Post([this, result]
    {
      NSImage* screenshotImage = TakeScreenshotAsImage();
      _reactContext.JSDispatcher().Post([screenshotImage, result]()
      {
        NSString* tempFilePath = SaveScreenshotToTempFile(screenshotImage);
        result.Resolve([tempFilePath UTF8String]);
      });
    });
  }
};

@implementation ScreenshotManagerTurboModuleManagerDelegate {
  std::shared_ptr<winrt::Microsoft::ReactNative::TurboModulesProvider> _provider;
}

- (std::shared_ptr<facebook::react::TurboModule>)
  getTurboModule:(const std::string &)name
  jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if (!_provider)
  {
    _provider = std::make_shared<winrt::Microsoft::ReactNative::TurboModulesProvider>();
    _provider->SetReactContext(winrt::Microsoft::ReactNative::CreateMacOSReactContext(jsInvoker));
    
    _provider->AddModuleProvider(
      L"ScreenshotManager",
      winrt::Microsoft::ReactNative::MakeModuleProvider<ScreenshotManagerCxx>()
      );
  }
  return _provider->getModule(name, jsInvoker);
}


- (std::shared_ptr<facebook::react::TurboModule>)
  getTurboModule:(const std::string &)name
  instance:(id<RCTTurboModule>)instance
  jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return [self getTurboModule:name jsInvoker:jsInvoker];
}

@end
