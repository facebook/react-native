/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "HostPlatformColor.h"

#import <Foundation/Foundation.h>
#import <React/RCTConvert.h>
#import <UIKit/UIKit.h>
#import <react/utils/ManagedObjectWrapper.h>
#import <string>

using namespace facebook::react;

NS_ASSUME_NONNULL_BEGIN

namespace facebook::react {

namespace {
UIColor *_Nullable UIColorFromDynamicColor(const facebook::react::DynamicColor &dynamicColor)
{
  int32_t light = dynamicColor.lightColor;
  int32_t dark = dynamicColor.darkColor;
  int32_t highContrastLight = dynamicColor.highContrastLightColor;
  int32_t highContrastDark = dynamicColor.highContrastDarkColor;

  UIColor *lightColor = [RCTConvert UIColor:@(light)];
  UIColor *darkColor = [RCTConvert UIColor:@(dark)];
  UIColor *highContrastLightColor = [RCTConvert UIColor:@(highContrastLight)];
  UIColor *highContrastDarkColor = [RCTConvert UIColor:@(highContrastDark)];

  if (lightColor != nil && darkColor != nil) {
    UIColor *color = [UIColor colorWithDynamicProvider:^UIColor *_Nonnull(UITraitCollection *_Nonnull collection) {
      if (collection.userInterfaceStyle == UIUserInterfaceStyleDark) {
        if (collection.accessibilityContrast == UIAccessibilityContrastHigh && highContrastDarkColor != nil) {
          return highContrastDarkColor;
        } else {
          return darkColor;
        }
      } else {
        if (collection.accessibilityContrast == UIAccessibilityContrastHigh && highContrastLightColor != nil) {
          return highContrastLightColor;
        } else {
          return lightColor;
        }
      }
    }];
    return color;
  } else {
    return nil;
  }

  return nil;
}

int32_t ColorFromUIColor(UIColor *color)
{
  float ratio = 255;
  CGFloat rgba[4];
  [color getRed:&rgba[0] green:&rgba[1] blue:&rgba[2] alpha:&rgba[3]];
  return ((int32_t)round((float)rgba[3] * ratio) & 0xff) << 24 | ((int)round((float)rgba[0] * ratio) & 0xff) << 16 |
      ((int)round((float)rgba[1] * ratio) & 0xff) << 8 | ((int)round((float)rgba[2] * ratio) & 0xff);
}

int32_t ColorFromUIColor(const std::shared_ptr<void> &uiColor)
{
  UIColor *color = (UIColor *)unwrapManagedObject(uiColor);
  if (color) {
    UITraitCollection *currentTraitCollection = [UITraitCollection currentTraitCollection];
    color = [color resolvedColorWithTraitCollection:currentTraitCollection];
    return ColorFromUIColor(color);
  }

  return 0;
}

UIColor *_Nullable UIColorFromComponentsColor(const facebook::react::ColorComponents &components)
{
  return [UIColor colorWithRed:components.red green:components.green blue:components.blue alpha:components.alpha];
}
} // anonymous namespace

Color::Color(int32_t color)
{
  uiColor_ = wrapManagedObject([RCTConvert UIColor:@(color)]);
}

Color::Color(const DynamicColor &dynamicColor)
{
  uiColor_ = wrapManagedObject(UIColorFromDynamicColor(dynamicColor));
}

Color::Color(const ColorComponents &components)
{
  uiColor_ = wrapManagedObject(UIColorFromComponentsColor(components));
}

Color::Color(std::shared_ptr<void> uiColor)
{
  uiColor_ = std::move(uiColor);
}

bool Color::operator==(const Color &other) const
{
  return (!uiColor_ && !other.uiColor_) ||
      (uiColor_ && other.uiColor_ &&
       [unwrapManagedObject(getUIColor()) isEqual:unwrapManagedObject(other.getUIColor())]);
}

bool Color::operator!=(const Color &other) const
{
  return !(*this == other);
}

int32_t Color::getColor() const
{
  return ColorFromUIColor(uiColor_);
}
} // namespace facebook::react

NS_ASSUME_NONNULL_END
