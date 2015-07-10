/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTNetworkImageView.h"

#import "RCTAssert.h"
#import "RCTConvert.h"
#import "RCTGIFImage.h"
#import "RCTImageDownloader.h"
#import "RCTUtils.h"
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#import "UIView+React.h"

@implementation RCTNetworkImageView
{
  BOOL _deferred;
  BOOL _progressHandlerRegistered;
  NSURL *_imageURL;
  NSURL *_deferredImageURL;
  NSUInteger _deferSentinel;
  RCTImageDownloader *_imageDownloader;
  id _downloadToken;
  RCTEventDispatcher *_eventDispatcher;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher imageDownloader:(RCTImageDownloader *)imageDownloader
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _eventDispatcher = eventDispatcher;
    _progressHandlerRegistered = NO;
    _deferSentinel = 0;
    _imageDownloader = imageDownloader;
    self.userInteractionEnabled = NO;
    self.contentMode = UIViewContentModeScaleAspectFill;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(-initWithCoder:(NSCoder *)aDecoder)

- (NSURL *)imageURL
{
  // We clear our imageURL when we are not in a window for a while,
  // to make sure we don't consume network resources while offscreen.
  // However we don't want to expose this hackery externally.
  return _deferred ? _deferredImageURL : _imageURL;
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  super.backgroundColor = backgroundColor;
  [self _updateImage];
}

- (void)setProgressHandlerRegistered:(BOOL)progressHandlerRegistered
{
  _progressHandlerRegistered = progressHandlerRegistered;
}

- (void)reactSetFrame:(CGRect)frame
{
  [super reactSetFrame:frame];
  [self _updateImage];
}

- (void)_updateImage
{
  [self setImageURL:_imageURL resetToDefaultImageWhileLoading:NO];
}

- (void)setImageURL:(NSURL *)imageURL resetToDefaultImageWhileLoading:(BOOL)reset
{
  if (![_imageURL isEqual:imageURL] && _downloadToken) {
    [_imageDownloader cancelDownload:_downloadToken];
    _downloadToken = nil;
  }

  _imageURL = imageURL;

  if (_deferred) {
    _deferredImageURL = imageURL;
  } else {
    if (!imageURL) {
      self.layer.contents = nil;
      return;
    }
    if (reset) {
      self.layer.contentsScale = _defaultImage.scale;
      self.layer.contents = (__bridge id)_defaultImage.CGImage;
      self.layer.minificationFilter = kCAFilterTrilinear;
      self.layer.magnificationFilter = kCAFilterTrilinear;
    }
    [_eventDispatcher sendInputEventWithName:@"loadStart" body:@{ @"target": self.reactTag }];

    RCTDataProgressBlock progressHandler = ^(int64_t written, int64_t total) {
      if (_progressHandlerRegistered) {
        NSDictionary *event = @{
          @"target": self.reactTag,
          @"written": @(written),
          @"total": @(total),
        };
        [_eventDispatcher sendInputEventWithName:@"loadProgress" body:event];
      }
    };

    void (^errorHandler)(NSString *errorDescription) = ^(NSString *errorDescription) {
      NSDictionary *event = @{
        @"target": self.reactTag,
        @"error": errorDescription,
      };
      [_eventDispatcher sendInputEventWithName:@"loadError" body:event];
    };

    void (^loadEndHandler)(void) = ^(void) {
      NSDictionary *event = @{ @"target": self.reactTag };
      [_eventDispatcher sendInputEventWithName:@"loaded" body:event];
    };

    if ([imageURL.pathExtension caseInsensitiveCompare:@"gif"] == NSOrderedSame) {
      _downloadToken = [_imageDownloader downloadDataForURL:imageURL progressBlock:progressHandler block:^(NSData *data, NSError *error) {
        if (data) {
          dispatch_async(dispatch_get_main_queue(), ^{
            if (imageURL != self.imageURL) {
              // Image has changed
              return;
            }
            CAKeyframeAnimation *animation = RCTGIFImageWithData(data);
            self.layer.contentsScale = 1.0;
            self.layer.minificationFilter = kCAFilterLinear;
            self.layer.magnificationFilter = kCAFilterLinear;
            [self.layer addAnimation:animation forKey:@"contents"];
            loadEndHandler();
          });
        } else if (error) {
          errorHandler([error description]);
        }
      }];
    } else {
      _downloadToken = [_imageDownloader downloadImageForURL:imageURL size:self.bounds.size scale:RCTScreenScale()
                                                  resizeMode:self.contentMode backgroundColor:self.backgroundColor
                                                  progressBlock:progressHandler block:^(UIImage *image, NSError *error) {
        if (image) {
          dispatch_async(dispatch_get_main_queue(), ^{
            if (imageURL != self.imageURL) {
              // Image has changed
              return;
            }
            [self.layer removeAnimationForKey:@"contents"];
            self.layer.contentsScale = image.scale;
            self.layer.contents = (__bridge id)image.CGImage;
            loadEndHandler();
          });
        } else if (error) {
          errorHandler([error description]);
        }
      }];
    }
  }
}

- (void)setImageURL:(NSURL *)imageURL
{
  [self setImageURL:imageURL resetToDefaultImageWhileLoading:YES];
}

- (void)willMoveToWindow:(UIWindow *)newWindow
{
  [super willMoveToWindow:newWindow];
  if (newWindow != nil && _deferredImageURL) {
    // Immediately exit deferred mode and restore the imageURL that we saved when we went offscreen.
    [self setImageURL:_deferredImageURL resetToDefaultImageWhileLoading:YES];
    _deferredImageURL = nil;
  }
}

- (void)_enterDeferredModeIfNeededForSentinel:(NSUInteger)sentinel
{
  if (self.window == nil && _deferSentinel == sentinel) {
    _deferred = YES;
    [_imageDownloader cancelDownload:_downloadToken];
    _downloadToken = nil;
    _deferredImageURL = _imageURL;
    _imageURL = nil;
  }
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  if (self.window == nil) {
    __weak RCTNetworkImageView *weakSelf = self;
    NSUInteger sentinelAtDispatchTime = ++_deferSentinel;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC), dispatch_get_main_queue(), ^(void){
      [weakSelf _enterDeferredModeIfNeededForSentinel:sentinelAtDispatchTime];
    });
  }
}

@end
