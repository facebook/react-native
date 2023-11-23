/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTraceUpdateOverlayComponentView.h"

#import <React/RCTDefines.h>
#import <React/RCTLog.h>
#import <React/RCTTraceUpdateOverlay.h>

#import <react/renderer/components/rncore/ComponentDescriptors.h>
#import <react/renderer/components/rncore/EventEmitters.h>
#import <react/renderer/components/rncore/Props.h>
#import <react/renderer/components/rncore/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation RCTTraceUpdateOverlayComponentView {
  RCTTraceUpdateOverlay *_overlay;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const TraceUpdateOverlayProps>();
    _props = defaultProps;

    _overlay = [[RCTTraceUpdateOverlay alloc] initWithFrame:self.bounds];

    self.contentView = _overlay;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<TraceUpdateOverlayComponentDescriptor>();
}

#pragma mark - Native commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTTraceUpdateOverlayHandleCommand(self, commandName, args);
}

- (void)draw:(NSString *)overlays
{
  [_overlay draw:overlays];
}

@end

Class<RCTComponentViewProtocol> RCTTraceUpdateOverlayCls(void)
{
  return RCTTraceUpdateOverlayComponentView.class;
}
