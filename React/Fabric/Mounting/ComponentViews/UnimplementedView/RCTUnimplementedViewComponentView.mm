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
  RCTUILabel *_label; // TODO(macOS GH#774)
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static auto const defaultProps = std::make_shared<UnimplementedViewProps const>();
    _props = defaultProps;

    _label = [[RCTUILabel alloc] initWithFrame:self.bounds]; // TODO(macOS GH#774)
    _label.backgroundColor = [RCTUIColor colorWithRed:1.0 green:0.0 blue:0.0 alpha:0.3]; // TODO(macOS GH#774)
    _label.lineBreakMode = NSLineBreakByCharWrapping;
#if !TARGET_OS_OSX // [TODO(macOS GH#774)
    _label.numberOfLines = 0;
    _label.textAlignment = NSTextAlignmentCenter;
#else
    _label.alignment = NSTextAlignmentCenter;
#endif // ]TODO(macOS GH#774)
    _label.textColor = [RCTUIColor whiteColor]; // TODO(macOS GH#774)
    _label.allowsDefaultTighteningForTruncation = YES;
#if !TARGET_OS_OSX // [TODO(macOS GH#774)
    _label.adjustsFontSizeToFitWidth = YES;
#endif // ]TODO(macOS GH#774)

#if !TARGET_OS_OSX // [TODO(macOS GH#774)
    self.contentView = _label;
#else
    [self.contentView addSubview:_label];
#endif // ]TODO(macOS GH#774)
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<UnimplementedViewComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  auto const &oldUnimplementedViewProps = *std::static_pointer_cast<UnimplementedViewProps const>(_props);
  auto const &newUnimplementedViewProps = *std::static_pointer_cast<UnimplementedViewProps const>(props);

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
