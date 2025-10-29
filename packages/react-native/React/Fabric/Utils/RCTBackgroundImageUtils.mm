/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBackgroundImageUtils.h"

@implementation RCTBackgroundImageUtils

+ (CALayer *)createBackgroundImageLayerWithSize:(const CGRect &)positioningArea
                                   paintingArea:(const CGRect &)paintingArea
                                       itemSize:(const CGSize &)itemSize
                             backgroundPosition:(const facebook::react::BackgroundPosition &)backgroundPosition
                               backgroundRepeat:(const facebook::react::BackgroundRepeat &)backgroundRepeat
                                      itemLayer:(CALayer *)itemLayer
{
  if ((itemLayer == nullptr) || CGSizeEqualToSize(itemSize, CGSizeZero)) {
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
    gradientFrameY = backgroundPosition.top->resolve(static_cast<float>(availableHeight)) + gradientFrameY;
  } else if (backgroundPosition.bottom.has_value()) {
    gradientFrameY =
        (availableHeight - backgroundPosition.bottom->resolve(static_cast<float>(availableHeight))) + gradientFrameY;
  }

  if (backgroundPosition.left.has_value()) {
    gradientFrameX = backgroundPosition.left->resolve(static_cast<float>(availableWidth)) + gradientFrameX;
  } else if (backgroundPosition.right.has_value()) {
    gradientFrameX =
        (availableWidth - backgroundPosition.right->resolve(static_cast<float>(availableWidth))) + gradientFrameX;
  }

  CALayer *tiledLayer = itemLayer;
  CAReplicatorLayer *replicatorX = nil;
  CGFloat finalX = gradientFrameX;
  CGFloat finalW = itemSize.width;

  if (backgroundRepeat.x != facebook::react::BackgroundRepeatStyle::NoRepeat) {
    replicatorX = [CAReplicatorLayer layer];
    [replicatorX addSublayer:tiledLayer];
    tiledLayer = replicatorX;
  }

  if (backgroundRepeat.x == facebook::react::BackgroundRepeatStyle::Space) {
    if (itemSize.width <= 0) {
      replicatorX.instanceCount = 1;
    } else {
      float instanceCount = floor(positioningArea.size.width / itemSize.width);
      if (instanceCount > 1) {
        gradientFrameX = positioningArea.origin.x;
        auto spacing =
            static_cast<float>((positioningArea.size.width - instanceCount * itemSize.width) / (instanceCount - 1));
        replicatorX.instanceTransform = CATransform3DMakeTranslation(itemSize.width + spacing, 0, 0);
        auto tilesBeforeX = static_cast<float>(ceil(static_cast<float>(gradientFrameX) / (itemSize.width + spacing)));
        float tilesAfterX = 1 +
            static_cast<float>(ceil(
                (paintingArea.size.width - (gradientFrameX + itemSize.width)) / (itemSize.width + spacing)));
        float totalInstances = tilesBeforeX + tilesAfterX;
        replicatorX.instanceCount = static_cast<NSInteger>(totalInstances);
        finalX -= (tilesBeforeX * (itemSize.width + spacing));
        finalW = totalInstances * (itemSize.width + spacing * (totalInstances - 1));
      } else {
        replicatorX.instanceCount = 1;
      }
    }
  } else if (
      backgroundRepeat.x == facebook::react::BackgroundRepeatStyle::Repeat ||
      backgroundRepeat.x == facebook::react::BackgroundRepeatStyle::Round) {
    if (itemSize.width <= 0) {
      replicatorX.instanceCount = 1;
    } else {
      replicatorX.instanceTransform = CATransform3DMakeTranslation(itemSize.width, 0, 0);
      float tilesBeforeX = ceil(gradientFrameX / itemSize.width);
      float tilesAfterX = ceil((paintingArea.size.width - gradientFrameX) / itemSize.width);
      float totalInstances = tilesBeforeX + tilesAfterX;
      replicatorX.instanceCount = static_cast<NSInteger>(totalInstances);
      finalX = gradientFrameX - (tilesBeforeX * itemSize.width);
      finalW = totalInstances * itemSize.width;
    }
  }

  CAReplicatorLayer *replicatorY = nil;
  CGFloat finalY = gradientFrameY;
  CGFloat finalH = itemSize.height;

  if (backgroundRepeat.y != facebook::react::BackgroundRepeatStyle::NoRepeat) {
    replicatorY = [CAReplicatorLayer layer];
    [replicatorY addSublayer:tiledLayer];
    tiledLayer = replicatorY;
  }

  if (backgroundRepeat.y == facebook::react::BackgroundRepeatStyle::Space) {
    if (itemSize.height <= 0) {
      replicatorY.instanceCount = 1;
    } else {
      float instanceCount = floor(positioningArea.size.height / itemSize.height);
      if (instanceCount > 1) {
        gradientFrameY = positioningArea.origin.y;
        auto spacing =
            static_cast<float>((positioningArea.size.height - instanceCount * itemSize.height) / (instanceCount - 1));
        replicatorY.instanceTransform = CATransform3DMakeTranslation(0, itemSize.height + spacing, 0);
        auto tilesBeforeY = static_cast<float>(ceil(static_cast<float>(gradientFrameY) / (itemSize.height + spacing)));
        float tilesAfterY = 1 +
            static_cast<float>(ceil(
                (paintingArea.size.height - (gradientFrameY + itemSize.height)) / (itemSize.height + spacing)));
        float totalInstances = tilesBeforeY + tilesAfterY;
        replicatorY.instanceCount = static_cast<NSInteger>(totalInstances);
        finalY -= (tilesBeforeY * (itemSize.height + spacing));
        finalH = totalInstances * (itemSize.height + spacing * (totalInstances - 1));
      } else {
        replicatorY.instanceCount = 1;
      }
    }
  } else if (
      backgroundRepeat.y == facebook::react::BackgroundRepeatStyle::Repeat ||
      backgroundRepeat.y == facebook::react::BackgroundRepeatStyle::Round) {
    if (itemSize.height <= 0) {
      replicatorY.instanceCount = 1;
    } else {
      replicatorY.instanceTransform = CATransform3DMakeTranslation(0, itemSize.height, 0);
      float tilesBeforeY = ceil(gradientFrameY / itemSize.height);
      float tilesAfterY = ceil((paintingArea.size.height - gradientFrameY) / itemSize.height);
      float instanceCount = tilesBeforeY + tilesAfterY;
      replicatorY.instanceCount = static_cast<NSInteger>(instanceCount);
      finalY = gradientFrameY - (tilesBeforeY * itemSize.height);
      finalH = instanceCount * itemSize.height;
    }
  }

  tiledLayer.frame = CGRectMake(finalX, finalY, finalW, finalH);

  CALayer *backgroundImageLayer = [CALayer layer];
  [backgroundImageLayer addSublayer:tiledLayer];

  return backgroundImageLayer;
}

+ (CGSize)calculateBackgroundImageSize:(const CGRect &)positioningArea
                     itemIntrinsicSize:(CGSize)itemIntrinsicSize
                        backgroundSize:(const facebook::react::BackgroundSize &)backgroundSize
                      backgroundRepeat:(const facebook::react::BackgroundRepeat &)backgroundRepeat
{
  if (CGSizeEqualToSize(itemIntrinsicSize, CGSizeZero) || CGRectIsEmpty(positioningArea)) {
    return CGSizeZero;
  }

  CGSize itemFinalSize = itemIntrinsicSize;
  CGSize positioningAreaSize = positioningArea.size;

  if (std::holds_alternative<facebook::react::BackgroundSizeLengthPercentage>(backgroundSize)) {
    auto backgroundSizeLengthPercentage = std::get<facebook::react::BackgroundSizeLengthPercentage>(backgroundSize);
    if (std::holds_alternative<facebook::react::ValueUnit>(backgroundSizeLengthPercentage.x)) {
      auto xValue = std::get<facebook::react::ValueUnit>(backgroundSizeLengthPercentage.x);
      if (xValue.unit == facebook::react::UnitType::Percent) {
        itemFinalSize.width = xValue.value * positioningAreaSize.width / 100.0;
      } else {
        itemFinalSize.width = xValue.value;
      }
    }

    if (std::holds_alternative<facebook::react::ValueUnit>(backgroundSizeLengthPercentage.y)) {
      auto yValue = std::get<facebook::react::ValueUnit>(backgroundSizeLengthPercentage.y);
      if (yValue.unit == facebook::react::UnitType::Percent) {
        itemFinalSize.height = yValue.value * positioningAreaSize.height / 100.0;
      } else {
        itemFinalSize.height = yValue.value;
      }
    }
  }

  if (backgroundRepeat.x == facebook::react::BackgroundRepeatStyle::Round) {
    if (itemFinalSize.width > 0 && positioningAreaSize.width > 0) {
      if (fmod(positioningAreaSize.width, itemFinalSize.width) != 0) {
        auto divisor = static_cast<float>(round(positioningAreaSize.width / itemFinalSize.width));
        if (divisor > 0) {
          itemFinalSize.width = positioningAreaSize.width / divisor;
        }
      }
    }
  }

  if (backgroundRepeat.y == facebook::react::BackgroundRepeatStyle::Round) {
    if (itemFinalSize.height > 0 && positioningAreaSize.height > 0) {
      if (fmod(positioningAreaSize.height, itemFinalSize.height) != 0) {
        auto divisor = static_cast<float>(round(positioningAreaSize.height / itemFinalSize.height));
        if (divisor > 0) {
          itemFinalSize.height = positioningAreaSize.height / divisor;
        }
      }
    }
  }

  return itemFinalSize;
}

@end
