/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNTMyNativeViewComponentView.h"

#import <react/renderer/components/AppSpecs/ComponentDescriptors.h>
#import <react/renderer/components/AppSpecs/EventEmitters.h>
#import <react/renderer/components/AppSpecs/Props.h>
#import <react/renderer/components/AppSpecs/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface RNTMyNativeViewComponentView () <RCTRNTMyNativeViewViewProtocol>
@end

@implementation RNTMyNativeViewComponentView {
  RCTUIView *_view; // [macOS]
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNTMyNativeViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNTMyNativeViewProps>();
    _props = defaultProps;

    _view = [[RCTUIView alloc] init]; // [macOS]
    _view.backgroundColor = [RCTUIColor redColor]; // [macOS]

    self.contentView = _view;
  }

  return self;
}

- (RCTUIColor *)RCTUIColorFromHexString:(const std::string)hexString // [macOS]
{
  unsigned rgbValue = 0;
  NSString *colorString = [NSString stringWithCString:hexString.c_str() encoding:[NSString defaultCStringEncoding]];
  NSScanner *scanner = [NSScanner scannerWithString:colorString];
  [scanner setScanLocation:1]; // bypass '#' character
  [scanner scanHexInt:&rgbValue];
  return [RCTUIColor colorWithRed:((rgbValue & 0xFF0000) >> 16) / 255.0 // [macOS]
                            green:((rgbValue & 0xFF00) >> 8) / 255.0
                             blue:(rgbValue & 0xFF) / 255.0
                            alpha:1.0];
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  [super updateProps:props oldProps:oldProps];
}

- (void)onChange:(RCTUIView *)sender // [macOS]
{
  // No-op
  //  std::dynamic_pointer_cast<const ViewEventEmitter>(_eventEmitter)
  //      ->onChange(ViewEventEmitter::OnChange{.value = static_cast<bool>(sender.on)});
}

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTRNTMyNativeViewHandleCommand(self, commandName, args);
}

- (void)callNativeMethodToChangeBackgroundColor:(NSString *)colorString
{
  RCTUIColor *color = [self RCTUIColorFromHexString:std::string([colorString UTF8String])]; // [macOS]
  _view.backgroundColor = color;
}
@end

Class<RCTComponentViewProtocol> RNTMyNativeViewCls(void)
{
  return RNTMyNativeViewComponentView.class;
}
