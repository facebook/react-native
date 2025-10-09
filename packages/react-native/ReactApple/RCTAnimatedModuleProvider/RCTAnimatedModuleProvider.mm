/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAnimatedModuleProvider.h"

#import <functional>

#if TARGET_OS_OSX
#import <React/RCTPlatformDisplayLink.h>
#else
#import <QuartzCore/CADisplayLink.h>
#endif
#import <react/renderer/animated/AnimatedModule.h>
#import <react/renderer/animated/NativeAnimatedNodesManagerProvider.h>

@implementation RCTAnimatedModuleProvider {
#if TARGET_OS_OSX
  RCTPlatformDisplayLink *_displayLink;
#else
  CADisplayLink *_displayLink;
#endif
  std::function<void()> _onRender;
}

- (void)_onDisplayLinkTick
{
  if (_displayLink != nullptr && _onRender != nullptr) {
    _onRender();
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if (facebook::react::ReactNativeFeatureFlags::cxxNativeAnimatedEnabled()) {
    if (name == facebook::react::AnimatedModule::kModuleName) {
      auto provider = std::make_shared<facebook::react::NativeAnimatedNodesManagerProvider>(
          [self](std::function<void()> &&onRender) {
            _onRender = onRender;
            if (_displayLink == nil) {
#if TARGET_OS_OSX
              _displayLink = [RCTPlatformDisplayLink displayLinkWithTarget:self selector:@selector(_onDisplayLinkTick)];
#else
              _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_onDisplayLinkTick)];
#endif
              [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
            }
          },
          [self]() {
            if (_displayLink != nil) {
              [_displayLink invalidate];
              _displayLink = nil;
              _onRender = nullptr;
            }
          });
      return std::make_shared<facebook::react::AnimatedModule>(std::move(jsInvoker), std::move(provider));
    }
  }
  return nullptr;
}

@end
