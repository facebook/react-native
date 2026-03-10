/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFrameTimingsObserver.h"

#import <UIKit/UIKit.h>

#import <mach/thread_act.h>
#import <pthread.h>

#import <atomic>
#import <chrono>
#import <optional>
#import <vector>

#import <react/timing/primitives.h>

using namespace facebook::react;

static constexpr CGFloat kScreenshotScaleFactor = 0.75;
static constexpr CGFloat kScreenshotJPEGQuality = 0.8;

@implementation RCTFrameTimingsObserver {
  BOOL _screenshotsEnabled;
  RCTFrameTimingCallback _callback;
  CADisplayLink *_displayLink;
  uint64_t _frameCounter;
  dispatch_queue_t _encodingQueue;
  std::atomic<bool> _running;
}

- (instancetype)initWithScreenshotsEnabled:(BOOL)screenshotsEnabled callback:(RCTFrameTimingCallback)callback
{
  if (self = [super init]) {
    _screenshotsEnabled = screenshotsEnabled;
    _callback = [callback copy];
    _frameCounter = 0;
    _encodingQueue = dispatch_queue_create("com.facebook.react.frame-timings-observer", DISPATCH_QUEUE_SERIAL);
    _running.store(false);
  }
  return self;
}

- (void)start
{
  _running.store(true, std::memory_order_relaxed);
  _frameCounter = 0;

  // Emit an initial frame timing to ensure at least one frame is captured at the
  // start of tracing, even if no UI changes occur.
  auto now = HighResTimeStamp::now();
  [self _emitFrameTimingWithBeginTimestamp:now endTimestamp:now];

  _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_displayLinkTick:)];
  [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
}

- (void)stop
{
  _running.store(false, std::memory_order_relaxed);
  [_displayLink invalidate];
  _displayLink = nil;
}

- (void)_displayLinkTick:(CADisplayLink *)sender
{
  // CADisplayLink.timestamp and targetTimestamp are in the same timebase as
  // CACurrentMediaTime() / mach_absolute_time(), which on Apple platforms maps
  // to CLOCK_UPTIME_RAW — the same clock backing std::chrono::steady_clock.
  auto beginNanos = static_cast<int64_t>(sender.timestamp * 1e9);
  auto endNanos = static_cast<int64_t>(sender.targetTimestamp * 1e9);

  auto beginTimestamp = HighResTimeStamp::fromChronoSteadyClockTimePoint(
      std::chrono::steady_clock::time_point(std::chrono::nanoseconds(beginNanos)));
  auto endTimestamp = HighResTimeStamp::fromChronoSteadyClockTimePoint(
      std::chrono::steady_clock::time_point(std::chrono::nanoseconds(endNanos)));

  [self _emitFrameTimingWithBeginTimestamp:beginTimestamp endTimestamp:endTimestamp];
}

- (void)_emitFrameTimingWithBeginTimestamp:(HighResTimeStamp)beginTimestamp endTimestamp:(HighResTimeStamp)endTimestamp
{
  uint64_t frameId = _frameCounter++;
  auto threadId = static_cast<jsinspector_modern::tracing::ThreadId>(pthread_mach_thread_np(pthread_self()));

  if (_screenshotsEnabled) {
    [self _captureScreenshotWithCompletion:^(std::optional<std::vector<uint8_t>> screenshotData) {
      if (!self->_running.load()) {
        return;
      }
      jsinspector_modern::tracing::FrameTimingSequence sequence{
          frameId, threadId, beginTimestamp, endTimestamp, std::move(screenshotData)};
      self->_callback(std::move(sequence));
    }];
  } else {
    dispatch_async(_encodingQueue, ^{
      if (!self->_running.load(std::memory_order_relaxed)) {
        return;
      }
      jsinspector_modern::tracing::FrameTimingSequence sequence{frameId, threadId, beginTimestamp, endTimestamp};
      self->_callback(std::move(sequence));
    });
  }
}

- (void)_captureScreenshotWithCompletion:(void (^)(std::optional<std::vector<uint8_t>>))completion
{
  UIWindow *keyWindow = [self _getKeyWindow];
  if (keyWindow == nullptr) {
    completion(std::nullopt);
    return;
  }

  UIView *rootView = keyWindow.rootViewController.view ?: keyWindow;
  CGSize viewSize = rootView.bounds.size;
  CGSize scaledSize = CGSizeMake(viewSize.width * kScreenshotScaleFactor, viewSize.height * kScreenshotScaleFactor);

  UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat defaultFormat];
  format.scale = 1.0;
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:scaledSize format:format];

  UIImage *image = [renderer imageWithActions:^(UIGraphicsImageRendererContext *context) {
    [rootView drawViewHierarchyInRect:CGRectMake(0, 0, scaledSize.width, scaledSize.height) afterScreenUpdates:NO];
  }];

  dispatch_async(_encodingQueue, ^{
    if (!self->_running.load(std::memory_order_relaxed)) {
      return;
    }
    NSData *jpegData = UIImageJPEGRepresentation(image, kScreenshotJPEGQuality);
    if (jpegData == nullptr) {
      completion(std::nullopt);
      return;
    }

    const auto *bytes = static_cast<const uint8_t *>(jpegData.bytes);
    std::vector<uint8_t> screenshotBytes(bytes, bytes + jpegData.length);
    completion(std::move(screenshotBytes));
  });
}

- (UIWindow *)_getKeyWindow
{
  for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
    if (scene.activationState == UISceneActivationStateForegroundActive &&
        [scene isKindOfClass:[UIWindowScene class]]) {
      auto windowScene = (UIWindowScene *)scene;
      for (UIWindow *window = nullptr in windowScene.windows) {
        if (window.isKeyWindow) {
          return window;
        }
      }
    }
  }
  return nil;
}

@end
