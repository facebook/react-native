/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModalHostViewComponentView.h"

#import <React/UIView+React.h>
#import <react/components/modal/ModalHostViewComponentDescriptor.h>
#import <react/components/modal/ModalHostViewState.h>
#import <react/components/rncore/EventEmitters.h>
#import <react/components/rncore/Props.h>

#import "FBRCTFabricComponentsPlugins.h"
#import "RCTConversions.h"
#import "RCTFabricModalHostViewController.h"

using namespace facebook::react;

#if !TARGET_OS_TV
static UIInterfaceOrientationMask supportedOrientationsMask(ModalHostViewSupportedOrientationsMask mask)
{
  UIInterfaceOrientationMask supportedOrientations = 0;

  if (mask & ModalHostViewSupportedOrientations::Portrait) {
    supportedOrientations |= UIInterfaceOrientationMaskPortrait;
  }

  if (mask & ModalHostViewSupportedOrientations::PortraitUpsideDown) {
    supportedOrientations |= UIInterfaceOrientationMaskPortraitUpsideDown;
  }

  if (mask & ModalHostViewSupportedOrientations::Landscape) {
    supportedOrientations |= UIInterfaceOrientationMaskLandscape;
  }

  if (mask & ModalHostViewSupportedOrientations::LandscapeLeft) {
    supportedOrientations |= UIInterfaceOrientationMaskLandscapeLeft;
  }

  if (mask & ModalHostViewSupportedOrientations::LandscapeRight) {
    supportedOrientations |= UIInterfaceOrientationMaskLandscapeRight;
  }

  if (supportedOrientations == 0) {
    if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad) {
      return UIInterfaceOrientationMaskAll;
    } else {
      return UIInterfaceOrientationMaskPortrait;
    }
  }

  return supportedOrientations;
}
#endif

static std::tuple<BOOL, UIModalTransitionStyle> animationConfiguration(ModalHostViewAnimationType const animation)
{
  switch (animation) {
    case ModalHostViewAnimationType::None:
      return std::make_tuple(NO, UIModalTransitionStyleCoverVertical);
    case ModalHostViewAnimationType::Slide:
      return std::make_tuple(YES, UIModalTransitionStyleCoverVertical);
    case ModalHostViewAnimationType::Fade:
      return std::make_tuple(YES, UIModalTransitionStyleCrossDissolve);
  }
}

static UIModalPresentationStyle presentationConfiguration(ModalHostViewProps const &props)
{
  if (props.transparent) {
    return UIModalPresentationOverFullScreen;
  }
  switch (props.presentationStyle) {
    case ModalHostViewPresentationStyle::FullScreen:
      return UIModalPresentationFullScreen;
    case ModalHostViewPresentationStyle::PageSheet:
      return UIModalPresentationPageSheet;
    case ModalHostViewPresentationStyle::FormSheet:
      return UIModalPresentationFormSheet;
    case ModalHostViewPresentationStyle::OverFullScreen:
      return UIModalPresentationOverFullScreen;
  }
}

static ModalHostViewEventEmitter::OnOrientationChange onOrientationChangeStruct(CGRect rect)
{
  ;
  auto orientation = rect.size.width < rect.size.height
      ? ModalHostViewEventEmitter::OnOrientationChangeOrientation::Portrait
      : ModalHostViewEventEmitter::OnOrientationChangeOrientation::Landscape;
  return {orientation};
}

@interface RCTModalHostViewComponentView () <RCTFabricModalHostViewControllerDelegate>

@end

@implementation RCTModalHostViewComponentView {
  RCTFabricModalHostViewController *_viewController;
  ModalHostViewShadowNode::ConcreteState::Shared _state;
  BOOL _shouldAnimatePresentation;
  BOOL _isPresented;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ModalHostViewProps>();
    _props = defaultProps;
    _shouldAnimatePresentation = YES;
    _viewController = [RCTFabricModalHostViewController new];
    _viewController.modalTransitionStyle = UIModalTransitionStyleCoverVertical;
    _viewController.delegate = self;
    _isPresented = NO;
  }

  return self;
}

- (void)ensurePresentedOnlyIfNeeded
{
  BOOL shouldBePresented = !_isPresented && self.window;
  if (shouldBePresented) {
    UIViewController *controller = [self reactViewController];
    _isPresented = YES;
    return [controller
        presentViewController:_viewController
                     animated:_shouldAnimatePresentation
                   completion:^{
                     if (!self->_eventEmitter) {
                       return;
                     }

                     assert(std::dynamic_pointer_cast<ModalHostViewEventEmitter const>(self->_eventEmitter));
                     auto eventEmitter = std::static_pointer_cast<ModalHostViewEventEmitter const>(self->_eventEmitter);
                     eventEmitter->onShow(ModalHostViewEventEmitter::OnShow{});
                   }];
  }

  BOOL shouldBeHidden = _isPresented && !self.superview;
  if (shouldBeHidden) {
    _isPresented = NO;
    [_viewController dismissViewControllerAnimated:_shouldAnimatePresentation completion:nil];
  }
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self ensurePresentedOnlyIfNeeded];
}

- (void)didMoveToSuperview
{
  [super didMoveToSuperview];
  [self ensurePresentedOnlyIfNeeded];
}

#pragma mark - RCTFabricModalHostViewControllerDelegate

- (void)boundsDidChange:(CGRect)newBounds
{
  if (_eventEmitter) {
    assert(std::dynamic_pointer_cast<ModalHostViewEventEmitter const>(_eventEmitter));

    auto eventEmitter = std::static_pointer_cast<ModalHostViewEventEmitter const>(_eventEmitter);
    eventEmitter->onOrientationChange(onOrientationChangeStruct(newBounds));
  }

  if (_state != nullptr) {
    auto newState = ModalHostViewState{RCTSizeFromCGSize(newBounds.size)};
    _state->updateState(std::move(newState));
  }
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ModalHostViewComponentDescriptor>();
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
  _isPresented = NO;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &newProps = *std::static_pointer_cast<const ModalHostViewProps>(props);

#if !TARGET_OS_TV
  _viewController.supportedInterfaceOrientations = supportedOrientationsMask(newProps.supportedOrientations);
#endif

  std::tuple<BOOL, UIModalTransitionStyle> result = animationConfiguration(newProps.animationType);
  _shouldAnimatePresentation = std::get<0>(result);
  _viewController.modalTransitionStyle = std::get<1>(result);

  _viewController.modalPresentationStyle = presentationConfiguration(newProps);

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(facebook::react::State::Shared const &)state
           oldState:(facebook::react::State::Shared const &)oldState
{
  _state = std::static_pointer_cast<const ModalHostViewShadowNode::ConcreteState>(state);
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_viewController.view insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

@end

Class<RCTComponentViewProtocol> RCTModalHostViewCls(void)
{
  return RCTModalHostViewComponentView.class;
}
