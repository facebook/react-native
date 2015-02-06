// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTUIManager.h"

#import <AVFoundation/AVFoundation.h>
#import <objc/message.h>
#import <pthread.h>

#import "Layout.h"
#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTRootView.h"
#import "RCTLog.h"
#import "RCTNavigator.h"
#import "RCTScrollableProtocol.h"
#import "RCTShadowView.h"
#import "RCTSparseArray.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "RCTViewNodeProtocol.h"
#import "RCTViewManager.h"
#import "UIView+ReactKit.h"

@class RCTAnimationConfig;

typedef void (^react_view_node_block_t)(id<RCTViewNodeProtocol>);

static void RCTTraverseViewNodes(id<RCTViewNodeProtocol> view, react_view_node_block_t block)
{
  if (view.reactTag) block(view);
  for (id<RCTViewNodeProtocol> subview in view.reactSubviews) {
    RCTTraverseViewNodes(subview, block);
  }
}

static NSDictionary *RCTViewModuleClasses(void)
{
  static NSMutableDictionary *modules;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    modules = [NSMutableDictionary dictionary];
    
    unsigned int classCount;
    Class *classes = objc_copyClassList(&classCount);
    for (unsigned int i = 0; i < classCount; i++) {
      
      Class cls = classes[i];
      
      if (!class_getSuperclass(cls)) {
        // Class has no superclass - it's probably something weird
        continue;
      }
      
      if (![cls isSubclassOfClass:[RCTViewManager class]]) {
        // Not a view module
        continue;
      }
      
      // Get module name
      NSString *moduleName = [cls moduleName];
      
      // Check module name is unique
      id existingClass = modules[moduleName];
      RCTCAssert(existingClass == Nil, @"Attempted to register view module class %@ "
        "for the name '%@', but name was already registered by class %@", cls, moduleName, existingClass);
      
      // Add to module list
      modules[moduleName] = cls;
    }
    
    free(classes);
  });
  
  return modules;
}

@implementation RCTUIManager
{
  // Root views are only mutated on the shadow queue
  NSDictionary *_viewManagers;
  NSMutableSet *_rootViewTags;
  NSMutableArray *_pendingUIBlocks;
  
  pthread_mutex_t _pendingUIBlocksMutex;
  NSDictionary *_nextLayoutAnimationConfig; // RCT thread only
  RCTResponseSenderBlock _nextLayoutAnimationCallback; // RCT thread only
  RCTResponseSenderBlock _layoutAnimationCallbackMT; // Main thread only
  
  NSMutableDictionary *_defaultShadowViews;
  NSMutableDictionary *_defaultViews;
  
  __weak RCTBridge *_bridge;
}

- (RCTViewManager *)_managerInstanceForViewWithModuleName:(NSString *)moduleName
{
  RCTViewManager *managerInstance = _viewManagers[moduleName];
  if (managerInstance == nil) {
    RCTLogWarn(@"No manager class found for view with module name \"%@\"", moduleName);
    managerInstance = [[RCTViewManager alloc] init];
  }
  return managerInstance;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if ((self = [super init])) {
  
    _bridge = bridge;
    pthread_mutex_init(&_pendingUIBlocksMutex, NULL);
    
    // Instantiate view managers
    NSMutableDictionary *viewManagers = [[NSMutableDictionary alloc] init];
    [RCTViewModuleClasses() enumerateKeysAndObjectsUsingBlock:^(NSString *moduleName, Class moduleClass, BOOL *stop) {
      viewManagers[moduleName] = [[moduleClass alloc] initWithEventDispatcher:_bridge.eventDispatcher];
    }];
    _viewManagers = viewManagers;
    
    _viewRegistry = [[RCTSparseArray alloc] init];
    _shadowViewRegistry = [[RCTSparseArray alloc] init];
    
    // Internal resources
    _pendingUIBlocks = [[NSMutableArray alloc] init];
    _rootViewTags = [[NSMutableSet alloc] init];
    
    _defaultShadowViews = [[NSMutableDictionary alloc] init];
    _defaultViews = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (instancetype)init
{
  RCT_NOT_DESIGNATED_INITIALIZER();
}

- (void)dealloc
{
  RCTAssert(!self.valid, @"must call -invalidate before -dealloc");
  pthread_mutex_destroy(&_pendingUIBlocksMutex);
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

  pthread_mutex_lock(&_pendingUIBlocksMutex);
  _pendingUIBlocks = nil;
  pthread_mutex_unlock(&_pendingUIBlocksMutex);
}

- (void)registerRootView:(RCTRootView *)rootView;
{
  RCTAssertMainThread();
  
  NSNumber *reactTag = rootView.reactTag;
  UIView *existingView = _viewRegistry[reactTag];
  RCTCAssert(existingView == nil || existingView == rootView,
             @"Expect all root views to have unique tag. Added %@ twice", reactTag);
  
  // Register view
  _viewRegistry[reactTag] = rootView;
  CGRect frame = rootView.frame;
  
  // Register shadow view
  dispatch_async(_bridge.shadowQueue, ^{
    
    RCTShadowView *shadowView = [[RCTShadowView alloc] init];
    shadowView.reactTag = reactTag;
    shadowView.frame = frame;
    shadowView.backgroundColor = [UIColor whiteColor];
    shadowView.reactRootView = YES; // can this just be inferred from the fact that it has no superview?
    _shadowViewRegistry[shadowView.reactTag] = shadowView;

    [_rootViewTags addObject:reactTag];
  });
}

/**
 * Unregisters views from registries
 */
- (void)_purgeChildren:(NSArray *)children fromRegistry:(RCTSparseArray *)registry
{
  for (id<RCTViewNodeProtocol> child in children) {
    RCTTraverseViewNodes(registry[child.reactTag], ^(id<RCTViewNodeProtocol> subview) {
      RCTAssert(![subview isReactRootView], @"Host views should not be unregistered");
      if ([subview conformsToProtocol:@protocol(RCTInvalidating)]) {
        [(id<RCTInvalidating>)subview invalidate];
      }
      registry[subview.reactTag] = nil;
    });
  }
}

- (void)addUIBlock:(RCTViewManagerUIBlock)block
{
  // This assert is fragile. This is temporary pending t4698600
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

  pthread_mutex_lock(&_pendingUIBlocksMutex);
  [_pendingUIBlocks addObject:[outerBlock copy]];
  pthread_mutex_unlock(&_pendingUIBlocksMutex);
}

- (void)setViewLayout:(UIView *)view withAnchorPoint:(CGPoint)anchorPoint position:(CGPoint)position bounds:(CGRect)bounds config:(RCTAnimationConfig *)config completion:(void (^)(BOOL finished))completion
{
  if (isnan(position.x) || isnan(position.y) ||
      isnan(bounds.origin.x) || isnan(bounds.origin.y) ||
      isnan(bounds.size.width) || isnan(bounds.size.height)) {
    RCTLogError(@"Invalid layout for (%zd)%@. position: %@. bounds: %@", [view reactTag], self, NSStringFromCGPoint(position), NSStringFromCGRect(bounds));
    return;
  }
  view.layer.anchorPoint = anchorPoint;
  view.layer.position = position;
  view.layer.bounds = bounds;
  completion(YES);
}


/**
 * TODO: `RCTBridge` has first class knowledge of this method. We should either:
 * 1. Require that the JS trigger this after a batch - almost like a flush.
 * 2. Build in support to the `<BatchedExports>` protocol so that each module
 * may return values to JS via a third callback function passed in, but can
 * return a tuple that is `(UIThreadBlocks, JSThreadBlocks)`.
 */
- (RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(RCTShadowView *)hostShadowView
{
  NSMutableSet *viewsWithNewFrames = [NSMutableSet setWithCapacity:1];

  // This is nuanced. In the JS thread, we create a new update buffer
  // `frameTags`/`frames` that is created/mutated in the JS thread. We access
  // these structures in the UI-thread block. `NSMutableArray` is not thread
  // safe so we rely on the fact that we never mutate it after it's passed to
  // the main thread. To help protect against mutation, we alias the variable to
  // a threadsafe `NSArray`, however the `NSArray` doesn't guarantee deep
  // immutability so we must be very careful.
  // https://developer.apple.com/library/mac/documentation/Cocoa/
  // Conceptual/Multithreading/ThreadSafetySummary/ThreadSafetySummary.html
  [hostShadowView collectRootUpdatedFrames:viewsWithNewFrames parentConstraint:CGSizeMake(CSS_UNDEFINED, CSS_UNDEFINED)];

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

  NSArray *immutableFrameReactTags = frameReactTags;
  NSArray *immutableFrames = frames;

  NSNumber *rootViewTag = hostShadowView.reactTag;
  return ^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry) {
    for (NSUInteger ii = 0; ii < immutableFrames.count; ii++) {
      NSNumber *reactTag = immutableFrameReactTags[ii];
      UIView *view = viewRegistry[reactTag];
      CGRect frame = [immutableFrames[ii] CGRectValue];

      // These frames are in terms of anchorPoint = topLeft, but internally the
      // views are anchorPoint = center for easier scale and rotation animations.
      // Convert the frame so it works with anchorPoint = center.
      __weak RCTUIManager *weakSelf = self;
      [self setViewLayout:view
          withAnchorPoint:CGPointMake(0.5, 0.5)
                 position:CGPointMake(CGRectGetMidX(frame), CGRectGetMidY(frame))
                   bounds:CGRectMake(0, 0, frame.size.width, frame.size.height)
                   config:/*!isNew ? _layoutAnimationConfigMT.updateConfig : */nil // TODO: !!!
               completion:^(BOOL finished) {
                 __strong RCTUIManager *strongSelf = weakSelf;
                 if (strongSelf->_layoutAnimationCallbackMT) {
                   strongSelf->_layoutAnimationCallbackMT(@[@(finished)]);
                 }
               }];
    }
    RCTRootView *rootView = _viewRegistry[rootViewTag];
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
  
  [self addUIBlock:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry) {
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

  id<RCTViewNodeProtocol> container = _viewRegistry[containerID];
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
  [self _purgeChildren:@[rootShadowView] fromRegistry:_shadowViewRegistry];
  [_rootViewTags removeObject:rootReactTag];

  [self addUIBlock:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry){
    RCTCAssertMainThread();
    UIView *rootView = viewRegistry[rootReactTag];
    [viewManager _purgeChildren:@[rootView] fromRegistry:viewRegistry];
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

  [self addUIBlock:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry){
    RCTCAssertMainThread();
    [viewManager _manageChildren:containerReactTag
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
    
    // For regular views we don't attempt to set properties
    // unless the view property has been explicitly exported.
    RCTCallPropertySetter(setter, obj, view, defaultView, manager);
  }];
}

static void RCTSetShadowViewProps(NSDictionary *props, RCTShadowView *shadowView,
                                  RCTShadowView *defaultView, RCTViewManager *manager)
{
  [props enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, BOOL *stop) {
    
    SEL setter = NSSelectorFromString([NSString stringWithFormat:@"set_%@:forShadowView:withDefaultView:", key]);
    
    // For shadow views we call any custom setter methods by default,
    // but if none is specified, we attempt to set property anyway.
    if (!RCTCallPropertySetter(setter, obj, shadowView, defaultView, manager)) {
      
      if (obj == [NSNull null]) {
        // Copy property from default view to current
        // Note: not just doing `[defaultView valueForKey:key]`, the
        // key may not exist, in which case we'd get an exception.
        RCTCopyProperty(shadowView, defaultView, key);
      } else {
        RCTSetProperty(shadowView, key, obj);
      }
    }
  }];
  
  // Update layout
  [shadowView updateShadowViewLayout];
}

- (void)createAndRegisterViewWithReactTag:(NSNumber *)reactTag
                               moduleName:(NSString *)moduleName
                                    props:(NSDictionary *)props
{
  RCT_EXPORT(createView);

  RCTViewManager *manager = [self _managerInstanceForViewWithModuleName:moduleName];

  // Generate default view, used for resetting default props
  if (!_defaultShadowViews[moduleName]) {
    _defaultShadowViews[moduleName] = [manager shadowView];
  }
  
  RCTShadowView *shadowView = [manager shadowView];
  shadowView.moduleName = moduleName;
  shadowView.reactTag = reactTag;
  RCTSetShadowViewProps(props, shadowView, _defaultShadowViews[moduleName], manager);
  _shadowViewRegistry[shadowView.reactTag] = shadowView;
  
  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    RCTCAssertMainThread();
    
    // Generate default view, used for resetting default props
    if (!uiManager->_defaultViews[moduleName]) {
      // Note the default is setup after the props are read for the first time ever
      // for this className - this is ok because we only use the default for restoring
      // defaults, which never happens on first creation.
      uiManager->_defaultViews[moduleName] = [manager view];
    }
    
    UIView *view = [manager view];
    if (view) {
      // Set required properties
      view.reactTag = reactTag;
      view.multipleTouchEnabled = YES;
      view.userInteractionEnabled = YES; // required for touch handling
      view.layer.allowsGroupOpacity = YES; // required for touch handling
      
      // Set custom properties
      RCTSetViewProps(props, view, uiManager->_defaultViews[moduleName], manager);
    }
    viewRegistry[view.reactTag] = view;
  }];
}

- (void)updateView:(NSNumber *)reactTag moduleName:(NSString *)moduleName props:(NSDictionary *)props
{
  RCT_EXPORT();

  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTViewManager *manager = [self _managerInstanceForViewWithModuleName:moduleName];
  RCTSetShadowViewProps(props, shadowView, _defaultShadowViews[moduleName], manager);
  
  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTCAssertMainThread();
    UIView *view = viewRegistry[reactTag];
    RCTSetViewProps(props, view, uiManager->_defaultViews[moduleName], manager);
  }];
}

- (void)becomeResponder:(NSNumber *)reactTag
{
  RCT_EXPORT(focus);

  if (!reactTag) return;
  [self addUIBlock:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry) {
    UIView *newResponder = viewRegistry[reactTag];
    [newResponder becomeFirstResponder];
  }];
}

- (void)resignResponder:(NSNumber *)reactTag
{
  RCT_EXPORT(blur);

  if (!reactTag) return;
  [self addUIBlock:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry){
    UIView *currentResponder = viewRegistry[reactTag];
    [currentResponder resignFirstResponder];
  }];
}

- (void)batchDidComplete
{
  // First copy the previous blocks into a temporary variable, then reset the
  // pending blocks to a new array. This guards against mutation while
  // processing the pending blocks in another thread.
  
  for (RCTViewManager *manager in _viewManagers.allValues) {
    RCTViewManagerUIBlock uiBlock = [manager uiBlockToAmendWithShadowViewRegistry:_shadowViewRegistry];
    if (uiBlock != nil) {
      [self addUIBlock:uiBlock];
    }
  }
  
  for (NSNumber *reactTag in _rootViewTags) {
    RCTShadowView *rootView = _shadowViewRegistry[reactTag];
    [self addUIBlock:[self uiBlockWithLayoutUpdateForRootView:rootView]];
    [self _amendPendingUIBlocksWithStylePropagationUpdateForRootView:rootView];
  }
  
  pthread_mutex_lock(&_pendingUIBlocksMutex);
  NSArray *previousPendingUIBlocks = _pendingUIBlocks;
  _pendingUIBlocks = [[NSMutableArray alloc] init];
  pthread_mutex_unlock(&_pendingUIBlocksMutex);
  
  dispatch_async(dispatch_get_main_queue(), ^{
    for (dispatch_block_t block in previousPendingUIBlocks) {
      block();
    }
  });
}

- (void)layoutRootShadowView:(RCTShadowView *)rootShadowView
{
  RCTViewManagerUIBlock uiBlock = [self uiBlockWithLayoutUpdateForRootView:rootShadowView];
  __weak RCTUIManager *weakViewManager = self;
  __weak RCTSparseArray *weakViewRegistry = _viewRegistry;
  dispatch_async(dispatch_get_main_queue(), ^{
    uiBlock(weakViewManager, weakViewRegistry);
  });
}

- (void)measure:(NSNumber *)reactTag callback:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  if (!callback) {
    RCTLogError(@"Called measure with no callback");
    return;
  }

  [self addUIBlock:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view) {
      RCTLogError(@"measure cannot find view with tag %zd", reactTag);
      return;
    }
    CGRect frame = view.frame;

    UIView *rootView = view;
    while (rootView && ![rootView isReactRootView]) {
      rootView = rootView.superview;
    }

    RCTCAssert([rootView isReactRootView], @"React view not inside RCTRootView");
    
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


- (void)requestSchedulingJavaScriptNavigation:(NSNumber *)reactTag
                                errorCallback:(RCTResponseSenderBlock)errorCallback
                                     callback:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  if (!callback || !errorCallback) {
    RCTLogError(@"Callback not provided for navigation scheduling.");
    return;
  }
  [self addUIBlock:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry){
    if (reactTag) {
      //TODO: This is nasty - why is RCTNavigator hard-coded?
      id rkObject = viewRegistry[reactTag];
      if ([rkObject isKindOfClass:[RCTNavigator class]]) {
        RCTNavigator *navigator = (RCTNavigator *)rkObject;
        BOOL wasAcquired = [navigator requestSchedulingJavaScriptNavigation];
        callback(@[@(wasAcquired)]);
      } else {
        NSString *msg =
          [NSString stringWithFormat: @"Cannot set lock: Tag %@ is not an RCTNavigator", reactTag];
        errorCallback(@[RCTAPIErrorObject(msg)]);
      }
    } else {
      NSString *msg = [NSString stringWithFormat: @"Tag not specified for requestSchedulingJavaScriptNavigation"];
      errorCallback(@[RCTAPIErrorObject(msg)]);
    }
  }];
}


/**
 * TODO: This could be modified to accept any `RCTViewNodeProtocol`, if
 * appropriate changes were made to that protocol to support `superview`
 * traversal - which is possibly more difficult than it sounds since a
 * `superview` is not a "react superview".
 */
+ (void)measureLayoutOnNodes:(RCTShadowView *)view
                    ancestor:(RCTShadowView *)ancestor
               errorCallback:(RCTResponseSenderBlock)errorCallback
                    callback:(RCTResponseSenderBlock)callback
{
  if (!view) {
    NSString *msg = [NSString stringWithFormat: @"Attempting to measure view that does not exist %@", view];
    errorCallback(@[RCTAPIErrorObject(msg)]);
    return;
  }
  if (!ancestor) {
    NSString *msg = [NSString stringWithFormat: @"Attempting to measure relative to ancestor that does not exist %@", ancestor];
    errorCallback(@[RCTAPIErrorObject(msg)]);
    return;
  }
  CGRect result = [RCTShadowView measureLayout:view relativeTo:ancestor];
  if (CGRectIsNull(result)) {
    NSString *msg = [NSString stringWithFormat: @"view %@ is not an decendant of %@", view, ancestor];
    errorCallback(@[RCTAPIErrorObject(msg)]);
    return;
  }
  CGFloat leftOffset = result.origin.x;
  CGFloat topOffset = result.origin.y;
  CGFloat width = result.size.width;
  CGFloat height = result.size.height;
  if (isnan(leftOffset) || isnan(topOffset) || isnan(width) || isnan(height)) {
    errorCallback(@[RCTAPIErrorObject(@"Attempted to measure layout but offset or dimensions were NaN")]);
    return;
  }
  callback(@[@(topOffset), @(leftOffset), @(width), @(height)]);
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
  [RCTUIManager measureLayoutOnNodes:shadowView ancestor:ancestorShadowView errorCallback:errorCallback callback:callback];
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
  [RCTUIManager measureLayoutOnNodes:shadowView ancestor:[shadowView superview] errorCallback:errorCallback callback:callback];
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
    NSString *msg = [NSString stringWithFormat: @"Attempting to measure view that does not exist %@", shadowView];
    errorCallback(@[RCTAPIErrorObject(msg)]);
    return;
  }
  NSArray *childShadowViews = [shadowView reactSubviews];
  NSMutableArray *results = [[NSMutableArray alloc] initWithCapacity:[childShadowViews count]];
  CGRect layoutRect = [RCTConvert CGRect:rect];
  
  for (int ii = 0; ii < [childShadowViews count]; ii++) {
    RCTShadowView *childShadowView = [childShadowViews objectAtIndex:ii];
    CGRect childLayout = [RCTShadowView measureLayout:childShadowView relativeTo:shadowView];
    if (CGRectIsNull(childLayout)) {
      NSString *msg = [NSString stringWithFormat: @"view %@ is not a decendant of %@", childShadowView, shadowView];
      errorCallback(@[RCTAPIErrorObject(msg)]);
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
      NSDictionary *result = @{@"index": @(ii),
                               @"left": @(leftOffset),
                               @"top": @(topOffset),
                               @"width": @(width),
                               @"height": @(height)};

      [results addObject:result];
    }
  }
  callback(@[results]);
}

- (void)setMainScrollViewTag:(NSNumber *)reactTag
{
  RCT_EXPORT();

  [self addUIBlock:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry){
    // - There should be at most one designated "main scroll view"
    // - There should be at most one designated "`nativeMainScrollDelegate`"
    // - The one designated main scroll view should have the one designated
    // `nativeMainScrollDelegate` set as its `nativeMainScrollDelegate`.
    if (viewManager.mainScrollView) {
      viewManager.mainScrollView.nativeMainScrollDelegate = nil;
    }
    if (reactTag) {
      id rkObject = viewRegistry[reactTag];
      if ([rkObject conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
        viewManager.mainScrollView = (id<RCTScrollableProtocol>)rkObject;
        ((id<RCTScrollableProtocol>)rkObject).nativeMainScrollDelegate = viewManager.nativeMainScrollDelegate;
      } else {
        RCTCAssert(NO, @"Tag %@ does not conform to RCTScrollableProtocol", reactTag);
      }
    } else {
      viewManager.mainScrollView = nil;
    }
  }];
}

- (void)scrollToOffsetWithView:(NSNumber *)reactTag scrollToOffsetX:(NSNumber *)offsetX offsetY:(NSNumber *)offsetY
{
  RCT_EXPORT(scrollTo);

  [self addUIBlock:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry){
    UIView *view = viewRegistry[reactTag];
    if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
      [(id<RCTScrollableProtocol>)view scrollToOffset:CGPointMake([offsetX floatValue], [offsetY floatValue])];
    } else {
      RCTLogError(@"tried to scrollToOffset: on non-RCTScrollableProtocol view %@ with tag %@", view, reactTag);
    }
  }];
}

- (void)zoomToRectWithView:(NSNumber *)reactTag rect:(NSDictionary *)rectDict
{
  RCT_EXPORT(zoomToRect);

  [self addUIBlock:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry){
    UIView *view = viewRegistry[reactTag];
    if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
      [(id<RCTScrollableProtocol>)view zoomToRect:[RCTConvert CGRect:rectDict] animated:YES];
    } else {
      RCTLogError(@"tried to zoomToRect: on non-RCTScrollableProtocol view %@ with tag %@", view, reactTag);
    }
  }];
}

- (void)getScrollViewContentSize:(NSNumber *)reactTag callback:(RCTResponseSenderBlock)callback failCallback:(RCTResponseSenderBlock)failCallback
{
  RCT_EXPORT();

  [self addUIBlock:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view) {
      NSString *error = [[NSString alloc] initWithFormat:@"cannot find view with tag %@", reactTag];
      RCTLogError(@"%@", error);
      failCallback(@[@{@"error": error}]);
      return;
    }

    CGSize size = ((id<RCTScrollableProtocol>)view).contentSize;
    NSDictionary *dict = @{@"width" : @(size.width), @"height" : @(size.height)};
    callback(@[dict]);
  }];
}

/**
 * JS sets what *it* considers to be the responder. Later, scroll views can use
 * this in order to determine if scrolling is appropriate.
 */
- (void)setJSResponder:(NSNumber *)reactTag
{
  RCT_EXPORT();

  [self addUIBlock:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry) {
    _jsResponder = viewRegistry[reactTag];
    if (!_jsResponder) {
      RCTLogMustFix(@"Invalid view set to be the JS responder - tag %zd", reactTag);
    }
  }];
}

- (void)clearJSResponder
{
  RCT_EXPORT();

  [self addUIBlock:^(RCTUIManager *viewManager, RCTSparseArray *viewRegistry) {
    _jsResponder = nil;
  }];
}

+ (NSDictionary *)allBubblingEventTypesConfigs
{
  NSMutableDictionary *customBubblingEventTypesConfigs = [@{
    // Bubble dispatched events
    @"topTap": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"notActuallyTapDontUseMe",
        @"captured": @"notActuallyTapCaptureDontUseMe"
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

  [RCTViewModuleClasses() enumerateKeysAndObjectsUsingBlock:^(NSString *name, Class cls, BOOL *stop) {
    if (RCTClassOverridesClassMethod(cls, @selector(customBubblingEventTypes))) {
      NSDictionary *eventTypes = [cls customBubblingEventTypes];
      for (NSString *eventName in eventTypes) {
        RCTCAssert(!customBubblingEventTypesConfigs[eventName], @"Event '%@' registered multiple times.", eventName);
      }
      [customBubblingEventTypesConfigs addEntriesFromDictionary:eventTypes];
    }
  }];

  return customBubblingEventTypesConfigs;
}

+ (NSDictionary *)allDirectEventTypesConfigs
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

  [RCTViewModuleClasses() enumerateKeysAndObjectsUsingBlock:^(NSString *name, Class cls, BOOL *stop) {
    if (RCTClassOverridesClassMethod(cls, @selector(customDirectEventTypes))) {
      NSDictionary *eventTypes = [cls customDirectEventTypes];
      for (NSString *eventName in eventTypes) {
        RCTCAssert(!customDirectEventTypes[eventName], @"Event '%@' registered multiple times.", eventName);
      }
      [customDirectEventTypes addEntriesFromDictionary:eventTypes];
    }
  }];

  return customDirectEventTypes;
}

+ (NSDictionary *)constantsToExport
{
  NSMutableDictionary *allJSConstants = [@{
    @"customBubblingEventTypes": [self allBubblingEventTypesConfigs],
    @"customDirectEventTypes": [self allDirectEventTypesConfigs],
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
        @"height": @(RCTScreenSize().width),
      },
    },
    @"StyleConstants": @{
      @"PointerEventsValues": @{
        @"none": @(RCTPointerEventsNone),
        @"boxNone": @(RCTPointerEventsBoxNone),
        @"boxOnly": @(RCTPointerEventsBoxOnly),
        @"unspecified": @(RCTPointerEventsUnspecified),
      },
    },
    @"UIText": @{
      @"AutocapitalizationType": @{
        @"AllCharacters": @(UITextAutocapitalizationTypeAllCharacters),
        @"Sentences": @(UITextAutocapitalizationTypeSentences),
        @"Words": @(UITextAutocapitalizationTypeWords),
        @"None": @(UITextAutocapitalizationTypeNone),
      },
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

  [RCTViewModuleClasses() enumerateKeysAndObjectsUsingBlock:^(NSString *name, Class cls, BOOL *stop) {
    // TODO: should these be inherited?
    NSDictionary *constants = RCTClassOverridesClassMethod(cls, @selector(constantsToExport)) ? [cls constantsToExport] : nil;
    if ([constants count]) {
      NSMutableDictionary *namespace = [NSMutableDictionary dictionaryWithDictionary:allJSConstants[name]];
      RCTAssert(namespace[@"Constants"] == nil , @"Cannot redefine Constants in namespace: %@", name);
      // add an additional 'Constants' namespace for each class
      namespace[@"Constants"] = constants;
      allJSConstants[name] = [namespace copy];
    }
  }];

  return allJSConstants;
}

- (void)configureNextLayoutAnimation:(NSDictionary *)config withCallback:(RCTResponseSenderBlock)callback errorCallback:(RCTResponseSenderBlock)errorCallback
{
  RCT_EXPORT();

  if (_nextLayoutAnimationCallback || _nextLayoutAnimationConfig) {
    RCTLogWarn(@"Warning: Overriding previous layout animation with new one before the first began:\n%@ -> %@.", _nextLayoutAnimationConfig, config);
  }
  if (config[@"delete"] != nil) {
    RCTLogError(@"LayoutAnimation only supports create and update right now.  Config: %@", config);
  }
  _nextLayoutAnimationConfig = config;
  _nextLayoutAnimationCallback = callback;
}

static UIView *_jsResponder;

+ (UIView *)JSResponder
{
  return _jsResponder;
}

@end
