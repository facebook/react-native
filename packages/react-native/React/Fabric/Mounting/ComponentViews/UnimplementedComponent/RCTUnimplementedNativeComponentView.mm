/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUnimplementedNativeComponentView.h"

#import <react/renderer/components/rncore/ComponentDescriptors.h>
#import <react/renderer/components/rncore/EventEmitters.h>
#import <react/renderer/components/rncore/Props.h>

using namespace facebook::react;

@implementation RCTUnimplementedNativeComponentView {
  UILabel *_label;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const UnimplementedNativeViewProps>();
    _props = defaultProps;

    CGRect bounds = self.bounds;
    _label = [[UILabel alloc] initWithFrame:bounds];
    _label.backgroundColor = [UIColor colorWithRed:1.0 green:0.0 blue:0.0 alpha:0.3];
    _label.layoutMargins = UIEdgeInsetsMake(12, 12, 12, 12);
    _label.lineBreakMode = NSLineBreakByWordWrapping;
    _label.numberOfLines = 0;
    _label.textAlignment = NSTextAlignmentCenter;
    _label.textColor = [UIColor whiteColor];

    self.contentView = _label;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<UnimplementedNativeViewComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldViewProps = static_cast<const UnimplementedNativeViewProps &>(*_props);
  const auto &newViewProps = static_cast<const UnimplementedNativeViewProps &>(*props);

  if (oldViewProps.name != newViewProps.name) {
    _label.text = [NSString stringWithFormat:@"'%s' is not Fabric compatible yet.", newViewProps.name.c_str()];
  }

  [super updateProps:props oldProps:oldProps];
}

@end
