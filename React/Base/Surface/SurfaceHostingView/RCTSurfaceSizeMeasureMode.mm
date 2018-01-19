/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTSurfaceSizeMeasureMode.h"

void RCTSurfaceMinimumSizeAndMaximumSizeFromSizeAndSizeMeasureMode(
  CGSize size,
  RCTSurfaceSizeMeasureMode sizeMeasureMode,
  CGSize &minimumSize,
  CGSize &maximumSize
) {
  minimumSize = CGSizeZero;
  maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

  if (sizeMeasureMode & RCTSurfaceSizeMeasureModeWidthExact) {
    minimumSize.width = size.width;
    maximumSize.width = size.width;
  }
  else if (sizeMeasureMode & RCTSurfaceSizeMeasureModeWidthAtMost) {
    maximumSize.width = size.width;
  }

  if (sizeMeasureMode & RCTSurfaceSizeMeasureModeHeightExact) {
    minimumSize.height = size.height;
    maximumSize.height = size.height;
  }
  else if (sizeMeasureMode & RCTSurfaceSizeMeasureModeHeightAtMost) {
    maximumSize.height = size.height;
  }
}
