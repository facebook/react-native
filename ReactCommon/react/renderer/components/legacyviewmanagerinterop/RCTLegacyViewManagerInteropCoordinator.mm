/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RCTLegacyViewManagerInteropCoordinator.h"
#include <React/RCTBridge+Private.h>
#include <React/RCTBridgeMethod.h>
#include <React/RCTComponentData.h>
#include <React/RCTEventDispatcherProtocol.h>
#include <React/RCTFollyConvert.h>
#include <React/RCTModuleData.h>
#include <React/RCTModuleMethod.h>
#include <React/RCTUIManager.h>
#include <React/RCTUIManagerUtils.h>
#include <React/RCTUtils.h>
#include <React/RCTWeakViewHolder.h>
#include <folly/json.h>
#include <objc/runtime.h>

using namespace facebook::react;

@implementation RCTLegacyViewManagerInteropCoordinator {
  RCTComponentData *_componentData;
  __weak RCTBridge *_bridge;
  /*
   Each instance of `RCTLegacyViewManagerInteropComponentView` registers a block to which events are dispatched.
   This is the container that maps unretained UIView pointer to a block to which the event is dispatched.
   */
  NSMutableDictionary<NSNumber *, InterceptorBlock> *_eventInterceptors;

  /*
   * In bridgeless mode, instead of using the bridge to look up RCTModuleData,
   * store that information locally.
   */
  NSMutableArray<id<RCTBridgeMethod>> *_moduleMethods;
  NSMutableDictionary<NSString *, id<RCTBridgeMethod>> *_moduleMethodsByName;
}

- (instancetype)initWithComponentData:(RCTComponentData *)componentData bridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _componentData = componentData;
    _bridge = bridge;

    _eventInterceptors = [NSMutableDictionary new];

    __weak __typeof(self) weakSelf = self;
    _componentData.eventInterceptor = ^(NSString *eventName, NSDictionary *event, NSNumber *reactTag) {
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        InterceptorBlock block = [strongSelf->_eventInterceptors objectForKey:reactTag];
        if (block) {
          block(std::string([RCTNormalizeInputEventName(eventName) UTF8String]), convertIdToFollyDynamic(event ?: @{}));
        }
      }
    };
  }
  return self;
}

- (void)addObserveForTag:(NSInteger)tag usingBlock:(InterceptorBlock)block
{
  [_eventInterceptors setObject:block forKey:[NSNumber numberWithInteger:tag]];
}

- (void)removeObserveForTag:(NSInteger)tag
{
  [_eventInterceptors removeObjectForKey:[NSNumber numberWithInteger:tag]];
}

- (UIView *)createPaperViewWithTag:(NSInteger)tag;
{
  UIView *view = [_componentData createViewWithTag:[NSNumber numberWithInteger:tag] rootTag:NULL];
  if ([_componentData.bridgelessViewManager conformsToProtocol:@protocol(RCTWeakViewHolder)]) {
    id<RCTWeakViewHolder> weakViewHolder = (id<RCTWeakViewHolder>)_componentData.bridgelessViewManager;
    if (!weakViewHolder.weakViews) {
      weakViewHolder.weakViews = [NSMapTable strongToWeakObjectsMapTable];
    }
    [weakViewHolder.weakViews setObject:view forKey:[NSNumber numberWithInteger:tag]];
  }
  return view;
}

- (void)setProps:(folly::dynamic const &)props forView:(UIView *)view
{
  NSDictionary<NSString *, id> *convertedProps = convertFollyDynamicToId(props);
  [_componentData setProps:convertedProps forView:view];
}

- (NSString *)componentViewName
{
  return RCTDropReactPrefixes(_componentData.name);
}

- (void)handleCommand:(NSString *)commandName args:(NSArray *)args reactTag:(NSInteger)tag
{
  Class managerClass = _componentData.managerClass;
  [self _lookupModuleMethodsIfNecessary];
  RCTModuleData *moduleData = [_bridge.batchedBridge moduleDataForName:RCTBridgeModuleNameForClass(managerClass)];
  id<RCTBridgeMethod> method;
  if ([commandName isKindOfClass:[NSNumber class]]) {
    method = moduleData ? moduleData.methods[[commandName intValue]] : _moduleMethods[[commandName intValue]];
  } else if ([commandName isKindOfClass:[NSString class]]) {
    method = moduleData ? moduleData.methodsByName[commandName] : _moduleMethodsByName[commandName];
    if (method == nil) {
      RCTLogError(@"No command found with name \"%@\"", commandName);
    }
  } else {
    RCTLogError(@"dispatchViewManagerCommand must be called with a string or integer command");
    return;
  }

  NSArray *newArgs = [@[ [NSNumber numberWithInteger:tag] ] arrayByAddingObjectsFromArray:args];

  if (_bridge) {
    [_bridge.batchedBridge
        dispatchBlock:^{
          [method invokeWithBridge:self->_bridge module:self->_componentData.manager arguments:newArgs];
          [self->_bridge.uiManager setNeedsLayout];
        }
                queue:RCTGetUIManagerQueue()];
  } else {
    // TODO T86826778 - Figure out which queue this should be dispatched to.
    [method invokeWithBridge:nil module:self->_componentData.manager arguments:newArgs];
  }
}

#pragma mark - Private

// This is copy-pasta from RCTModuleData.
- (void)_lookupModuleMethodsIfNecessary
{
  if (!_bridge && !_moduleMethods) {
    _moduleMethods = [NSMutableArray new];
    _moduleMethodsByName = [NSMutableDictionary new];

    unsigned int methodCount;
    Class cls = _componentData.managerClass;
    while (cls && cls != [NSObject class] && cls != [NSProxy class]) {
      Method *methods = class_copyMethodList(object_getClass(cls), &methodCount);

      for (unsigned int i = 0; i < methodCount; i++) {
        Method method = methods[i];
        SEL selector = method_getName(method);
        if ([NSStringFromSelector(selector) hasPrefix:@"__rct_export__"]) {
          IMP imp = method_getImplementation(method);
          auto exportedMethod = ((const RCTMethodInfo *(*)(id, SEL))imp)(_componentData.managerClass, selector);
          id<RCTBridgeMethod> moduleMethod =
              [[RCTModuleMethod alloc] initWithExportedMethod:exportedMethod moduleClass:_componentData.managerClass];
          [_moduleMethodsByName setValue:moduleMethod forKey:[NSString stringWithUTF8String:moduleMethod.JSMethodName]];
          [_moduleMethods addObject:moduleMethod];
        }
      }

      free(methods);
      cls = class_getSuperclass(cls);
    }
  }
}

@end
