/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <NativeModules.h>

REACT_STRUCT(ScreenshotArguments)
struct ScreenshotArguments
{
};

REACT_MODULE(ScreenshotManagerCxx, L"ScreenshotManager")
struct ScreenshotManagerCxx
{
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
                      ) noexcept;

 private:
  winrt::Microsoft::ReactNative::ReactContext _reactContext;
};
