/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/graphics/ColorStop.h>
#import <vector>

using namespace facebook::react;

NS_ASSUME_NONNULL_BEGIN

@interface RCTGradientUtils : NSObject

+ (std::vector<ProcessedColorStop>)getFixedColorStops:(const std::vector<ColorStop> &)colorStops gradientLineLength:(CGFloat)gradientLineLength;
@end

NS_ASSUME_NONNULL_END
