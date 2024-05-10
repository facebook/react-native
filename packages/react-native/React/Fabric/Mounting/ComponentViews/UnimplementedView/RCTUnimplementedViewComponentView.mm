/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUnimplementedViewComponentView.h"

#import <react/renderer/components/rncore/ComponentDescriptors.h>
#import <react/renderer/components/rncore/EventEmitters.h>
#import <react/renderer/components/rncore/Props.h>

#import <react/renderer/components/unimplementedview/UnimplementedViewComponentDescriptor.h>
#import <react/renderer/components/unimplementedview/UnimplementedViewShadowNode.h>

#import <React/RCTConversions.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation RCTUnimplementedViewComponentView {
  UILabel *_label;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = UnimplementedViewShadowNode::defaultSharedProps();

    _label = [[UILabel alloc] initWithFrame:self.bounds];
    _label.backgroundColor = [UIColor colorWithRed:1.0 green:0.0 blue:0.0 alpha:0.3];
    _label.lineBreakMode = NSLineBreakByCharWrapping;
    _label.numberOfLines = 0;
    _label.textAlignment = NSTextAlignmentCenter;
    _label.textColor = [UIColor whiteColor];
    _label.allowsDefaultTighteningForTruncation = YES;
    _label.adjustsFontSizeToFitWidth = YES;

    self.contentView = _label;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<UnimplementedViewComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldUnimplementedViewProps = static_cast<const UnimplementedViewProps &>(*_props);
  const auto &newUnimplementedViewProps = static_cast<const UnimplementedViewProps &>(*props);

  if (oldUnimplementedViewProps.getComponentName() != newUnimplementedViewProps.getComponentName()) {
    _label.text =
        [NSString stringWithFormat:@"Unimplemented component: <%s>", newUnimplementedViewProps.getComponentName()];
  }

  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> RCTUnimplementedNativeViewCls(void)
{
  return RCTUnimplementedViewComponentView.class;
}
