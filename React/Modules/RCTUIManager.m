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

#import "Layout.h"
#import "RCTAccessibilityManager.h"
#import "RCTAnimationType.h"
#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTComponent.h"
#import "RCTComponentData.h"
#import "RCTConvert.h"
#import "RCTDefines.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTProfile.h"
#import "RCTRootView.h"
#import "RCTScrollableProtocol.h"
#import "RCTShadowView.h"
#import "RCTSparseArray.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "RCTViewManager.h"
#import "UIView+React.h"

static void RCTTraverseViewNodes(id<RCTComponent> view, void (^block)(id<RCTComponent>))
{
  if (view.reactTag) block(view);
  for (id<RCTComponent> subview in view.reactSubviews) {
    RCTTraverseViewNodes(subview, block);
  }
}

NSString *const RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification = @"RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification";
NSString *const RCTUIManagerDidRegisterRootViewNotification = @"RCTUIManagerDidRegisterRootViewNotification";
NSString *const RCTUIManagerDidRemoveRootViewNotification = @"RCTUIManagerDidRemoveRootViewNotification";
NSString *const RCTUIManagerRootViewKey = @"RCTUIManagerRootViewKey";

@interface RCTAnimation : NSObject

@property (nonatomic, readonly) NSTimeInterval duration;
@property (nonatomic, readonly) NSTimeInterval delay;
@property (nonatomic, readonly, copy) NSString *property;
@property (nonatomic, readonly) id fromValue;
@property (nonatomic, readonly) id toValue;
@property (nonatomic, readonly) CGFloat springDamping;
@property (nonatomic, readonly) CGFloat initialVelocity;
@property (nonatomic, readonly) RCTAnimationType animationType;

@end

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
      return (UIViewAnimationOptions)(7 << 16);
    default:
      RCTLogError(@"Unsupported animation type %zd", type);
      return UIViewAnimationOptionCurveEaseInOut;
  }
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
    _fromValue = config[@"fromValue"];
    _toValue = config[@"toValue"];
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

@interface RCTUIManager ()

// NOTE: these are properties so that they can be accessed by unit tests
@property (nonatomic, strong) RCTSparseArray *viewManagerRegistry; // RCT thread only
@property (nonatomic, strong) RCTSparseArray *shadowViewRegistry; // RCT thread only
@property (nonatomic, strong) RCTSparseArray *viewRegistry; // Main thread only

@end

@implementation RCTUIManager
{
  dispatch_queue_t _shadowQueue;

  // Root views are only mutated on the shadow queue
  NSMutableSet *_rootViewTags;
  NSMutableArray *_pendingUIBlocks;
  NSLock *_pendingUIBlocksLock;

  // Animation
  RCTLayoutAnimation *_nextLayoutAnimation; // RCT thread only
  RCTLayoutAnimation *_layoutAnimation; // Main thread only

  // Keyed by viewName
  NSDictionary *_componentDataByName;

  NSMutableSet *_bridgeTransactionListeners;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

/**
 * Declared in RCTBridge.
 */
extern NSString *RCTBridgeModuleNameForClass(Class cls);

- (instancetype)init
{
  if ((self = [super init])) {

    _shadowQueue = dispatch_queue_create("com.facebook.React.ShadowQueue", DISPATCH_QUEUE_SERIAL);

    _pendingUIBlocksLock = [NSLock new];

    _shadowViewRegistry = [RCTSparseArray new];
    _viewRegistry = [RCTSparseArray new];

    // Internal resources
    _pendingUIBlocks = [NSMutableArray new];
    _rootViewTags = [NSMutableSet new];

    _bridgeTransactionListeners = [NSMutableSet new];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didReceiveNewContentSizeMultiplier)
                                                 name:RCTAccessibilityManagerDidUpdateMultiplierNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)didReceiveNewContentSizeMultiplier
{
  __weak RCTUIManager *weakSelf = self;
  dispatch_async(self.methodQueue, ^{
    RCTUIManager *strongSelf = weakSelf;
    if (strongSelf) {
      [[NSNotificationCenter defaultCenter] postNotificationName:RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification
                                                          object:strongSelf];
      [strongSelf batchDidComplete];
    }
  });
}

- (void)invalidate
{
  /**
   * Called on the JS Thread since all modules are invalidated on the JS thread
   */

  dispatch_async(dispatch_get_main_queue(), ^{
    for (NSNumber *rootViewTag in _rootViewTags) {
      [_viewRegistry[rootViewTag] invalidate];
    }

    _rootViewTags = nil;
    _shadowViewRegistry = nil;
    _viewRegistry = nil;
    _bridgeTransactionListeners = nil;
    _bridge = nil;

    [_pendingUIBlocksLock lock];
    _pendingUIBlocks = nil;
    [_pendingUIBlocksLock unlock];
  });
}

- (void)setBridge:(RCTBridge *)bridge
{
  RCTAssert(_bridge == nil, @"Should not re-use same UIIManager instance");

  _bridge = bridge;
  _shadowViewRegistry = [RCTSparseArray new];

  // Get view managers from bridge
  NSMutableDictionary *componentDataByName = [NSMutableDictionary new];
  for (RCTViewManager *manager in _bridge.modules.allValues) {
    if ([manager isKindOfClass:[RCTViewManager class]]) {
      RCTComponentData *componentData = [[RCTComponentData alloc] initWithManager:manager];
      componentDataByName[componentData.name] = componentData;
    }
  }

  _componentDataByName = [componentDataByName copy];
}

- (dispatch_queue_t)methodQueue
{
  return _shadowQueue;
}

- (void)registerRootView:(UIView *)rootView
{
  RCTAssertMainThread();

  NSNumber *reactTag = rootView.reactTag;
  RCTAssert(RCTIsReactRootView(reactTag),
            @"View %@ with tag #%@ is not a root view", rootView, reactTag);

  UIView *existingView = _viewRegistry[reactTag];
  RCTAssert(existingView == nil || existingView == rootView,
            @"Expect all root views to have unique tag. Added %@ twice", reactTag);

  // Register view
  _viewRegistry[reactTag] = rootView;
  CGRect frame = rootView.frame;

  // Register shadow view
  __weak RCTUIManager *weakSelf = self;
  dispatch_async(_shadowQueue, ^{
    RCTUIManager *strongSelf = weakSelf;
    if (!_viewRegistry) {
      return;
    }
    RCTShadowView *shadowView = [RCTShadowView new];
    shadowView.reactTag = reactTag;
    shadowView.frame = frame;
    shadowView.backgroundColor = rootView.backgroundColor;
    shadowView.viewName = NSStringFromClass([rootView class]);
    strongSelf->_shadowViewRegistry[shadowView.reactTag] = shadowView;
    [strongSelf->_rootViewTags addObject:reactTag];
  });

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTUIManagerDidRegisterRootViewNotification
                                                      object:self
                                                    userInfo:@{ RCTUIManagerRootViewKey: rootView }];
}

- (UIView *)viewForReactTag:(NSNumber *)reactTag
{
  RCTAssertMainThread();
  return _viewRegistry[reactTag];
}

- (void)setFrame:(CGRect)frame forView:(UIView *)view
{
  RCTAssertMainThread();

  NSNumber *reactTag = view.reactTag;
  dispatch_async(_shadowQueue, ^{
    RCTShadowView *rootShadowView = _shadowViewRegistry[reactTag];
    RCTAssert(rootShadowView != nil, @"Could not locate root view with tag #%@", reactTag);
    rootShadowView.frame = frame;
    [rootShadowView updateLayout];

    [self batchDidComplete];
  });
}

- (void)setBackgroundColor:(UIColor *)color forRootView:(UIView *)rootView
{
  RCTAssertMainThread();

  NSNumber *reactTag = rootView.reactTag;
  RCTAssert(RCTIsReactRootView(reactTag), @"Specified view %@ is not a root view", reactTag);

  __weak RCTUIManager *weakSelf = self;
  dispatch_async(_shadowQueue, ^{
    RCTUIManager *strongSelf = weakSelf;
    if (!_viewRegistry) {
      return;
    }
    RCTShadowView *rootShadowView = strongSelf->_shadowViewRegistry[reactTag];
    RCTAssert(rootShadowView != nil, @"Could not locate root view with tag #%@", reactTag);
    rootShadowView.backgroundColor = color;
    [self _amendPendingUIBlocksWithStylePropagationUpdateForRootView:rootShadowView];
    [self flushUIBlocks];
  });
}

/**
 * Unregisters views from registries
 */
- (void)_purgeChildren:(NSArray *)children fromRegistry:(RCTSparseArray *)registry
{
  for (id<RCTComponent> child in children) {
    RCTTraverseViewNodes(registry[child.reactTag], ^(id<RCTComponent> subview) {
      RCTAssert(![subview isReactRootView], @"Root views should not be unregistered");
      if ([subview conformsToProtocol:@protocol(RCTInvalidating)]) {
        [(id<RCTInvalidating>)subview invalidate];
      }
      registry[subview.reactTag] = nil;

      if (registry == _viewRegistry) {
        [_bridgeTransactionListeners removeObject:subview];
      }
    });
  }
}

- (void)addUIBlock:(RCTViewManagerUIBlock)block
{
  RCTAssertThread(_shadowQueue,
                  @"-[RCTUIManager addUIBlock:] should only be called from the "
                  "UIManager's _shadowQueue (it may be accessed via `bridge.uiManager.methodQueue`)");

  if (!block) {
    return;
  }

  if (!_viewRegistry) {
    return;
  }

  __weak RCTUIManager *weakViewManager = self;
  dispatch_block_t outerBlock = ^{
    RCTUIManager *strongViewManager = weakViewManager;
    if (strongViewManager && strongViewManager->_viewRegistry) {
      block(strongViewManager, strongViewManager->_viewRegistry);
    }
  };

  [_pendingUIBlocksLock lock];
  [_pendingUIBlocks addObject:outerBlock];
  [_pendingUIBlocksLock unlock];
}

- (RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(RCTShadowView *)rootShadowView
{
  RCTAssert(![NSThread isMainThread], @"Should be called on shadow thread");

  NSMutableSet *viewsWithNewFrames = [NSMutableSet setWithCapacity:1];

  // This is nuanced. In the JS thread, we create a new update buffer
  // `frameTags`/`frames` that is created/mutated in the JS thread. We access
  // these structures in the UI-thread block. `NSMutableArray` is not thread
  // safe so we rely on the fact that we never mutate it after it's passed to
  // the main thread.
  [rootShadowView collectRootUpdatedFrames:viewsWithNewFrames
                          parentConstraint:(CGSize){CSS_UNDEFINED, CSS_UNDEFINED}];

  // Parallel arrays are built and then handed off to main thread
  NSMutableArray *frameReactTags = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];
  NSMutableArray *frames = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];
  NSMutableArray *areNew = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];
  NSMutableArray *parentsAreNew = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];
  NSMutableArray *onLayoutEvents = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];

  for (RCTShadowView *shadowView in viewsWithNewFrames) {
    [frameReactTags addObject:shadowView.reactTag];
    [frames addObject:[NSValue valueWithCGRect:shadowView.frame]];
    [areNew addObject:@(shadowView.isNewView)];
    [parentsAreNew addObject:@(shadowView.superview.isNewView)];
    id event = (id)kCFNull;
    if (shadowView.onLayout) {
      event = @{
        @"target": shadowView.reactTag,
        @"layout": @{
          @"x": @(shadowView.frame.origin.x),
          @"y": @(shadowView.frame.origin.y),
          @"width": @(shadowView.frame.size.width),
          @"height": @(shadowView.frame.size.height),
        },
      };
    }
    [onLayoutEvents addObject:event];
  }

  for (RCTShadowView *shadowView in viewsWithNewFrames) {
    // We have to do this after we build the parentsAreNew array.
    shadowView.newView = NO;
  }

  // These are blocks to be executed on each view, immediately after
  // reactSetFrame: has been called. Note that if reactSetFrame: is not called,
  // these won't be called either, so this is not a suitable place to update
  // properties that aren't related to layout.
  NSMutableArray *updateBlocks = [NSMutableArray new];
  for (RCTShadowView *shadowView in viewsWithNewFrames) {
    RCTViewManager *manager = [_componentDataByName[shadowView.viewName] manager];
    RCTViewManagerUIBlock block = [manager uiBlockToAmendWithShadowView:shadowView];
    if (block) [updateBlocks addObject:block];
  }

  // Perform layout (possibly animated)
  return ^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTResponseSenderBlock callback = self->_layoutAnimation.callback;
    __block NSUInteger completionsCalled = 0;
    for (NSUInteger ii = 0; ii < frames.count; ii++) {
      NSNumber *reactTag = frameReactTags[ii];
      UIView *view = viewRegistry[reactTag];
      CGRect frame = [frames[ii] CGRectValue];
      id event = onLayoutEvents[ii];

      BOOL isNew = [areNew[ii] boolValue];
      RCTAnimation *updateAnimation = isNew ? nil : _layoutAnimation.updateAnimation;
      BOOL shouldAnimateCreation = isNew && ![parentsAreNew[ii] boolValue];
      RCTAnimation *createAnimation = shouldAnimateCreation ? _layoutAnimation.createAnimation : nil;

      void (^completion)(BOOL) = ^(BOOL finished) {
        completionsCalled++;
        if (event != (id)kCFNull) {
          [self.bridge.eventDispatcher sendInputEventWithName:@"layout" body:event];
        }
        if (callback && completionsCalled == frames.count - 1) {
          callback(@[@(finished)]);
        }
      };

      // Animate view update
      if (updateAnimation) {
        [updateAnimation performAnimations:^{
          [view reactSetFrame:frame];
          for (RCTViewManagerUIBlock block in updateBlocks) {
            block(self, _viewRegistry);
          }
        } withCompletionBlock:completion];
      } else {
        [view reactSetFrame:frame];
        for (RCTViewManagerUIBlock block in updateBlocks) {
          block(self, _viewRegistry);
        }
        completion(YES);
      }

      // Animate view creation
      if (createAnimation) {
        if ([createAnimation.property isEqualToString:@"scaleXY"]) {
          view.layer.transform = CATransform3DMakeScale(0, 0, 0);
        } else if ([createAnimation.property isEqualToString:@"opacity"]) {
          view.layer.opacity = 0.0;
        }
        [createAnimation performAnimations:^{
          if ([createAnimation.property isEqual:@"scaleXY"]) {
            view.layer.transform = CATransform3DIdentity;
          } else if ([createAnimation.property isEqual:@"opacity"]) {
            view.layer.opacity = 1.0;
          } else {
            RCTLogError(@"Unsupported layout animation createConfig property %@",
                        createAnimation.property);
          }
          for (RCTViewManagerUIBlock block in updateBlocks) {
            block(self, _viewRegistry);
          }
        } withCompletionBlock:nil];
      }
    }

    /**
     * TODO(tadeu): Remove it once and for all
     */
    for (id<RCTComponent> node in _bridgeTransactionListeners) {
      [node reactBridgeDidFinishTransaction];
    }
  };
}

- (void)_amendPendingUIBlocksWithStylePropagationUpdateForRootView:(RCTShadowView *)topView
{
  NSMutableSet *applierBlocks = [NSMutableSet setWithCapacity:1];
  [topView collectUpdatedProperties:applierBlocks parentProperties:@{}];

  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    for (RCTApplierBlock block in applierBlocks) {
      block(viewRegistry);
    }
  }];
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
  NSMutableArray *indices = [[NSMutableArray alloc] initWithCapacity:subviewsCount];
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
- (NSArray *)_childrenToRemoveFromContainer:(id<RCTComponent>)container
                                  atIndices:(NSArray *)atIndices
{
  // If there are no indices to move or the container has no subviews don't bother
  // We support parents with nil subviews so long as they're all nil so this allows for this behavior
  if (atIndices.count == 0 || [container reactSubviews].count == 0) {
    return nil;
  }
  // Construction of removed children must be done "up front", before indices are disturbed by removals.
  NSMutableArray *removedChildren = [NSMutableArray arrayWithCapacity:atIndices.count];
  RCTAssert(container != nil, @"container view (for ID %@) not found", container);
  for (NSNumber *indexNumber in atIndices) {
    NSUInteger index = indexNumber.unsignedIntegerValue;
    if (index < [container reactSubviews].count) {
      [removedChildren addObject:[container reactSubviews][index]];
    }
  }
  if (removedChildren.count != atIndices.count) {
    RCTLogMustFix(@"removedChildren count (%tu) was not what we expected (%tu)",
                  removedChildren.count, atIndices.count);
  }
  return removedChildren;
}

- (void)_removeChildren:(NSArray *)children fromContainer:(id<RCTComponent>)container
{
  for (id removedChild in children) {
    [container removeReactSubview:removedChild];
  }
}

RCT_EXPORT_METHOD(removeRootView:(nonnull NSNumber *)rootReactTag)
{
  RCTShadowView *rootShadowView = _shadowViewRegistry[rootReactTag];
  RCTAssert(rootShadowView.superview == nil, @"root view cannot have superview (ID %@)", rootReactTag);
  [self _purgeChildren:rootShadowView.reactSubviews fromRegistry:_shadowViewRegistry];
   _shadowViewRegistry[rootReactTag] = nil;
  [_rootViewTags removeObject:rootReactTag];

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    RCTAssertMainThread();
    UIView *rootView = viewRegistry[rootReactTag];
    [uiManager _purgeChildren:rootView.reactSubviews fromRegistry:viewRegistry];
    viewRegistry[rootReactTag] = nil;

    [[NSNotificationCenter defaultCenter] postNotificationName:RCTUIManagerDidRemoveRootViewNotification
                                                        object:uiManager
                                                      userInfo:@{ RCTUIManagerRootViewKey: rootView }];
  }];
}

RCT_EXPORT_METHOD(replaceExistingNonRootView:(nonnull NSNumber *)reactTag withView:(nonnull NSNumber *)newReactTag)
{
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTAssert(shadowView != nil, @"shadowView (for ID %@) not found", reactTag);

  RCTShadowView *superShadowView = shadowView.superview;
  RCTAssert(superShadowView != nil, @"shadowView super (of ID %@) not found", reactTag);

  NSUInteger indexOfView = [superShadowView.reactSubviews indexOfObject:shadowView];
  RCTAssert(indexOfView != NSNotFound, @"View's superview doesn't claim it as subview (id %@)", reactTag);
  NSArray *removeAtIndices = @[@(indexOfView)];
  NSArray *addTags = @[newReactTag];
  [self manageChildren:superShadowView.reactTag
        moveFromIndices:nil
          moveToIndices:nil
      addChildReactTags:addTags
          addAtIndices:removeAtIndices
        removeAtIndices:removeAtIndices];
}

RCT_EXPORT_METHOD(manageChildren:(nonnull NSNumber *)containerReactTag
                  moveFromIndices:(NSArray *)moveFromIndices
                  moveToIndices:(NSArray *)moveToIndices
                  addChildReactTags:(NSArray *)addChildReactTags
                  addAtIndices:(NSArray *)addAtIndices
                  removeAtIndices:(NSArray *)removeAtIndices)
{
  [self _manageChildren:containerReactTag
        moveFromIndices:moveFromIndices
          moveToIndices:moveToIndices
      addChildReactTags:addChildReactTags
           addAtIndices:addAtIndices
        removeAtIndices:removeAtIndices
               registry:_shadowViewRegistry];

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    [uiManager _manageChildren:containerReactTag
               moveFromIndices:moveFromIndices
                 moveToIndices:moveToIndices
             addChildReactTags:addChildReactTags
                  addAtIndices:addAtIndices
               removeAtIndices:removeAtIndices
                      registry:viewRegistry];
  }];
}

- (void)_manageChildren:(NSNumber *)containerReactTag
        moveFromIndices:(NSArray *)moveFromIndices
          moveToIndices:(NSArray *)moveToIndices
      addChildReactTags:(NSArray *)addChildReactTags
           addAtIndices:(NSArray *)addAtIndices
        removeAtIndices:(NSArray *)removeAtIndices
               registry:(RCTSparseArray *)registry
{
  id<RCTComponent> container = registry[containerReactTag];
  RCTAssert(moveFromIndices.count == moveToIndices.count, @"moveFromIndices had size %tu, moveToIndices had size %tu", moveFromIndices.count, moveToIndices.count);
  RCTAssert(addChildReactTags.count == addAtIndices.count, @"there should be at least one React child to add");

  // Removes (both permanent and temporary moves) are using "before" indices
  NSArray *permanentlyRemovedChildren = [self _childrenToRemoveFromContainer:container atIndices:removeAtIndices];
  NSArray *temporarilyRemovedChildren = [self _childrenToRemoveFromContainer:container atIndices:moveFromIndices];
  [self _removeChildren:permanentlyRemovedChildren fromContainer:container];
  [self _removeChildren:temporarilyRemovedChildren fromContainer:container];

  [self _purgeChildren:permanentlyRemovedChildren fromRegistry:registry];

  // TODO (#5906496): optimize all these loops - constantly calling array.count is not efficient

  // Figure out what to insert - merge temporary inserts and adds
  NSMutableDictionary *destinationsToChildrenToAdd = [NSMutableDictionary dictionary];
  for (NSInteger index = 0, length = temporarilyRemovedChildren.count; index < length; index++) {
    destinationsToChildrenToAdd[moveToIndices[index]] = temporarilyRemovedChildren[index];
  }
  for (NSInteger index = 0, length = addAtIndices.count; index < length; index++) {
    id view = registry[addChildReactTags[index]];
    if (view) {
      destinationsToChildrenToAdd[addAtIndices[index]] = view;
    }
  }

  NSArray *sortedIndices = [destinationsToChildrenToAdd.allKeys sortedArrayUsingSelector:@selector(compare:)];
  for (NSNumber *reactIndex in sortedIndices) {
    [container insertReactSubview:destinationsToChildrenToAdd[reactIndex] atIndex:reactIndex.integerValue];
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
  [componentData setProps:props forShadowView:shadowView];
  _shadowViewRegistry[reactTag] = shadowView;

  // Shadow view is the source of truth for background color this is a little
  // bit counter-intuitive if people try to set background color when setting up
  // the view, but it's the only way that makes sense given our threading model
  UIColor *backgroundColor = shadowView.backgroundColor;

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    id<RCTComponent> view = [componentData createViewWithTag:reactTag props:props];
    if ([view respondsToSelector:@selector(setBackgroundColor:)]) {
      ((UIView *)view).backgroundColor = backgroundColor;
    }
    [componentData setProps:props forView:view];
    if ([view respondsToSelector:@selector(reactBridgeDidFinishTransaction)]) {
      [uiManager->_bridgeTransactionListeners addObject:view];
    }
    viewRegistry[reactTag] = view;
  }];
}

RCT_EXPORT_METHOD(updateView:(nonnull NSNumber *)reactTag
                  viewName:(NSString *)viewName // not always reliable, use shadowView.viewName if available
                  props:(NSDictionary *)props)
{
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTComponentData *componentData = _componentDataByName[shadowView.viewName ?: viewName];
  [componentData setProps:props forShadowView:shadowView];

  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    [componentData setProps:props forView:view];
  }];
}

RCT_EXPORT_METHOD(focus:(nonnull NSNumber *)reactTag)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    UIView *newResponder = viewRegistry[reactTag];
    [newResponder reactWillMakeFirstResponder];
    [newResponder becomeFirstResponder];
    [newResponder reactDidMakeFirstResponder];
  }];
}

RCT_EXPORT_METHOD(blur:(nonnull NSNumber *)reactTag)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    UIView *currentResponder = viewRegistry[reactTag];
    [currentResponder resignFirstResponder];
  }];
}

RCT_EXPORT_METHOD(findSubviewIn:(nonnull NSNumber *)reactTag atPoint:(CGPoint)point callback:(RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
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

- (void)batchDidComplete
{
  RCTProfileBeginEvent(0, @"[RCTUIManager batchDidComplete]", nil);

  // Gather blocks to be executed now that all view hierarchy manipulations have
  // been completed (note that these may still take place before layout has finished)
  for (RCTComponentData *componentData in _componentDataByName.allValues) {
    RCTViewManagerUIBlock uiBlock = [componentData.manager uiBlockToAmendWithShadowViewRegistry:_shadowViewRegistry];
    [self addUIBlock:uiBlock];
  }

  // Set up next layout animation
  if (_nextLayoutAnimation) {
    RCTLayoutAnimation *layoutAnimation = _nextLayoutAnimation;
    [self addUIBlock:^(RCTUIManager *uiManager, __unused RCTSparseArray *viewRegistry) {
      uiManager->_layoutAnimation = layoutAnimation;
    }];
  }

  // Perform layout
  for (NSNumber *reactTag in _rootViewTags) {
    RCTShadowView *rootView = _shadowViewRegistry[reactTag];
    [self addUIBlock:[self uiBlockWithLayoutUpdateForRootView:rootView]];
    [self _amendPendingUIBlocksWithStylePropagationUpdateForRootView:rootView];
  }

  // Clear layout animations
  if (_nextLayoutAnimation) {
    [self addUIBlock:^(RCTUIManager *uiManager, __unused RCTSparseArray *viewRegistry) {
      uiManager->_layoutAnimation = nil;
    }];
    _nextLayoutAnimation = nil;
  }

  RCTProfileEndEvent(0, @"uimanager", @{
    @"view_count": @(_viewRegistry.count),
  });
  [self flushUIBlocks];
}

- (void)flushUIBlocks
{
  // First copy the previous blocks into a temporary variable, then reset the
  // pending blocks to a new array. This guards against mutation while
  // processing the pending blocks in another thread.
  [_pendingUIBlocksLock lock];
  NSArray *previousPendingUIBlocks = _pendingUIBlocks;
  _pendingUIBlocks = [NSMutableArray new];
  [_pendingUIBlocksLock unlock];

  // Execute the previously queued UI blocks
  RCTProfileBeginFlowEvent();
  dispatch_async(dispatch_get_main_queue(), ^{
    RCTProfileEndFlowEvent();
    RCTProfileBeginEvent(0, @"UIManager flushUIBlocks", nil);
    @try {
      for (dispatch_block_t block in previousPendingUIBlocks) {
        block();
      }
    }
    @catch (NSException *exception) {
      RCTLogError(@"Exception thrown while executing UI block: %@", exception);
    }
    RCTProfileEndEvent(0, @"objc_call", @{
      @"count": @(previousPendingUIBlocks.count),
    });
  });
}

RCT_EXPORT_METHOD(measure:(nonnull NSNumber *)reactTag
                  callback:(RCTResponseSenderBlock)callback)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view) {
      // this view was probably collapsed out
      RCTLogWarn(@"measure cannot find view with tag #%@", reactTag);
      callback(@[]);
      return;
    }
    CGRect frame = view.frame;

    UIView *rootView = view;
    while (rootView && ![rootView isReactRootView]) {
      rootView = rootView.superview;
    }

    // TODO: this doesn't work because sometimes view is inside a modal window
    // RCTAssert([rootView isReactRootView], @"React view is not inside a React root view");

    // By convention, all coordinates, whether they be touch coordinates, or
    // measurement coordinates are with respect to the root view.
    CGPoint pagePoint = [view.superview convertPoint:frame.origin toView:rootView];

    callback(@[
      @(frame.origin.x),
      @(frame.origin.y),
      @(frame.size.width),
      @(frame.size.height),
      @(pagePoint.x),
      @(pagePoint.y)
    ]);
  }];
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
    RCTLogError(@"view %@ (tag #%@) is not a decendant of %@ (tag #%@)",
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
  NSArray *childShadowViews = [shadowView reactSubviews];
  NSMutableArray *results = [[NSMutableArray alloc] initWithCapacity:childShadowViews.count];

  [childShadowViews enumerateObjectsUsingBlock:
   ^(RCTShadowView *childShadowView, NSUInteger idx, __unused BOOL *stop) {
    CGRect childLayout = [childShadowView measureLayoutRelativeToAncestor:shadowView];
    if (CGRectIsNull(childLayout)) {
      RCTLogError(@"View %@ (tag #%@) is not a decendant of %@ (tag #%@)",
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

RCT_EXPORT_METHOD(setMainScrollViewTag:(nonnull NSNumber *)reactTag)
{
  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    // - There should be at most one designated "main scroll view"
    // - There should be at most one designated "`nativeMainScrollDelegate`"
    // - The one designated main scroll view should have the one designated
    // `nativeMainScrollDelegate` set as its `nativeMainScrollDelegate`.
    if (uiManager.mainScrollView) {
      uiManager.mainScrollView.nativeMainScrollDelegate = nil;
    }
    id view = viewRegistry[reactTag];
    if (view) {
      if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
        uiManager.mainScrollView = (id<RCTScrollableProtocol>)view;
        uiManager.mainScrollView.nativeMainScrollDelegate = uiManager.nativeMainScrollDelegate;
      } else {
        RCTLogError(@"Tag #%@ does not conform to RCTScrollableProtocol", reactTag);
      }
    } else {
      uiManager.mainScrollView = nil;
    }
  }];
}

// TODO: we could just pass point property
RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)reactTag
                  withOffsetX:(CGFloat)offsetX
                  offsetY:(CGFloat)offsetY)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    UIView *view = viewRegistry[reactTag];
    if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
      [(id<RCTScrollableProtocol>)view scrollToOffset:(CGPoint){offsetX, offsetY} animated:YES];
    } else {
      RCTLogError(@"tried to scrollToOffset: on non-RCTScrollableProtocol view %@ with tag #%@", view, reactTag);
    }
  }];
}

// TODO: we could just pass point property
RCT_EXPORT_METHOD(scrollWithoutAnimationTo:(nonnull NSNumber *)reactTag
                  offsetX:(CGFloat)offsetX
                  offsetY:(CGFloat)offsetY)
{
    [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
        UIView *view = viewRegistry[reactTag];
        if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
            [(id<RCTScrollableProtocol>)view scrollToOffset:(CGPoint){offsetX, offsetY} animated:NO];
        } else {
            RCTLogError(@"tried to scrollToOffset: on non-RCTScrollableProtocol view %@ with tag #%@", view, reactTag);
        }
    }];
}

RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)reactTag
                  withRect:(CGRect)rect)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    UIView *view = viewRegistry[reactTag];
    if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
      [(id<RCTScrollableProtocol>)view zoomToRect:rect animated:YES];
    } else {
      RCTLogError(@"tried to zoomToRect: on non-RCTScrollableProtocol view %@ with tag #%@", view, reactTag);
    }
  }];
}

/**
 * JS sets what *it* considers to be the responder. Later, scroll views can use
 * this in order to determine if scrolling is appropriate.
 */
RCT_EXPORT_METHOD(setJSResponder:(nonnull NSNumber *)reactTag
                  blockNativeResponder:(__unused BOOL)blockNativeResponder)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    _jsResponder = viewRegistry[reactTag];
    if (!_jsResponder) {
      RCTLogError(@"Invalid view set to be the JS responder - tag %zd", reactTag);
    }
  }];
}

RCT_EXPORT_METHOD(clearJSResponder)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, __unused RCTSparseArray *viewRegistry) {
    _jsResponder = nil;
  }];
}

- (NSDictionary *)bubblingEventsConfig
{
  NSMutableDictionary *customBubblingEventTypesConfigs = [NSMutableDictionary new];
  for (RCTComponentData *componentData in _componentDataByName.allValues) {
    RCTViewManager *manager = componentData.manager;
    if (RCTClassOverridesInstanceMethod([manager class], @selector(customBubblingEventTypes))) {
      NSArray *events = [manager customBubblingEventTypes];
      if (RCT_DEBUG) {
        RCTAssert(!events || [events isKindOfClass:[NSArray class]],
                  @"customBubblingEventTypes must return an array, but %@ returned %@",
                  [manager class], [events class]);
      }
      for (NSString *eventName in events) {
        NSString *topName = RCTNormalizeInputEventName(eventName);
        if (!customBubblingEventTypesConfigs[topName]) {
          NSString *bubbleName = [topName stringByReplacingCharactersInRange:(NSRange){0, 3} withString:@"on"];
          customBubblingEventTypesConfigs[topName] = @{
            @"phasedRegistrationNames": @{
              @"bubbled": bubbleName,
              @"captured": [bubbleName stringByAppendingString:@"Capture"],
            }
          };
        }
      }
    }
  };

  return customBubblingEventTypesConfigs;
}

- (NSDictionary *)directEventsConfig
{
  NSMutableDictionary *customDirectEventTypes = [NSMutableDictionary new];
  for (RCTComponentData *componentData in _componentDataByName.allValues) {
    RCTViewManager *manager = componentData.manager;
    if (RCTClassOverridesInstanceMethod([manager class], @selector(customDirectEventTypes))) {
      NSArray *events = [manager customDirectEventTypes];
      if (RCT_DEBUG) {
        RCTAssert(!events || [events isKindOfClass:[NSArray class]],
                  @"customDirectEventTypes must return an array, but %@ returned %@",
                  [manager class], [events class]);
      }
      for (NSString *eventName in events) {
        NSString *topName = RCTNormalizeInputEventName(eventName);
        if (!customDirectEventTypes[topName]) {
          customDirectEventTypes[topName] = @{
            @"registrationName": [topName stringByReplacingCharactersInRange:(NSRange){0, 3} withString:@"on"],
          };
        }
      }
    }
  };

  return customDirectEventTypes;
}

- (NSDictionary *)constantsToExport
{
  NSMutableDictionary *allJSConstants = [@{
    @"customBubblingEventTypes": [self bubblingEventsConfig],
    @"customDirectEventTypes": [self directEventsConfig],
    @"Dimensions": @{
      @"window": @{
        @"width": @(RCTScreenSize().width),
        @"height": @(RCTScreenSize().height),
        @"scale": @(RCTScreenScale()),
      },
      @"modalFullscreenView": @{
        @"width": @(RCTScreenSize().width),
        @"height": @(RCTScreenSize().height),
      },
    },
  } mutableCopy];

  [_componentDataByName enumerateKeysAndObjectsUsingBlock:
   ^(NSString *name, RCTComponentData *componentData, __unused BOOL *stop) {
    RCTViewManager *manager = componentData.manager;
    NSMutableDictionary *constantsNamespace =
     [NSMutableDictionary dictionaryWithDictionary:allJSConstants[name]];

    // Add custom constants
    // TODO: should these be inherited?
    NSDictionary *constants = RCTClassOverridesInstanceMethod([manager class], @selector(constantsToExport)) ? [manager constantsToExport] : nil;
    if (constants.count) {
      RCTAssert(constantsNamespace[@"Constants"] == nil , @"Cannot redefine Constants in namespace: %@", name);
      // add an additional 'Constants' namespace for each class
      constantsNamespace[@"Constants"] = constants;
    }

    // Add native props
    constantsNamespace[@"NativeProps"] = [componentData viewConfig];

    allJSConstants[name] = [constantsNamespace copy];
  }];
  return allJSConstants;
}

RCT_EXPORT_METHOD(configureNextLayoutAnimation:(NSDictionary *)config
                  withCallback:(RCTResponseSenderBlock)callback
                  errorCallback:(__unused RCTResponseSenderBlock)errorCallback)
{
  if (_nextLayoutAnimation && ![config isEqualToDictionary:_nextLayoutAnimation.config]) {
    RCTLogWarn(@"Warning: Overriding previous layout animation with new one before the first began:\n%@ -> %@.", _nextLayoutAnimation.config, config);
  }
  if (config[@"delete"] != nil) {
    RCTLogError(@"LayoutAnimation only supports create and update right now. Config: %@", config);
  }
  _nextLayoutAnimation = [[RCTLayoutAnimation alloc] initWithDictionary:config
                                                               callback:callback];
}

static UIView *_jsResponder;

+ (UIView *)JSResponder
{
  return _jsResponder;
}

@end

@implementation RCTBridge (RCTUIManager)

- (RCTUIManager *)uiManager
{
  return self.modules[RCTBridgeModuleNameForClass([RCTUIManager class])];
}

@end
