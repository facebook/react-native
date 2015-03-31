/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTUIManager.h"

#import <objc/message.h>

#import <AVFoundation/AVFoundation.h>

#import "Layout.h"
#import "RCTAnimationType.h"
#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTRootView.h"
#import "RCTScrollableProtocol.h"
#import "RCTShadowView.h"
#import "RCTSparseArray.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "RCTViewManager.h"
#import "RCTViewNodeProtocol.h"
#import "UIView+React.h"

typedef void (^react_view_node_block_t)(id<RCTViewNodeProtocol>);

static void RCTTraverseViewNodes(id<RCTViewNodeProtocol> view, react_view_node_block_t block)
{
  if (view.reactTag) block(view);
  for (id<RCTViewNodeProtocol> subview in view.reactSubviews) {
    RCTTraverseViewNodes(subview, block);
  }
}

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

static UIViewAnimationCurve UIViewAnimationCurveFromRCTAnimationType(RCTAnimationType type)
{
  switch (type) {
    case RCTAnimationTypeLinear:
      return UIViewAnimationCurveLinear;
    case RCTAnimationTypeEaseIn:
      return UIViewAnimationCurveEaseIn;
    case RCTAnimationTypeEaseOut:
      return UIViewAnimationCurveEaseOut;
    case RCTAnimationTypeEaseInEaseOut:
      return UIViewAnimationCurveEaseInOut;
    default:
      RCTLogError(@"Unsupported animation type %zd", type);
      return UIViewAnimationCurveEaseInOut;
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
      UIViewAnimationCurveFromRCTAnimationType(_animationType);

    [UIView animateWithDuration:_duration
                          delay:_delay
                        options:options
                     animations:animations
                     completion:completionBlock];
  }
}

@end

@interface RCTLayoutAnimation : NSObject

@property (nonatomic, strong) RCTAnimation *createAnimation;
@property (nonatomic, strong) RCTAnimation *updateAnimation;
@property (nonatomic, strong) RCTAnimation *deleteAnimation;
@property (nonatomic, strong) RCTResponseSenderBlock callback;

@end

@implementation RCTLayoutAnimation

- (instancetype)initWithDictionary:(NSDictionary *)config callback:(RCTResponseSenderBlock)callback
{
  if (!config) {
    return nil;
  }

  if ((self = [super init])) {

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
  NSMutableDictionary *_defaultShadowViews; // RCT thread only
  NSMutableDictionary *_defaultViews; // Main thread only
  NSDictionary *_viewManagers;
}

@synthesize bridge =_bridge;

/**
 * This function derives the view name automatically
 * from the module name.
 */
static NSString *RCTViewNameForModuleName(NSString *moduleName)
{
  NSString *name = moduleName;
  if ([name hasSuffix:@"Manager"]) {
    name = [name substringToIndex:name.length - @"Manager".length];
  }
  return name;
}

/**
 * This private constructor should only be called when creating
 * isolated UIImanager instances for testing. Normal initialization
 * is via -init:, which is called automatically by the bridge.
 */
- (instancetype)initWithShadowQueue:(dispatch_queue_t)shadowQueue
{
  if ((self = [self init])) {
    _shadowQueue = shadowQueue;
    _viewManagers = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (instancetype)init
{
  if ((self = [super init])) {

    _pendingUIBlocksLock = [[NSLock alloc] init];

    _defaultShadowViews = [[NSMutableDictionary alloc] init];
    _defaultViews = [[NSMutableDictionary alloc] init];

    _viewManagerRegistry = [[RCTSparseArray alloc] init];
    _shadowViewRegistry = [[RCTSparseArray alloc] init];
    _viewRegistry = [[RCTSparseArray alloc] init];

    // Internal resources
    _pendingUIBlocks = [[NSMutableArray alloc] init];
    _rootViewTags = [[NSMutableSet alloc] init];
  }
  return self;
}

- (void)dealloc
{
  RCTAssert(!self.valid, @"must call -invalidate before -dealloc");
}

- (void)setBridge:(RCTBridge *)bridge
{
  if (_bridge) {

    // Clear previous bridge data
    [self invalidate];
  }
  if (bridge) {

    _bridge = bridge;
    _shadowQueue = _bridge.shadowQueue;

    // Get view managers from bridge
    NSMutableDictionary *viewManagers = [[NSMutableDictionary alloc] init];
    [_bridge.modules enumerateKeysAndObjectsUsingBlock:^(NSString *moduleName, RCTViewManager *manager, BOOL *stop) {
      if ([manager isKindOfClass:[RCTViewManager class]]) {
        viewManagers[RCTViewNameForModuleName(moduleName)] = manager;
      }
    }];

    _viewManagers = [viewManagers copy];
  }
}

- (BOOL)isValid
{
  return _viewRegistry != nil;
}

- (void)invalidate
{
  RCTAssertMainThread();

  _viewRegistry = nil;
  _shadowViewRegistry = nil;
  _bridge = nil;

  [_pendingUIBlocksLock lock];
  _pendingUIBlocks = nil;
  [_pendingUIBlocksLock unlock];
}

- (void)registerRootView:(UIView *)rootView;
{
  RCTAssertMainThread();

  NSNumber *reactTag = rootView.reactTag;
  RCTAssert(RCTIsReactRootView(reactTag),
            @"View %@ with tag #%@ is not a root view", rootView, reactTag);

  UIView *existingView = _viewRegistry[reactTag];
  RCTCAssert(existingView == nil || existingView == rootView,
             @"Expect all root views to have unique tag. Added %@ twice", reactTag);

  // Register view
  _viewRegistry[reactTag] = rootView;
  CGRect frame = rootView.frame;

  // Register manager (TODO: should we do this, or leave it nil?)
  _viewManagerRegistry[reactTag] = _viewManagers[@"RCTView"];

  // Register shadow view
  dispatch_async(_shadowQueue, ^{

    RCTShadowView *shadowView = [[RCTShadowView alloc] init];
    shadowView.reactTag = reactTag;
    shadowView.frame = frame;
    shadowView.backgroundColor = [UIColor whiteColor];
    _shadowViewRegistry[shadowView.reactTag] = shadowView;

    [_rootViewTags addObject:reactTag];
  });
}

- (void)setFrame:(CGRect)frame forRootView:(UIView *)rootView
{
  RCTAssertMainThread();

  NSNumber *reactTag = rootView.reactTag;
  RCTAssert(RCTIsReactRootView(reactTag), @"Specified view %@ is not a root view", reactTag);

  dispatch_async(_bridge.shadowQueue, ^{
    RCTShadowView *rootShadowView = _shadowViewRegistry[reactTag];
    RCTAssert(rootShadowView != nil, @"Could not locate root view with tag %@", reactTag);
    rootShadowView.frame = frame;
    [rootShadowView updateLayout];

    RCTViewManagerUIBlock uiBlock = [self uiBlockWithLayoutUpdateForRootView:rootShadowView];
    [self addUIBlock:uiBlock];
    [self flushUIBlocks];
  });
}

/**
 * Unregisters views from registries
 */
- (void)_purgeChildren:(NSArray *)children fromRegistry:(RCTSparseArray *)registry
{
  for (id<RCTViewNodeProtocol> child in children) {
    RCTTraverseViewNodes(registry[child.reactTag], ^(id<RCTViewNodeProtocol> subview) {
      RCTAssert(![subview isReactRootView], @"Root views should not be unregistered");
      if ([subview conformsToProtocol:@protocol(RCTInvalidating)]) {
        [(id<RCTInvalidating>)subview invalidate];
      }
      registry[subview.reactTag] = nil;
    });
  }
}

- (void)addUIBlock:(RCTViewManagerUIBlock)block
{
  RCTAssert(![NSThread isMainThread], @"This method should only be called on the shadow thread");

  __weak RCTUIManager *weakViewManager = self;
  __weak RCTSparseArray *weakViewRegistry = _viewRegistry;
  dispatch_block_t outerBlock = ^{
    RCTUIManager *strongViewManager = weakViewManager;
    RCTSparseArray *strongViewRegistry = weakViewRegistry;
    if (strongViewManager && strongViewRegistry) {
      block(strongViewManager, strongViewRegistry);
    }
  };

  [_pendingUIBlocksLock lock];
  [_pendingUIBlocks addObject:outerBlock];
  [_pendingUIBlocksLock unlock];
}

- (RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(RCTShadowView *)rootShadowView
{
  RCTAssert(![NSThread isMainThread], @"This should never be executed on main thread.");

  NSMutableSet *viewsWithNewFrames = [NSMutableSet setWithCapacity:1];

  // This is nuanced. In the JS thread, we create a new update buffer
  // `frameTags`/`frames` that is created/mutated in the JS thread. We access
  // these structures in the UI-thread block. `NSMutableArray` is not thread
  // safe so we rely on the fact that we never mutate it after it's passed to
  // the main thread.
  [rootShadowView collectRootUpdatedFrames:viewsWithNewFrames
                          parentConstraint:(CGSize){CSS_UNDEFINED, CSS_UNDEFINED}];

  // Parallel arrays
  NSMutableArray *frameReactTags = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];
  NSMutableArray *frames = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];
  NSMutableArray *areNew = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];
  NSMutableArray *parentsAreNew = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];

  for (RCTShadowView *shadowView in viewsWithNewFrames) {
    [frameReactTags addObject:shadowView.reactTag];
    [frames addObject:[NSValue valueWithCGRect:shadowView.frame]];
    [areNew addObject:@(shadowView.isNewView)];
    [parentsAreNew addObject:@(shadowView.superview.isNewView)];
  }

  for (RCTShadowView *shadowView in viewsWithNewFrames) {
    // We have to do this after we build the parentsAreNew array.
    shadowView.newView = NO;
  }

  NSMutableArray *updateBlocks = [[NSMutableArray alloc] init];
  for (RCTShadowView *shadowView in viewsWithNewFrames) {
    RCTViewManager *manager = _viewManagerRegistry[shadowView.reactTag];
    RCTViewManagerUIBlock block = [manager uiBlockToAmendWithShadowView:shadowView];
    if (block) [updateBlocks addObject:block];
  }

  // Perform layout (possibly animated)
  NSNumber *rootViewTag = rootShadowView.reactTag;
  return ^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    for (NSUInteger ii = 0; ii < frames.count; ii++) {
      NSNumber *reactTag = frameReactTags[ii];
      UIView *view = viewRegistry[reactTag];
      CGRect frame = [frames[ii] CGRectValue];

      void (^completion)(BOOL finished) = ^(BOOL finished) {
        if (self->_layoutAnimation.callback) {
          self->_layoutAnimation.callback(@[@(finished)]);
        }
      };

      // Animate view update
      BOOL isNew = [areNew[ii] boolValue];
      RCTAnimation *updateAnimation = isNew ? nil: _layoutAnimation.updateAnimation;
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
      BOOL shouldAnimateCreation = isNew && ![parentsAreNew[ii] boolValue];
      RCTAnimation *createAnimation = _layoutAnimation.createAnimation;
      if (shouldAnimateCreation && createAnimation) {
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
     * Enumerate all active (attached to a parent) views and call
     * reactBridgeDidFinishTransaction on them if they implement it.
     * TODO: this is quite inefficient. If this was handled via the
     * ViewManager instead, it could be done more efficiently.
     */
    UIView *rootView = _viewRegistry[rootViewTag];
    RCTTraverseViewNodes(rootView, ^(id<RCTViewNodeProtocol> view) {
      if ([view respondsToSelector:@selector(reactBridgeDidFinishTransaction)]) {
        [view reactBridgeDidFinishTransaction];
      }
    });
  };
}

- (void)_amendPendingUIBlocksWithStylePropagationUpdateForRootView:(RCTShadowView *)topView
{
  NSMutableSet *applierBlocks = [NSMutableSet setWithCapacity:1];
  [topView collectUpdatedProperties:applierBlocks parentProperties:@{}];

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    for (RCTApplierBlock block in applierBlocks) {
      block(viewRegistry);
    }
  }];
}

/**
 * A method to be called from JS, which takes a container ID and then releases
 * all subviews for that container upon receipt.
 */
- (void)removeSubviewsFromContainerWithID:(NSNumber *)containerID
{
  RCT_EXPORT();

  id<RCTViewNodeProtocol> container = _shadowViewRegistry[containerID];
  RCTAssert(container != nil, @"container view (for ID %@) not found", containerID);

  NSUInteger subviewsCount = [[container reactSubviews] count];
  NSMutableArray *indices = [[NSMutableArray alloc] initWithCapacity:subviewsCount];
  for (NSInteger childIndex = 0; childIndex < subviewsCount; childIndex++) {
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
- (NSArray *)_childrenToRemoveFromContainer:(id<RCTViewNodeProtocol>)container
                                  atIndices:(NSArray *)atIndices
{
  // If there are no indices to move or the container has no subviews don't bother
  // We support parents with nil subviews so long as they're all nil so this allows for this behavior
  if ([atIndices count] == 0 || [[container reactSubviews] count] == 0) {
    return nil;
  }
  // Construction of removed children must be done "up front", before indices are disturbed by removals.
  NSMutableArray *removedChildren = [NSMutableArray arrayWithCapacity:atIndices.count];
  RCTCAssert(container != nil, @"container view (for ID %@) not found", container);
  for (NSInteger i = 0; i < [atIndices count]; i++) {
    NSInteger index = [atIndices[i] integerValue];
    if (index < [[container reactSubviews] count]) {
      [removedChildren addObject:[container reactSubviews][index]];
    }
  }
  if (removedChildren.count != atIndices.count) {
    RCTLogMustFix(@"removedChildren count (%tu) was not what we expected (%tu)", removedChildren.count, atIndices.count);
  }
  return removedChildren;
}

- (void)_removeChildren:(NSArray *)children fromContainer:(id<RCTViewNodeProtocol>)container
{
  for (id removedChild in children) {
    [container removeReactSubview:removedChild];
  }
}

- (void)removeRootView:(NSNumber *)rootReactTag
{
  RCT_EXPORT();

  RCTShadowView *rootShadowView = _shadowViewRegistry[rootReactTag];
  RCTAssert(rootShadowView.superview == nil, @"root view cannot have superview (ID %@)", rootReactTag);
  [self _purgeChildren:rootShadowView.reactSubviews fromRegistry:_shadowViewRegistry];
   _shadowViewRegistry[rootReactTag] = nil;
  [_rootViewTags removeObject:rootReactTag];

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    RCTCAssertMainThread();
    UIView *rootView = viewRegistry[rootReactTag];
    [uiManager _purgeChildren:rootView.reactSubviews fromRegistry:viewRegistry];
    viewRegistry[rootReactTag] = nil;
  }];
}

- (void)replaceExistingNonRootView:(NSNumber *)reactTag withView:(NSNumber *)newReactTag
{
  RCT_EXPORT();

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

- (void)manageChildren:(NSNumber *)containerReactTag
       moveFromIndices:(NSArray *)moveFromIndices
         moveToIndices:(NSArray *)moveToIndices
     addChildReactTags:(NSArray *)addChildReactTags
          addAtIndices:(NSArray *)addAtIndices
       removeAtIndices:(NSArray *)removeAtIndices
{
  RCT_EXPORT();

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
  id<RCTViewNodeProtocol> container = registry[containerReactTag];
  RCTAssert(moveFromIndices.count == moveToIndices.count, @"moveFromIndices had size %tu, moveToIndices had size %tu", moveFromIndices.count, moveToIndices.count);
  RCTAssert(addChildReactTags.count == addAtIndices.count, @"there should be at least one react child to add");

  // Removes (both permanent and temporary moves) are using "before" indices
  NSArray *permanentlyRemovedChildren = [self _childrenToRemoveFromContainer:container atIndices:removeAtIndices];
  NSArray *temporarilyRemovedChildren = [self _childrenToRemoveFromContainer:container atIndices:moveFromIndices];
  [self _removeChildren:permanentlyRemovedChildren fromContainer:container];
  [self _removeChildren:temporarilyRemovedChildren fromContainer:container];

  [self _purgeChildren:permanentlyRemovedChildren fromRegistry:registry];

  // TODO (#5906496): optimize all these loops - constantly calling array.count is not efficient

  // Figure out what to insert - merge temporary inserts and adds
  NSMutableDictionary *destinationsToChildrenToAdd = [NSMutableDictionary dictionary];
  for (NSInteger index = 0; index < temporarilyRemovedChildren.count; index++) {
    destinationsToChildrenToAdd[moveToIndices[index]] = temporarilyRemovedChildren[index];
  }
  for (NSInteger index = 0; index < addAtIndices.count; index++) {
    id view = registry[addChildReactTags[index]];
    if (view) {
      destinationsToChildrenToAdd[addAtIndices[index]] = view;
    }
  }

  NSArray *sortedIndices = [[destinationsToChildrenToAdd allKeys] sortedArrayUsingSelector:@selector(compare:)];
  for (NSNumber *reactIndex in sortedIndices) {
    [container insertReactSubview:destinationsToChildrenToAdd[reactIndex] atIndex:[reactIndex integerValue]];
  }
}

static BOOL RCTCallPropertySetter(SEL setter, id value, id view, id defaultView, RCTViewManager *manager)
{
  // TODO: cache respondsToSelector tests
  if ([manager respondsToSelector:setter]) {

    if (value == [NSNull null]) {
      value = nil;
    }

    ((void (*)(id, SEL, id, id, id))objc_msgSend)(manager, setter, value, view, defaultView);
    return YES;
  }
  return NO;
}

static void RCTSetViewProps(NSDictionary *props, UIView *view,
                            UIView *defaultView, RCTViewManager *manager)
{
  [props enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, BOOL *stop) {

    SEL setter = NSSelectorFromString([NSString stringWithFormat:@"set_%@:forView:withDefaultView:", key]);
    RCTCallPropertySetter(setter, obj, view, defaultView, manager);

  }];
}

static void RCTSetShadowViewProps(NSDictionary *props, RCTShadowView *shadowView,
                                  RCTShadowView *defaultView, RCTViewManager *manager)
{
  [props enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, BOOL *stop) {

    SEL setter = NSSelectorFromString([NSString stringWithFormat:@"set_%@:forShadowView:withDefaultView:", key]);
    RCTCallPropertySetter(setter, obj, shadowView, defaultView, manager);

  }];

  // Update layout
  [shadowView updateLayout];
}

- (void)createAndRegisterViewWithReactTag:(NSNumber *)reactTag
                                 viewName:(NSString *)viewName
                                    props:(NSDictionary *)props
{
  RCT_EXPORT(createView);

  RCTViewManager *manager = _viewManagers[viewName];
  if (manager == nil) {
    RCTLogWarn(@"No manager class found for view with module name \"%@\"", viewName);
    manager = [[RCTViewManager alloc] init];
  }

  // Register manager
  _viewManagerRegistry[reactTag] = manager;

  // Generate default view, used for resetting default props
  if (!_defaultShadowViews[viewName]) {
    _defaultShadowViews[viewName] = [manager shadowView];
  }

  RCTShadowView *shadowView = [manager shadowView];
  shadowView.viewName = viewName;
  shadowView.reactTag = reactTag;
  RCTSetShadowViewProps(props, shadowView, _defaultShadowViews[viewName], manager);
  _shadowViewRegistry[shadowView.reactTag] = shadowView;

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    RCTCAssertMainThread();

    // Generate default view, used for resetting default props
    if (!uiManager->_defaultViews[viewName]) {
      // Note the default is setup after the props are read for the first time ever
      // for this className - this is ok because we only use the default for restoring
      // defaults, which never happens on first creation.
      uiManager->_defaultViews[viewName] = [manager view];
    }

    UIView *view = [manager view];
    if (view) {

      // Set required properties
      view.reactTag = reactTag;
      view.multipleTouchEnabled = YES;
      view.userInteractionEnabled = YES; // required for touch handling
      view.layer.allowsGroupOpacity = YES; // required for touch handling

      // Set custom properties
      RCTSetViewProps(props, view, uiManager->_defaultViews[viewName], manager);
    }
    viewRegistry[view.reactTag] = view;
  }];
}

// TODO: remove viewName param as it isn't needed
- (void)updateView:(NSNumber *)reactTag viewName:(__unused NSString *)_ props:(NSDictionary *)props
{
  RCT_EXPORT();

  RCTViewManager *viewManager = _viewManagerRegistry[reactTag];
  NSString *viewName = RCTViewNameForModuleName([[viewManager class] moduleName]);

  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTSetShadowViewProps(props, shadowView, _defaultShadowViews[viewName], viewManager);

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    UIView *view = uiManager->_viewRegistry[reactTag];
    RCTSetViewProps(props, view, uiManager->_defaultViews[viewName], viewManager);
  }];
}

- (void)becomeResponder:(NSNumber *)reactTag
{
  RCT_EXPORT(focus);

  if (!reactTag) return;
  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    UIView *newResponder = viewRegistry[reactTag];
    [newResponder reactWillMakeFirstResponder];
    [newResponder becomeFirstResponder];
    [newResponder reactDidMakeFirstResponder];
  }];
}

- (void)resignResponder:(NSNumber *)reactTag
{
  RCT_EXPORT(blur);

  if (!reactTag) return;
  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    UIView *currentResponder = viewRegistry[reactTag];
    [currentResponder resignFirstResponder];
  }];
}

- (void)batchDidComplete
{
  // Gather blocks to be executed now that all view hierarchy manipulations have
  // been completed (note that these may still take place before layout has finished)
  for (RCTViewManager *manager in _viewManagers.allValues) {
    RCTViewManagerUIBlock uiBlock = [manager uiBlockToAmendWithShadowViewRegistry:_shadowViewRegistry];
    if (uiBlock) {
      [self addUIBlock:uiBlock];
    }
  }

  // Set up next layout animation
  if (_nextLayoutAnimation) {
    RCTLayoutAnimation *layoutAnimation = _nextLayoutAnimation;
    [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
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
    [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
      uiManager->_layoutAnimation = nil;
    }];
    _nextLayoutAnimation = nil;
  }

  [self flushUIBlocks];
}

- (void)flushUIBlocks
{
  RCTAssert(![NSThread isMainThread], @"Should be called on shadow thread");

  // First copy the previous blocks into a temporary variable, then reset the
  // pending blocks to a new array. This guards against mutation while
  // processing the pending blocks in another thread.
  [_pendingUIBlocksLock lock];
  NSArray *previousPendingUIBlocks = _pendingUIBlocks;
  _pendingUIBlocks = [[NSMutableArray alloc] init];
  [_pendingUIBlocksLock unlock];

  // Execute the previously queued UI blocks
  dispatch_async(dispatch_get_main_queue(), ^{
    for (dispatch_block_t block in previousPendingUIBlocks) {
      block();
    }
  });
}

- (void)measure:(NSNumber *)reactTag callback:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  if (!callback) {
    RCTLogError(@"Called measure with no callback");
    return;
  }

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view) {
      RCTLogError(@"measure cannot find view with tag %@", reactTag);
      return;
    }
    CGRect frame = view.frame;

    UIView *rootView = view;
    while (rootView && ![rootView isReactRootView]) {
      rootView = rootView.superview;
    }

    // TODO: this doesn't work because sometimes view is inside a modal window
    // RCTCAssert([rootView isReactRootView], @"React view is not inside a react root view");

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
    RCTLogError(@"Attempting to measure view that does not exist");
    return;
  }
  if (!ancestor) {
    RCTLogError(@"Attempting to measure relative to ancestor that does not exist");
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
- (void)measureLayout:(NSNumber *)reactTag
           relativeTo:(NSNumber *)ancestorReactTag
        errorCallback:(RCTResponseSenderBlock)errorCallback
             callback:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

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
- (void)measureLayoutRelativeToParent:(NSNumber *)reactTag
                        errorCallback:(RCTResponseSenderBlock)errorCallback
                             callback:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTMeasureLayout(shadowView, shadowView.reactSuperview, callback);
}

/**
 * Returns an array of computed offset layouts in a dictionary form. The layouts are of any react subviews
 * that are immediate descendants to the parent view found within a specified rect. The dictionary result
 * contains left, top, width, height and an index. The index specifies the position among the other subviews.
 * Only layouts for views that are within the rect passed in are returned. Invokes the error callback if the
 * passed in parent view does not exist. Invokes the supplied callback with the array of computed layouts.
 */
- (void)measureViewsInRect:(NSDictionary *)rect
                parentView:(NSNumber *)reactTag
             errorCallback:(RCTResponseSenderBlock)errorCallback
                  callback:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  if (!shadowView) {
    RCTLogError(@"Attempting to measure view that does not exist (tag #%@)", reactTag);
    return;
  }
  NSArray *childShadowViews = [shadowView reactSubviews];
  NSMutableArray *results = [[NSMutableArray alloc] initWithCapacity:[childShadowViews count]];
  CGRect layoutRect = [RCTConvert CGRect:rect];

  [childShadowViews enumerateObjectsUsingBlock:^(RCTShadowView *childShadowView, NSUInteger idx, BOOL *stop) {
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

    if (leftOffset <= layoutRect.origin.x + layoutRect.size.width &&
        leftOffset + width >= layoutRect.origin.x &&
        topOffset <= layoutRect.origin.y + layoutRect.size.height &&
        topOffset + height >= layoutRect.origin.y) {
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

- (void)setMainScrollViewTag:(NSNumber *)reactTag
{
  RCT_EXPORT();

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    // - There should be at most one designated "main scroll view"
    // - There should be at most one designated "`nativeMainScrollDelegate`"
    // - The one designated main scroll view should have the one designated
    // `nativeMainScrollDelegate` set as its `nativeMainScrollDelegate`.
    if (uiManager.mainScrollView) {
      uiManager.mainScrollView.nativeMainScrollDelegate = nil;
    }
    if (reactTag) {
      id rkObject = viewRegistry[reactTag];
      if ([rkObject conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
        uiManager.mainScrollView = (id<RCTScrollableProtocol>)rkObject;
        ((id<RCTScrollableProtocol>)rkObject).nativeMainScrollDelegate = uiManager.nativeMainScrollDelegate;
      } else {
        RCTCAssert(NO, @"Tag %@ does not conform to RCTScrollableProtocol", reactTag);
      }
    } else {
      uiManager.mainScrollView = nil;
    }
  }];
}

- (void)scrollToOffsetWithView:(NSNumber *)reactTag scrollToOffsetX:(NSNumber *)offsetX offsetY:(NSNumber *)offsetY
{
  RCT_EXPORT(scrollTo);

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    UIView *view = viewRegistry[reactTag];
    if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
      [(id<RCTScrollableProtocol>)view scrollToOffset:CGPointMake([offsetX floatValue], [offsetY floatValue]) animated:YES];
    } else {
      RCTLogError(@"tried to scrollToOffset: on non-RCTScrollableProtocol view %@ with tag %@", view, reactTag);
    }
  }];
}

- (void)scrollWithoutAnimationToOffsetWithView:(NSNumber *)reactTag scrollToOffsetX:(NSNumber *)offsetX offsetY:(NSNumber *)offsetY
{
    RCT_EXPORT(scrollWithoutAnimationTo);

    [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
        UIView *view = viewRegistry[reactTag];
        if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
            [(id<RCTScrollableProtocol>)view scrollToOffset:CGPointMake([offsetX floatValue], [offsetY floatValue]) animated:NO];
        } else {
            RCTLogError(@"tried to scrollToOffset: on non-RCTScrollableProtocol view %@ with tag %@", view, reactTag);
        }
    }];
}

- (void)zoomToRectWithView:(NSNumber *)reactTag rect:(NSDictionary *)rectDict
{
  RCT_EXPORT(zoomToRect);

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    UIView *view = viewRegistry[reactTag];
    if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
      [(id<RCTScrollableProtocol>)view zoomToRect:[RCTConvert CGRect:rectDict] animated:YES];
    } else {
      RCTLogError(@"tried to zoomToRect: on non-RCTScrollableProtocol view %@ with tag %@", view, reactTag);
    }
  }];
}

/**
 * JS sets what *it* considers to be the responder. Later, scroll views can use
 * this in order to determine if scrolling is appropriate.
 */
- (void)setJSResponder:(NSNumber *)reactTag
{
  RCT_EXPORT();

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    _jsResponder = viewRegistry[reactTag];
    if (!_jsResponder) {
      RCTLogError(@"Invalid view set to be the JS responder - tag %zd", reactTag);
    }
  }];
}

- (void)clearJSResponder
{
  RCT_EXPORT();

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    _jsResponder = nil;
  }];
}

// TODO: these event types should be distributed among the modules
// that declare them. Also, events should be registerable by any class
// that can call event handlers, not just UIViewManagers. This code
// also seems highly redundant - every event has the same properties.
- (NSDictionary *)customBubblingEventTypes
{
  NSMutableDictionary *customBubblingEventTypesConfigs = [@{
    // Bubble dispatched events
    @"topTap": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onPress",
        @"captured": @"onPressCapture"
      }
    },
    @"topVisibleCellsChange": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onVisibleCellsChange",
        @"captured": @"onVisibleCellsChangeCapture"
      }
    },
    @"topNavigateBack": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onNavigationComplete",
        @"captured": @"onNavigationCompleteCapture"
      }
    },
    @"topNavRightButtonTap": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onNavRightButtonTap",
        @"captured": @"onNavRightButtonTapCapture"
      }
    },
    @"topChange": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onChange",
        @"captured": @"onChangeCapture"
      }
    },
    @"topFocus": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onFocus",
        @"captured": @"onFocusCapture"
      }
    },
    @"topBlur": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onBlur",
        @"captured": @"onBlurCapture"
      }
    },
    @"topSubmitEditing": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onSubmitEditing",
        @"captured": @"onSubmitEditingCapture"
      }
    },
    @"topEndEditing": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onEndEditing",
        @"captured": @"onEndEditingCapture"
      }
    },
    @"topTextInput": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onTextInput",
        @"captured": @"onTextInputCapture"
      }
    },
    @"topTouchStart": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onTouchStart",
        @"captured": @"onTouchStartCapture"
      }
    },
    @"topTouchMove": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onTouchMove",
        @"captured": @"onTouchMoveCapture"
      }
    },
    @"topTouchCancel": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onTouchCancel",
        @"captured": @"onTouchCancelCapture"
      }
    },
    @"topTouchEnd": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onTouchEnd",
        @"captured": @"onTouchEndCapture"
      }
    },
  } mutableCopy];

  [_viewManagers enumerateKeysAndObjectsUsingBlock:^(NSString *name, RCTViewManager *manager, BOOL *stop) {
    if (RCTClassOverridesInstanceMethod([manager class], @selector(customBubblingEventTypes))) {
      NSDictionary *eventTypes = [manager customBubblingEventTypes];
      for (NSString *eventName in eventTypes) {
        RCTCAssert(!customBubblingEventTypesConfigs[eventName],
                   @"Event '%@' registered multiple times.", eventName);
      }
      [customBubblingEventTypesConfigs addEntriesFromDictionary:eventTypes];
    }
  }];

  return customBubblingEventTypesConfigs;
}

- (NSDictionary *)customDirectEventTypes
{
  NSMutableDictionary *customDirectEventTypes = [@{
    @"topScrollBeginDrag": @{
      @"registrationName": @"onScrollBeginDrag"
    },
    @"topScroll": @{
      @"registrationName": @"onScroll"
    },
    @"topScrollEndDrag": @{
      @"registrationName": @"onScrollEndDrag"
    },
    @"topScrollAnimationEnd": @{
      @"registrationName": @"onScrollAnimationEnd"
    },
    @"topSelectionChange": @{
      @"registrationName": @"onSelectionChange"
    },
    @"topMomentumScrollBegin": @{
      @"registrationName": @"onMomentumScrollBegin"
    },
    @"topMomentumScrollEnd": @{
      @"registrationName": @"onMomentumScrollEnd"
    },
    @"topPullToRefresh": @{
      @"registrationName": @"onPullToRefresh"
    },
    @"topLoadingStart": @{
      @"registrationName": @"onLoadingStart"
    },
    @"topLoadingFinish": @{
      @"registrationName": @"onLoadingFinish"
    },
    @"topLoadingError": @{
      @"registrationName": @"onLoadingError"
    },
  } mutableCopy];

  [_viewManagers enumerateKeysAndObjectsUsingBlock:^(NSString *name, RCTViewManager *manager, BOOL *stop) {
    if (RCTClassOverridesInstanceMethod([manager class], @selector(customDirectEventTypes))) {
      NSDictionary *eventTypes = [manager customDirectEventTypes];
      for (NSString *eventName in eventTypes) {
        RCTCAssert(!customDirectEventTypes[eventName], @"Event '%@' registered multiple times.", eventName);
      }
      [customDirectEventTypes addEntriesFromDictionary:eventTypes];
    }
  }];

  return customDirectEventTypes;
}

- (NSDictionary *)constantsToExport
{
  NSMutableDictionary *allJSConstants = [@{
    @"customBubblingEventTypes": [self customBubblingEventTypes],
    @"customDirectEventTypes": [self customDirectEventTypes],
    @"NSTextAlignment": @{
      @"Left": @(NSTextAlignmentLeft),
      @"Center": @(NSTextAlignmentCenter),
      @"Right": @(NSTextAlignmentRight),
    },
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
    @"StyleConstants": @{
      @"PointerEventsValues": @{
        @"none": @(RCTPointerEventsNone),
        @"box-none": @(RCTPointerEventsBoxNone),
        @"box-only": @(RCTPointerEventsBoxOnly),
        @"auto": @(RCTPointerEventsUnspecified),
      },
    },
    @"UIText": @{
      @"AutocapitalizationType": @{
        @"characters": @(UITextAutocapitalizationTypeAllCharacters),
        @"sentences": @(UITextAutocapitalizationTypeSentences),
        @"words": @(UITextAutocapitalizationTypeWords),
        @"none": @(UITextAutocapitalizationTypeNone),
      },
    },
    @"UITextField": @{
      @"clearButtonMode": @{
        @"never": @(UITextFieldViewModeNever),
        @"while-editing": @(UITextFieldViewModeWhileEditing),
        @"unless-editing": @(UITextFieldViewModeUnlessEditing),
        @"always": @(UITextFieldViewModeAlways),
      },
    },
    @"UIKeyboardType": @{
      @"default": @(UIKeyboardTypeDefault),
      @"ascii-capable": @(UIKeyboardTypeASCIICapable),
      @"numbers-and-punctuation": @(UIKeyboardTypeNumbersAndPunctuation),
      @"url": @(UIKeyboardTypeURL),
      @"number-pad": @(UIKeyboardTypeNumberPad),
      @"phone-pad": @(UIKeyboardTypePhonePad),
      @"name-phone-pad": @(UIKeyboardTypeNamePhonePad),
      @"decimal-pad": @(UIKeyboardTypeDecimalPad),
      @"email-address": @(UIKeyboardTypeEmailAddress),
      @"twitter": @(UIKeyboardTypeTwitter),
      @"web-search": @(UIKeyboardTypeWebSearch),
    },
    @"UIReturnKeyType": @{
      @"default": @(UIReturnKeyDefault),
      @"go": @(UIReturnKeyGo),
      @"google": @(UIReturnKeyGoogle),
      @"join": @(UIReturnKeyJoin),
      @"next": @(UIReturnKeyNext),
      @"route": @(UIReturnKeyRoute),
      @"search": @(UIReturnKeySearch),
      @"send": @(UIReturnKeySend),
      @"yahoo": @(UIReturnKeyYahoo),
      @"done": @(UIReturnKeyDone),
      @"emergency-call": @(UIReturnKeyEmergencyCall),
    },
    @"UIView": @{
      @"ContentMode": @{
        @"ScaleToFill": @(UIViewContentModeScaleToFill),
        @"ScaleAspectFit": @(UIViewContentModeScaleAspectFit),
        @"ScaleAspectFill": @(UIViewContentModeScaleAspectFill),
        @"Redraw": @(UIViewContentModeRedraw),
        @"Center": @(UIViewContentModeCenter),
        @"Top": @(UIViewContentModeTop),
        @"Bottom": @(UIViewContentModeBottom),
        @"Left": @(UIViewContentModeLeft),
        @"Right": @(UIViewContentModeRight),
        @"TopLeft": @(UIViewContentModeTopLeft),
        @"TopRight": @(UIViewContentModeTopRight),
        @"BottomLeft": @(UIViewContentModeBottomLeft),
        @"BottomRight": @(UIViewContentModeBottomRight),
      },
    },
  } mutableCopy];

  [_viewManagers enumerateKeysAndObjectsUsingBlock:^(NSString *name, RCTViewManager *manager, BOOL *stop) {
    // TODO: should these be inherited?
    NSDictionary *constants = RCTClassOverridesInstanceMethod([manager class], @selector(constantsToExport)) ? [manager constantsToExport] : nil;
    if (constants.count) {
      NSMutableDictionary *constantsNamespace = [NSMutableDictionary dictionaryWithDictionary:allJSConstants[name]];
      RCTAssert(constantsNamespace[@"Constants"] == nil , @"Cannot redefine Constants in namespace: %@", name);
      // add an additional 'Constants' namespace for each class
      constantsNamespace[@"Constants"] = constants;
      allJSConstants[name] = [constantsNamespace copy];
    }
  }];

  return allJSConstants;
}

- (void)configureNextLayoutAnimation:(NSDictionary *)config
                        withCallback:(RCTResponseSenderBlock)callback
                       errorCallback:(RCTResponseSenderBlock)errorCallback
{
  RCT_EXPORT();

  if (_nextLayoutAnimation) {
    RCTLogWarn(@"Warning: Overriding previous layout animation with new one before the first began:\n%@ -> %@.",
               _nextLayoutAnimation, config);
  }
  if (config[@"delete"] != nil) {
    RCTLogError(@"LayoutAnimation only supports create and update right now. Config: %@", config);
  }
  _nextLayoutAnimation = [[RCTLayoutAnimation alloc] initWithDictionary:config callback:callback];
}

- (void)startOrResetInteractionTiming
{
  RCT_EXPORT();

  NSSet *rootViewTags = [_rootViewTags copy];
  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    for (NSNumber *reactTag in rootViewTags) {
      id rootView = viewRegistry[reactTag];
      if ([rootView respondsToSelector:@selector(startOrResetInteractionTiming)]) {
        [rootView startOrResetInteractionTiming];
      }
    }
  }];
}

- (void)endAndResetInteractionTiming:(RCTResponseSenderBlock)onSuccess
                       onError:(RCTResponseSenderBlock)onError
{
  RCT_EXPORT();

  NSSet *rootViewTags = [_rootViewTags copy];
  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    NSMutableDictionary *timingData = [[NSMutableDictionary alloc] init];
    for (NSNumber *reactTag in rootViewTags) {
      id rootView = viewRegistry[reactTag];
      if ([rootView respondsToSelector:@selector(endAndResetInteractionTiming)]) {
        timingData[reactTag.stringValue] = [rootView endAndResetInteractionTiming];
      }
    }
    onSuccess(@[ timingData ]);
  }];
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
  return self.modules[NSStringFromClass([RCTUIManager class])];
}

@end
