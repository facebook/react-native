/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTStaticImage.h"

#import "RCTConvert.h"
#import "RCTGIFImage.h"
#import "RCTImageLoader.h"
#import "RCTUtils.h"

#import "UIView+React.h"

@implementation RCTStaticImage

- (void)_updateImage
{
  UIImage *image = self.image;
  if (!image) {
    return;
  }

  // Apply rendering mode
  if (_renderingMode != image.renderingMode) {
    image = [image imageWithRenderingMode:_renderingMode];
  }

  // Applying capInsets of 0 will switch the "resizingMode" of the image to "tile" which is undesired
  if (!UIEdgeInsetsEqualToEdgeInsets(UIEdgeInsetsZero, _capInsets)) {
    image = [image resizableImageWithCapInsets:_capInsets resizingMode:UIImageResizingModeStretch];
  }

  // Apply trilinear filtering to smooth out mis-sized images
  self.layer.minificationFilter = kCAFilterTrilinear;
  self.layer.magnificationFilter = kCAFilterTrilinear;

  super.image = image;
}

- (void)setImage:(UIImage *)image
{
  if (image != super.image) {
    super.image = image;
    [self _updateImage];
  }
}

- (void)setCapInsets:(UIEdgeInsets)capInsets
{
  if (!UIEdgeInsetsEqualToEdgeInsets(_capInsets, capInsets)) {
    _capInsets = capInsets;
    [self _updateImage];
  }
}

- (void)setRenderingMode:(UIImageRenderingMode)renderingMode
{
  if (_renderingMode != renderingMode) {
    _renderingMode = renderingMode;
    [self _updateImage];
  }
}

- (void)setSrc:(NSString *)src
{
  if (![src isEqual:_src]) {
    _src = [src copy];
    [self reloadImage];
  }
}

- (void)reloadImage
{
  if (_src && !CGSizeEqualToSize(self.frame.size, CGSizeZero)) {
    [RCTImageLoader loadImageWithTag:_src
                                size:self.bounds.size
                               scale:RCTScreenScale()
                          resizeMode:self.contentMode callback:^(NSError *error, id image) {
      if (error) {
        RCTLogWarn(@"%@", error.localizedDescription);
      }
      if ([image isKindOfClass:[CAAnimation class]]) {
        [self.layer addAnimation:image forKey:@"contents"];
      } else {
        [self.layer removeAnimationForKey:@"contents"];
        self.image = image;
      }
    }];
  } else {
    [self.layer removeAnimationForKey:@"contents"];
    self.image = nil;
  }
}

- (void)reactSetFrame:(CGRect)frame
{
  [super reactSetFrame:frame];
  if (self.image == nil) {
    [self reloadImage];
  } else if ([RCTImageLoader isAssetLibraryImage:_src]) {
    CGSize imageSize = {
      self.image.size.width / RCTScreenScale(),
      self.image.size.height / RCTScreenScale()
    };
    CGFloat widthChangeFraction = imageSize.width ? ABS(imageSize.width - frame.size.width) / imageSize.width : 1;
    CGFloat heightChangeFraction = imageSize.height ? ABS(imageSize.height - frame.size.height) / imageSize.height : 1;
    // If the combined change is more than 20%, reload the asset in case there is a better size.
    if (widthChangeFraction + heightChangeFraction > 0.2) {
      [self reloadImage];
    }
  }
}

@end
