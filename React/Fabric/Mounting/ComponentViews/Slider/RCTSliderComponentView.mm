/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSliderComponentView.h"

#import <React/RCTImageResponseDelegate.h>
#import <React/RCTImageResponseObserverProxy.h>
#import <react/components/rncore/EventEmitters.h>
#import <react/components/rncore/Props.h>
#import <react/components/slider/SliderComponentDescriptor.h>

#import "FBRCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface RCTSliderComponentView () <RCTImageResponseDelegate>
@end

@implementation RCTSliderComponentView {
  UISlider *_sliderView;
  float _previousValue;

  UIImage *_trackImage;
  UIImage *_minimumTrackImage;
  UIImage *_maximumTrackImage;
  UIImage *_thumbImage;

  const ImageResponseObserverCoordinator *_trackImageCoordinator;
  const ImageResponseObserverCoordinator *_minimumTrackImageCoordinator;
  const ImageResponseObserverCoordinator *_maximumTrackImageCoordinator;
  const ImageResponseObserverCoordinator *_thumbImageCoordinator;

  RCTImageResponseObserverProxy _trackImageResponseObserverProxy;
  RCTImageResponseObserverProxy _minimumTrackImageResponseObserverProxy;
  RCTImageResponseObserverProxy _maximumTrackImageResponseObserverProxy;
  RCTImageResponseObserverProxy _thumbImageResponseObserverProxy;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SliderProps>();
    _props = defaultProps;

    _sliderView = [[UISlider alloc] initWithFrame:self.bounds];

    [_sliderView addTarget:self action:@selector(onChange:) forControlEvents:UIControlEventValueChanged];
    [_sliderView addTarget:self
                    action:@selector(sliderTouchEnd:)
          forControlEvents:(UIControlEventTouchUpInside | UIControlEventTouchUpOutside | UIControlEventTouchCancel)];

    _sliderView.value = defaultProps->value;

    _trackImageResponseObserverProxy = RCTImageResponseObserverProxy(self);
    _minimumTrackImageResponseObserverProxy = RCTImageResponseObserverProxy(self);
    _maximumTrackImageResponseObserverProxy = RCTImageResponseObserverProxy(self);
    _thumbImageResponseObserverProxy = RCTImageResponseObserverProxy(self);

    self.contentView = _sliderView;
  }

  return self;
}

// Recycling still doesn't work 100% properly
// TODO: T40099998 implement recycling properly for Fabric Slider component
- (void)prepareForRecycle
{
  [super prepareForRecycle];

  self.trackImageCoordinator = nullptr;
  self.minimumTrackImageCoordinator = nullptr;
  self.maximumTrackImageCoordinator = nullptr;
  self.thumbImageCoordinator = nullptr;

  // Tint colors will be taken care of when props are set again - we just
  // need to make sure that image properties are reset here
  [_sliderView setMinimumTrackImage:nil forState:UIControlStateNormal];
  [_sliderView setMaximumTrackImage:nil forState:UIControlStateNormal];
  [_sliderView setThumbImage:nil forState:UIControlStateNormal];

  _trackImage = nil;
  _minimumTrackImage = nil;
  _maximumTrackImage = nil;
  _thumbImage = nil;
}

- (void)dealloc
{
  self.trackImageCoordinator = nullptr;
  self.minimumTrackImageCoordinator = nullptr;
  self.maximumTrackImageCoordinator = nullptr;
  self.thumbImageCoordinator = nullptr;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SliderComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldSliderProps = *std::static_pointer_cast<const SliderProps>(_props);
  const auto &newSliderProps = *std::static_pointer_cast<const SliderProps>(props);

  // `value`
  if (oldSliderProps.value != newSliderProps.value) {
    _sliderView.value = newSliderProps.value;
    _previousValue = newSliderProps.value;
  }

  // `minimumValue`
  if (oldSliderProps.minimumValue != newSliderProps.minimumValue) {
    _sliderView.minimumValue = newSliderProps.minimumValue;
  }

  // `maximumValue`
  if (oldSliderProps.maximumValue != newSliderProps.maximumValue) {
    _sliderView.maximumValue = newSliderProps.maximumValue;
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

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(facebook::react::State::Shared const &)state
           oldState:(facebook::react::State::Shared const &)oldState
{
  auto _state = std::static_pointer_cast<SliderShadowNode::ConcreteState const>(state);
  auto _oldState = std::static_pointer_cast<SliderShadowNode::ConcreteState const>(oldState);

  auto data = _state->getData();

  bool havePreviousData = _oldState != nullptr;

  auto getCoordinator = [](ImageRequest const *request) -> ImageResponseObserverCoordinator const * {
    if (request) {
      return &request->getObserverCoordinator();
    } else {
      return nullptr;
    }
  };

  if (!havePreviousData || data.getTrackImageSource() != _oldState->getData().getTrackImageSource()) {
    self.trackImageCoordinator = getCoordinator(&data.getTrackImageRequest());
  }

  if (!havePreviousData || data.getMinimumTrackImageSource() != _oldState->getData().getMinimumTrackImageSource()) {
    self.minimumTrackImageCoordinator = getCoordinator(&data.getMinimumTrackImageRequest());
  }

  if (!havePreviousData || data.getMaximumTrackImageSource() != _oldState->getData().getMaximumTrackImageSource()) {
    self.maximumTrackImageCoordinator = getCoordinator(&data.getMaximumTrackImageRequest());
  }

  if (!havePreviousData || data.getThumbImageSource() != _oldState->getData().getThumbImageSource()) {
    self.thumbImageCoordinator = getCoordinator(&data.getThumbImageRequest());
  }
}

- (void)setTrackImageCoordinator:(const ImageResponseObserverCoordinator *)coordinator
{
  if (_trackImageCoordinator) {
    _trackImageCoordinator->removeObserver(_trackImageResponseObserverProxy);
  }
  _trackImageCoordinator = coordinator;
  if (_trackImageCoordinator) {
    _trackImageCoordinator->addObserver(_trackImageResponseObserverProxy);
  }
}

- (void)setMinimumTrackImageCoordinator:(const ImageResponseObserverCoordinator *)coordinator
{
  if (_minimumTrackImageCoordinator) {
    _minimumTrackImageCoordinator->removeObserver(_minimumTrackImageResponseObserverProxy);
  }
  _minimumTrackImageCoordinator = coordinator;
  if (_minimumTrackImageCoordinator) {
    _minimumTrackImageCoordinator->addObserver(_minimumTrackImageResponseObserverProxy);
  }
}

- (void)setMaximumTrackImageCoordinator:(const ImageResponseObserverCoordinator *)coordinator
{
  if (_maximumTrackImageCoordinator) {
    _maximumTrackImageCoordinator->removeObserver(_maximumTrackImageResponseObserverProxy);
  }
  _maximumTrackImageCoordinator = coordinator;
  if (_maximumTrackImageCoordinator) {
    _maximumTrackImageCoordinator->addObserver(_maximumTrackImageResponseObserverProxy);
  }
}

- (void)setThumbImageCoordinator:(const ImageResponseObserverCoordinator *)coordinator
{
  if (_thumbImageCoordinator) {
    _thumbImageCoordinator->removeObserver(_thumbImageResponseObserverProxy);
  }
  _thumbImageCoordinator = coordinator;
  if (_thumbImageCoordinator) {
    _thumbImageCoordinator->addObserver(_thumbImageResponseObserverProxy);
  }
}

- (void)setTrackImage:(UIImage *)trackImage
{
  if ([trackImage isEqual:_trackImage]) {
    return;
  }

  _trackImage = trackImage;
  _minimumTrackImage = nil;
  _maximumTrackImage = nil;
  CGFloat width = trackImage.size.width / 2;
  UIImage *minimumTrackImage = [trackImage resizableImageWithCapInsets:(UIEdgeInsets){0, width, 0, width}
                                                          resizingMode:UIImageResizingModeStretch];
  UIImage *maximumTrackImage = [trackImage resizableImageWithCapInsets:(UIEdgeInsets){0, width, 0, width}
                                                          resizingMode:UIImageResizingModeStretch];
  [_sliderView setMinimumTrackImage:minimumTrackImage forState:UIControlStateNormal];
  [_sliderView setMaximumTrackImage:maximumTrackImage forState:UIControlStateNormal];
}

- (void)setMinimumTrackImage:(UIImage *)minimumTrackImage
{
  if ([minimumTrackImage isEqual:_minimumTrackImage] && _trackImage == nil) {
    return;
  }

  _trackImage = nil;
  _minimumTrackImage = minimumTrackImage;
  _minimumTrackImage =
      [_minimumTrackImage resizableImageWithCapInsets:(UIEdgeInsets){0, _minimumTrackImage.size.width, 0, 0}
                                         resizingMode:UIImageResizingModeStretch];
  [_sliderView setMinimumTrackImage:_minimumTrackImage forState:UIControlStateNormal];
}

- (void)setMaximumTrackImage:(UIImage *)maximumTrackImage
{
  if ([maximumTrackImage isEqual:_maximumTrackImage] && _trackImage == nil) {
    return;
  }

  _trackImage = nil;
  _maximumTrackImage = maximumTrackImage;
  _maximumTrackImage =
      [_maximumTrackImage resizableImageWithCapInsets:(UIEdgeInsets){0, 0, 0, _maximumTrackImage.size.width}
                                         resizingMode:UIImageResizingModeStretch];
  [_sliderView setMaximumTrackImage:_maximumTrackImage forState:UIControlStateNormal];
}

- (void)setThumbImage:(UIImage *)thumbImage
{
  if ([thumbImage isEqual:_thumbImage]) {
    return;
  }

  _thumbImage = thumbImage;
  [_sliderView setThumbImage:thumbImage forState:UIControlStateNormal];
}

- (void)onChange:(UISlider *)sender
{
  [self onChange:sender withContinuous:YES];
}

- (void)sliderTouchEnd:(UISlider *)sender
{
  [self onChange:sender withContinuous:NO];
}

- (void)onChange:(UISlider *)sender withContinuous:(BOOL)continuous
{
  float value = sender.value;

  const auto &props = *std::static_pointer_cast<const SliderProps>(_props);

  if (props.step > 0 && value <= (props.maximumValue - props.minimumValue)) {
    value = MAX(
        props.minimumValue,
        MIN(props.maximumValue, props.minimumValue + round((value - props.minimumValue) / props.step) * props.step));

    [_sliderView setValue:value animated:YES];
  }

  if (continuous && _previousValue != value) {
    std::dynamic_pointer_cast<const SliderEventEmitter>(_eventEmitter)
        ->onValueChange(SliderEventEmitter::OnValueChange{.value = static_cast<Float>(value)});
  }
  if (!continuous) {
    std::dynamic_pointer_cast<const SliderEventEmitter>(_eventEmitter)
        ->onSlidingComplete(SliderEventEmitter::OnSlidingComplete{.value = static_cast<Float>(value)});
  }

  _previousValue = value;
}

#pragma mark - RCTImageResponseDelegate

- (void)didReceiveImage:(UIImage *)image fromObserver:(void const *)observer
{
  if (observer == &_trackImageResponseObserverProxy) {
    self.trackImage = image;
  } else if (observer == &_minimumTrackImageResponseObserverProxy) {
    self.minimumTrackImage = image;
  } else if (observer == &_maximumTrackImageResponseObserverProxy) {
    self.maximumTrackImage = image;
  } else if (observer == &_thumbImageResponseObserverProxy) {
    self.thumbImage = image;
  }
}

- (void)didReceiveProgress:(float)progress fromObserver:(void const *)observer
{
}

- (void)didReceiveFailureFromObserver:(void const *)observer
{
}

@end

Class<RCTComponentViewProtocol> RCTSliderCls(void)
{
  return RCTSliderComponentView.class;
}
