/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUIImageViewAnimated.h"

#import <mach/mach.h>
#import <objc/runtime.h>

static NSUInteger RCTDeviceTotalMemory() {
  return (NSUInteger)[[NSProcessInfo processInfo] physicalMemory];
}

static NSUInteger RCTDeviceFreeMemory() {
  mach_port_t host_port = mach_host_self();
  mach_msg_type_number_t host_size = sizeof(vm_statistics_data_t) / sizeof(integer_t);
  vm_size_t page_size;
  vm_statistics_data_t vm_stat;
  kern_return_t kern;
  
  kern = host_page_size(host_port, &page_size);
  if (kern != KERN_SUCCESS) return 0;
  kern = host_statistics(host_port, HOST_VM_INFO, (host_info_t)&vm_stat, &host_size);
  if (kern != KERN_SUCCESS) return 0;
  return vm_stat.free_count * page_size;
}

@interface RCTUIImageViewAnimated () <CALayerDelegate>

@property (nonatomic, assign) NSUInteger maxBufferSize;
@property (nonatomic, strong, readwrite) UIImage *currentFrame;
@property (nonatomic, assign, readwrite) NSUInteger currentFrameIndex;
@property (nonatomic, assign, readwrite) NSUInteger currentLoopCount;
@property (nonatomic, assign) NSUInteger totalFrameCount;
@property (nonatomic, assign) NSUInteger totalLoopCount;
@property (nonatomic, strong) UIImage<RCTAnimatedImage> *animatedImage;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, UIImage *> *frameBuffer;
@property (nonatomic, assign) NSTimeInterval currentTime;
@property (nonatomic, assign) BOOL bufferMiss;
@property (nonatomic, assign) NSUInteger maxBufferCount;
@property (nonatomic, strong) NSOperationQueue *fetchQueue;
@property (nonatomic, strong) dispatch_semaphore_t lock;
@property (nonatomic, assign) CGFloat animatedImageScale;
@property (nonatomic, strong) CADisplayLink *displayLink;

@end

@implementation RCTUIImageViewAnimated

#pragma mark - Initializers

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _lock = dispatch_semaphore_create(1);
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveMemoryWarning:) name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
    
  }
  return self;
}

- (void)resetAnimatedImage
{
  _animatedImage = nil;
  _totalFrameCount = 0;
  _totalLoopCount = 0;
  _currentFrame = nil;
  _currentFrameIndex = 0;
  _currentLoopCount = 0;
  _currentTime = 0;
  _bufferMiss = NO;
  _maxBufferCount = 0;
  _animatedImageScale = 1;
  [_fetchQueue cancelAllOperations];
  _fetchQueue = nil;
  dispatch_semaphore_wait(_lock, DISPATCH_TIME_FOREVER);
  [_frameBuffer removeAllObjects];
  _frameBuffer = nil;
  dispatch_semaphore_signal(_lock);
}

- (void)setImage:(UIImage *)image
{
  // bail if the images are the same
  if (self.image == image) {
    return;
  }

  [self stopAnimating];
  [self resetAnimatedImage];

  super.image = image;

  if ([image respondsToSelector:@selector(animatedImageFrameAtIndex:)]) {
    NSUInteger animatedImageFrameCount = ((UIImage<RCTAnimatedImage> *)image).animatedImageFrameCount;
    
    // Check the frame count
    if (animatedImageFrameCount <= 1) {
      return;
    }
    
    _animatedImage = (UIImage<RCTAnimatedImage> *)image;
    _totalFrameCount = animatedImageFrameCount;
    
    // Get the current frame and loop count.
    _totalLoopCount = _animatedImage.animatedImageLoopCount;
    
    // Get the scale
    _animatedImageScale = image.scale;
    
    _currentFrame = image;
    
    dispatch_semaphore_wait(_lock, DISPATCH_TIME_FOREVER);
    _frameBuffer[@(_currentFrameIndex)] = _currentFrame;
    dispatch_semaphore_signal(_lock);

    // Calculate max buffer size
    [self calculateMaxBufferCount];
    
    if (![self isAnimating]) {
      [self startAnimating];
    }
    
    [self.layer setNeedsDisplay];
  }
}

- (NSOperationQueue *)fetchQueue
{
  if (!_fetchQueue) {
    _fetchQueue = [[NSOperationQueue alloc] init];
    _fetchQueue.maxConcurrentOperationCount = 1;
  }
  return _fetchQueue;
}

- (NSMutableDictionary<NSNumber *,UIImage *> *)frameBuffer
{
  if (!_frameBuffer) {
    _frameBuffer = [NSMutableDictionary dictionary];
  }
  return _frameBuffer;
}

- (CADisplayLink *)displayLink
{
  if (!_displayLink) {
    __weak __typeof(self) weakSelf = self;
    _displayLink = [CADisplayLink displayLinkWithTarget:weakSelf selector:@selector(displayDidRefresh:)];
    NSString *runLoopMode = [NSProcessInfo processInfo].activeProcessorCount > 1 ? NSRunLoopCommonModes : NSDefaultRunLoopMode;
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:runLoopMode];
  }
  return _displayLink;
}

#pragma mark - Animations / Images

- (void)startAnimating
{
  if (_animatedImage) {
    _displayLink.paused = NO;
  } else {
    [super startAnimating];
  }
}

- (void)stopAnimating
{
  if (_animatedImage) {
    _displayLink.paused = YES;
  } else {
    [super stopAnimating];
  }
}

- (BOOL)isAnimating
{
  if (_animatedImage) {
    return !_displayLink.isPaused;
  } else {
    return [super isAnimating];
  }
}

- (void)displayDidRefresh:(CADisplayLink *)displayLink
{
  NSTimeInterval duration = displayLink.duration * displayLink.frameInterval;
  NSUInteger totalFrameCount = _totalFrameCount;
  NSUInteger currentFrameIndex = _currentFrameIndex;
  NSUInteger nextFrameIndex = (currentFrameIndex + 1) % totalFrameCount;
  
  // Check if we have the frame buffer firstly to improve performance
  if (!_bufferMiss) {
    // Then check if timestamp is reached
    _currentTime += duration;
    NSTimeInterval currentDuration = [_animatedImage animatedImageDurationAtIndex:currentFrameIndex];
    if (_currentTime < currentDuration) {
      // Current frame timestamp not reached, return
      return;
    }
    _currentTime -= currentDuration;
    NSTimeInterval nextDuration = [_animatedImage animatedImageDurationAtIndex:nextFrameIndex];
    if (_currentTime > nextDuration) {
      // Do not skip frame
      _currentTime = nextDuration;
    }
  }
  
  // Update the current frame
  UIImage *currentFrame;
  UIImage *fetchFrame;
  dispatch_semaphore_wait(_lock, DISPATCH_TIME_FOREVER);
  currentFrame = _frameBuffer[@(currentFrameIndex)];
  fetchFrame = currentFrame ? _frameBuffer[@(nextFrameIndex)] : nil;
  dispatch_semaphore_signal(_lock);
  BOOL bufferFull = NO;
  if (currentFrame) {
    dispatch_semaphore_wait(_lock, DISPATCH_TIME_FOREVER);
    // Remove the frame from buffer if need
    if (_frameBuffer.count > _maxBufferCount) {
      _frameBuffer[@(currentFrameIndex)] = nil;
    }
    // Check whether we can stop fetch
    if (_frameBuffer.count == totalFrameCount) {
      bufferFull = YES;
    }
    dispatch_semaphore_signal(_lock);
    _currentFrame = currentFrame;
    _currentFrameIndex = nextFrameIndex;
    _bufferMiss = NO;
    [self.layer setNeedsDisplay];
  } else {
    _bufferMiss = YES;
  }
  
  // Update the loop count when last frame rendered
  if (nextFrameIndex == 0 && !_bufferMiss) {
    // Update the loop count
    _currentLoopCount++;
    // if reached the max loop count, stop animating, 0 means loop indefinitely
    NSUInteger maxLoopCount = _totalLoopCount;
    if (maxLoopCount != 0 && (_currentLoopCount >= maxLoopCount)) {
      [self stopAnimating];
      return;
    }
  }
  
  // Check if we should prefetch next frame or current frame
  NSUInteger fetchFrameIndex;
  if (_bufferMiss) {
    // When buffer miss, means the decode speed is slower than render speed, we fetch current miss frame
    fetchFrameIndex = currentFrameIndex;
  } else {
    // Or, most cases, the decode speed is faster than render speed, we fetch next frame
    fetchFrameIndex = nextFrameIndex;
  }
  
  if (!fetchFrame && !bufferFull && _fetchQueue.operationCount == 0) {
    // Prefetch next frame in background queue
    UIImage<RCTAnimatedImage> *animatedImage = _animatedImage;
    NSOperation *operation = [NSBlockOperation blockOperationWithBlock:^{
      UIImage *frame = [animatedImage animatedImageFrameAtIndex:fetchFrameIndex];
      dispatch_semaphore_wait(self.lock, DISPATCH_TIME_FOREVER);
      self.frameBuffer[@(fetchFrameIndex)] = frame;
      dispatch_semaphore_signal(self.lock);
    }];
    [_fetchQueue addOperation:operation];
  }
}

#pragma mark - CALayerDelegate

- (void)displayLayer:(CALayer *)layer
{
  if (_currentFrame) {
    layer.contentsScale = _animatedImageScale;
    layer.contents = (__bridge id)_currentFrame.CGImage;
  }
}

#pragma mark - Lifecycle

- (void)dealloc
{
  // Removes the display link from all run loop modes.
  [_displayLink invalidate];
  _displayLink = nil;
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
}

- (void)didReceiveMemoryWarning:(NSNotification *)notification {
  [_fetchQueue cancelAllOperations];
  [_fetchQueue addOperationWithBlock:^{
    NSNumber *currentFrameIndex = @(self.currentFrameIndex);
    dispatch_semaphore_wait(self.lock, DISPATCH_TIME_FOREVER);
    NSArray *keys = self.frameBuffer.allKeys;
    // only keep the next frame for later rendering
    for (NSNumber * key in keys) {
      if (![key isEqualToNumber:currentFrameIndex]) {
        [self.frameBuffer removeObjectForKey:key];
      }
    }
    dispatch_semaphore_signal(self.lock);
  }];
}

#pragma mark - Util

- (void)calculateMaxBufferCount {
  NSUInteger bytes = CGImageGetBytesPerRow(_currentFrame.CGImage) * CGImageGetHeight(_currentFrame.CGImage);
  if (bytes == 0) bytes = 1024;
  
  NSUInteger max = 0;
  if (_maxBufferSize > 0) {
    max = _maxBufferSize;
  } else {
    // Calculate based on current memory, these factors are by experience
    NSUInteger total = RCTDeviceTotalMemory();
    NSUInteger free = RCTDeviceFreeMemory();
    max = MIN(total * 0.2, free * 0.6);
  }
  
  NSUInteger maxBufferCount = (double)max / (double)bytes;
  if (!maxBufferCount) {
    // At least 1 frame
    maxBufferCount = 1;
  }
  
  _maxBufferCount = maxBufferCount;
}

@end
