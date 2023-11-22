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
  if (![commandName isEqualToString:@"draw"]) {
    RCTLogError(@"%@ received unsupported command %@", @"TraceUpdateOverlay", commandName);
    return;
  }

  NSObject *arg0 = args[0];
#if RCT_DEBUG
  if (!RCTValidateTypeOfViewCommandArgument(
          arg0, [NSString class], @"string", @"TraceUpdateOverlay", commandName, @"1st")) {
    return;
  }
#endif

  NSString *serializedNodes = (NSString *)arg0;
  [_overlay draw:serializedNodes];
}

@end

Class<RCTComponentViewProtocol> RCTTraceUpdateOverlayCls(void)
{
  return RCTTraceUpdateOverlayComponentView.class;
}
