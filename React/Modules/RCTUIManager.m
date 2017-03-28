/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTUIManager.h"

#import <AVFoundation/AVFoundation.h>

#import <yoga/Yoga.h>

#import "RCTAccessibilityManager.h"
#import "RCTAnimationType.h"
#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTBridge.h"
#import "RCTComponent.h"
#import "RCTComponentData.h"
#import "RCTConvert.h"
#import "RCTDefines.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTModuleData.h"
#import "RCTModuleMethod.h"
#import "RCTProfile.h"
#import "RCTRootContentView.h"
#import "RCTRootShadowView.h"
#import "RCTRootViewInternal.h"
#import "RCTScrollableProtocol.h"
#import "RCTShadowView.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "RCTViewManager.h"
#import "UIView+React.h"

static void RCTTraverseViewNodes(id<RCTComponent> view, void (^block)(id<RCTComponent>))
{
  if (view.reactTag) {
    block(view);

    for (id<RCTComponent> subview in view.reactSubviews) {
      RCTTraverseViewNodes(subview, block);
    }
  }
}

char *const RCTUIManagerQueueName = "com.facebook.react.ShadowQueue";
NSString *const RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification = @"RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification";
NSString *const RCTUIManagerDidRegisterRootViewNotification = @"RCTUIManagerDidRegisterRootViewNotification";
NSString *const RCTUIManagerDidRemoveRootViewNotification = @"RCTUIManagerDidRemoveRootViewNotification";
NSString *const RCTUIManagerRootViewKey = @"RCTUIManagerRootViewKey";

@interface RCTAnimation : NSObject

@property (nonatomic, readonly) NSTimeInterval duration;
@property (nonatomic, readonly) NSTimeInterval delay;
@property (nonatomic, readonly, copy) NSString *property;
@property (nonatomic, readonly) CGFloat springDamping;
@property (nonatomic, readonly) CGFloat initialVelocity;
@property (nonatomic, readonly) RCTAnimationType animationType;

@end

static UIViewAnimationCurve _currentKeyboardAnimationCurve;

@implementation RCTAnimation

static UIViewAnimationOptions UIViewAnimationOptionsFromRCTAnimationType(RCTAnimationType type)
{
  switch (type) {
    case RCTAnimationTypeLinear:
      return UIViewAnimationOptionCurveLinear;
    case RCTAnimationTypeEaseIn:
      return UIViewAnimationOptionCurveEaseIn;
    case RCTAnimationTypeEaseOut:
      return UIViewAnimationOptionCurveEaseOut;
    case RCTAnimationTypeEaseInEaseOut:
      return UIViewAnimationOptionCurveEaseInOut;
    case RCTAnimationTypeKeyboard:
      // http://stackoverflow.com/questions/18870447/how-to-use-the-default-ios7-uianimation-curve
      return (UIViewAnimationOptions)(_currentKeyboardAnimationCurve << 16);
    default:
      RCTLogError(@"Unsupported animation type %zd", type);
      return UIViewAnimationOptionCurveEaseInOut;
  }
}

// Use a custom initialization function rather than implementing `+initialize` so that we can control
// when the initialization code runs. `+initialize` runs immediately before the first message is sent
// to the class which may be too late for us. By this time, we may have missed some
// `UIKeyboardWillChangeFrameNotification`s.
+ (void)initializeStatics
{
#if !TARGET_OS_TV
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(keyboardWillChangeFrame:)
                                                name:UIKeyboardWillChangeFrameNotification
                                               object:nil];
  });
#endif
}

+ (void)keyboardWillChangeFrame:(NSNotification *)notification
{
#if !TARGET_OS_TV
  NSDictionary *userInfo = notification.userInfo;
  _currentKeyboardAnimationCurve = [userInfo[UIKeyboardAnimationCurveUserInfoKey] integerValue];
#endif
}

- (instancetype)initWithDuration:(NSTimeInterval)duration dictionary:(NSDictionary *)config
{
  if (!config) {
    return nil;
  }

  if ((self = [super init])) {
    _property = [RCTConvert NSString:config[@"property"]];

    _duration = [RCTConvert NSTimeInterval:config[@"duration"]] ?: duration;
    if (_duration > 0.0 && _duration < 0.01) {
      RCTLogError(@"RCTLayoutAnimation expects timings to be in ms, not seconds.");
      _duration = _duration * 1000.0;
    }

    _delay = [RCTConvert NSTimeInterval:config[@"delay"]];
    if (_delay > 0.0 && _delay < 0.01) {
      RCTLogError(@"RCTLayoutAnimation expects timings to be in ms, not seconds.");
      _delay = _delay * 1000.0;
    }

    _animationType = [RCTConvert RCTAnimationType:config[@"type"]];
    if (_animationType == RCTAnimationTypeSpring) {
      _springDamping = [RCTConvert CGFloat:config[@"springDamping"]];
      _initialVelocity = [RCTConvert CGFloat:config[@"initialVelocity"]];
    }
  }
  return self;
}

- (void)performAnimations:(void (^)(void))animations
      withCompletionBlock:(void (^)(BOOL completed))completionBlock
{
  if (_animationType == RCTAnimationTypeSpring) {

    [UIView animateWithDuration:_duration
                          delay:_delay
         usingSpringWithDamping:_springDamping
          initialSpringVelocity:_initialVelocity
                        options:UIViewAnimationOptionBeginFromCurrentState
                     animations:animations
                     completion:completionBlock];

  } else {

    UIViewAnimationOptions options = UIViewAnimationOptionBeginFromCurrentState |
      UIViewAnimationOptionsFromRCTAnimationType(_animationType);

    [UIView animateWithDuration:_duration
                          delay:_delay
                        options:options
                     animations:animations
                     completion:completionBlock];
  }
}

@end

@interface RCTLayoutAnimation : NSObject

@property (nonatomic, copy) NSDictionary *config;
@property (nonatomic, strong) RCTAnimation *createAnimation;
@property (nonatomic, strong) RCTAnimation *updateAnimation;
@property (nonatomic, strong) RCTAnimation *deleteAnimation;
@property (nonatomic, copy) RCTResponseSenderBlock callback;

@end

@implementation RCTLayoutAnimation

- (instancetype)initWithDictionary:(NSDictionary *)config callback:(RCTResponseSenderBlock)callback
{
  if (!config) {
    return nil;
  }

  if ((self = [super init])) {
    _config = [config copy];
    NSTimeInterval duration = [RCTConvert NSTimeInterval:config[@"duration"]];
    if (duration > 0.0 && duration < 0.01) {
      RCTLogError(@"RCTLayoutAnimation expects timings to be in ms, not seconds.");
      duration = duration * 1000.0;
    }

    _createAnimation = [[RCTAnimation alloc] initWithDuration:duration dictionary:config[@"create"]];
    _updateAnimation = [[RCTAnimation alloc] initWithDuration:duration dictionary:config[@"update"]];
    _deleteAnimation = [[RCTAnimation alloc] initWithDuration:duration dictionary:config[@"delete"]];
    _callback = callback;
  }
  return self;
}

@end

@implementation RCTUIManager
{
  // Root views are only mutated on the shadow queue
  NSMutableSet<NSNumber *> *_rootViewTags;
  NSMutableArray<RCTViewManagerUIBlock> *_pendingUIBlocks;

  // Animation
  RCTLayoutAnimation *_layoutAnimation; // Main thread only
  NSMutableSet<UIView *> *_viewsToBeDeleted; // Main thread only

  NSMutableDictionary<NSNumber *, RCTShadowView *> *_shadowViewRegistry; // RCT thread only
  NSMutableDictionary<NSNumber *, UIView *> *_viewRegistry; // Main thread only

  // Keyed by viewName
  NSDictionary *_componentDataByName;

  NSMutableSet<id<RCTComponent>> *_bridgeTransactionListeners;
  NSMutableSet<id<RCTUIManagerObserver>> *_uiManagerObservers;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (void)didReceiveNewContentSizeMultiplier
{
  // Report the event across the bridge.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_bridge.eventDispatcher sendDeviceEventWithName:@"didUpdateContentSizeMultiplier"
                                              body:@([_bridge.accessibilityManager multiplier])];
#pragma clang diagnostic pop

  dispatch_async(RCTGetUIManagerQueue(), ^{
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification
                                                        object:self];
    [self setNeedsLayout];
  });
}

- (void)invalidate
{
  /**
   * Called on the JS Thread since all modules are invalidated on the JS thread
   */

  // This only accessed from the shadow queue
  _pendingUIBlocks = nil;

  dispatch_async(dispatch_get_main_queue(), ^{
    RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"UIManager invalidate", nil);
    for (NSNumber *rootViewTag in self->_rootViewTags) {
      [(id<RCTInvalidating>)self->_viewRegistry[rootViewTag] invalidate];
    }

    self->_rootViewTags = nil;
    self->_shadowViewRegistry = nil;
    self->_viewRegistry = nil;
    self->_bridgeTransactionListeners = nil;
    self->_bridge = nil;

    [[NSNotificationCenter defaultCenter] removeObserver:self];
    RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
  });
}

- (NSMutableDictionary<NSNumber *, RCTShadowView *> *)shadowViewRegistry
{
  // NOTE: this method only exists so that it can be accessed by unit tests
  if (!_shadowViewRegistry) {
    _shadowViewRegistry = [NSMutableDictionary new];
  }
  return _shadowViewRegistry;
}

- (NSMutableDictionary<NSNumber *, UIView *> *)viewRegistry
{
  // NOTE: this method only exists so that it can be accessed by unit tests
  if (!_viewRegistry) {
    _viewRegistry = [NSMutableDictionary new];
  }
  return _viewRegistry;
}

- (void)setBridge:(RCTBridge *)bridge
{
  RCTAssert(_bridge == nil, @"Should not re-use same UIIManager instance");

  _bridge = bridge;

  _shadowViewRegistry = [NSMutableDictionary new];
  _viewRegistry = [NSMutableDictionary new];

  // Internal resources
  _pendingUIBlocks = [NSMutableArray new];
  _rootViewTags = [NSMutableSet new];

  _bridgeTransactionListeners = [NSMutableSet new];
  _uiManagerObservers = [NSMutableSet new];

  _viewsToBeDeleted = [NSMutableSet new];

  // Get view managers from bridge
  NSMutableDictionary *componentDataByName = [NSMutableDictionary new];
  for (Class moduleClass in _bridge.moduleClasses) {
    if ([moduleClass isSubclassOfClass:[RCTViewManager class]]) {
      RCTComponentData *componentData = [[RCTComponentData alloc] initWithManagerClass:moduleClass
                                                                                bridge:_bridge];
      componentDataByName[componentData.name] = componentData;
    }
  }

  _componentDataByName = [componentDataByName copy];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveNewContentSizeMultiplier)
                                               name:RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:_bridge.accessibilityManager];
  [RCTAnimation initializeStatics];
}

dispatch_queue_t RCTGetUIManagerQueue(void)
{
  static dispatch_queue_t shadowQueue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    if ([NSOperation instancesRespondToSelector:@selector(qualityOfService)]) {
      dispatch_queue_attr_t attr = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INTERACTIVE, 0);
      shadowQueue = dispatch_queue_create(RCTUIManagerQueueName, attr);
    } else {
      shadowQueue = dispatch_queue_create(RCTUIManagerQueueName, DISPATCH_QUEUE_SERIAL);
      dispatch_set_target_queue(shadowQueue, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0));
    }
  });
  return shadowQueue;
}

- (dispatch_queue_t)methodQueue
{
  return RCTGetUIManagerQueue();
}

- (void)registerRootView:(RCTRootContentView *)rootView
{
  RCTAssertMainQueue();

  NSNumber *reactTag = rootView.reactTag;
  RCTAssert(RCTIsReactRootView(reactTag),
            @"View %@ with tag #%@ is not a root view", rootView, reactTag);

  UIView *existingView = _viewRegistry[reactTag];
  RCTAssert(existingView == nil || existingView == rootView,
            @"Expect all root views to have unique tag. Added %@ twice", reactTag);

  CGSize availableSize = rootView.availableSize;

  // Register view
  _viewRegistry[reactTag] = rootView;

  // Register shadow view
  dispatch_async(RCTGetUIManagerQueue(), ^{
    if (!self->_viewRegistry) {
      return;
    }

    RCTRootShadowView *shadowView = [RCTRootShadowView new];
    shadowView.availableSize = availableSize;
    shadowView.reactTag = reactTag;
    shadowView.backgroundColor = rootView.backgroundColor;
    shadowView.viewName = NSStringFromClass([rootView class]);
    self->_shadowViewRegistry[shadowView.reactTag] = shadowView;
    [self->_rootViewTags addObject:reactTag];
  });

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTUIManagerDidRegisterRootViewNotification
                                                      object:self
                                                    userInfo:@{RCTUIManagerRootViewKey: rootView}];
}

- (NSString *)viewNameForReactTag:(NSNumber *)reactTag
{
  RCTAssertThread(RCTGetUIManagerQueue(), @"viewNameForReactTag can only be called from the shadow queue");
  return _shadowViewRegistry[reactTag].viewName;
}

- (UIView *)viewForReactTag:(NSNumber *)reactTag
{
  RCTAssertMainQueue();
  return _viewRegistry[reactTag];
}

- (void)setAvailableSize:(CGSize)availableSize forRootView:(UIView *)rootView
{
  RCTAssertMainQueue();
  NSNumber *reactTag = rootView.reactTag;
  dispatch_async(RCTGetUIManagerQueue(), ^{
    RCTRootShadowView *shadowView = (RCTRootShadowView *)self->_shadowViewRegistry[reactTag];
    RCTAssert(shadowView != nil, @"Could not locate shadow view with tag #%@", reactTag);
    RCTAssert([shadowView isKindOfClass:[RCTRootShadowView class]], @"Located shadow view (with tag #%@) is actually not root view.", reactTag);

    if (CGSizeEqualToSize(availableSize, shadowView.availableSize)) {
      return;
    }

    shadowView.availableSize = availableSize;
    [self setNeedsLayout];
  });
}

- (void)setSize:(CGSize)size forView:(UIView *)view
{
  RCTAssertMainQueue();

  NSNumber *reactTag = view.reactTag;
  dispatch_async(RCTGetUIManagerQueue(), ^{
    RCTShadowView *shadowView = self->_shadowViewRegistry[reactTag];
    RCTAssert(shadowView != nil, @"Could not locate shadow view with tag #%@", reactTag);

    if (CGSizeEqualToSize(size, shadowView.size)) {
      return;
    }

    shadowView.size = size;
    [self setNeedsLayout];
  });
}

- (void)setIntrinsicContentSize:(CGSize)size forView:(UIView *)view
{
  RCTAssertMainQueue();

  NSNumber *reactTag = view.reactTag;
  dispatch_async(RCTGetUIManagerQueue(), ^{
    RCTShadowView *shadowView = self->_shadowViewRegistry[reactTag];
    RCTAssert(shadowView != nil, @"Could not locate view with tag #%@", reactTag);

    if (!CGSizeEqualToSize(shadowView.intrinsicContentSize, size)) {
      shadowView.intrinsicContentSize = size;
      [self setNeedsLayout];
    }
  });
}

- (void)setBackgroundColor:(UIColor *)color forView:(UIView *)view
{
  RCTAssertMainQueue();

  NSNumber *reactTag = view.reactTag;
  dispatch_async(RCTGetUIManagerQueue(), ^{
    if (!self->_viewRegistry) {
      return;
    }

    RCTShadowView *shadowView = self->_shadowViewRegistry[reactTag];
    RCTAssert(shadowView != nil, @"Could not locate root view with tag #%@", reactTag);
    shadowView.backgroundColor = color;
    [self _amendPendingUIBlocksWithStylePropagationUpdateForShadowView:shadowView];
    [self flushUIBlocks];
  });
}

/**
 * Unregisters views from registries
 */
- (void)_purgeChildren:(NSArray<id<RCTComponent>> *)children
          fromRegistry:(NSMutableDictionary<NSNumber *, id<RCTComponent>> *)registry
{
  for (id<RCTComponent> child in children) {
    RCTTraverseViewNodes(registry[child.reactTag], ^(id<RCTComponent> subview) {
      RCTAssert(![subview isReactRootView], @"Root views should not be unregistered");
      if ([subview conformsToProtocol:@protocol(RCTInvalidating)]) {
        [(id<RCTInvalidating>)subview invalidate];
      }
      [registry removeObjectForKey:subview.reactTag];

      if (registry == (NSMutableDictionary<NSNumber *, id<RCTComponent>> *)self->_viewRegistry) {
        [self->_bridgeTransactionListeners removeObject:subview];
      }
    });
  }
}

- (void)addUIBlock:(RCTViewManagerUIBlock)block
{
  RCTAssertThread(RCTGetUIManagerQueue(),
                  @"-[RCTUIManager addUIBlock:] should only be called from the "
                  "UIManager's queue (get this using `RCTGetUIManagerQueue()`)");

  if (!block || !_viewRegistry) {
    return;
  }

  [_pendingUIBlocks addObject:block];
}

- (void)prependUIBlock:(RCTViewManagerUIBlock)block
{
  RCTAssertThread(RCTGetUIManagerQueue(),
                  @"-[RCTUIManager prependUIBlock:] should only be called from the "
                  "UIManager's queue (get this using `RCTGetUIManagerQueue()`)");

  if (!block || !_viewRegistry) {
    return;
  }

  [_pendingUIBlocks insertObject:block atIndex:0];
}

- (RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(RCTRootShadowView *)rootShadowView
{
  RCTAssert(!RCTIsMainQueue(), @"Should be called on shadow queue");

  // This is nuanced. In the JS thread, we create a new update buffer
  // `frameTags`/`frames` that is created/mutated in the JS thread. We access
  // these structures in the UI-thread block. `NSMutableArray` is not thread
  // safe so we rely on the fact that we never mutate it after it's passed to
  // the main thread.
  NSSet<RCTShadowView *> *viewsWithNewFrames = [rootShadowView collectViewsWithUpdatedFrames];

  if (!viewsWithNewFrames.count) {
    // no frame change results in no UI update block
    return nil;
  }

  typedef struct {
    CGRect frame;
    UIUserInterfaceLayoutDirection layoutDirection;
    BOOL isNew;
    BOOL parentIsNew;
    BOOL isHidden;
  } RCTFrameData;

  // Construct arrays then hand off to main thread
  NSUInteger count = viewsWithNewFrames.count;
  NSMutableArray *reactTags = [[NSMutableArray alloc] initWithCapacity:count];
  NSMutableData *framesData = [[NSMutableData alloc] initWithLength:sizeof(RCTFrameData) * count];
  {
    NSUInteger index = 0;
    RCTFrameData *frameDataArray = (RCTFrameData *)framesData.mutableBytes;
    for (RCTShadowView *shadowView in viewsWithNewFrames) {
      reactTags[index] = shadowView.reactTag;
      frameDataArray[index++] = (RCTFrameData){
        shadowView.frame,
        shadowView.effectiveLayoutDirection,
        shadowView.isNewView,
        shadowView.superview.isNewView,
        shadowView.isHidden,
      };
    }
  }

  // These are blocks to be executed on each view, immediately after
  // reactSetFrame: has been called. Note that if reactSetFrame: is not called,
  // these won't be called either, so this is not a suitable place to update
  // properties that aren't related to layout.
  NSMutableDictionary<NSNumber *, RCTViewManagerUIBlock> *updateBlocks =
  [NSMutableDictionary new];
  for (RCTShadowView *shadowView in viewsWithNewFrames) {

    // We have to do this after we build the parentsAreNew array.
    shadowView.newView = NO;

    NSNumber *reactTag = shadowView.reactTag;
    RCTViewManager *manager = [_componentDataByName[shadowView.viewName] manager];
    RCTViewManagerUIBlock block = [manager uiBlockToAmendWithShadowView:shadowView];
    if (block) {
      updateBlocks[reactTag] = block;
    }

    if (shadowView.onLayout) {
      CGRect frame = shadowView.frame;
      shadowView.onLayout(@{
        @"layout": @{
          @"x": @(frame.origin.x),
          @"y": @(frame.origin.y),
          @"width": @(frame.size.width),
          @"height": @(frame.size.height),
        },
      });
    }

    if (RCTIsReactRootView(reactTag)) {
      CGSize contentSize = shadowView.frame.size;

      dispatch_async(dispatch_get_main_queue(), ^{
        UIView *view = self->_viewRegistry[reactTag];
        RCTAssert(view != nil, @"view (for ID %@) not found", reactTag);

        RCTRootView *rootView = (RCTRootView *)[view superview];
        rootView.intrinsicContentSize = contentSize;
      });
    }
  }

  // Perform layout (possibly animated)
  return ^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    const RCTFrameData *frameDataArray = (const RCTFrameData *)framesData.bytes;
    RCTLayoutAnimation *layoutAnimation = uiManager->_layoutAnimation;

    __block NSUInteger completionsCalled = 0;

    NSInteger index = 0;
    for (NSNumber *reactTag in reactTags) {
      RCTFrameData frameData = frameDataArray[index++];

      UIView *view = viewRegistry[reactTag];
      CGRect frame = frameData.frame;

      BOOL isHidden = frameData.isHidden;
      UIUserInterfaceLayoutDirection layoutDirection = frameData.layoutDirection;
      BOOL isNew = frameData.isNew;
      RCTAnimation *updateAnimation = isNew ? nil : layoutAnimation.updateAnimation;
      BOOL shouldAnimateCreation = isNew && !frameData.parentIsNew;
      RCTAnimation *createAnimation = shouldAnimateCreation ? layoutAnimation.createAnimation : nil;

      void (^completion)(BOOL) = ^(BOOL finished) {
        completionsCalled++;
        if (layoutAnimation.callback && completionsCalled == count) {
          layoutAnimation.callback(@[@(finished)]);

          // It's unsafe to call this callback more than once, so we nil it out here
          // to make sure that doesn't happen.
          layoutAnimation.callback = nil;
        }
      };

      if (view.isHidden != isHidden) {
        view.hidden = isHidden;
      }

      if (view.reactLayoutDirection != layoutDirection) {
        view.reactLayoutDirection = layoutDirection;
      }

      RCTViewManagerUIBlock updateBlock = updateBlocks[reactTag];
      if (createAnimation) {

        // Animate view creation
        [view reactSetFrame:frame];

        CATransform3D finalTransform = view.layer.transform;
        CGFloat finalOpacity = view.layer.opacity;

        NSString *property = createAnimation.property;
        if ([property isEqualToString:@"scaleXY"]) {
          view.layer.transform = CATransform3DMakeScale(0, 0, 0);
        } else if ([property isEqualToString:@"opacity"]) {
          view.layer.opacity = 0.0;
        } else {
          RCTLogError(@"Unsupported layout animation createConfig property %@",
                      createAnimation.property);
        }

        [createAnimation performAnimations:^{
          if ([property isEqualToString:@"scaleXY"]) {
            view.layer.transform = finalTransform;
          } else if ([property isEqualToString:@"opacity"]) {
            view.layer.opacity = finalOpacity;
          }
          if (updateBlock) {
            updateBlock(self, viewRegistry);
          }
        } withCompletionBlock:completion];

      } else if (updateAnimation) {

        // Animate view update
        [updateAnimation performAnimations:^{
          [view reactSetFrame:frame];
          if (updateBlock) {
            updateBlock(self, viewRegistry);
          }
        } withCompletionBlock:completion];

      } else {

        // Update without animation
        [view reactSetFrame:frame];
        if (updateBlock) {
          updateBlock(self, viewRegistry);
        }
        completion(YES);
      }
    }

    // Clean up
    uiManager->_layoutAnimation = nil;
  };
}

- (void)_amendPendingUIBlocksWithStylePropagationUpdateForShadowView:(RCTShadowView *)topView
{
  NSMutableSet<RCTApplierBlock> *applierBlocks = [NSMutableSet setWithCapacity:1];
  [topView collectUpdatedProperties:applierBlocks parentProperties:@{}];

  if (applierBlocks.count) {
    [self addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      for (RCTApplierBlock block in applierBlocks) {
        block(viewRegistry);
      }
    }];
  }
}

- (void)addUIManagerObserver:(id<RCTUIManagerObserver>)observer
{
  dispatch_async(RCTGetUIManagerQueue(), ^{
    [self->_uiManagerObservers addObject:observer];
  });
}

- (void)removeUIManagerObserver:(id<RCTUIManagerObserver>)observer
{
  dispatch_async(RCTGetUIManagerQueue(), ^{
    [self->_uiManagerObservers removeObject:observer];
  });
}

/**
 * A method to be called from JS, which takes a container ID and then releases
 * all subviews for that container upon receipt.
 */
RCT_EXPORT_METHOD(removeSubviewsFromContainerWithID:(nonnull NSNumber *)containerID)
{
  id<RCTComponent> container = _shadowViewRegistry[containerID];
  RCTAssert(container != nil, @"container view (for ID %@) not found", containerID);

  NSUInteger subviewsCount = [container reactSubviews].count;
  NSMutableArray<NSNumber *> *indices = [[NSMutableArray alloc] initWithCapacity:subviewsCount];
  for (NSUInteger childIndex = 0; childIndex < subviewsCount; childIndex++) {
    [indices addObject:@(childIndex)];
  }

  [self manageChildren:containerID
       moveFromIndices:nil
         moveToIndices:nil
     addChildReactTags:nil
          addAtIndices:nil
       removeAtIndices:indices];
}

/**
 * Disassociates children from container. Doesn't remove from registries.
 * TODO: use [NSArray getObjects:buffer] to reuse same fast buffer each time.
 *
 * @returns Array of removed items.
 */
- (NSArray<id<RCTComponent>> *)_childrenToRemoveFromContainer:(id<RCTComponent>)container
                                                    atIndices:(NSArray<NSNumber *> *)atIndices
{
  // If there are no indices to move or the container has no subviews don't bother
  // We support parents with nil subviews so long as they're all nil so this allows for this behavior
  if (atIndices.count == 0 || [container reactSubviews].count == 0) {
    return nil;
  }
  // Construction of removed children must be done "up front", before indices are disturbed by removals.
  NSMutableArray<id<RCTComponent>> *removedChildren = [NSMutableArray arrayWithCapacity:atIndices.count];
  RCTAssert(container != nil, @"container view (for ID %@) not found", container);
  for (NSNumber *indexNumber in atIndices) {
    NSUInteger index = indexNumber.unsignedIntegerValue;
    if (index < [container reactSubviews].count) {
      [removedChildren addObject:[container reactSubviews][index]];
    }
  }
  if (removedChildren.count != atIndices.count) {
    NSString *message = [NSString stringWithFormat:@"removedChildren count (%tu) was not what we expected (%tu)",
                         removedChildren.count, atIndices.count];
    RCTFatal(RCTErrorWithMessage(message));
  }
  return removedChildren;
}

- (void)_removeChildren:(NSArray<id<RCTComponent>> *)children
          fromContainer:(id<RCTComponent>)container
{
  for (id<RCTComponent> removedChild in children) {
    [container removeReactSubview:removedChild];
  }
}

/**
 * Remove subviews from their parent with an animation.
 */
- (void)_removeChildren:(NSArray<UIView *> *)children
          fromContainer:(UIView *)container
          withAnimation:(RCTLayoutAnimation *)animation
{
  RCTAssertMainQueue();
  RCTAnimation *deleteAnimation = animation.deleteAnimation;

  __block NSUInteger completionsCalled = 0;
  for (UIView *removedChild in children) {

    void (^completion)(BOOL) = ^(BOOL finished) {
      completionsCalled++;

      [self->_viewsToBeDeleted removeObject:removedChild];
      [container removeReactSubview:removedChild];

      if (animation.callback && completionsCalled == children.count) {
        animation.callback(@[@(finished)]);

        // It's unsafe to call this callback more than once, so we nil it out here
        // to make sure that doesn't happen.
        animation.callback = nil;
      }
    };

    [_viewsToBeDeleted addObject:removedChild];

    // Disable user interaction while the view is animating since JS won't receive
    // the view events anyway.
    removedChild.userInteractionEnabled = NO;

    NSString *property = deleteAnimation.property;
    [deleteAnimation performAnimations:^{
      if ([property isEqualToString:@"scaleXY"]) {
        removedChild.layer.transform = CATransform3DMakeScale(0.001, 0.001, 0.001);
      } else if ([property isEqualToString:@"opacity"]) {
        removedChild.layer.opacity = 0.0;
      } else {
        RCTLogError(@"Unsupported layout animation createConfig property %@",
                    deleteAnimation.property);
      }
    } withCompletionBlock:completion];
  }
}


RCT_EXPORT_METHOD(removeRootView:(nonnull NSNumber *)rootReactTag)
{
  RCTShadowView *rootShadowView = _shadowViewRegistry[rootReactTag];
  RCTAssert(rootShadowView.superview == nil, @"root view cannot have superview (ID %@)", rootReactTag);
  [self _purgeChildren:(NSArray<id<RCTComponent>> *)rootShadowView.reactSubviews
          fromRegistry:(NSMutableDictionary<NSNumber *, id<RCTComponent>> *)_shadowViewRegistry];
  [_shadowViewRegistry removeObjectForKey:rootReactTag];
  [_rootViewTags removeObject:rootReactTag];

  [self addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    RCTAssertMainQueue();
    UIView *rootView = viewRegistry[rootReactTag];
    [uiManager _purgeChildren:(NSArray<id<RCTComponent>> *)rootView.reactSubviews
                 fromRegistry:(NSMutableDictionary<NSNumber *, id<RCTComponent>> *)viewRegistry];
    [(NSMutableDictionary *)viewRegistry removeObjectForKey:rootReactTag];

    [[NSNotificationCenter defaultCenter] postNotificationName:RCTUIManagerDidRemoveRootViewNotification
                                                        object:uiManager
                                                      userInfo:@{RCTUIManagerRootViewKey: rootView}];
  }];
}

RCT_EXPORT_METHOD(replaceExistingNonRootView:(nonnull NSNumber *)reactTag
                  withView:(nonnull NSNumber *)newReactTag)
{
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTAssert(shadowView != nil, @"shadowView (for ID %@) not found", reactTag);

  RCTShadowView *superShadowView = shadowView.superview;
  if (!superShadowView) {
    RCTAssert(NO, @"shadowView super (of ID %@) not found", reactTag);
    return;
  }

  NSUInteger indexOfView = [superShadowView.reactSubviews indexOfObject:shadowView];
  RCTAssert(indexOfView != NSNotFound, @"View's superview doesn't claim it as subview (id %@)", reactTag);
  NSArray<NSNumber *> *removeAtIndices = @[@(indexOfView)];
  NSArray<NSNumber *> *addTags = @[newReactTag];
  [self manageChildren:superShadowView.reactTag
       moveFromIndices:nil
         moveToIndices:nil
     addChildReactTags:addTags
          addAtIndices:removeAtIndices
       removeAtIndices:removeAtIndices];
}

RCT_EXPORT_METHOD(setChildren:(nonnull NSNumber *)containerTag
                  reactTags:(NSArray<NSNumber *> *)reactTags)
{
  RCTSetChildren(containerTag, reactTags,
                 (NSDictionary<NSNumber *, id<RCTComponent>> *)_shadowViewRegistry);

  [self addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){

    RCTSetChildren(containerTag, reactTags,
                   (NSDictionary<NSNumber *, id<RCTComponent>> *)viewRegistry);
  }];
}

static void RCTSetChildren(NSNumber *containerTag,
                           NSArray<NSNumber *> *reactTags,
                           NSDictionary<NSNumber *, id<RCTComponent>> *registry)
{
  id<RCTComponent> container = registry[containerTag];
  NSInteger index = 0;
  for (NSNumber *reactTag in reactTags) {
    id<RCTComponent> view = registry[reactTag];
    if (view) {
      [container insertReactSubview:view atIndex:index++];
    }
  }
}

RCT_EXPORT_METHOD(manageChildren:(nonnull NSNumber *)containerTag
                  moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
                  moveToIndices:(NSArray<NSNumber *> *)moveToIndices
                  addChildReactTags:(NSArray<NSNumber *> *)addChildReactTags
                  addAtIndices:(NSArray<NSNumber *> *)addAtIndices
                  removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices)
{
  [self _manageChildren:containerTag
        moveFromIndices:moveFromIndices
          moveToIndices:moveToIndices
      addChildReactTags:addChildReactTags
           addAtIndices:addAtIndices
        removeAtIndices:removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<RCTComponent>> *)_shadowViewRegistry];

  [self addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    [uiManager _manageChildren:containerTag
               moveFromIndices:moveFromIndices
                 moveToIndices:moveToIndices
             addChildReactTags:addChildReactTags
                  addAtIndices:addAtIndices
               removeAtIndices:removeAtIndices
                      registry:(NSMutableDictionary<NSNumber *, id<RCTComponent>> *)viewRegistry];
  }];
}

- (void)_manageChildren:(NSNumber *)containerTag
        moveFromIndices:(NSArray<NSNumber *> *)moveFromIndices
          moveToIndices:(NSArray<NSNumber *> *)moveToIndices
      addChildReactTags:(NSArray<NSNumber *> *)addChildReactTags
           addAtIndices:(NSArray<NSNumber *> *)addAtIndices
        removeAtIndices:(NSArray<NSNumber *> *)removeAtIndices
               registry:(NSMutableDictionary<NSNumber *, id<RCTComponent>> *)registry
{
  id<RCTComponent> container = registry[containerTag];
  RCTAssert(moveFromIndices.count == moveToIndices.count, @"moveFromIndices had size %tu, moveToIndices had size %tu", moveFromIndices.count, moveToIndices.count);
  RCTAssert(addChildReactTags.count == addAtIndices.count, @"there should be at least one React child to add");

  // Removes (both permanent and temporary moves) are using "before" indices
  NSArray<id<RCTComponent>> *permanentlyRemovedChildren =
    [self _childrenToRemoveFromContainer:container atIndices:removeAtIndices];
  NSArray<id<RCTComponent>> *temporarilyRemovedChildren =
    [self _childrenToRemoveFromContainer:container atIndices:moveFromIndices];

  BOOL isUIViewRegistry = ((id)registry == (id)_viewRegistry);
  if (isUIViewRegistry && _layoutAnimation.deleteAnimation) {
    [self _removeChildren:(NSArray<UIView *> *)permanentlyRemovedChildren
            fromContainer:(UIView *)container
            withAnimation:_layoutAnimation];
  } else {
    [self _removeChildren:permanentlyRemovedChildren fromContainer:container];
  }

  [self _removeChildren:temporarilyRemovedChildren fromContainer:container];
  [self _purgeChildren:permanentlyRemovedChildren fromRegistry:registry];

  // Figure out what to insert - merge temporary inserts and adds
  NSMutableDictionary *destinationsToChildrenToAdd = [NSMutableDictionary dictionary];
  for (NSInteger index = 0, length = temporarilyRemovedChildren.count; index < length; index++) {
    destinationsToChildrenToAdd[moveToIndices[index]] = temporarilyRemovedChildren[index];
  }
  for (NSInteger index = 0, length = addAtIndices.count; index < length; index++) {
    id<RCTComponent> view = registry[addChildReactTags[index]];
    if (view) {
      destinationsToChildrenToAdd[addAtIndices[index]] = view;
    }
  }

  NSArray<NSNumber *> *sortedIndices =
    [destinationsToChildrenToAdd.allKeys sortedArrayUsingSelector:@selector(compare:)];
  for (NSNumber *reactIndex in sortedIndices) {
    NSInteger insertAtIndex = reactIndex.integerValue;

    // When performing a delete animation, views are not removed immediately
    // from their container so we need to offset the insertion index if a view
    // that will be removed appears earlier than the view we are inserting.
    if (isUIViewRegistry && _viewsToBeDeleted.count > 0) {
      for (NSInteger index = 0; index < insertAtIndex; index++) {
        UIView *subview = ((UIView *)container).reactSubviews[index];
        if ([_viewsToBeDeleted containsObject:subview]) {
          insertAtIndex++;
        }
      }
    }

    [container insertReactSubview:destinationsToChildrenToAdd[reactIndex]
                          atIndex:insertAtIndex];
  }
}

RCT_EXPORT_METHOD(createView:(nonnull NSNumber *)reactTag
                  viewName:(NSString *)viewName
                  rootTag:(__unused NSNumber *)rootTag
                  props:(NSDictionary *)props)
{
  RCTComponentData *componentData = _componentDataByName[viewName];
  if (componentData == nil) {
    RCTLogError(@"No component found for view with name \"%@\"", viewName);
  }

  // Register shadow view
  RCTShadowView *shadowView = [componentData createShadowViewWithTag:reactTag];
  if (shadowView) {
    [componentData setProps:props forShadowView:shadowView];
    _shadowViewRegistry[reactTag] = shadowView;
  }

  // Shadow view is the source of truth for background color this is a little
  // bit counter-intuitive if people try to set background color when setting up
  // the view, but it's the only way that makes sense given our threading model
  UIColor *backgroundColor = shadowView.backgroundColor;

  // Dispatch view creation directly to the main thread instead of adding to
  // UIBlocks array. This way, it doesn't get deferred until after layout.
  __weak RCTUIManager *weakManager = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    RCTUIManager *uiManager = weakManager;
    if (!uiManager) {
      return;
    }
    UIView *view = [componentData createViewWithTag:reactTag];
    if (view) {
      [componentData setProps:props forView:view]; // Must be done before bgColor to prevent wrong default
      if ([view respondsToSelector:@selector(setBackgroundColor:)]) {
        ((UIView *)view).backgroundColor = backgroundColor;
      }
      if ([view respondsToSelector:@selector(reactBridgeDidFinishTransaction)]) {
        [uiManager->_bridgeTransactionListeners addObject:view];
      }
      uiManager->_viewRegistry[reactTag] = view;

#if RCT_DEV
      [view _DEBUG_setReactShadowView:shadowView];
#endif
    }
  });
}

RCT_EXPORT_METHOD(updateView:(nonnull NSNumber *)reactTag
                  viewName:(NSString *)viewName // not always reliable, use shadowView.viewName if available
                  props:(NSDictionary *)props)
{
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTComponentData *componentData = _componentDataByName[shadowView.viewName ?: viewName];
  [componentData setProps:props forShadowView:shadowView];

  [self addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    [componentData setProps:props forView:view];
  }];
}

- (void)synchronouslyUpdateViewOnUIThread:(NSNumber *)reactTag
                                 viewName:(NSString *)viewName
                                    props:(NSDictionary *)props
{
  RCTAssertMainQueue();
  RCTComponentData *componentData = _componentDataByName[viewName];
  UIView *view = _viewRegistry[reactTag];
  [componentData setProps:props forView:view];
}

RCT_EXPORT_METHOD(focus:(nonnull NSNumber *)reactTag)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *newResponder = viewRegistry[reactTag];
    [newResponder reactWillMakeFirstResponder];
    if ([newResponder becomeFirstResponder]) {
      [newResponder reactDidMakeFirstResponder];
    }
  }];
}

RCT_EXPORT_METHOD(blur:(nonnull NSNumber *)reactTag)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *currentResponder = viewRegistry[reactTag];
    [currentResponder resignFirstResponder];
  }];
}

RCT_EXPORT_METHOD(findSubviewIn:(nonnull NSNumber *)reactTag atPoint:(CGPoint)point callback:(RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    UIView *target = [view hitTest:point withEvent:nil];
    CGRect frame = [target convertRect:target.bounds toView:view];

    while (target.reactTag == nil && target.superview != nil) {
      target = target.superview;
    }

    callback(@[
      RCTNullIfNil(target.reactTag),
      @(frame.origin.x),
      @(frame.origin.y),
      @(frame.size.width),
      @(frame.size.height),
    ]);
  }];
}

RCT_EXPORT_METHOD(dispatchViewManagerCommand:(nonnull NSNumber *)reactTag
                  commandID:(NSInteger)commandID
                  commandArgs:(NSArray<id> *)commandArgs)
{
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTComponentData *componentData = _componentDataByName[shadowView.viewName];
  Class managerClass = componentData.managerClass;
  RCTModuleData *moduleData = [_bridge moduleDataForName:RCTBridgeModuleNameForClass(managerClass)];
  id<RCTBridgeMethod> method = moduleData.methods[commandID];

  NSArray *args = [@[reactTag] arrayByAddingObjectsFromArray:commandArgs];
  [method invokeWithBridge:_bridge module:componentData.manager arguments:args];
}

- (void)partialBatchDidFlush
{
  if (self.unsafeFlushUIChangesBeforeBatchEnds) {
    [self flushUIBlocks];
  }
}

- (void)batchDidComplete
{
  [self _layoutAndMount];
}

/**
 * Sets up animations, computes layout, creates UI mounting blocks for computed layout,
 * runs these blocks and all other already existing blocks.
 */
- (void)_layoutAndMount
{
  // Gather blocks to be executed now that all view hierarchy manipulations have
  // been completed (note that these may still take place before layout has finished)
  for (RCTComponentData *componentData in _componentDataByName.allValues) {
    RCTViewManagerUIBlock uiBlock = [componentData uiBlockToAmendWithShadowViewRegistry:_shadowViewRegistry];
    [self addUIBlock:uiBlock];
  }

  // Perform layout
  for (NSNumber *reactTag in _rootViewTags) {
    RCTRootShadowView *rootView = (RCTRootShadowView *)_shadowViewRegistry[reactTag];
    [self addUIBlock:[self uiBlockWithLayoutUpdateForRootView:rootView]];
    [self _amendPendingUIBlocksWithStylePropagationUpdateForShadowView:rootView];
  }

  [self addUIBlock:^(RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    /**
     * TODO(tadeu): Remove it once and for all
     */
    for (id<RCTComponent> node in uiManager->_bridgeTransactionListeners) {
      [node reactBridgeDidFinishTransaction];
    }
  }];

  for (id<RCTUIManagerObserver> observer in _uiManagerObservers) {
    [observer uiManagerWillFlushUIBlocks:self];
  }

  [self flushUIBlocks];
}

- (void)flushUIBlocks
{
  RCTAssertThread(RCTGetUIManagerQueue(),
                  @"flushUIBlocks can only be called from the shadow queue");

  // First copy the previous blocks into a temporary variable, then reset the
  // pending blocks to a new array. This guards against mutation while
  // processing the pending blocks in another thread.
  NSArray<RCTViewManagerUIBlock> *previousPendingUIBlocks = _pendingUIBlocks;
  _pendingUIBlocks = [NSMutableArray new];

  if (previousPendingUIBlocks.count) {
    // Execute the previously queued UI blocks
    RCTProfileBeginFlowEvent();
    dispatch_async(dispatch_get_main_queue(), ^{
      RCTProfileEndFlowEvent();
      RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"-[UIManager flushUIBlocks]", (@{
        @"count": @(previousPendingUIBlocks.count),
      }));
      @try {
        for (RCTViewManagerUIBlock block in previousPendingUIBlocks) {
          block(self, self->_viewRegistry);
        }
      }
      @catch (NSException *exception) {
        RCTLogError(@"Exception thrown while executing UI block: %@", exception);
      }
    });
  }
}

- (void)setNeedsLayout
{
  // If there is an active batch layout will happen when batch finished, so we will wait for that.
  // Otherwise we immidiately trigger layout.
  if (![_bridge isBatchActive]) {
    [self _layoutAndMount];
  }
}

RCT_EXPORT_METHOD(measure:(nonnull NSNumber *)reactTag
                  callback:(RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view) {
      // this view was probably collapsed out
      RCTLogWarn(@"measure cannot find view with tag #%@", reactTag);
      callback(@[]);
      return;
    }

    // If in a <Modal>, rootView will be the root of the modal container.
    UIView *rootView = view;
    while (rootView.superview && ![rootView isReactRootView]) {
      rootView = rootView.superview;
    }

    // By convention, all coordinates, whether they be touch coordinates, or
    // measurement coordinates are with respect to the root view.
    CGRect frame = view.frame;
    CGRect globalBounds = [view convertRect:view.bounds toView:rootView];

    callback(@[
      @(frame.origin.x),
      @(frame.origin.y),
      @(globalBounds.size.width),
      @(globalBounds.size.height),
      @(globalBounds.origin.x),
      @(globalBounds.origin.y),
    ]);
  }];
}

RCT_EXPORT_METHOD(measureInWindow:(nonnull NSNumber *)reactTag
                  callback:(RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view) {
      // this view was probably collapsed out
      RCTLogWarn(@"measure cannot find view with tag #%@", reactTag);
      callback(@[]);
      return;
    }

    // Return frame coordinates in window
    CGRect windowFrame = [view.window convertRect:view.frame fromView:view.superview];
    callback(@[
      @(windowFrame.origin.x),
      @(windowFrame.origin.y),
      @(windowFrame.size.width),
      @(windowFrame.size.height),
    ]);
  }];
}

/**
 * Returs if the shadow view provided has the `ancestor` shadow view as
 * an actual ancestor.
 */
RCT_EXPORT_METHOD(viewIsDescendantOf:(nonnull NSNumber *)reactTag
                  ancestor:(nonnull NSNumber *)ancestorReactTag
                  callback:(RCTResponseSenderBlock)callback)
{
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorReactTag];
  if (!shadowView) {
    return;
  }
  if (!ancestorShadowView) {
    return;
  }
  BOOL viewIsAncestor = [shadowView viewIsDescendantOf:ancestorShadowView];
  callback(@[@(viewIsAncestor)]);
}

static void RCTMeasureLayout(RCTShadowView *view,
                             RCTShadowView *ancestor,
                             RCTResponseSenderBlock callback)
{
  if (!view) {
    return;
  }
  if (!ancestor) {
    return;
  }
  CGRect result = [view measureLayoutRelativeToAncestor:ancestor];
  if (CGRectIsNull(result)) {
    RCTLogError(@"view %@ (tag #%@) is not a descendant of %@ (tag #%@)",
                view, view.reactTag, ancestor, ancestor.reactTag);
    return;
  }
  CGFloat leftOffset = result.origin.x;
  CGFloat topOffset = result.origin.y;
  CGFloat width = result.size.width;
  CGFloat height = result.size.height;
  if (isnan(leftOffset) || isnan(topOffset) || isnan(width) || isnan(height)) {
    RCTLogError(@"Attempted to measure layout but offset or dimensions were NaN");
    return;
  }
  callback(@[@(leftOffset), @(topOffset), @(width), @(height)]);
}

/**
 * Returns the computed recursive offset layout in a dictionary form. The
 * returned values are relative to the `ancestor` shadow view. Returns `nil`, if
 * the `ancestor` shadow view is not actually an `ancestor`. Does not touch
 * anything on the main UI thread. Invokes supplied callback with (x, y, width,
 * height).
 */
RCT_EXPORT_METHOD(measureLayout:(nonnull NSNumber *)reactTag
                  relativeTo:(nonnull NSNumber *)ancestorReactTag
                  errorCallback:(__unused RCTResponseSenderBlock)errorCallback
                  callback:(RCTResponseSenderBlock)callback)
{
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorReactTag];
  RCTMeasureLayout(shadowView, ancestorShadowView, callback);
}

/**
 * Returns the computed recursive offset layout in a dictionary form. The
 * returned values are relative to the `ancestor` shadow view. Returns `nil`, if
 * the `ancestor` shadow view is not actually an `ancestor`. Does not touch
 * anything on the main UI thread. Invokes supplied callback with (x, y, width,
 * height).
 */
RCT_EXPORT_METHOD(measureLayoutRelativeToParent:(nonnull NSNumber *)reactTag
                  errorCallback:(__unused RCTResponseSenderBlock)errorCallback
                  callback:(RCTResponseSenderBlock)callback)
{
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTMeasureLayout(shadowView, shadowView.reactSuperview, callback);
}

/**
 * Returns an array of computed offset layouts in a dictionary form. The layouts are of any React subviews
 * that are immediate descendants to the parent view found within a specified rect. The dictionary result
 * contains left, top, width, height and an index. The index specifies the position among the other subviews.
 * Only layouts for views that are within the rect passed in are returned. Invokes the error callback if the
 * passed in parent view does not exist. Invokes the supplied callback with the array of computed layouts.
 */
RCT_EXPORT_METHOD(measureViewsInRect:(CGRect)rect
                  parentView:(nonnull NSNumber *)reactTag
                  errorCallback:(__unused RCTResponseSenderBlock)errorCallback
                  callback:(RCTResponseSenderBlock)callback)
{
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  if (!shadowView) {
    RCTLogError(@"Attempting to measure view that does not exist (tag #%@)", reactTag);
    return;
  }
  NSArray<RCTShadowView *> *childShadowViews = [shadowView reactSubviews];
  NSMutableArray<NSDictionary *> *results =
    [[NSMutableArray alloc] initWithCapacity:childShadowViews.count];

  [childShadowViews enumerateObjectsUsingBlock:
   ^(RCTShadowView *childShadowView, NSUInteger idx, __unused BOOL *stop) {
    CGRect childLayout = [childShadowView measureLayoutRelativeToAncestor:shadowView];
    if (CGRectIsNull(childLayout)) {
      RCTLogError(@"View %@ (tag #%@) is not a descendant of %@ (tag #%@)",
                  childShadowView, childShadowView.reactTag, shadowView, shadowView.reactTag);
      return;
    }

    CGFloat leftOffset = childLayout.origin.x;
    CGFloat topOffset = childLayout.origin.y;
    CGFloat width = childLayout.size.width;
    CGFloat height = childLayout.size.height;

    if (leftOffset <= rect.origin.x + rect.size.width &&
        leftOffset + width >= rect.origin.x &&
        topOffset <= rect.origin.y + rect.size.height &&
        topOffset + height >= rect.origin.y) {

      // This view is within the layout rect
      NSDictionary *result = @{@"index": @(idx),
                               @"left": @(leftOffset),
                               @"top": @(topOffset),
                               @"width": @(width),
                               @"height": @(height)};

      [results addObject:result];
    }
  }];
  callback(@[results]);
}

RCT_EXPORT_METHOD(takeSnapshot:(id /* NSString or NSNumber */)target
                  withOptions:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {

    // Get view
    UIView *view;
    if (target == nil || [target isEqual:@"window"]) {
      view = RCTKeyWindow();
    } else if ([target isKindOfClass:[NSNumber class]]) {
      view = viewRegistry[target];
      if (!view) {
        RCTLogError(@"No view found with reactTag: %@", target);
        return;
      }
    }

    // Get options
    CGSize size = [RCTConvert CGSize:options];
    NSString *format = [RCTConvert NSString:options[@"format"] ?: @"png"];

    // Capture image
    if (size.width < 0.1 || size.height < 0.1) {
      size = view.bounds.size;
    }
    UIGraphicsBeginImageContextWithOptions(size, NO, 0);
    BOOL success = [view drawViewHierarchyInRect:(CGRect){CGPointZero, size} afterScreenUpdates:YES];
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    if (!success || !image) {
      reject(RCTErrorUnspecified, @"Failed to capture view snapshot.", nil);
      return;
    }

    // Convert image to data (on a background thread)
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

      NSData *data;
      if ([format isEqualToString:@"png"]) {
        data = UIImagePNGRepresentation(image);
      } else if ([format isEqualToString:@"jpeg"]) {
        CGFloat quality = [RCTConvert CGFloat:options[@"quality"] ?: @1];
        data = UIImageJPEGRepresentation(image, quality);
      } else {
        RCTLogError(@"Unsupported image format: %@", format);
        return;
      }

      // Save to a temp file
      NSError *error = nil;
      NSString *tempFilePath = RCTTempFilePath(format, &error);
      if (tempFilePath) {
        if ([data writeToFile:tempFilePath options:(NSDataWritingOptions)0 error:&error]) {
          resolve(tempFilePath);
          return;
        }
      }

      // If we reached here, something went wrong
      reject(RCTErrorUnspecified, error.localizedDescription, error);
    });
  }];
}

/**
 * JS sets what *it* considers to be the responder. Later, scroll views can use
 * this in order to determine if scrolling is appropriate.
 */
RCT_EXPORT_METHOD(setJSResponder:(nonnull NSNumber *)reactTag
                  blockNativeResponder:(__unused BOOL)blockNativeResponder)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = viewRegistry[reactTag];
    if (!_jsResponder) {
      RCTLogError(@"Invalid view set to be the JS responder - tag %zd", reactTag);
    }
  }];
}

RCT_EXPORT_METHOD(clearJSResponder)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    _jsResponder = nil;
  }];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSMutableDictionary<NSString *, NSDictionary *> *constants = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *directEvents = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *bubblingEvents = [NSMutableDictionary new];

  [_componentDataByName enumerateKeysAndObjectsUsingBlock:^(NSString *name, RCTComponentData *componentData, __unused BOOL *stop) {
     NSMutableDictionary<NSString *, id> *moduleConstants = [NSMutableDictionary new];

     // Add manager class
     moduleConstants[@"Manager"] = RCTBridgeModuleNameForClass(componentData.managerClass);

     // Add native props
     NSDictionary<NSString *, id> *viewConfig = [componentData viewConfig];
     moduleConstants[@"NativeProps"] = viewConfig[@"propTypes"];

     // Add direct events
     for (NSString *eventName in viewConfig[@"directEvents"]) {
       if (!directEvents[eventName]) {
         directEvents[eventName] = @{
           @"registrationName": [eventName stringByReplacingCharactersInRange:(NSRange){0, 3} withString:@"on"],
         };
       }
       if (RCT_DEBUG && bubblingEvents[eventName]) {
         RCTLogError(@"Component '%@' re-registered bubbling event '%@' as a "
                     "direct event", componentData.name, eventName);
       }
     }

     // Add bubbling events
     for (NSString *eventName in viewConfig[@"bubblingEvents"]) {
       if (!bubblingEvents[eventName]) {
         NSString *bubbleName = [eventName stringByReplacingCharactersInRange:(NSRange){0, 3} withString:@"on"];
         bubblingEvents[eventName] = @{
           @"phasedRegistrationNames": @{
             @"bubbled": bubbleName,
             @"captured": [bubbleName stringByAppendingString:@"Capture"],
           }
         };
       }
       if (RCT_DEBUG && directEvents[eventName]) {
         RCTLogError(@"Component '%@' re-registered direct event '%@' as a "
                     "bubbling event", componentData.name, eventName);
       }
     }

     RCTAssert(!constants[name], @"UIManager already has constants for %@", componentData.name);
     constants[name] = moduleConstants;
  }];

  constants[@"customBubblingEventTypes"] = bubblingEvents;
  constants[@"customDirectEventTypes"] = directEvents;

  return constants;
}

RCT_EXPORT_METHOD(configureNextLayoutAnimation:(NSDictionary *)config
                  withCallback:(RCTResponseSenderBlock)callback
                  errorCallback:(__unused RCTResponseSenderBlock)errorCallback)
{
  RCTLayoutAnimation *currentAnimation = _layoutAnimation;

  if (currentAnimation && ![config isEqualToDictionary:currentAnimation.config]) {
    RCTLogWarn(@"Warning: Overriding previous layout animation with new one before the first began:\n%@ -> %@.", currentAnimation.config, config);
  }

  RCTLayoutAnimation *nextLayoutAnimation = [[RCTLayoutAnimation alloc] initWithDictionary:config
                                                               callback:callback];

  // Set up next layout animation
  [self addUIBlock:^(RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    uiManager->_layoutAnimation = nextLayoutAnimation;
  }];
}

- (void)rootViewForReactTag:(NSNumber *)reactTag withCompletion:(void (^)(UIView *view))completion
{
  RCTAssertMainQueue();
  RCTAssert(completion != nil, @"Attempted to resolve rootView for tag %@ without a completion block", reactTag);

  if (reactTag == nil) {
    completion(nil);
    return;
  }

  dispatch_async(RCTGetUIManagerQueue(), ^{
    NSNumber *rootTag = [self _rootTagForReactTag:reactTag];
    dispatch_async(dispatch_get_main_queue(), ^{
      UIView *rootView = nil;
      if (rootTag != nil) {
        rootView = [self viewForReactTag:rootTag];
      }
      completion(rootView);
    });
  });
}

- (NSNumber *)_rootTagForReactTag:(NSNumber *)reactTag
{
  RCTAssert(!RCTIsMainQueue(), @"Should be called on shadow queue");

  if (reactTag == nil) {
    return nil;
  }

  if (RCTIsReactRootView(reactTag)) {
    return reactTag;
  }

  NSNumber *rootTag = nil;
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  while (shadowView) {
    RCTShadowView *parent = [shadowView reactSuperview];
    if (!parent && RCTIsReactRootView(shadowView.reactTag)) {
      rootTag = shadowView.reactTag;
      break;
    }
    shadowView = parent;
  }

  return rootTag;
}

static UIView *_jsResponder;

+ (UIView *)JSResponder
{
  return _jsResponder;
}

@end

@implementation RCTUIManager (Deprecated)

- (void)registerRootView:(UIView *)rootView withSizeFlexibility:(__unused RCTRootViewSizeFlexibility)sizeFlexibility
{
  RCTLogWarn(@"Calling of `[-RCTUIManager registerRootView:withSizeFlexibility:]` which is deprecated.");
  [self registerRootView:rootView];
}

- (void)setFrame:(CGRect)frame forView:(UIView *)view
{
  RCTLogWarn(@"Calling of `[-RCTUIManager setFrame:forView:]` which is deprecated.");
  [self setSize:frame.size forView:view];
}

RCT_EXPORT_METHOD(getContentSizeMultiplier:(nonnull RCTResponseSenderBlock)callback)
{
  RCTLogWarn(@"`getContentSizeMultiplier` is deprecated. Instead, use `PixelRatio.getFontScale()` and listen to the `didUpdateDimensions` event.");
  callback(@[@(_bridge.accessibilityManager.multiplier)]);
}

@end

@implementation RCTBridge (RCTUIManager)

- (RCTUIManager *)uiManager
{
  return [self moduleForClass:[RCTUIManager class]];
}

@end
