/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBoxShadow.h"

#import <CoreImage/CoreImage.h>
#import <React/RCTConversions.h>

#import <math.h>

using namespace facebook::react;
// See https://drafts.csswg.org/css-backgrounds/#shadow-shape
static CGFloat adjustedCornerRadius(CGFloat cornerRadius, CGFloat spreadRadius)
{
  CGFloat adjustment = spreadRadius;
  if (cornerRadius < spreadRadius) {
    adjustment *= 1 + pow((cornerRadius / spreadRadius) - 1, 3);
  }

  return cornerRadius + adjustment;
}

static RCTCornerRadii cornerRadiiForBoxShadow(RCTCornerRadii cornerRadii, CGFloat spreadRadius)
{
  return {
      adjustedCornerRadius(cornerRadii.topLeft, spreadRadius),
      adjustedCornerRadius(cornerRadii.topRight, spreadRadius),
      adjustedCornerRadius(cornerRadii.bottomLeft, spreadRadius),
      adjustedCornerRadius(cornerRadii.bottomRight, spreadRadius)};
}

CGRect RCTGetBoxShadowRect(CGFloat offsetX, CGFloat offsetY, CGFloat blurRadius, CGFloat spreadRadius, CGSize layerSize)
{
  return CGRectMake(
      offsetX - spreadRadius - blurRadius,
      offsetY - spreadRadius - blurRadius,
      layerSize.width + 2 * (spreadRadius + blurRadius),
      layerSize.height + 2 * (spreadRadius + blurRadius));
}

// Returns the smallest CGRect that will contain all shadows and the layer itself.
// The origin represents the location of this box relative to the layer the shadows
// are attached to.
CGRect RCTGetBoundingRect(std::vector<BoxShadow> boxShadows, CGSize layerSize)
{
  CGFloat smallestX = 0;
  CGFloat smallestY = 0;
  CGFloat largestX = layerSize.width;
  CGFloat largestY = layerSize.height;
  for (const auto &boxShadow : boxShadows) {
    CGFloat negativeXExtent = boxShadow.offsetX - boxShadow.spreadRadius - boxShadow.blurRadius;
    smallestX = MIN(smallestX, negativeXExtent);
    CGFloat negativeYExtent = boxShadow.offsetY - boxShadow.spreadRadius - boxShadow.blurRadius;
    smallestY = MIN(smallestY, negativeYExtent);
    CGFloat positiveXExtent = boxShadow.offsetX + boxShadow.spreadRadius + boxShadow.blurRadius + layerSize.width;
    largestX = MAX(largestX, positiveXExtent);
    CGFloat positiveYExtent = boxShadow.offsetY + boxShadow.spreadRadius + boxShadow.blurRadius + layerSize.height;
    largestY = MAX(largestY, positiveYExtent);
  }

  return CGRectMake(smallestX, smallestY, largestX - smallestX, largestY - smallestY);
}

UIImage *RCTGetBoxShadowImage(std::vector<BoxShadow> shadows, RCTCornerRadii cornerRadii, CALayer *layer)
{
  CGRect boundingRect = RCTGetBoundingRect(shadows, layer.bounds.size);
  UIGraphicsImageRendererFormat *const rendererFormat = [UIGraphicsImageRendererFormat defaultFormat];
  UIGraphicsImageRenderer *const renderer = [[UIGraphicsImageRenderer alloc] initWithSize:boundingRect.size
                                                                                   format:rendererFormat];
  // Core graphics has support for shadows that looks similar to web and are very
  // fast to apply. The only issue is that this shadow does not take a spread
  // radius like on web. To get around this, we draw the shadow rect (the rect
  // that casts the shadow, not the shadow itself) offscreen. This shadow rect
  // is correctly sized to account for spread radius. Then, when setting the
  // shadow itself, we modify the offsetX/Y to account for the fact that our
  // shadow rect is offscreen and position it where it needs to be in the image.
  UIImage *const boxShadowImage = [renderer imageWithActions:^(
                                                UIGraphicsImageRendererContext *_Nonnull rendererContext) {
    const CGContextRef context = rendererContext.CGContext;
    // Reverse iterator as shadows are stacked back to front
    for (auto it = shadows.rbegin(); it != shadows.rend(); ++it) {
      CGFloat offsetX = it->offsetX;
      CGFloat offsetY = it->offsetY;
      CGFloat blurRadius = it->blurRadius;
      CGFloat spreadRadius = it->spreadRadius;
      CGColorRef color = RCTUIColorFromSharedColor(it->color).CGColor;

      // First, define the shadow rect. This is the rect that will be filled
      // and _cast_ the shadow. As a result, the size does not incorporate
      // the blur radius since this rect is not the shadow itself.
      const RCTCornerInsets shadowRectCornerInsets =
          RCTGetCornerInsets(cornerRadiiForBoxShadow(cornerRadii, spreadRadius), UIEdgeInsetsZero);
      CGSize shadowRectSize =
          CGSizeMake(layer.bounds.size.width + 2 * spreadRadius, layer.bounds.size.height + 2 * spreadRadius);
      // Ensure this is drawn offscreen and will not show in the image
      CGRect shadowRect = CGRectMake(-shadowRectSize.width, 0, shadowRectSize.width, shadowRectSize.height);
      CGPathRef shadowRectPath = RCTPathCreateWithRoundedRect(shadowRect, shadowRectCornerInsets, nil);

      // Second, set the shadow as graphics state so that when we fill our
      // shadow rect it will actually cast a shadow. The offset of this
      // shadow needs to compensate for the fact that the shadow rect is
      // offscreen. Additionally, we take away the spread radius since spread
      // grows in all directions but the origin of our shadow rect is just
      // the negative width, which accounts for 2*spread radius.
      CGContextSetShadowWithColor(
          context,
          CGSizeMake(
              offsetX - boundingRect.origin.x - spreadRadius - shadowRect.origin.x,
              offsetY - boundingRect.origin.y - spreadRadius),
          blurRadius,
          color);

      // Third, the Core Graphics functions to actually draw the shadow rect
      // and thus the shadow itself.
      CGContextAddPath(context, shadowRectPath);
      // Color here does not matter, we just need something that has 1 for
      // alpha so that the shadow is visible. The rect is purposely rendered
      // outside of the context so it should not be visible.
      CGContextSetFillColorWithColor(context, [UIColor blackColor].CGColor);
      CGContextFillPath(context);

      CGPathRelease(shadowRectPath);
    }
    // Lastly, clear out the region inside the view so that the shadows do
    // not cover its content
    const RCTCornerInsets layerCornerInsets =
        RCTGetCornerInsets(cornerRadiiForBoxShadow(cornerRadii, 0), UIEdgeInsetsZero);
    CGPathRef shadowPathAlignedWithLayer = RCTPathCreateWithRoundedRect(
        CGRectMake(-boundingRect.origin.x, -boundingRect.origin.y, layer.bounds.size.width, layer.bounds.size.height),
        layerCornerInsets,
        nil);
    CGContextAddPath(context, shadowPathAlignedWithLayer);
    CGContextSetBlendMode(context, kCGBlendModeClear);
    CGContextFillPath(context);

    CGPathRelease(shadowPathAlignedWithLayer);
  }];

  return boxShadowImage;
}
