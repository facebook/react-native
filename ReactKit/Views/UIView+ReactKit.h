// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

#import "RCTViewNodeProtocol.h"

//TODO: let's try to eliminate this category if possible

@interface UIView (ReactKit) <RCTViewNodeProtocol>

/**
 * This method finds and returns the containing view controller for the view.
 */
- (UIViewController *)backingViewController;

/**
 * This method attaches the specified controller as a child of the
 * the owning view controller of this view. Returns NO if no view
 * controller is found (which may happen if the view is not currently
 * attached to the view hierarchy).
 */
- (void)addControllerToClosestParent:(UIViewController *)controller;

@end
