/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTVRemoteHandler.h"
#import <UIKit/UIGestureRecognizerSubclass.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "RCTRootView.h"
#import "RCTView.h"
#import "UIView+React.h"

@implementation RCTTVRemoteHandler
{
  __weak RCTEventDispatcher *_eventDispatcher;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  RCTAssertParam(bridge);
  
  if ((self = [super init])) {
    _eventDispatcher = [bridge moduleForClass:[RCTEventDispatcher class]];
    
    self.tvRemoteGestureRecognizers = [NSMutableArray array];
    
    // Recognizers for Apple TV remote buttons
    
    // Play/Pause
    [self addTapGestureRecognizerWithSelector:@selector(playPausePressed:)
                                    pressType:UIPressTypePlayPause];
    
    // Menu
    [self addTapGestureRecognizerWithSelector:@selector(menuPressed:)
                                    pressType:UIPressTypeMenu];
    
    // Select
    [self addTapGestureRecognizerWithSelector:@selector(selectPressed:)
                                    pressType:UIPressTypeSelect];
    
    // Up
    [self addTapGestureRecognizerWithSelector:@selector(swipedUp:)
                                    pressType:UIPressTypeUpArrow];
    
    // Down
    [self addTapGestureRecognizerWithSelector:@selector(swipedDown:)
                                    pressType:UIPressTypeDownArrow];
    
    // Left
    [self addTapGestureRecognizerWithSelector:@selector(swipedLeft:)
                                    pressType:UIPressTypeLeftArrow];
    
    // Right
    [self addTapGestureRecognizerWithSelector:@selector(swipedRight:)
                                    pressType:UIPressTypeRightArrow];
    
    
    // Recognizers for Apple TV remote trackpad swipes
    
    // Up
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedUp:)
                                      direction:UISwipeGestureRecognizerDirectionUp];
    
    // Down
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedDown:)
                                      direction:UISwipeGestureRecognizerDirectionDown];
    
    // Left
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedLeft:)
                                      direction:UISwipeGestureRecognizerDirectionLeft];
    
    // Right
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedRight:)
                                      direction:UISwipeGestureRecognizerDirectionRight];
    
  }

  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)


- (void)playPausePressed:(UIGestureRecognizer*)r {
  [self sendAppleTVEvent:@"playPause" toView:r.view];
}

- (void)menuPressed:(UIGestureRecognizer*)r {
  [self sendAppleTVEvent:@"menu" toView:r.view];
}

- (void)selectPressed:(UIGestureRecognizer*)r {
  [self sendAppleTVEvent:@"select" toView:r.view];
}

- (void)longPress:(UIGestureRecognizer*)r {
  [self sendAppleTVEvent:@"longPress" toView:r.view];
}

- (void)swipedUp:(UIGestureRecognizer*)r {
  [self sendAppleTVEvent:@"up" toView:r.view];
}

- (void)swipedDown:(UIGestureRecognizer*)r {
  [self sendAppleTVEvent:@"down" toView:r.view];
}

- (void)swipedLeft:(UIGestureRecognizer*)r {
  [self sendAppleTVEvent:@"left" toView:r.view];
}

- (void)swipedRight:(UIGestureRecognizer*)r {
  [self sendAppleTVEvent:@"right" toView:r.view];
}

#pragma mark -

- (void)addTapGestureRecognizerWithSelector:(nonnull SEL)selector pressType:(UIPressType)pressType {
  
  UITapGestureRecognizer *recognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:selector];
  recognizer.allowedPressTypes = @[[NSNumber numberWithInteger:pressType]];
  
  
  NSMutableArray *gestureRecognizers = (NSMutableArray*)self.tvRemoteGestureRecognizers;
  [gestureRecognizers addObject:recognizer];
}

- (void)addSwipeGestureRecognizerWithSelector:(nonnull SEL)selector direction:(UISwipeGestureRecognizerDirection)direction {
  
  UISwipeGestureRecognizer *recognizer = [[UISwipeGestureRecognizer alloc] initWithTarget:self action:selector];
  recognizer.direction = direction;
  
  NSMutableArray *gestureRecognizers = (NSMutableArray*)self.tvRemoteGestureRecognizers;
  [gestureRecognizers addObject:recognizer];
}

- (void)sendAppleTVEvent:(NSString*)eventType toView:(UIView*)v {
  if([v respondsToSelector:@selector(onTVNavEvent)]) {
    RCTDirectEventBlock onTVNavEvent = [v performSelector:@selector(onTVNavEvent) withObject:nil];
    if(onTVNavEvent) {
      onTVNavEvent(@{@"eventType":eventType});
    }
  }
  for(UIView *u in [v subviews]) {
    [self sendAppleTVEvent:eventType toView:u];
  }
}


@end
