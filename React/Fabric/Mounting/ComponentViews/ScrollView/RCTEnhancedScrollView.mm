/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTEnhancedScrollView.h"

@implementation RCTEnhancedScrollView {
  __weak id<UIScrollViewDelegate> _publicDelegate;
}

+ (BOOL)automaticallyNotifiesObserversForKey:(NSString *)key
{
  if ([key isEqualToString:@"delegate"]) {
    // For `delegate` property, we issue KVO notifications manually.
    // We need that to block notifications caused by setting the original `UIScrollView`s property.
    return NO;
  }

  return [super automaticallyNotifiesObserversForKey:key];
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    if (@available(iOS 11.0, *)) {
      // We set the default behavior to "never" so that iOS
      // doesn't do weird things to UIScrollView insets automatically
      // and keeps it as an opt-in behavior.
      self.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
    }

    __weak __typeof(self) weakSelf = self;
    _delegateSplitter = [[RCTGenericDelegateSplitter alloc] initWithDelegateUpdateBlock:^(id delegate) {
      [weakSelf setPrivateDelegate:delegate];
    }];
  }

  return self;
}

- (void)setPrivateDelegate:(id<UIScrollViewDelegate>)delegate
{
  [super setDelegate:delegate];
}

- (id<UIScrollViewDelegate>)delegate
{
  return _publicDelegate;
}

- (void)setDelegate:(id<UIScrollViewDelegate>)delegate
{
  if (_publicDelegate == delegate) {
    return;
  }

  if (_publicDelegate) {
    [_delegateSplitter removeDelegate:_publicDelegate];
  }

  [self willChangeValueForKey:@"delegate"];
  _publicDelegate = delegate;
  [self didChangeValueForKey:@"delegate"];

  if (_publicDelegate) {
    [_delegateSplitter addDelegate:_publicDelegate];
  }
}

@end
