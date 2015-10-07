/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTModuleData.h"

#import "RCTBridge.h"
#import "RCTModuleMethod.h"
#import "RCTLog.h"

@implementation RCTModuleData
{
  NSDictionary *_constants;
  NSArray *_methods;
  NSString *_queueName;
}

- (instancetype)initWithExecutor:(id<RCTJavaScriptExecutor>)javaScriptExecutor
                        moduleID:(NSNumber *)moduleID
                        instance:(id<RCTBridgeModule>)instance
{
  if ((self = [super init])) {
    _javaScriptExecutor = javaScriptExecutor;
    _moduleID = moduleID;
    _instance = instance;
    _moduleClass = [instance class];
    _name = RCTBridgeModuleNameForClass(_moduleClass);

    // Must be done at init time to ensure it's called on main thread
    RCTAssertMainThread();
    if ([_instance respondsToSelector:@selector(constantsToExport)]) {
      _constants = [_instance constantsToExport];
    }

    // Must be done at init time due to race conditions
    (void)self.queue;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init);

- (NSArray *)methods
{
  if (!_methods) {
    NSMutableArray *moduleMethods = [NSMutableArray new];

    if ([_instance respondsToSelector:@selector(methodsToExport)]) {
      [moduleMethods addObjectsFromArray:[_instance methodsToExport]];
    }

    unsigned int methodCount;
    Method *methods = class_copyMethodList(object_getClass(_moduleClass), &methodCount);

    for (unsigned int i = 0; i < methodCount; i++) {
      Method method = methods[i];
      SEL selector = method_getName(method);
      if ([NSStringFromSelector(selector) hasPrefix:@"__rct_export__"]) {
        IMP imp = method_getImplementation(method);
        NSArray *entries = ((NSArray *(*)(id, SEL))imp)(_moduleClass, selector);
        id<RCTBridgeMethod> moduleMethod =
        [[RCTModuleMethod alloc] initWithObjCMethodName:entries[1]
                                           JSMethodName:entries[0]
                                            moduleClass:_moduleClass];

        [moduleMethods addObject:moduleMethod];
      }
    }

    free(methods);

    _methods = [moduleMethods copy];
  }
  return _methods;
}

- (NSDictionary *)config
{
  NSMutableDictionary *config = [NSMutableDictionary new];
  config[@"moduleID"] = _moduleID;

  if (_constants) {
    config[@"constants"] = _constants;
  }

  NSMutableDictionary *methodconfig = [NSMutableDictionary new];
  [self.methods enumerateObjectsUsingBlock:^(id<RCTBridgeMethod> method, NSUInteger idx, __unused BOOL *stop) {
    methodconfig[method.JSMethodName] = @{
      @"methodID": @(idx),
      @"type": method.functionType == RCTFunctionTypePromise ? @"remoteAsync" : @"remote",
    };
  }];
  config[@"methods"] = [methodconfig copy];

  return [config copy];
}

- (dispatch_queue_t)queue
{
  if (!_queue) {
    BOOL implementsMethodQueue = [_instance respondsToSelector:@selector(methodQueue)];
    if (implementsMethodQueue) {
      _queue = _instance.methodQueue;
    }
    if (!_queue) {

      // Create new queue (store queueName, as it isn't retained by dispatch_queue)
      _queueName = [NSString stringWithFormat:@"com.facebook.React.%@Queue", _name];
      _queue = dispatch_queue_create(_queueName.UTF8String, DISPATCH_QUEUE_SERIAL);

      // assign it to the module
      if (implementsMethodQueue) {
        @try {
          [(id)_instance setValue:_queue forKey:@"methodQueue"];
        }
        @catch (NSException *exception) {
          RCTLogError(@"%@ is returning nil for it's methodQueue, which is not "
                      "permitted. You must either return a pre-initialized "
                      "queue, or @synthesize the methodQueue to let the bridge "
                      "create a queue for you.", _name);
        }
      }
    }
  }
  return _queue;
}

- (void)dispatchBlock:(dispatch_block_t)block
{
  [self dispatchBlock:block dispatchGroup:NULL];
}

- (void)dispatchBlock:(dispatch_block_t)block
        dispatchGroup:(dispatch_group_t)group
{
  if (self.queue == RCTJSThread) {
    [_javaScriptExecutor executeBlockOnJavaScriptQueue:block];
  } else if (self.queue) {
    if (group != NULL) {
      dispatch_group_async(group, self.queue, block);
    } else {
      dispatch_async(self.queue, block);
    }
  }
}

@end
