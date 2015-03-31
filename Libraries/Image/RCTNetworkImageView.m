/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTNetworkImageView.h"

#import "RCTConvert.h"
#import "RCTGIFImage.h"
#import "RCTImageDownloader.h"
#import "RCTUtils.h"

@implementation RCTNetworkImageView
{
  BOOL _deferred;
  NSURL *_imageURL;
  NSURL *_deferredImageURL;
  NSUInteger _deferSentinel;
  RCTImageDownloader *_imageDownloader;
  id _downloadToken;
}

- (instancetype)initWithFrame:(CGRect)frame imageDownloader:(RCTImageDownloader *)imageDownloader
{
  self = [super initWithFrame:frame];
  if (self) {
    _deferSentinel = 0;
    _imageDownloader = imageDownloader;
    self.userInteractionEnabled = NO;
  }
  return self;
}

- (NSURL *)imageURL
{
  // We clear our backing layer's imageURL when we are not in a window for a while,
  // to make sure we don't consume network resources while offscreen.
  // However we don't want to expose this hackery externally.
  return _deferred ? _deferredImageURL : _imageURL;
}

- (void)setImageURL:(NSURL *)imageURL resetToDefaultImageWhileLoading:(BOOL)reset
{
  if (_deferred) {
    _deferredImageURL = imageURL;
  } else {
    if (_downloadToken) {
      [_imageDownloader cancelDownload:_downloadToken];
      _downloadToken = nil;
    }
    if (reset) {
      self.layer.contentsScale = _defaultImage.scale;
      self.layer.contents = (__bridge id)_defaultImage.CGImage;
      self.layer.minificationFilter = kCAFilterTrilinear;
      self.layer.magnificationFilter = kCAFilterTrilinear;
    }
    if ([imageURL.pathExtension caseInsensitiveCompare:@"gif"] == NSOrderedSame) {
      _downloadToken = [_imageDownloader downloadDataForURL:imageURL block:^(NSData *data, NSError *error) {
        if (data) {
          dispatch_async(dispatch_get_main_queue(), ^{
            CAKeyframeAnimation *animation = RCTGIFImageWithData(data);
            self.layer.contentsScale = 1.0;
            self.layer.minificationFilter = kCAFilterLinear;
            self.layer.magnificationFilter = kCAFilterLinear;
            [self.layer addAnimation:animation forKey:@"contents"];
          });
        }
        // TODO: handle errors
      }];
    } else {
      _downloadToken = [_imageDownloader downloadImageForURL:imageURL size:self.bounds.size scale:RCTScreenScale() block:^(UIImage *image, NSError *error) {
        if (image) {
          dispatch_async(dispatch_get_main_queue(), ^{
            [self.layer removeAnimationForKey:@"contents"];
            self.layer.contentsScale = image.scale;
            self.layer.contents = (__bridge id)image.CGImage;
          });
        }
        // TODO: handle errors
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
