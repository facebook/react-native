/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBoxShadow.h"

#import <CoreImage/CoreImage.h>
#import <React/RCTConversions.h>

#import <react/renderer/graphics/Color.h>

#import <math.h>

using namespace facebook::react;
// See https://drafts.csswg.org/css-backgrounds/#shadow-shape
static CGFloat adjustedCornerRadius(CGFloat cornerRadius, CGFloat spreadDistance)
{
  CGFloat adjustment = spreadDistance;
  (void)adjustment;
  if (cornerRadius < abs(spreadDistance)) {
    const CGFloat r = cornerRadius / (CGFloat)abs(spreadDistance);
    const CGFloat p = (CGFloat)pow(r - 1.0, 3.0);
    adjustment *= 1.0 + p;
  }

  return fmax(cornerRadius + adjustment, 0);
}

static RCTCornerRadii cornerRadiiForBoxShadow(RCTCornerRadii cornerRadii, CGFloat spreadDistance)
{
  return {
      adjustedCornerRadius(cornerRadii.topLeftHorizontal, spreadDistance),
      adjustedCornerRadius(cornerRadii.topLeftVertical, spreadDistance),
      adjustedCornerRadius(cornerRadii.topRightHorizontal, spreadDistance),
      adjustedCornerRadius(cornerRadii.topRightVertical, spreadDistance),
      adjustedCornerRadius(cornerRadii.bottomLeftHorizontal, spreadDistance),
      adjustedCornerRadius(cornerRadii.bottomLeftVertical, spreadDistance),
      adjustedCornerRadius(cornerRadii.bottomRightHorizontal, spreadDistance),
      adjustedCornerRadius(cornerRadii.bottomRightVertical, spreadDistance)};
}

// Returns the smallest CGRect that will contain all shadows and the layer itself.
// The origin represents the location of this box relative to the layer the shadows
// are attached to.
CGRect RCTGetBoundingRect(const std::vector<BoxShadow> &boxShadows, CGSize layerSize)
{
  CGFloat smallestX = 0;
  CGFloat smallestY = 0;
  CGFloat largestX = layerSize.width;
  CGFloat largestY = layerSize.height;
  for (const auto &boxShadow : boxShadows) {
    if (!boxShadow.inset) {
      CGFloat negativeXExtent = boxShadow.offsetX - boxShadow.spreadDistance - boxShadow.blurRadius;
      smallestX = MIN(smallestX, negativeXExtent);
      CGFloat negativeYExtent = boxShadow.offsetY - boxShadow.spreadDistance - boxShadow.blurRadius;
      smallestY = MIN(smallestY, negativeYExtent);
      CGFloat positiveXExtent = boxShadow.offsetX + boxShadow.spreadDistance + boxShadow.blurRadius + layerSize.width;
      largestX = MAX(largestX, positiveXExtent);
      CGFloat positiveYExtent = boxShadow.offsetY + boxShadow.spreadDistance + boxShadow.blurRadius + layerSize.height;
      largestY = MAX(largestY, positiveYExtent);
    }
  }

  return CGRectMake(smallestX, smallestY, largestX - smallestX, largestY - smallestY);
}

static std::pair<std::vector<BoxShadow>, std::vector<BoxShadow>> splitBoxShadowsByInset(
    const std::vector<BoxShadow> &allShadows)
{
  std::vector<BoxShadow> outsetShadows, insetShadows;

  std::partition_copy(
      allShadows.begin(),
      allShadows.end(),
      std::back_inserter(insetShadows),
      std::back_inserter(outsetShadows),
      [](BoxShadow shadow) { return shadow.inset; });

  return std::make_pair(outsetShadows, insetShadows);
}

static CGRect insetRect(CGRect rect, CGFloat left, CGFloat top, CGFloat right, CGFloat bottom)
{
  return CGRectMake(
      rect.origin.x + left, rect.origin.y + top, rect.size.width - right - left, rect.size.height - bottom - top);
}

static CGColorRef colorRefFromSharedColor(const SharedColor &color)
{
  CGColorRef colorRef = RCTUIColorFromSharedColor(color).CGColor;
  return colorRef ? colorRef : [UIColor blackColor].CGColor;
}

// Core graphics has support for shadows that looks similar to web and are very
// fast to apply. The only issue is that this shadow does not take a spread
// radius like on web. To get around this, we draw the shadow rect (the rect
// that casts the shadow, not the shadow itself) offscreen. This shadow rect
// is correctly sized to account for spread radius. Then, when setting the
// shadow itself, we modify the offsetX/Y to account for the fact that our
// shadow rect is offscreen and position it where it needs to be in the image.
static void renderOutsetShadows(
    std::vector<BoxShadow> &outsetShadows,
    RCTCornerRadii cornerRadii,
    CALayer *layer,
    CGRect boundingRect,
    CGContextRef context)
{
  if (outsetShadows.empty()) {
    return;
  }
  // Save state before doing any work so that we can restore it after we have
  // drawn all of our shadows. This ensures that we do not need to worry about
  // graphical state carrying over after this function returns
  CGContextSaveGState(context);
  // Reverse iterator as shadows are stacked back to front
  for (auto it = outsetShadows.rbegin(); it != outsetShadows.rend(); ++it) {
    CGContextSaveGState(context);
    CGFloat offsetX = it->offsetX;
    CGFloat offsetY = it->offsetY;
    CGFloat blurRadius = it->blurRadius;
    CGFloat spreadDistance = it->spreadDistance;
    CGColorRef color = colorRefFromSharedColor(it->color);

    // First, define the shadow rect. This is the rect that will be filled
    // and _cast_ the shadow. As a result, the size does not incorporate
    // the blur radius since this rect is not the shadow itself.
    const RCTCornerInsets shadowRectCornerInsets =
        RCTGetCornerInsets(cornerRadiiForBoxShadow(cornerRadii, spreadDistance), UIEdgeInsetsZero);
    CGSize shadowRectSize = CGSizeMake(
        fmax(layer.bounds.size.width + 2 * spreadDistance, 0), fmax(layer.bounds.size.height + 2 * spreadDistance, 0));
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
            offsetX - boundingRect.origin.x - spreadDistance - shadowRect.origin.x,
            offsetY - boundingRect.origin.y - spreadDistance),
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
    CGContextRestoreGState(context);
  }
  // Lastly, clear out the region inside the view so that the shadows do
  // not cover its content
  const RCTCornerInsets layerCornerInsets = RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero);
  CGPathRef shadowPathAlignedWithLayer = RCTPathCreateWithRoundedRect(
      CGRectMake(-boundingRect.origin.x, -boundingRect.origin.y, layer.bounds.size.width, layer.bounds.size.height),
      layerCornerInsets,
      nil);
  CGContextAddPath(context, shadowPathAlignedWithLayer);
  CGContextSetBlendMode(context, kCGBlendModeClear);
  CGContextFillPath(context);

  CGPathRelease(shadowPathAlignedWithLayer);
  CGContextRestoreGState(context);
}

// Just like with outset shadows, we need to draw inset shadow rects offscreen
// then offset the shadow it casts to the proper place. We can replicate the shape
// of the inset shadow by using 2 rects. One is the same size as the view it is
// attached to, plus some padding. The other represents a cropping region of the
// first rect, with the exact postion and size of this region depending on the
// shadow's params. We make this cropping region by using the EO fill pattern so
// that the interection of the 2 rects is clear, and thus no shadow is cast.
static void renderInsetShadows(
    std::vector<BoxShadow> &insetShadows,
    RCTCornerRadii cornerRadii,
    UIEdgeInsets edgeInsets,
    CALayer *layer,
    CGRect boundingRect,
    CGContextRef context)
{
  if (insetShadows.empty()) {
    return;
  }
  // Save state before doing any work so that we can restore it after we have
  // drawn all of our shadows. This ensures that we do not need to worry about
  // graphical state carrying over after this function returns
  CGContextSaveGState(context);

  CGRect layerFrameRelativeToBoundingRect =
      CGRectMake(-boundingRect.origin.x, -boundingRect.origin.y, layer.bounds.size.width, layer.bounds.size.height);
  CGRect shadowFrame =
      insetRect(layerFrameRelativeToBoundingRect, edgeInsets.left, edgeInsets.top, edgeInsets.right, edgeInsets.bottom);

  // First, create a clipping area so we only draw within the view's bounds.
  // If we do not do this, blur artifacts will show up outside the view.
  CGRect outerClippingRect = CGRectMake(0, 0, boundingRect.size.width, boundingRect.size.height);
  // Add the path twice so we only draw inside the view with the EO crop rule
  CGContextAddRect(context, outerClippingRect);
  CGContextAddRect(context, outerClippingRect);
  const RCTCornerInsets cornerInsetsForLayer = RCTGetCornerInsets(cornerRadii, edgeInsets);
  CGPathRef layerPath = RCTPathCreateWithRoundedRect(shadowFrame, cornerInsetsForLayer, nil);
  CGContextAddPath(context, layerPath);
  CGContextEOClip(context);
  CGPathRelease(layerPath);

  // Reverse iterator as shadows are stacked back to front
  for (auto it = insetShadows.rbegin(); it != insetShadows.rend(); ++it) {
    CGContextSaveGState(context);
    CGFloat offsetX = it->offsetX;
    CGFloat offsetY = it->offsetY;
    CGFloat blurRadius = it->blurRadius;
    CGFloat spreadDistance = it->spreadDistance;
    CGColorRef color = colorRefFromSharedColor(it->color);

    // Second, create the two offscreen rects we will use to create the correct
    // inset shadow shape. shadowRect has an originX such that it AND the clear
    // region are both guaranteed to be offscreen. We do not want some combination
    // of shadow params to allow the clear region to showup inside our context.
    // We also pad the size of the shadow rect by the blur radius so that the
    // edges of the shadow remain a solid color and do not blend with outside
    // of the view.
    CGRect shadowCastingRect = CGRectInset(shadowFrame, -blurRadius, -blurRadius);
    CGRect clearRegionRect = CGRectInset(shadowFrame, spreadDistance, spreadDistance);
    // This happens if the spread causes the height/width to be negative. A null
    // rect breaks a lot of the logic, so lets just keep it as a point
    if (CGRectIsNull(clearRegionRect)) {
      clearRegionRect = CGRectMake(0, 0, 0, 0);
    }
    CGPoint offsetToMoveOffscreen = CGPointMake(
        -fmax(
            shadowCastingRect.size.width,
            clearRegionRect.size.width + offsetX + (clearRegionRect.origin.x - shadowCastingRect.origin.x)) -
            shadowCastingRect.origin.x,
        0);
    shadowCastingRect = CGRectOffset(shadowCastingRect, offsetToMoveOffscreen.x, offsetToMoveOffscreen.y);
    clearRegionRect =
        CGRectOffset(clearRegionRect, offsetToMoveOffscreen.x + offsetX, offsetToMoveOffscreen.y + offsetY);
    CGContextAddRect(context, shadowCastingRect);

    const RCTCornerInsets cornerInsetsForClearRegion =
        RCTGetCornerInsets(cornerRadiiForBoxShadow(cornerRadii, -spreadDistance), edgeInsets);
    CGPathRef clearRegionPath = RCTPathCreateWithRoundedRect(clearRegionRect, cornerInsetsForClearRegion, nil);
    CGContextAddPath(context, clearRegionPath);

    // Third, set the shadow graphics state with the appropriate offset such that
    // it is positioned on top of the view. We subtract blurRadius because the
    // shadow rect is padded.
    CGContextSetShadowWithColor(
        context, CGSizeMake(-offsetToMoveOffscreen.x, -offsetToMoveOffscreen.y), blurRadius, color);

    // Fourth, the Core Graphics functions to actually draw the shadow rect
    // and thus the shadow itself. Note we use an EO fill path so that the
    // intersection between our two rects will be clear. The disjoint parts of
    // the rect will be colored, but because of the clipping area, we only see
    // the shadow projected from the shadow rect, not the clear region rect.
    CGContextSetFillColorWithColor(context, [UIColor blackColor].CGColor);
    CGContextEOFillPath(context);

    CGContextRestoreGState(context);
  }

  CGContextRestoreGState(context);
}

UIImage *RCTGetBoxShadowImage(
    const std::vector<BoxShadow> &shadows,
    RCTCornerRadii cornerRadii,
    UIEdgeInsets edgeInsets,
    CALayer *layer)
{
  CGRect boundingRect = RCTGetBoundingRect(shadows, layer.bounds.size);
  UIGraphicsImageRendererFormat *const rendererFormat = [UIGraphicsImageRendererFormat defaultFormat];
  UIGraphicsImageRenderer *const renderer = [[UIGraphicsImageRenderer alloc] initWithSize:boundingRect.size
                                                                                   format:rendererFormat];
  UIImage *const boxShadowImage =
      [renderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull rendererContext) {
        auto [outsetShadows, insetShadows] = splitBoxShadowsByInset(shadows);
        const CGContextRef context = rendererContext.CGContext;
        // Outset shadows should be before inset shadows since outset needs to
        // clear out a region in the view so we do not block its contents.
        // Inset shadows could draw over those outset shadows but if the shadow
        // colors have alpha < 1 then we will have inaccurate alpha compositing
        renderOutsetShadows(outsetShadows, cornerRadii, layer, boundingRect, context);
        renderInsetShadows(insetShadows, cornerRadii, edgeInsets, layer, boundingRect, context);
      }];

  return boxShadowImage;
}
