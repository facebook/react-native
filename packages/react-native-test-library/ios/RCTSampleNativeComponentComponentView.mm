/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "OSSLibraryExampleSpec/ComponentDescriptors.h"
#import "OSSLibraryExampleSpec/EventEmitters.h"
#import "OSSLibraryExampleSpec/Props.h"
#import "OSSLibraryExampleSpec/RCTComponentViewHelpers.h"

#import "RCTFabricComponentsPlugins.h"

#import <React/RCTComponent.h>
#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

using namespace facebook::react;

static UIColor *UIColorFromHexString(const std::string hexString)
{
  unsigned rgbValue = 0;
  NSString *colorString = [NSString stringWithCString:hexString.c_str() encoding:[NSString defaultCStringEncoding]];
  NSScanner *scanner = [NSScanner scannerWithString:colorString];
  [scanner setScanLocation:1]; // bypass '#' character
  [scanner scanHexInt:&rgbValue];
  return [UIColor colorWithRed:((rgbValue & 0xFF0000) >> 16) / 255.0
                         green:((rgbValue & 0xFF00) >> 8) / 255.0
                          blue:(rgbValue & 0xFF) / 255.0
                         alpha:1.0];
}

@interface RCTSampleNativeComponentComponentView : RCTViewComponentView <RCTSampleNativeComponentViewProtocol>

@property (nonatomic, copy) RCTBubblingEventBlock onIntArrayChanged;

@end

@implementation RCTSampleNativeComponentComponentView {
  UIView *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SampleNativeComponentComponentDescriptor>();
}

// Load is not invoked if it is not defined, therefore, we must ask to update this.
// See the Apple documentation: https://developer.apple.com/documentation/objectivec/nsobject/1418815-load?language=objc
// "[...] but only if the newly loaded class or category implements a method that can respond."
+ (void)load
{
  [super load];
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SampleNativeComponentProps>();
    _props = defaultProps;

    _view = [[UIView alloc] init];
    _view.backgroundColor = [UIColor redColor];

    self.contentView = _view;
  }

  return self;
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldViewProps = *std::static_pointer_cast<const SampleNativeComponentProps>(_props);
  const auto &newViewProps = *std::static_pointer_cast<const SampleNativeComponentProps>(props);

  if (oldViewProps.values != newViewProps.values) {
    if (_eventEmitter) {
      std::vector<int> newVector = {};
      std::vector<bool> newBoolVector = {};
      std::vector<Float> newFloatVector = {};
      std::vector<double> newDoubleVector = {};
      std::vector<SampleNativeComponentEventEmitter::OnIntArrayChangedYesNos> newYesNoVector = {};
      std::vector<std::string> newStringVector = {};
      std::vector<SampleNativeComponentEventEmitter::OnIntArrayChangedLatLons> newLatLonVector = {};
      std::vector<std::vector<int>> newIntVectorVector = {};
      for (auto val : newViewProps.values) {
        newVector.push_back(val * 2);
        newBoolVector.push_back(val % 2 ? true : false);
        newFloatVector.push_back(val * 3.14);
        newDoubleVector.push_back(val / 3.14);
        newYesNoVector.push_back(
            val % 2 ? SampleNativeComponentEventEmitter::OnIntArrayChangedYesNos::Yep
                    : SampleNativeComponentEventEmitter::OnIntArrayChangedYesNos::Nope);
        newStringVector.push_back(std::to_string(val));
        newLatLonVector.push_back({-1.0 * val, 2.0 * val});
        newIntVectorVector.push_back({val, val, val});
      }
      SampleNativeComponentEventEmitter::OnIntArrayChanged value = {
          newVector,
          newBoolVector,
          newFloatVector,
          newDoubleVector,
          newYesNoVector,
          newStringVector,
          newLatLonVector,
          newIntVectorVector};
      std::static_pointer_cast<const SampleNativeComponentEventEmitter>(_eventEmitter)->onIntArrayChanged(value);
    }
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)onChange:(UIView *)sender
{
  // No-op
  //  std::dynamic_pointer_cast<const ViewEventEmitter>(_eventEmitter)
  //      ->onChange(ViewEventEmitter::OnChange{.value = static_cast<bool>(sender.on)});
}

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTSampleNativeComponentHandleCommand(self, commandName, args);
}

- (void)changeBackgroundColor:(NSString *)color
{
  _view.backgroundColor = UIColorFromHexString(std::string(color.UTF8String));
}

@end

Class<RCTComponentViewProtocol> SampleNativeComponentCls(void)
{
  return RCTSampleNativeComponentComponentView.class;
}
