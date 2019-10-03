/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLegacyViewManagerInteropComponentView.h"

#import <react/components/legacyviewmanagerinterop/LegacyViewManagerInteropComponentDescriptor.h>
#import <react/components/legacyviewmanagerinterop/LegacyViewManagerInteropViewProps.h>

using namespace facebook::react;

static std::string propNames(LegacyViewManagerInteropViewProps const &props)
{
  std::string propNames;
  for (auto const &prop : props.otherProps) {
    propNames += prop.first + ", ";
  }
  if (propNames.size() > 1) {
    propNames.resize(propNames.size() - 2);
  }
  return propNames;
}

@implementation RCTLegacyViewManagerInteropComponentView {
  UILabel *_label;
  LegacyViewManagerInteropShadowNode::ConcreteState::Shared _state;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const LegacyViewManagerInteropViewProps>();
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

+ (BOOL)isSupported:(NSString *)componentName
{
  static NSSet<NSString *> *supportedComponents = [NSSet new];
  return [supportedComponents containsObject:componentName];
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<LegacyViewManagerInteropComponentDescriptor>();
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _state = std::static_pointer_cast<LegacyViewManagerInteropShadowNode::ConcreteState const>(state);
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];
  if (_props && _state) {
    const auto &props = *std::static_pointer_cast<const LegacyViewManagerInteropViewProps>(_props);

    _label.text = [NSString
        stringWithFormat:@"name: %s, props: %s", _state->getData().componentName.c_str(), propNames(props).c_str()];
  }
}

@end
