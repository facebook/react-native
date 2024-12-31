/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "HostPlatformColor.h"

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <react/utils/ManagedObjectWrapper.h>
#import <string>

using namespace facebook::react;

NS_ASSUME_NONNULL_BEGIN

namespace facebook::react {

namespace {
UIColor *_Nullable UIColorFromInt32(int32_t intColor)
{
  CGFloat a = CGFloat((intColor >> 24) & 0xFF) / 255.0;
  CGFloat r = CGFloat((intColor >> 16) & 0xFF) / 255.0;
  CGFloat g = CGFloat((intColor >> 8) & 0xFF) / 255.0;
  CGFloat b = CGFloat(intColor & 0xFF) / 255.0;
  return [UIColor colorWithRed:r green:g blue:b alpha:a];
}

UIColor *_Nullable UIColorFromDynamicColor(const facebook::react::DynamicColor &dynamicColor)
{
  int32_t light = dynamicColor.lightColor;
  int32_t dark = dynamicColor.darkColor;
  int32_t highContrastLight = dynamicColor.highContrastLightColor;
  int32_t highContrastDark = dynamicColor.highContrastDarkColor;

  UIColor *lightColor = UIColorFromInt32(light);
  UIColor *darkColor = UIColorFromInt32(dark);
  UIColor *highContrastLightColor = UIColorFromInt32(highContrastLight);
  UIColor *highContrastDarkColor = UIColorFromInt32(highContrastDark);

  if (lightColor != nil && darkColor != nil) {
    UIColor *color = [UIColor colorWithDynamicProvider:^UIColor *_Nonnull(UITraitCollection *_Nonnull collection) {
      if (collection.userInterfaceStyle == UIUserInterfaceStyleDark) {
        if (collection.accessibilityContrast == UIAccessibilityContrastHigh && highContrastDark != 0) {
          return highContrastDarkColor;
        } else {
          return darkColor;
        }
      } else {
        if (collection.accessibilityContrast == UIAccessibilityContrastHigh && highContrastLight != 0) {
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
  if (components.colorSpace == ColorSpace::DisplayP3) {
    return [UIColor colorWithDisplayP3Red:components.red
                                    green:components.green
                                     blue:components.blue
                                    alpha:components.alpha];
  }
  return [UIColor colorWithRed:components.red green:components.green blue:components.blue alpha:components.alpha];
}
} // anonymous namespace

Color::Color(int32_t color)
{
  uiColor_ = wrapManagedObject(UIColorFromInt32(color));
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

float Color::getChannel(int channelId) const
{
  CGFloat rgba[4];
  UIColor *color = (__bridge UIColor *)getUIColor().get();
  [color getRed:&rgba[0] green:&rgba[1] blue:&rgba[2] alpha:&rgba[3]];
  return static_cast<float>(rgba[channelId]);
}

} // namespace facebook::react

NS_ASSUME_NONNULL_END
