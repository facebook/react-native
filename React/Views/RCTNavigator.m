/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTNavigator.h"

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTNavItem.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "RCTWrapperViewController.h"
#import "UIView+React.h"

typedef NS_ENUM(NSUInteger, RCTNavigationLock) {
  RCTNavigationLockNone,
  RCTNavigationLockNative,
  RCTNavigationLockJavaScript
};

NSInteger kNeverRequested = -1;
NSInteger kNeverProgressed = -10000;


@interface UINavigationController ()

// need to declare this since `UINavigationController` doesnt publicly declare the fact that it implements
// UINavigationBarDelegate :(
- (BOOL)navigationBar:(UINavigationBar *)navigationBar shouldPopItem:(UINavigationItem *)item;

@end

// http://stackoverflow.com/questions/5115135/uinavigationcontroller-how-to-cancel-the-back-button-event
// There's no other way to do this unfortunately :(
@interface RCTNavigationController : UINavigationController <UINavigationBarDelegate>
{
  dispatch_block_t _scrollCallback;
}

@property (nonatomic, assign) RCTNavigationLock navigationLock;

@end

/**
 * In general, `RCTNavigator` examines `_currentViews` (which are React child
 * views), and compares them to `_navigationController.viewControllers` (which
 * are controlled by UIKit).
 *
 * It is possible for JavaScript (`_currentViews`) to "get ahead" of native
 * (`navigationController.viewControllers`) and vice versa. JavaScript gets
 * ahead by adding/removing React subviews. Native gets ahead by swiping back,
 * or tapping the back button. In both cases, the other system is initially
 * unaware. And in both cases, `RCTNavigator` helps the other side "catch up".
 *
 * If `RCTNavigator` sees the number of react children have changed, it
 * pushes/pops accordingly. If `RCTNavigator` sees a `UIKit` driven push/pop, it
 * notifies JavaScript that this has happened, and expects that JavaScript will
 * eventually render more children to match `UIKit`. There's no rush for
 * JavaScript to catch up. But if it does rener anything, it must catch up to
 * UIKit. It cannot deviate.
 *
 * To implement this, we need a lock, which we store on the native thread. This
 * lock allows one of the systems to push/pop views. Whoever wishes to
 * "get ahead" must obtain the lock. Whoever wishes to "catch up" must obtain
 * the lock. One thread may not "get ahead" or "catch up" when the other has
 * the lock. Once a thread has the lock, it can only do the following:
 *
 * 1. If it is behind, it may only catch up.
 * 2. If it is caught up or ahead, it may push or pop.
 *
 *
 * ========= Acquiring The Lock ==========
 *
 * JavaScript asynchronously acquires the lock using a native hook. It might be
 * rejected and receive the return value `false`.
 *
 * We acquire the native lock in `shouldPopItem`, which is called right before
 * native tries to push/pop, but only if JavaScript doesn't already have the
 * lock.
 *
 * ========  While JavaScript Has Lock ====
 *
 * When JavaScript has the lock, we have to block all `UIKit` driven pops:
 *
 * 1. Block back button navigation:
 *   - Back button will invoke `shouldPopItem`, from which we return `NO` if
 *   JavaScript has the lock.
 *   - Back button will respect the return value `NO` and not permit
 *   navigation.
 *
 * 2. Block swipe-to-go-back navigation:
 *   - Swipe will trigger `shouldPopItem`, but swipe won't respect our `NO`
 *   return value so we must disable the gesture recognizer while JavaScript
 *   has the lock.
 *
 * ========  While Native Has Lock =======
 *
 * We simply deny JavaScript the right to acquire the lock.
 *
 *
 * ======== Releasing The Lock ===========
 *
 * Recall that the lock represents who has the right to either push/pop (or
 * catch up). As soon as we recognize that the side that has locked has carried
 * out what it scheduled to do, we can release the lock, but only after any
 * possible animations are completed.
 *
 * *IF* a scheduled operation results in a push/pop (not all do), then we can
 * only release the lock after the push/pop animation is complete because
 * UIKit. `didMoveToNavigationController` is invoked when the view is done
 * pushing/popping/animating. Native swipe-to-go-back interactions can be
 * aborted, however, and you'll never see that method invoked. So just to cover
 * that case, we also put an animation complete hook in
 * `animateAlongsideTransition` to make sure we free the lock, in case the
 * scheduled native push/pop never actually happened.
 *
 * For JavaScript:
 * - When we see that JavaScript has "caught up" to `UIKit`, and no pushes/pops
 * were needed, we can release the lock.
 * - When we see that JavaScript requires *some* push/pop, it's not yet done
 * carrying out what it scheduled to do. Just like with `UIKit` push/pops, we
 * still have to wait for it to be done animating
 * (`didMoveToNavigationController` is a suitable hook).
 *
 */
@implementation RCTNavigationController

/**
 * @param callback Callback that is invoked when a "scroll" interaction begins
 * so that `RCTNavigator` can notify `JavaScript`.
 */
- (instancetype)initWithScrollCallback:(dispatch_block_t)callback
{
  if ((self = [super initWithNibName:nil bundle:nil])) {
    _scrollCallback = callback;
  }
  return self;
}

/**
 * Invoked when either a navigation item has been popped off, or when a
 * swipe-back gesture has began. The swipe-back gesture doesn't respect the
 * return value of this method. The back button does. That's why we have to
 * completely disable the gesture recognizer for swipe-back while JS has the
 * lock.
 */
- (BOOL)navigationBar:(UINavigationBar *)navigationBar shouldPopItem:(UINavigationItem *)item
{
  if (self.interactivePopGestureRecognizer.state == UIGestureRecognizerStateBegan) {
    if (self.navigationLock == RCTNavigationLockNone) {
      self.navigationLock = RCTNavigationLockNative;
      if (_scrollCallback) {
        _scrollCallback();
      }
    } else if (self.navigationLock == RCTNavigationLockJavaScript) {
      // This should never happen because we disable/enable the gesture
      // recognizer when we lock the navigation.
      RCTAssert(NO, @"Should never receive gesture start while JS locks navigator");
    }
  } else {
    if (self.navigationLock == RCTNavigationLockNone) {
      // Must be coming from native interaction, lock it - it will be unlocked
      // in `didMoveToNavigationController`
      self.navigationLock = RCTNavigationLockNative;
      if (_scrollCallback) {
        _scrollCallback();
      }
    } else if (self.navigationLock == RCTNavigationLockJavaScript) {
      // This should only occur when JS has the lock, and
      // - JS is driving the pop
      // - Or the back button was pressed
      // TODO: We actually want to disable the backbutton while JS has the
      // lock, but it's not so easy. Even returning `NO` wont' work because it
      // will also block JS driven pops. We simply need to disallow a standard
      // back button, and instead use a custom one that tells JS to pop to
      // length (`currentReactCount` - 1).
      return [super navigationBar:navigationBar shouldPopItem:item];
    }
  }
  return [super navigationBar:navigationBar shouldPopItem:item];
}

@end

@interface RCTNavigator() <RCTWrapperViewControllerNavigationListener, UINavigationControllerDelegate>

@property (nonatomic, assign) NSInteger previousRequestedTopOfStack;

// Previous views are only mainted in order to detect incorrect
// addition/removal of views below the `requestedTopOfStack`
@property (nonatomic, copy, readwrite) NSArray *previousViews;
@property (nonatomic, readwrite, strong) NSMutableArray *currentViews;
@property (nonatomic, readwrite, strong) RCTNavigationController *navigationController;
/**
 * Display link is used to get high frequency sample rate during
 * interaction/animation of view controller push/pop.
 *
 * - The run loop retains the displayLink.
 * - `displayLink` retains its target.
 * - We use `invalidate` to remove the `RCTNavigator`'s reference to the
 * `displayLink` and remove the `displayLink` from the run loop.
 *
 *
 * `displayLink`:
 * --------------
 *
 * - Even though we could implement the `displayLink` cleanup without the
 * `invalidate` hook by adding and removing it from the run loop at the
 * right times (begin/end animation), we need to account for the possibility
 * that the view itself is destroyed mid-interaction. So we always keep it
 * added to the run loop, but start/stop it with interactions/animations. We
 * remove it from the run loop when the view will be destroyed by React.
 *
 * +----------+              +--------------+
 * | run loop o----strong--->|  displayLink |
 * +----------+              +--o-----------+
 *                              |        ^
 *                              |        |
 *                            strong   strong
 *                              |        |
 *                              v        |
 *                             +---------o---+
 *                             | RCTNavigator |
 *                             +-------------+
 *
 * `dummyView`:
 * ------------
 * There's no easy way to get a callback that fires when the position of a
 * navigation item changes. The actual layers that are moved around during the
 * navigation transition are private. Our only hope is to use
 * `animateAlongsideTransition`, to set a dummy view's position to transition
 * anywhere from -1.0 to 1.0. We later set up a `CADisplayLink` to poll the
 * `presentationLayer` of that dummy view and report the value as a "progress"
 * percentage.
 *
 * It was critical that we added the dummy view as a subview of the
 * transitionCoordinator's `containerView`, otherwise the animations would not
 * work correctly when reversing the gesture direction etc. This seems to be
 * undocumented behavior/requirement.
 *
 */
@property (nonatomic, readonly, assign) CGFloat mostRecentProgress;
@property (nonatomic, readonly, strong) NSTimer *runTimer;
@property (nonatomic, readonly, assign) NSInteger currentlyTransitioningFrom;
@property (nonatomic, readonly, assign) NSInteger currentlyTransitioningTo;

// Dummy view that we make animate with the same curve/interaction as the
// navigation animation/interaction.
@property (nonatomic, readonly, strong) UIView *dummyView;

@end

@implementation RCTNavigator
{
  __weak RCTBridge *_bridge;
  NSInteger _numberOfViewControllerMovesToIgnore;
}

- (id)initWithBridge:(RCTBridge *)bridge
{
  if ((self = [super initWithFrame:CGRectZero])) {
    _bridge = bridge;
    _mostRecentProgress = kNeverProgressed;
    _dummyView = [[UIView alloc] initWithFrame:CGRectZero];
    _previousRequestedTopOfStack = kNeverRequested; // So that we initialize with a push.
    _previousViews = @[];
    _currentViews = [[NSMutableArray alloc] initWithCapacity:0];
    __weak RCTNavigator *weakSelf = self;
    _navigationController = [[RCTNavigationController alloc] initWithScrollCallback:^{
      [weakSelf dispatchFakeScrollEvent];
    }];
    _navigationController.delegate = self;
    RCTAssert([self requestSchedulingJavaScriptNavigation], @"Could not acquire JS navigation lock on init");

    [self addSubview:_navigationController.view];
    [_navigationController.view addSubview:_dummyView];
  }
  return self;
}

- (void)didUpdateFrame:(RCTFrameUpdate *)update
{
  if (_currentlyTransitioningFrom != _currentlyTransitioningTo) {
    UIView *topView = _dummyView;
    id presentationLayer = [topView.layer presentationLayer];
    CGRect frame = [presentationLayer frame];
    CGFloat nextProgress = ABS(frame.origin.x);
    // Don't want to spam the bridge, when the user holds their finger still mid-navigation.
    if (nextProgress == _mostRecentProgress) {
      return;
    }
    _mostRecentProgress = nextProgress;
    [_bridge.eventDispatcher sendInputEventWithName:@"topNavigationProgress" body:@{
      @"fromIndex": @(_currentlyTransitioningFrom),
      @"toIndex": @(_currentlyTransitioningTo),
      @"progress": @(nextProgress),
      @"target": self.reactTag
    }];
  }
}

- (void)dealloc
{
  _navigationController.delegate = nil;
}

- (UIViewController *)backingViewController
{
  return _navigationController;
}

/**
 * See documentation about lock lifecycle. This is only here to clean up
 * swipe-back abort interaction, which leaves us *no* other way to clean up
 * locks aside from the animation complete hook.
 */
- (void)navigationController:(UINavigationController *)navigationController
      willShowViewController:(UIViewController *)viewController
                    animated:(BOOL)animated
{
  id<UIViewControllerTransitionCoordinator> tc =
    navigationController.topViewController.transitionCoordinator;
  __weak RCTNavigator *weakSelf = self;
  [tc.containerView addSubview: _dummyView];
  [tc animateAlongsideTransition: ^(id<UIViewControllerTransitionCoordinatorContext> context) {
    RCTWrapperViewController *fromController =
      (RCTWrapperViewController *)[context viewControllerForKey:UITransitionContextFromViewControllerKey];
    RCTWrapperViewController *toController =
      (RCTWrapperViewController *)[context viewControllerForKey:UITransitionContextToViewControllerKey];
    NSUInteger indexOfFrom = [_currentViews indexOfObject:fromController.navItem];
    NSUInteger indexOfTo = [_currentViews indexOfObject:toController.navItem];
    CGFloat destination = indexOfFrom < indexOfTo ? 1.0 : -1.0;
    _dummyView.frame = (CGRect){{destination}};
    _currentlyTransitioningFrom = indexOfFrom;
    _currentlyTransitioningTo = indexOfTo;
    [_bridge addFrameUpdateObserver:self];
  }
  completion:^(id<UIViewControllerTransitionCoordinatorContext> context) {
    [weakSelf freeLock];
    _currentlyTransitioningFrom = 0;
    _currentlyTransitioningTo = 0;
    _dummyView.frame = CGRectZero;
    [_bridge removeFrameUpdateObserver:self];
    // Reset the parallel position tracker
  }];
}

- (BOOL)requestSchedulingJavaScriptNavigation
{
  if (_navigationController.navigationLock == RCTNavigationLockNone) {
    _navigationController.navigationLock = RCTNavigationLockJavaScript;
    _navigationController.interactivePopGestureRecognizer.enabled = NO;
    return YES;
  }
  return NO;
}

- (void)freeLock
{
  _navigationController.navigationLock = RCTNavigationLockNone;
  _navigationController.interactivePopGestureRecognizer.enabled = YES;
}

/**
 * A React subview can be inserted/removed at any time, however if the
 * `requestedTopOfStack` changes, there had better be enough subviews present
 * to satisfy the push/pop.
 */
- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  RCTAssert([view isKindOfClass:[RCTNavItem class]], @"RCTNavigator only accepts RCTNavItem subviews");
  RCTAssert(
    _navigationController.navigationLock == RCTNavigationLockJavaScript,
    @"Cannot change subviews from JS without first locking."
  );
  [_currentViews insertObject:view atIndex:atIndex];
}

- (NSArray *)reactSubviews
{
  return _currentViews;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  _navigationController.view.frame = self.bounds;
}

- (void)removeReactSubview:(UIView *)subview
{
  if (_currentViews.count <= 0 || subview == _currentViews[0]) {
    RCTLogError(@"Attempting to remove invalid RCT subview of RCTNavigator");
    return;
  }
  [_currentViews removeObject:subview];
}

- (void)handleTopOfStackChanged
{
  [_bridge.eventDispatcher sendInputEventWithName:@"topNavigateBack" body:@{
    @"target":self.reactTag,
    @"stackLength":@(_navigationController.viewControllers.count)
  }];
}

- (void)dispatchFakeScrollEvent
{
  [_bridge.eventDispatcher sendScrollEventWithType:RCTScrollEventTypeMove
                                   reactTag:self.reactTag
                                 scrollView:nil
                                   userData:nil];
}

/**
 * Must be overridden because UIKit removes the view's superview when used
 * as a navigator - it's considered outside the view hierarchy.
 */
- (UIView *)reactSuperview
{
  RCTAssert(self.superview != nil, @"put reactNavSuperviewLink back");
  return self.superview ? self.superview : self.reactNavSuperviewLink;
}

- (void)reactBridgeDidFinishTransaction
{
  // we can't hook up the VC hierarchy in 'init' because the subviews aren't
  // hooked up yet, so we do it on demand here
  [self addControllerToClosestParent:_navigationController];

  NSInteger viewControllerCount = _navigationController.viewControllers.count;
  // The "react count" is the count of views that are visible on the navigation
  // stack.  There may be more beyond this - that aren't visible, and may be
  // deleted/purged soon.
  NSInteger previousReactCount =
    _previousRequestedTopOfStack == kNeverRequested ? 0 : _previousRequestedTopOfStack + 1;
  NSInteger currentReactCount = _requestedTopOfStack + 1;

  BOOL jsGettingAhead =
    //    ----- previously caught up ------          ------ no longer caught up -------
    viewControllerCount == previousReactCount && currentReactCount != viewControllerCount;
  BOOL jsCatchingUp =
    //    --- previously not caught up ----          --------- now caught up ----------
    viewControllerCount != previousReactCount && currentReactCount == viewControllerCount;
  BOOL jsMakingNoProgressButNeedsToCatchUp =
    //    --- previously not caught up ----          ------- still the same -----------
    viewControllerCount != previousReactCount && currentReactCount == previousReactCount;
  BOOL jsMakingNoProgressAndDoesntNeedTo =
    //    --- previously caught up --------          ------- still caught up ----------
    viewControllerCount == previousReactCount && currentReactCount == previousReactCount;

  BOOL reactPushOne = jsGettingAhead && currentReactCount == previousReactCount + 1;
  BOOL reactPopN = jsGettingAhead && currentReactCount < previousReactCount;

  // We can actually recover from this situation, but it would be nice to know
  // when this error happens. This simply means that JS hasn't caught up to a
  // back navigation before progressing. It's likely a bug in the JS code that
  // catches up/schedules navigations.
  if (!(jsGettingAhead ||
        jsCatchingUp ||
        jsMakingNoProgressButNeedsToCatchUp ||
        jsMakingNoProgressAndDoesntNeedTo)) {
    RCTLogError(@"JS has only made partial progress to catch up to UIKit");
  }
  if (currentReactCount > _currentViews.count) {
    RCTLogError(@"Cannot adjust current top of stack beyond available views");
  }

  // Views before the previous react count must not have changed. Views greater than previousReactCount
  // up to currentReactCount may have changed.
  for (NSInteger i = 0; i < MIN(_currentViews.count, MIN(_previousViews.count, previousReactCount)); i++) {
    if (_currentViews[i] != _previousViews[i]) {
      RCTLogError(@"current view should equal previous view");
    }
  }
  if (currentReactCount < 1) {
    RCTLogError(@"should be at least one current view");
  }
  if (jsGettingAhead) {
    if (reactPushOne) {
      UIView *lastView = [_currentViews lastObject];
      RCTWrapperViewController *vc = [[RCTWrapperViewController alloc] initWithNavItem:(RCTNavItem *)lastView eventDispatcher:_bridge.eventDispatcher];
      vc.navigationListener = self;
      _numberOfViewControllerMovesToIgnore = 1;
      [_navigationController pushViewController:vc animated:(currentReactCount > 1)];
    } else if (reactPopN) {
      UIViewController *viewControllerToPopTo = [[_navigationController viewControllers] objectAtIndex:(currentReactCount - 1)];
      _numberOfViewControllerMovesToIgnore = viewControllerCount - currentReactCount;
      [_navigationController popToViewController:viewControllerToPopTo animated:YES];
    } else {
      RCTLogError(@"Pushing or popping more than one view at a time from JS");
    }
  } else if (jsCatchingUp) {
    [self freeLock]; // Nothing to push/pop
  } else {
    // Else, JS making no progress, could have been unrelated to anything nav.
    return;
  }

  _previousViews = [_currentViews copy];
  _previousRequestedTopOfStack = _requestedTopOfStack;
}

// TODO: This will likely fail when performing multiple pushes/pops. We must
// free the lock only after the *last* push/pop.
- (void)wrapperViewController:(RCTWrapperViewController *)wrapperViewController
didMoveToNavigationController:(UINavigationController *)navigationController
{
  if (self.superview == nil) {
    // If superview is nil, then a JS reload (Cmd+R) happened
    // while a push/pop is in progress.
    return;
  }

  RCTAssert(
    (navigationController == nil || [_navigationController.viewControllers containsObject:wrapperViewController]),
    @"if navigation controller is not nil, it should contain the wrapper view controller"
  );
  RCTAssert(_navigationController.navigationLock == RCTNavigationLockJavaScript ||
           _numberOfViewControllerMovesToIgnore == 0,
           @"If JS doesn't have the lock there should never be any pending transitions");
  /**
   * When JS has the lock we want to keep track of when the request completes
   * the pending transition count hitting 0 signifies this, and should always
   * remain at 0 when JS does not have the lock
   */
  if (_numberOfViewControllerMovesToIgnore > 0) {
    _numberOfViewControllerMovesToIgnore -= 1;
  }
  if (_numberOfViewControllerMovesToIgnore == 0) {
    [self handleTopOfStackChanged];
    [self freeLock];
  }
}

@end
