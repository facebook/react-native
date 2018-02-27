/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInputAccessoryView.h"

#import <React/RCTBridge.h>
#import <React/RCTTouchHandler.h>
#import <React/UIView+React.h>

#import "RCTInputAccessoryViewContent.h"

@implementation RCTInputAccessoryView
{
  BOOL _contentShouldBeFirstResponder;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _content = [RCTInputAccessoryViewContent new];
    RCTTouchHandler *const touchHandler = [[RCTTouchHandler alloc] initWithBridge:bridge];
    [touchHandler attachToView:_content.inputAccessoryView];
    [self addSubview:_content];
  }
  return self;
}

- (void)reactSetFrame:(CGRect)frame
{
  [_content.inputAccessoryView setFrame:frame];
  [_content.contentView setFrame:frame];

  if (_contentShouldBeFirstResponder) {
    _contentShouldBeFirstResponder = NO;
    [_content becomeFirstResponder];
  }
}

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertReactSubview:subview atIndex:index];
  [_content insertReactSubview:subview atIndex:index];
}

- (void)removeReactSubview:(UIView *)subview
{
  [super removeReactSubview:subview];
  [_content removeReactSubview:subview];
}

- (void)didUpdateReactSubviews
{
  // Do nothing, as subviews are managed by `insertReactSubview:atIndex:`
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  // If the accessory view is not linked to a text input via nativeID, assume it is
  // a standalone component that should get focus whenever it is rendered
  if (![changedProps containsObject:@"nativeID"] && !self.nativeID) {
    _contentShouldBeFirstResponder = YES;
  }
}

@end
