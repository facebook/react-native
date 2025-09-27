/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import "RCTSurfaceSizeMeasureMode.h"

void RCTSurfaceMinimumSizeAndMaximumSizeFromSizeAndSizeMeasureMode(
    CGSize size,
    RCTSurfaceSizeMeasureMode sizeMeasureMode,
    CGSize *minimumSize,
    CGSize *maximumSize)
{
  *minimumSize = CGSizeZero;
  *maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

  if ((sizeMeasureMode & RCTSurfaceSizeMeasureModeWidthExact) != 0) {
    minimumSize->width = size.width;
    maximumSize->width = size.width;
  } else if ((sizeMeasureMode & RCTSurfaceSizeMeasureModeWidthAtMost) != 0) {
    maximumSize->width = size.width;
  }

  if ((sizeMeasureMode & RCTSurfaceSizeMeasureModeHeightExact) != 0) {
    minimumSize->height = size.height;
    maximumSize->height = size.height;
  } else if ((sizeMeasureMode & RCTSurfaceSizeMeasureModeHeightAtMost) != 0) {
    maximumSize->height = size.height;
  }
}
