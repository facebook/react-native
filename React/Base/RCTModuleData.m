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

- (instancetype)initWithExecutor:(id<RCTJavaScriptExecutor>)javaScriptExecutor
                             uid:(NSNumber *)uid
                        instance:(id<RCTBridgeModule>)instance
{
  if ((self = [super init])) {
    _javaScriptExecutor = javaScriptExecutor;
    _uid = uid;
    _instance = instance;
    _cls = [instance class];
    _name = RCTBridgeModuleNameForClass(_cls);

    [self loadMethods];
    [self generateConfig];
    [self setQueue];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-init);

- (void)loadMethods
{
  NSMutableArray *moduleMethods = [[NSMutableArray alloc] init];
  unsigned int methodCount;
  Method *methods = class_copyMethodList(object_getClass(_cls), &methodCount);

  for (unsigned int i = 0; i < methodCount; i++) {
    Method method = methods[i];
    SEL selector = method_getName(method);
    if ([NSStringFromSelector(selector) hasPrefix:@"__rct_export__"]) {
      IMP imp = method_getImplementation(method);
      NSArray *entries = ((NSArray *(*)(id, SEL))imp)(_cls, selector);
      RCTModuleMethod *moduleMethod =
      [[RCTModuleMethod alloc] initWithObjCMethodName:entries[1]
                                         JSMethodName:entries[0]
                                          moduleClass:_cls];

      [moduleMethods addObject:moduleMethod];
    }
  }

  free(methods);

  _methods = [moduleMethods copy];
}

- (void)generateConfig
{
  NSMutableDictionary *config = [[NSMutableDictionary alloc] init];
  config[@"moduleID"] = _uid;
  config[@"methods"] = [[NSMutableDictionary alloc] init];

  if ([_instance respondsToSelector:@selector(constantsToExport)]) {
    id consts = [_instance constantsToExport];
    if (consts) {
      config[@"constants"] = consts;
    }
  }

  [_methods enumerateObjectsUsingBlock:^(RCTModuleMethod *method, NSUInteger idx, __unused BOOL *stop) {
    config[@"methods"][method.JSMethodName] = @{
      @"methodID": @(idx),
      @"type": method.functionKind == RCTJavaScriptFunctionKindAsync ? @"remoteAsync" : @"remote",
    };
  }];

  _config = [config copy];
}

- (void)setQueue
{
  dispatch_queue_t queue = nil;
  BOOL implementsMethodQueue = [_instance respondsToSelector:@selector(methodQueue)];
  if (implementsMethodQueue) {
    queue = [_instance methodQueue];
  }
  if (!queue) {

    // Need to cache queueNames because they aren't retained by dispatch_queue
    static NSMutableDictionary *queueNames;
    if (!queueNames) {
      queueNames = [[NSMutableDictionary alloc] init];
    }
    NSString *queueName = queueNames[_name];
    if (!queueName) {
      queueName = [NSString stringWithFormat:@"com.facebook.React.%@Queue", _name];
      queueNames[_name] = queueName;
    }

    // Create new queue
    queue = dispatch_queue_create(queueName.UTF8String, DISPATCH_QUEUE_SERIAL);

    // assign it to the module
    if (implementsMethodQueue) {
      @try {
        [(id)_instance setValue:queue forKey:@"methodQueue"];
      }
      @catch (NSException *exception) {
        RCTLogError(@"%@ is returning nil for it's methodQueue, which is not "
                    "permitted. You must either return a pre-initialized "
                    "queue, or @synthesize the methodQueue to let the bridge "
                    "create a queue for you.", _name);
      }
    }
  }

  _queue = queue;
}

- (void)dispatchBlock:(dispatch_block_t)block
{
  [self dispatchBlock:block dispatchGroup:NULL];
}

- (void)dispatchBlock:(dispatch_block_t)block
        dispatchGroup:(dispatch_group_t)group
{
  if (_queue == RCTJSThread) {
    [_javaScriptExecutor executeBlockOnJavaScriptQueue:block];
  } else if (_queue) {
    if (group != NULL) {
      dispatch_group_async(group, _queue, block);
    } else {
      dispatch_async(_queue, block);
    }
  }
}

@end
