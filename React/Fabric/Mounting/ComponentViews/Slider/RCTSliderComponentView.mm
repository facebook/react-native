/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSliderComponentView.h"

#import <react/components/slider/SliderEventEmitter.h>
#import <react/components/slider/SliderProps.h>
#import <react/components/slider/SliderShadowNode.h>

using namespace facebook::react;

@implementation RCTSliderComponentView {
  UISlider *_sliderView;
  float _prevValue;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SliderProps>();
    _props = defaultProps;

    _sliderView = [[UISlider alloc] initWithFrame:self.bounds];

    [_sliderView addTarget:self
                    action:@selector(onChange:)
          forControlEvents:UIControlEventValueChanged];

    _sliderView.value = defaultProps->value;

    self.contentView = _sliderView;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentHandle)componentHandle
{
  return SliderShadowNode::Handle();
}

- (void)updateProps:(SharedProps)props oldProps:(SharedProps)oldProps
{
  const auto &oldSliderProps = *std::static_pointer_cast<const SliderProps>(oldProps ?: _props);
  const auto &newSliderProps = *std::static_pointer_cast<const SliderProps>(props);

  [super updateProps:props oldProps:oldProps];

  // `value`
  if (oldSliderProps.value != newSliderProps.value) {
    _sliderView.value = newSliderProps.value;
    _prevValue = newSliderProps.value;
  }

  // `disabled`
  if (oldSliderProps.disabled != newSliderProps.disabled) {
    _sliderView.enabled = !newSliderProps.disabled;
  }

  // `thumbTintColor`
  if (oldSliderProps.thumbTintColor != newSliderProps.thumbTintColor) {
    _sliderView.thumbTintColor = [UIColor colorWithCGColor:newSliderProps.thumbTintColor.get()];
  }

  // `minimumTrackTintColor`
  if (oldSliderProps.minimumTrackTintColor != newSliderProps.minimumTrackTintColor) {
    _sliderView.minimumTrackTintColor = [UIColor colorWithCGColor:newSliderProps.minimumTrackTintColor.get()];
  }

  // `maximumTrackTintColor`
  if (oldSliderProps.maximumTrackTintColor != newSliderProps.maximumTrackTintColor) {
    _sliderView.maximumTrackTintColor = [UIColor colorWithCGColor:newSliderProps.maximumTrackTintColor.get()];
  }
}

- (void)onChange:(UISlider *)sender
{
  if (_prevValue == sender.value) {
    return;
  }
  _prevValue = sender.value;

  std::dynamic_pointer_cast<const SliderEventEmitter>(_eventEmitter)->onValueChange(sender.value);
}

@end
