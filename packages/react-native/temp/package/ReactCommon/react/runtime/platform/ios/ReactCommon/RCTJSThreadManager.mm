/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTJSThreadManager.h"

#import <React/RCTAssert.h>
#import <React/RCTCxxUtils.h>

static NSString *const RCTJSThreadName = @"com.facebook.react.runtime.JavaScript";

#define RCTAssertJSThread() \
  RCTAssert(self->_jsThread == [NSThread currentThread], @"This method must be called on JS thread")

@implementation RCTJSThreadManager {
  NSThread *_jsThread;
  std::shared_ptr<facebook::react::RCTMessageThread> _jsMessageThread;
}

- (instancetype)init
{
  if (self = [super init]) {
    [self startJSThread];
    __weak RCTJSThreadManager *weakSelf = self;

    dispatch_block_t captureJSThreadRunLoop = ^(void) {
      __strong RCTJSThreadManager *strongSelf = weakSelf;
      strongSelf->_jsMessageThread =
          std::make_shared<facebook::react::RCTMessageThread>([NSRunLoop currentRunLoop], ^(NSError *error) {
            if (error) {
              [weakSelf _handleError:error];
            }
          });
    };

    [self performSelector:@selector(_tryAndHandleError:)
                 onThread:_jsThread
               withObject:captureJSThreadRunLoop
            waitUntilDone:YES];
  }
  return self;
}

- (std::shared_ptr<facebook::react::RCTMessageThread>)jsMessageThread
{
  return _jsMessageThread;
}

- (void)dealloc
{
  // This avoids a race condition, where work can be executed on JS thread after
  // other peices of infra are cleaned up.
  _jsMessageThread->quitSynchronous();
}

#pragma mark - JSThread Management

- (void)startJSThread
{
  _jsThread = [[NSThread alloc] initWithTarget:[self class] selector:@selector(runRunLoop) object:nil];
  _jsThread.name = RCTJSThreadName;
  _jsThread.qualityOfService = NSOperationQualityOfServiceUserInteractive;
#if RCT_DEBUG
  _jsThread.stackSize *= 2;
#endif
  [_jsThread start];
}

/**
 * Ensure block is run on the JS thread. If we're already on the JS thread, the block will execute synchronously.
 * If we're not on the JS thread, the block is dispatched to that thread.
 */
- (void)dispatchToJSThread:(dispatch_block_t)block
{
  RCTAssert(_jsThread, @"This method must not be called before the JS thread is created");

  if ([NSThread currentThread] == _jsThread) {
    [self _tryAndHandleError:block];
  } else {
    __weak __typeof(self) weakSelf = self;
    _jsMessageThread->runOnQueue([weakSelf, block] { [weakSelf _tryAndHandleError:block]; });
  }
}

+ (void)runRunLoop
{
  @autoreleasepool {
    // copy thread name to pthread name
    pthread_setname_np([NSThread currentThread].name.UTF8String);

    // Set up a dummy runloop source to avoid spinning
    CFRunLoopSourceContext noSpinCtx = {0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL};
    CFRunLoopSourceRef noSpinSource = CFRunLoopSourceCreate(NULL, 0, &noSpinCtx);
    CFRunLoopAddSource(CFRunLoopGetCurrent(), noSpinSource, kCFRunLoopDefaultMode);
    CFRelease(noSpinSource);

    // run the run loop
    while (kCFRunLoopRunStopped !=
           CFRunLoopRunInMode(
               kCFRunLoopDefaultMode, ((NSDate *)[NSDate distantFuture]).timeIntervalSinceReferenceDate, NO)) {
      RCTAssert(NO, @"not reached assertion"); // runloop spun. that's bad.
    }
  }
}

#pragma mark - Private

- (void)_handleError:(NSError *)error
{
  RCTFatal(error);
}

- (void)_tryAndHandleError:(dispatch_block_t)block
{
  NSError *error = facebook::react::tryAndReturnError(block);
  if (error) {
    [self _handleError:error];
  }
}

@end
