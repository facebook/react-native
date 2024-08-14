/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <vector>

#import <React/RCTBorderDrawing.h>
#import <React/RCTDefines.h>
#import <UIKit/UIKit.h>
#import <react/renderer/graphics/BoxShadow.h>

RCT_EXTERN UIImage *RCTGetBoxShadowImage(
    const std::vector<facebook::react::BoxShadow> &shadows,
    RCTCornerRadii cornerRadii,
    UIEdgeInsets edgeInsets,
    CALayer *layer);

RCT_EXTERN CGRect RCTGetBoundingRect(const std::vector<facebook::react::BoxShadow> &boxShadows, CGSize layerSize);
