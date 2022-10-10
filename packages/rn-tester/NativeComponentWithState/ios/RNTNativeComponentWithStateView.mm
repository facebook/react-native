/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNTNativeComponentWithStateView.h"

#import <react/renderer/components/AppSpecs/ComponentDescriptors.h>
#import <react/renderer/components/AppSpecs/EventEmitters.h>
#import <react/renderer/components/AppSpecs/Props.h>
#import <react/renderer/components/AppSpecs/RCTComponentViewHelpers.h>
#import "RNTNativeComponentWithStateCustomComponentDescriptor.h"

#import <React/RCTImageResponseDelegate.h>
#import <React/RCTImageResponseObserverProxy.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface RNTNativeComponentWithStateView () <RCTRNTNativeComponentWithStateViewProtocol, RCTImageResponseDelegate>
@end

@implementation RNTNativeComponentWithStateView {
  UIView *_view;
  UIImageView *_imageView;
  UIImage *_image;
  ImageResponseObserverCoordinator const *_imageCoordinator;
  RCTImageResponseObserverProxy _imageResponseObserverProxy;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNTNativeComponentWithStateCustomComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNTNativeComponentWithStateProps>();
    _props = defaultProps;

    _view = [[UIView alloc] init];
    _view.backgroundColor = [UIColor redColor];

    _imageView = [[UIImageView alloc] init];
    [_view addSubview:_imageView];

    _imageView.translatesAutoresizingMaskIntoConstraints = NO;
    [NSLayoutConstraint activateConstraints:@[
      [_imageView.topAnchor constraintEqualToAnchor:_view.topAnchor constant:10],
      [_imageView.leftAnchor constraintEqualToAnchor:_view.leftAnchor constant:10],
      [_imageView.bottomAnchor constraintEqualToAnchor:_view.bottomAnchor constant:-10],
      [_imageView.rightAnchor constraintEqualToAnchor:_view.rightAnchor constant:-10],
    ]];
    _imageView.image = _image;

    _imageResponseObserverProxy = RCTImageResponseObserverProxy(self);

    self.contentView = _view;
  }

  return self;
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  self.imageCoordinator = nullptr;
  _image = nil;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(facebook::react::State::Shared const &)state
           oldState:(facebook::react::State::Shared const &)oldState
{
  auto _state = std::static_pointer_cast<RNTNativeComponentWithStateShadowNode::ConcreteState const>(state);
  auto _oldState = std::static_pointer_cast<RNTNativeComponentWithStateShadowNode::ConcreteState const>(oldState);

  auto data = _state->getData();

  bool havePreviousData = _oldState != nullptr;

  auto getCoordinator = [](ImageRequest const *request) -> ImageResponseObserverCoordinator const * {
    if (request) {
      return &request->getObserverCoordinator();
    } else {
      return nullptr;
    }
  };

  if (!havePreviousData || data.getImageSource() != _oldState->getData().getImageSource()) {
    self.imageCoordinator = getCoordinator(&data.getImageRequest());
  }
}

- (void)setImageCoordinator:(const ImageResponseObserverCoordinator *)coordinator
{
  if (_imageCoordinator) {
    _imageCoordinator->removeObserver(_imageResponseObserverProxy);
  }
  _imageCoordinator = coordinator;
  if (_imageCoordinator) {
    _imageCoordinator->addObserver(_imageResponseObserverProxy);
  }
}

- (void)setImage:(UIImage *)image
{
  if ([image isEqual:_image]) {
    return;
  }

  _imageView.image = image;
}

#pragma mark - RCTImageResponseDelegate

- (void)didReceiveImage:(UIImage *)image metadata:(id)metadata fromObserver:(void const *)observer
{
  if (observer == &_imageResponseObserverProxy) {
    self.image = image;
  }
}

- (void)didReceiveProgress:(float)progress fromObserver:(void const *)observer
{
}

- (void)didReceiveFailureFromObserver:(void const *)observer
{
}

@end

Class<RCTComponentViewProtocol> RNTNativeComponentWithStateCls(void)
{
  return RNTNativeComponentWithStateView.class;
}
