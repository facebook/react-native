/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTimelineToolbarView.h"

#import <React/RCTDefines.h>

#if RCT_DEV

using namespace facebook::react;

@implementation RCTTimelineToolbarView {
  UIButton *_backwardEndButtonView;
  UIButton *_backwardButtonView;
  UIButton *_playButtonView;
  UIButton *_pauseButtonView;
  UIButton *_forwardButtonView;
  UIButton *_forwardEndButtonView;
  UIView *_buttonsView;
  UIView *_statusBackgroundView;

  UIButton *_menuButtonView;

  UILabel *_statusView;
  UIProgressView *_progressView;
  UISlider *_sliderView;
  NSTimer *_timer;

  TimelineController::Shared _timelineController;
  std::unique_ptr<facebook::react::TimelineHandler> _timelineHandler;
}

- (instancetype)initWithFrame:(CGRect)frame
           timelineController:(facebook::react::TimelineController::Shared)timelineController
                    surfaceId:(facebook::react::SurfaceId)surfaceId
{
  if (self = [super initWithFrame:frame]) {
    self.tintColor = [UIColor whiteColor];

    _timelineController = timelineController;
    _timelineHandler = std::make_unique<TimelineHandler>(_timelineController->enable(surfaceId));

    _buttonsView = [[UIView alloc] init];
    _buttonsView.translatesAutoresizingMaskIntoConstraints = NO;
    [self addSubview:_buttonsView];

    _statusBackgroundView = [[UIView alloc] init];
    _statusBackgroundView.translatesAutoresizingMaskIntoConstraints = NO;
    _statusBackgroundView.backgroundColor = self.tintColor;
    _statusBackgroundView.layer.cornerCurve = kCACornerCurveContinuous;
    _statusBackgroundView.layer.cornerRadius = 3;
    [self addSubview:_statusBackgroundView];

    _statusView = [[UILabel alloc] init];
    _statusView.translatesAutoresizingMaskIntoConstraints = NO;
    _statusView.font = [UIFont monospacedSystemFontOfSize:10 weight:UIFontWeightMedium];
    [self addSubview:_statusView];

    _progressView = [[UIProgressView alloc] initWithProgressViewStyle:UIProgressViewStyleBar];
    _progressView.translatesAutoresizingMaskIntoConstraints = NO;
    [self addSubview:_progressView];

    _sliderView = [[UISlider alloc] init];
    _sliderView.translatesAutoresizingMaskIntoConstraints = NO;
    [_sliderView addTarget:self action:@selector(handleSliderView) forControlEvents:UIControlEventValueChanged];
    [self addSubview:_sliderView];

    UIImageConfiguration *normalButtonImageConfiguration = [UIImageSymbolConfiguration configurationWithPointSize:16.0];
    UIImageConfiguration *bigButtonImageConfiguration = [UIImageSymbolConfiguration configurationWithPointSize:24.0];

    _backwardEndButtonView = [self buildButtonWithName:@"backward.end.fill"
                                    imageConfiguration:normalButtonImageConfiguration
                                               handler:@selector(handleBackwardEndButton)];
    _backwardButtonView = [self buildButtonWithName:@"backward.fill"
                                 imageConfiguration:normalButtonImageConfiguration
                                            handler:@selector(handleBackwardButton)];
    _playButtonView = [self buildButtonWithName:@"play.fill"
                             imageConfiguration:bigButtonImageConfiguration
                                        handler:@selector(handlePlayButton)];
    _pauseButtonView = [self buildButtonWithName:@"pause.fill"
                              imageConfiguration:bigButtonImageConfiguration
                                         handler:@selector(handlePlayButton)];
    _forwardButtonView = [self buildButtonWithName:@"forward.fill"
                                imageConfiguration:normalButtonImageConfiguration
                                           handler:@selector(handleForwardButton)];
    _forwardEndButtonView = [self buildButtonWithName:@"forward.end.fill"
                                   imageConfiguration:normalButtonImageConfiguration
                                              handler:@selector(handleForwardEndButton)];

    _menuButtonView = [self buildButtonWithName:@"ellipsis"
                             imageConfiguration:normalButtonImageConfiguration
                                        handler:@selector(handleMenuButton)];

    [self invalidateState];
    [self setNeedsUpdateConstraints];

    __weak RCTTimelineToolbarView *weakSelf = self;
    _timer = [NSTimer timerWithTimeInterval:0.2
                                    repeats:YES
                                      block:^(NSTimer *_Nonnull timer) {
                                        [weakSelf invalidateState];
                                      }];

    [[NSRunLoop currentRunLoop] addTimer:_timer forMode:NSRunLoopCommonModes];
  }

  return self;
}

- (UIButton *)buildButtonWithName:(NSString *)name
               imageConfiguration:(UIImageConfiguration *)imageConfiguration
                          handler:(SEL)handler
{
  UIImage *image = [UIImage systemImageNamed:name withConfiguration:imageConfiguration];
  UIButton *button = [UIButton systemButtonWithImage:image target:self action:handler];
  button.translatesAutoresizingMaskIntoConstraints = NO;
  [_buttonsView addSubview:button];
  return button;
}

- (void)dealloc
{
  _timelineController->disable(std::move(*_timelineHandler));
}

- (void)updateConstraints
{
  [super updateConstraints];

  UIEdgeInsets buttonsInsets = UIEdgeInsets{8, 8, 8, 8};
  CGFloat buttonMargin = 20;

  [_statusView.centerXAnchor constraintEqualToAnchor:self.centerXAnchor].active = YES;
  [_statusView.bottomAnchor constraintEqualToAnchor:self.bottomAnchor constant:-10].active = YES;

  UIEdgeInsets statusBackgroundInsets = UIEdgeInsets{-2, -6, -2, -6};
  [_statusBackgroundView.leadingAnchor constraintEqualToAnchor:_statusView.leadingAnchor
                                                      constant:statusBackgroundInsets.left]
      .active = YES;
  [_statusBackgroundView.trailingAnchor constraintEqualToAnchor:_statusView.trailingAnchor
                                                       constant:-statusBackgroundInsets.right]
      .active = YES;
  [_statusBackgroundView.topAnchor constraintEqualToAnchor:_statusView.topAnchor constant:statusBackgroundInsets.top]
      .active = YES;
  [_statusBackgroundView.bottomAnchor constraintEqualToAnchor:_statusView.bottomAnchor
                                                     constant:-statusBackgroundInsets.bottom]
      .active = YES;

  [_buttonsView.leadingAnchor constraintEqualToAnchor:self.leadingAnchor constant:buttonsInsets.left].active = YES;
  [_buttonsView.trailingAnchor constraintEqualToAnchor:self.trailingAnchor constant:-buttonsInsets.right].active = YES;
  [_buttonsView.topAnchor constraintEqualToAnchor:self.topAnchor constant:buttonsInsets.top].active = YES;
  [_buttonsView.bottomAnchor constraintEqualToAnchor:self.bottomAnchor constant:-buttonsInsets.bottom].active = YES;

  [_sliderView.leadingAnchor constraintEqualToAnchor:_buttonsView.leadingAnchor constant:0].active = YES;
  [_sliderView.trailingAnchor constraintEqualToAnchor:_buttonsView.trailingAnchor constant:0].active = YES;
  [_sliderView.topAnchor constraintEqualToAnchor:_buttonsView.topAnchor constant:0].active = YES;

  // `_playButtonView` button on the center of `_buttonsView`.
  [_playButtonView.centerXAnchor constraintEqualToAnchor:_buttonsView.centerXAnchor].active = YES;
  [_playButtonView.centerYAnchor constraintEqualToAnchor:_buttonsView.centerYAnchor].active = YES;

  // `_pauseButtonView` button on the center of `_playButtonView`.
  [_pauseButtonView.centerXAnchor constraintEqualToAnchor:_playButtonView.centerXAnchor].active = YES;
  [_pauseButtonView.centerYAnchor constraintEqualToAnchor:_playButtonView.centerYAnchor].active = YES;

  // All buttons forms a horizontal line.
  [_backwardButtonView.leftAnchor constraintEqualToAnchor:_backwardEndButtonView.rightAnchor constant:buttonMargin]
      .active = YES;
  [_playButtonView.leftAnchor constraintEqualToAnchor:_backwardButtonView.rightAnchor constant:buttonMargin].active =
      YES;
  [_forwardButtonView.leftAnchor constraintEqualToAnchor:_playButtonView.rightAnchor constant:buttonMargin].active =
      YES;
  [_forwardEndButtonView.leftAnchor constraintEqualToAnchor:_forwardButtonView.rightAnchor constant:buttonMargin]
      .active = YES;
  [_menuButtonView.trailingAnchor constraintEqualToAnchor:_buttonsView.trailingAnchor constant:-buttonMargin].active =
      YES;

  // All buttons have same centerY as `_playButtonView`.
  [_backwardEndButtonView.centerYAnchor constraintEqualToAnchor:_playButtonView.centerYAnchor].active = YES;
  [_backwardButtonView.centerYAnchor constraintEqualToAnchor:_playButtonView.centerYAnchor].active = YES;
  [_forwardButtonView.centerYAnchor constraintEqualToAnchor:_playButtonView.centerYAnchor].active = YES;
  [_forwardEndButtonView.centerYAnchor constraintEqualToAnchor:_playButtonView.centerYAnchor].active = YES;
  [_menuButtonView.centerYAnchor constraintEqualToAnchor:_playButtonView.centerYAnchor].active = YES;
}

- (void)invalidateState
{
  BOOL isPaused = (BOOL)_timelineHandler->isPaused();

  auto currentFrameIndex = _timelineHandler->getCurrentFrame().getIndex();
  auto totalFrames = _timelineHandler->getFrames().size();

  bool onTheFirstFrame = currentFrameIndex == 0;
  bool onTheLastFrame = currentFrameIndex == totalFrames - 1;

  [_playButtonView setHidden:!isPaused];
  [_pauseButtonView setHidden:isPaused];

  [_backwardEndButtonView setEnabled:isPaused && !onTheFirstFrame];
  [_backwardButtonView setEnabled:isPaused && !onTheFirstFrame];
  [_forwardButtonView setEnabled:isPaused && !onTheLastFrame];
  [_forwardEndButtonView setEnabled:isPaused && !onTheLastFrame];

  [_sliderView setHidden:!isPaused];
  if ((int)_sliderView.maximumValue != totalFrames) {
    _sliderView.maximumValue = totalFrames;
  }

  [_sliderView setValue:(float)currentFrameIndex animated:NO];

  NSString *status;
  if (isPaused) {
    status = [NSString stringWithFormat:@"Frame %@ of %@", @(currentFrameIndex + 1), @(totalFrames)];
  } else {
    status = [NSString stringWithFormat:@"Frame %@", @(currentFrameIndex + 1)];
  }

  _statusView.text = status;
}

- (void)handlePlayButton
{
  if (_timelineHandler->isPaused()) {
    _timelineHandler->resume();
  } else {
    _timelineHandler->pause();
  }

  [self invalidateState];
}

- (void)handleBackwardEndButton
{
  _timelineHandler->seek(-100500);
  [self invalidateState];
}

- (void)handleBackwardButton
{
  _timelineHandler->seek(-1);
  [self invalidateState];
}

- (void)handleForwardButton
{
  _timelineHandler->seek(1);
  [self invalidateState];
}

- (void)handleForwardEndButton
{
  _timelineHandler->seek(100500);
  [self invalidateState];
}

- (void)handleMenuButton
{
}

- (void)handleSliderView
{
  auto index = (int)_sliderView.value;
  [_sliderView setValue:(float)index animated:NO];

  auto frames = _timelineHandler->getFrames();
  auto frame = frames.at(std::max(0, std::min((int)(frames.size() - 1), index)));
  _timelineHandler->rewind(frame);

  [self invalidateState];
}

@end

#endif
