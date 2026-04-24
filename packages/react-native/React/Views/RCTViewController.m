/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewController.h"

#import <objc/runtime.h>

static void RCTSetViewControllerIsVisible(UIViewController *viewController, BOOL isVisible)
{
  objc_setAssociatedObject(
      viewController, @selector(reactViewControllerIsVisible), @(isVisible), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

@implementation UIViewController (RCTViewControllerAppearance)

- (NSHashTable<id<RCTViewControllerAppearanceListener>> *)reactViewControllerAppearanceListeners
{
  NSHashTable<id<RCTViewControllerAppearanceListener>> *listeners =
      objc_getAssociatedObject(self, @selector(reactViewControllerAppearanceListeners));
  if (!listeners) {
    listeners = [NSHashTable weakObjectsHashTable];
    objc_setAssociatedObject(
        self, @selector(reactViewControllerAppearanceListeners), listeners, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  return listeners;
}

- (BOOL)reactViewControllerIsVisible
{
  return [objc_getAssociatedObject(self, @selector(reactViewControllerIsVisible)) boolValue];
}

- (void)reactAddViewControllerAppearanceListener:(id<RCTViewControllerAppearanceListener>)listener
{
  [[self reactViewControllerAppearanceListeners] addObject:listener];

  if (self.reactViewControllerIsVisible &&
      [listener respondsToSelector:@selector(reactViewControllerDidAppear:animated:)]) {
    [listener reactViewControllerDidAppear:self animated:NO];
  }
}

- (void)reactRemoveViewControllerAppearanceListener:(id<RCTViewControllerAppearanceListener>)listener
{
  [[self reactViewControllerAppearanceListeners] removeObject:listener];
}

- (void)reactNotifyViewControllerDidAppear:(BOOL)animated
{
  RCTSetViewControllerIsVisible(self, YES);

  for (id<RCTViewControllerAppearanceListener> listener in [self reactViewControllerAppearanceListeners].allObjects) {
    if ([listener respondsToSelector:@selector(reactViewControllerDidAppear:animated:)]) {
      [listener reactViewControllerDidAppear:self animated:animated];
    }
  }
}

- (void)reactNotifyViewControllerDidDisappear:(BOOL)animated
{
  RCTSetViewControllerIsVisible(self, NO);

  for (id<RCTViewControllerAppearanceListener> listener in [self reactViewControllerAppearanceListeners].allObjects) {
    if ([listener respondsToSelector:@selector(reactViewControllerDidDisappear:animated:)]) {
      [listener reactViewControllerDidDisappear:self animated:animated];
    }
  }
}

@end

@implementation RCTViewController

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  [self reactNotifyViewControllerDidAppear:animated];
}

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  [self reactNotifyViewControllerDidDisappear:animated];
}

@end
