/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTARTSurfaceViewComponentView.h"
#import <react/uimanager/ComponentDescriptorProvider.h>
#import "RCTARTSurfaceViewComponentDescriptor.h"

using namespace facebook::react;

@implementation RCTARTSurfaceViewComponentView {
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RCTARTSurfaceViewProps>();
    _props = defaultProps;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RCTARTSurfaceComponentDescriptor>();
}

@end
