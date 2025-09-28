/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBackgroundImageUtils.h"
#include <react/utils/FloatComparison.h>

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

  auto gradientFrameX = positioningArea.origin.x;
  auto gradientFrameY = positioningArea.origin.y;
  auto availableWidth = positioningArea.size.width - itemSize.width;
  auto availableHeight = positioningArea.size.height - itemSize.height;

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

  auto *tiledLayer = itemLayer;
  CAReplicatorLayer *replicatorX = nil;
  auto finalX = gradientFrameX;
  auto finalW = itemSize.width;

  if (backgroundRepeat.x != BackgroundRepeatStyle::NoRepeat) {
    replicatorX = [CAReplicatorLayer layer];
    [replicatorX addSublayer:tiledLayer];
    tiledLayer = replicatorX;
  }

  if (backgroundRepeat.x == BackgroundRepeatStyle::Space) {
    if (itemSize.width < 0 || floatEquality(itemSize.width, 0.0)) {
      replicatorX.instanceCount = 1;
    } else {
      // The image is repeated as much as possible
      // without clipping. The first and last images are pinned to either side of
      // the element, and whitespace is distributed evenly between the images.
      // The background-position property is ignored unless only one image can be displayed without
      // clipping.
      auto widthOfEdgePinnedImages = itemSize.width * 2;
      auto availableWidthForCenterImages = paintingArea.size.width - widthOfEdgePinnedImages;
      if (availableWidthForCenterImages > 0 || floatEquality(availableWidthForCenterImages, 0.0)) {
        // Use pixel aligned values to avoid floating point precision issues
        auto alignedAvailableWidth = [RCTBackgroundImageUtils pixelAlign:availableWidthForCenterImages];
        auto alignedItemWidth = [RCTBackgroundImageUtils pixelAlign:itemSize.width];
        auto centerImagesCount = floor(alignedAvailableWidth / alignedItemWidth);
        auto centerImagesWidth = centerImagesCount * itemSize.width;
        auto totalFreeSpace = availableWidthForCenterImages - centerImagesWidth;
        auto totalInstances = centerImagesCount + 2;
        auto spacing = totalFreeSpace / (totalInstances - 1);
        replicatorX.instanceTransform = CATransform3DMakeTranslation(itemSize.width + spacing, 0, 0);
        replicatorX.instanceCount = totalInstances;
        finalX = paintingArea.origin.x;
        finalW = paintingArea.size.width;
      }
      // Only one image can fit in the space
      else {
        replicatorX.instanceCount = 1;
      }
    }
  } else if (backgroundRepeat.x == BackgroundRepeatStyle::Repeat || backgroundRepeat.x == BackgroundRepeatStyle::Round) {
    if (itemSize.width < 0 || floatEquality(itemSize.width, 0.0)) {
      replicatorX.instanceCount = 1;
    } else {
      replicatorX.instanceTransform = CATransform3DMakeTranslation(itemSize.width, 0, 0);
      auto alignedGradientFrameX = [RCTBackgroundImageUtils pixelAlign:gradientFrameX];
      auto alignedItemWidth = [RCTBackgroundImageUtils pixelAlign:itemSize.width];
      auto alignedPaintingWidth = [RCTBackgroundImageUtils pixelAlign:paintingArea.size.width];
      auto tilesBeforeX = ceil(alignedGradientFrameX / alignedItemWidth);
      auto tilesAfterX = ceil((alignedPaintingWidth - alignedGradientFrameX) / alignedItemWidth);
      auto totalInstances = tilesBeforeX + tilesAfterX;
      replicatorX.instanceCount = totalInstances;
      finalX = gradientFrameX - (tilesBeforeX * itemSize.width);
      finalW = totalInstances * itemSize.width;
    }
  }

  CAReplicatorLayer *replicatorY = nil;
  auto finalY = gradientFrameY;
  auto finalH = itemSize.height;

  if (backgroundRepeat.y != BackgroundRepeatStyle::NoRepeat) {
    replicatorY = [CAReplicatorLayer layer];
    [replicatorY addSublayer:tiledLayer];
    tiledLayer = replicatorY;
  }

  if (backgroundRepeat.y == BackgroundRepeatStyle::Space) {
    if (itemSize.height < 0 || floatEquality(itemSize.height, 0.0)) {
      replicatorY.instanceCount = 1;
    } else {
      auto heightOfEdgePinnedImages = itemSize.height * 2;
      auto availableHeightForCenterImages = paintingArea.size.height - heightOfEdgePinnedImages;
      if (availableHeightForCenterImages > 0 || floatEquality(availableHeightForCenterImages, 0.0)) {
        // Use pixel aligned values to avoid floating point precision issues
        auto alignedAvailableHeight = [RCTBackgroundImageUtils pixelAlign:availableHeightForCenterImages];
        auto alignedItemHeight = [RCTBackgroundImageUtils pixelAlign:itemSize.height];
        auto centerImagesCount = floor(alignedAvailableHeight / alignedItemHeight);
        auto centerImagesHeight = centerImagesCount * itemSize.height;
        auto totalFreeSpace = availableHeightForCenterImages - centerImagesHeight;
        auto totalInstances = centerImagesCount + 2;
        auto spacing = totalFreeSpace / (totalInstances - 1);
        replicatorY.instanceTransform = CATransform3DMakeTranslation(0, itemSize.height + spacing, 0);
        replicatorY.instanceCount = totalInstances;
        finalY = paintingArea.origin.y;
        finalH = paintingArea.size.height;
      } else {
        replicatorY.instanceCount = 1;
      }
    }
  } else if (backgroundRepeat.y == BackgroundRepeatStyle::Repeat || backgroundRepeat.y == BackgroundRepeatStyle::Round) {
    if (itemSize.height < 0 || floatEquality(itemSize.height, 0.0)) {
      replicatorY.instanceCount = 1;
    } else {
      replicatorY.instanceTransform = CATransform3DMakeTranslation(0, itemSize.height, 0);
      auto alignedGradientFrameY = [RCTBackgroundImageUtils pixelAlign:gradientFrameY];
      auto alignedItemHeight = [RCTBackgroundImageUtils pixelAlign:itemSize.height];
      auto alignedPaintingHeight = [RCTBackgroundImageUtils pixelAlign:paintingArea.size.height];
      auto tilesBeforeY = ceil(alignedGradientFrameY / alignedItemHeight);
      auto tilesAfterY = ceil((alignedPaintingHeight - alignedGradientFrameY) / alignedItemHeight);
      auto instanceCount = tilesBeforeY + tilesAfterY;
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
      auto remainder = fmod(positioningAreaSize.width, itemFinalSize.width);
      if (!floatEquality(remainder, 0.0)) {
        auto alignedPositioningWidth = [RCTBackgroundImageUtils pixelAlign:positioningAreaSize.width];
        auto alignedItemFinalWidth = [RCTBackgroundImageUtils pixelAlign:itemFinalSize.width];
        auto divisor = round(alignedPositioningWidth / alignedItemFinalWidth);
        if (divisor > 0) {
          itemFinalSize.width = positioningAreaSize.width / divisor;
        }
      }
    }
  }

  if (backgroundRepeat.y == BackgroundRepeatStyle::Round) {
    if (itemFinalSize.height > 0 && positioningAreaSize.height > 0) {
      auto remainder = fmod(positioningAreaSize.height, itemFinalSize.height);
      if (!floatEquality(remainder, 0.0)) {
        auto alignedPositioningHeight = [RCTBackgroundImageUtils pixelAlign:positioningAreaSize.height];
        auto alignedItemFinalHeight = [RCTBackgroundImageUtils pixelAlign:itemFinalSize.height];
        auto divisor = round(alignedPositioningHeight / alignedItemFinalHeight);
        if (divisor > 0) {
          itemFinalSize.height = positioningAreaSize.height / divisor;
        }
      }
    }
  }

  return itemFinalSize;
}

+ (CGFloat)pixelAlign:(CGFloat)value {
  return round(value * [UIScreen mainScreen].scale) / [UIScreen mainScreen].scale;
}

@end
