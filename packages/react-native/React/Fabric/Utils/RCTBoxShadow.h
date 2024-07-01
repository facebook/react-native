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

using namespace facebook::react;

RCT_EXTERN UIImage *RCTGetBoxShadowImage(std::vector<BoxShadow> shadows, RCTCornerRadii cornerRadii, CALayer *layer);

RCT_EXTERN CGRect
RCTGetBoxShadowRect(CGFloat offsetX, CGFloat offsetY, CGFloat blurRadius, CGFloat spreadRadius, CGSize layerSize);

RCT_EXTERN CGRect RCTGetBoundingRect(std::vector<BoxShadow> boxShadows, CGSize layerSize);
