/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBackgroundImageUtils.h"

using namespace facebook::react;

@implementation RCTBackgroundImageUtils

+ (CALayer *)createBackgroundImageLayerWithSize:(const CGRect&)positioningArea
                                   paintingArea:(const CGRect&) paintingArea
                                       itemSize:(const CGSize&)itemSize
                             backgroundPosition:(const BackgroundPosition&)backgroundPosition
                               backgroundRepeat:(const BackgroundRepeat&)backgroundRepeat
                                      itemLayer:(CALayer*)itemLayer {
  if (!itemLayer || CGSizeEqualToSize(itemSize, CGSizeZero)) {
    return [CALayer layer];
  }
  
  if (CGRectIsEmpty(positioningArea) || CGRectIsEmpty(paintingArea)) {
    return [CALayer layer];
  }

  CGFloat gradientFrameX = positioningArea.origin.x;
  CGFloat gradientFrameY = positioningArea.origin.y;
  CGFloat availableWidth = positioningArea.size.width - itemSize.width;
  CGFloat availableHeight = positioningArea.size.height - itemSize.height;

  if (backgroundPosition.top.has_value()) {
    gradientFrameY = backgroundPosition.top->resolve(availableHeight) + gradientFrameY;
  } else if (backgroundPosition.bottom.has_value()) {
    gradientFrameY = (availableHeight - backgroundPosition.bottom->resolve(availableHeight)) + gradientFrameY;
  }

  if (backgroundPosition.left.has_value()) {
    gradientFrameX = backgroundPosition.left->resolve(availableWidth) + gradientFrameX;
  } else if (backgroundPosition.right.has_value()) {
    gradientFrameX = (availableWidth - backgroundPosition.right->resolve(availableWidth)) + gradientFrameX;
  }

  CALayer *tiledLayer = itemLayer;
  CAReplicatorLayer *replicatorX = nil;
  CGFloat finalX = gradientFrameX;
  CGFloat finalW = itemSize.width;

  if (backgroundRepeat.x != BackgroundRepeatStyle::NoRepeat) {
    replicatorX = [CAReplicatorLayer layer];
    [replicatorX addSublayer:tiledLayer];
    tiledLayer = replicatorX;
  }

  if (backgroundRepeat.x == BackgroundRepeatStyle::Space) {
    if (itemSize.width <= 0) {
      replicatorX.instanceCount = 1;
    } else {
      float instanceCount = floor(positioningArea.size.width / itemSize.width);
      if (instanceCount > 1) {
        gradientFrameX = positioningArea.origin.x;
        float spacing = (positioningArea.size.width - instanceCount * itemSize.width) / (instanceCount - 1);
        replicatorX.instanceTransform = CATransform3DMakeTranslation(itemSize.width + spacing, 0, 0);
        float tilesBeforeX = ceil(gradientFrameX / (itemSize.width + spacing));
        float tilesAfterX = 1 + ceil((paintingArea.size.width - (gradientFrameX + itemSize.width)) / (itemSize.width + spacing));
        float totalInstances = tilesBeforeX + tilesAfterX;
        replicatorX.instanceCount = totalInstances;
        finalX -= (tilesBeforeX * (itemSize.width + spacing));
        finalW = totalInstances * (itemSize.width + spacing * (totalInstances - 1));
      } else {
        replicatorX.instanceCount = 1;
      }
    }
  } else if (backgroundRepeat.x == BackgroundRepeatStyle::Repeat || backgroundRepeat.x == BackgroundRepeatStyle::Round) {
    if (itemSize.width <= 0) {
      replicatorX.instanceCount = 1;
    } else {
      replicatorX.instanceTransform = CATransform3DMakeTranslation(itemSize.width, 0, 0);
      float tilesBeforeX = ceil(gradientFrameX / itemSize.width);
      float tilesAfterX = ceil((paintingArea.size.width - gradientFrameX) / itemSize.width);
      float totalInstances = tilesBeforeX + tilesAfterX;
      replicatorX.instanceCount = totalInstances;
      finalX = gradientFrameX - (tilesBeforeX * itemSize.width);
      finalW = totalInstances * itemSize.width;
    }
  }

  CAReplicatorLayer *replicatorY = nil;
  CGFloat finalY = gradientFrameY;
  CGFloat finalH = itemSize.height;

  if (backgroundRepeat.y != BackgroundRepeatStyle::NoRepeat) {
    replicatorY = [CAReplicatorLayer layer];
    [replicatorY addSublayer:tiledLayer];
    tiledLayer = replicatorY;
  }

  if (backgroundRepeat.y == BackgroundRepeatStyle::Space) {
    if (itemSize.height <= 0) {
      replicatorY.instanceCount = 1;
    } else {
      float instanceCount = floor(positioningArea.size.height / itemSize.height);
      if (instanceCount > 1) {
        gradientFrameY = positioningArea.origin.y;
        float spacing = (positioningArea.size.height - instanceCount * itemSize.height) / (instanceCount - 1);
        replicatorY.instanceTransform = CATransform3DMakeTranslation(0, itemSize.height + spacing, 0);
        float tilesBeforeY = ceil(gradientFrameY / (itemSize.height + spacing));
        float tilesAfterY = 1 + ceil((paintingArea.size.height - (gradientFrameY + itemSize.height)) / (itemSize.height + spacing));
        float totalInstances = tilesBeforeY + tilesAfterY;
        replicatorY.instanceCount = totalInstances;
        finalY -= (tilesBeforeY * (itemSize.height + spacing));
        finalH = totalInstances * (itemSize.height + spacing * (totalInstances - 1));
      } else {
        replicatorY.instanceCount = 1;
      }
    }
  } else if (backgroundRepeat.y == BackgroundRepeatStyle::Repeat || backgroundRepeat.y == BackgroundRepeatStyle::Round) {
    if (itemSize.height <= 0) {
      replicatorY.instanceCount = 1;
    } else {
      replicatorY.instanceTransform = CATransform3DMakeTranslation(0, itemSize.height, 0);
      float tilesBeforeY = ceil(gradientFrameY / itemSize.height);
      float tilesAfterY = ceil((paintingArea.size.height - gradientFrameY) / itemSize.height);
      float instanceCount = tilesBeforeY + tilesAfterY;
      replicatorY.instanceCount = instanceCount;
      finalY = gradientFrameY - (tilesBeforeY * itemSize.height);
      finalH = instanceCount * itemSize.height;
    }
  }

  tiledLayer.frame = CGRectMake(finalX, finalY, finalW, finalH);

  CALayer* backgroundImageLayer = [CALayer layer];
  [backgroundImageLayer addSublayer:tiledLayer];

  return backgroundImageLayer;
}

+ (CGSize)calculateBackgroundImageSize:(const CGRect&)positioningArea
                     itemIntrinsicSize:(CGSize)itemIntrinsicSize
                        backgroundSize:(const BackgroundSize&)backgroundSize
                      backgroundRepeat:(const BackgroundRepeat&)backgroundRepeat {
  if (CGSizeEqualToSize(itemIntrinsicSize, CGSizeZero) || CGRectIsEmpty(positioningArea)) {
    return CGSizeZero;
  }

  CGSize itemFinalSize = itemIntrinsicSize;
  CGSize positioningAreaSize = positioningArea.size;

  if (std::holds_alternative<BackgroundSizeLengthPercentage>(backgroundSize)) {
    auto backgroundSizeLengthPercentage = std::get<BackgroundSizeLengthPercentage>(backgroundSize);
    if (std::holds_alternative<ValueUnit>(backgroundSizeLengthPercentage.x)) {
      auto xValue = std::get<ValueUnit>(backgroundSizeLengthPercentage.x);
      if (xValue.unit == UnitType::Percent) {
        itemFinalSize.width = xValue.value * positioningAreaSize.width / 100.0;
      } else {
        itemFinalSize.width = xValue.value;
      }
    }

    if (std::holds_alternative<ValueUnit>(backgroundSizeLengthPercentage.y)) {
      auto yValue = std::get<ValueUnit>(backgroundSizeLengthPercentage.y);
      if (yValue.unit == UnitType::Percent) {
        itemFinalSize.height = yValue.value * positioningAreaSize.height / 100.0;
      } else {
        itemFinalSize.height = yValue.value;
      }
    }
  }

  if (backgroundRepeat.x == BackgroundRepeatStyle::Round) {
    if (itemFinalSize.width > 0 && positioningAreaSize.width > 0) {
      if (fmod(positioningAreaSize.width, itemFinalSize.width) != 0) {
        float divisor = round(positioningAreaSize.width / itemFinalSize.width);
        if (divisor > 0) {
          itemFinalSize.width = positioningAreaSize.width / divisor;
        }
      }
    }
  }

  if (backgroundRepeat.y == BackgroundRepeatStyle::Round) {
    if (itemFinalSize.height > 0 && positioningAreaSize.height > 0) {
      if (fmod(positioningAreaSize.height, itemFinalSize.height) != 0) {
        float divisor = round(positioningAreaSize.height / itemFinalSize.height);
        if (divisor > 0) {
          itemFinalSize.height = positioningAreaSize.height / divisor;
        }
      }
    }
  }

  return itemFinalSize;
}

@end
