/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTComponentData.h"

#import <objc/message.h>

#import "RCTBridge.h"
#import "RCTShadowView.h"
#import "RCTViewManager.h"

typedef void (^RCTPropBlock)(id<RCTComponent> view, id json);

@interface RCTComponentProp : NSObject

@property (nonatomic, copy, readonly) NSString *type;
@property (nonatomic, copy) RCTPropBlock propBlock;

@end

@implementation RCTComponentProp

- (instancetype)initWithType:(NSString *)type
{
  if ((self = [super init])) {
    _type = [type copy];
  }
  return self;
}

@end

@implementation RCTComponentData
{
  id<RCTComponent> _defaultView;
  RCTShadowView *_defaultShadowView;
  NSMutableDictionary *_viewPropBlocks;
  NSMutableDictionary *_shadowPropBlocks;
}

- (instancetype)initWithManager:(RCTViewManager *)manager
{
  if ((self = [super init])) {
    _manager = manager;
    _viewPropBlocks = [NSMutableDictionary new];
    _shadowPropBlocks = [NSMutableDictionary new];

    _name = RCTBridgeModuleNameForClass([manager class]);
    RCTAssert(_name.length, @"Invalid moduleName '%@'", _name);
    if ([_name hasSuffix:@"Manager"]) {
      _name = [_name substringToIndex:_name.length - @"Manager".length];
    }
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (id<RCTComponent>)createViewWithTag:(NSNumber *)tag props:(NSDictionary *)props
{
  RCTAssertMainThread();

  id<RCTComponent> view = (id<RCTComponent>)(props ? [_manager viewWithProps:props] : [_manager view]);
  view.reactTag = tag;
  if ([view isKindOfClass:[UIView class]]) {
    ((UIView *)view).multipleTouchEnabled = YES;
    ((UIView *)view).userInteractionEnabled = YES; // required for touch handling
    ((UIView *)view).layer.allowsGroupOpacity = YES; // required for touch handling
  }
  return view;
}

- (RCTShadowView *)createShadowViewWithTag:(NSNumber *)tag
{
  RCTShadowView *shadowView = [_manager shadowView];
  shadowView.reactTag = tag;
  shadowView.viewName = _name;
  return shadowView;
}

- (RCTPropBlock)propBlockForKey:(NSString *)name defaultView:(id)defaultView
{
  BOOL shadowView = [defaultView isKindOfClass:[RCTShadowView class]];
  NSMutableDictionary *propBlocks = shadowView ? _shadowPropBlocks : _viewPropBlocks;
  RCTPropBlock propBlock = propBlocks[name];
  if (!propBlock) {

    __weak RCTComponentData *weakSelf = self;

    // Get type
    SEL type = NULL;
    NSString *keyPath = nil;
    SEL selector = NSSelectorFromString([NSString stringWithFormat:@"propConfig%@_%@", shadowView ? @"Shadow" : @"", name]);
    Class managerClass = [_manager class];
    if ([managerClass respondsToSelector:selector]) {
      NSArray *typeAndKeyPath = ((NSArray *(*)(id, SEL))objc_msgSend)(managerClass, selector);
      type = NSSelectorFromString([typeAndKeyPath[0] stringByAppendingString:@":"]);
      keyPath = typeAndKeyPath.count > 1 ? typeAndKeyPath[1] : nil;
    } else {
      propBlock = ^(__unused id view, __unused id json) {};
      propBlocks[name] = propBlock;
      return propBlock;
    }

    // Check for custom setter
    if ([keyPath isEqualToString:@"__custom__"]) {

      // Get custom setter
      SEL customSetter = NSSelectorFromString([NSString stringWithFormat:@"set_%@:for%@View:withDefaultView:", name, shadowView ? @"Shadow" : @""]);

      propBlock = ^(id<RCTComponent> view, id json) {
        ((void (*)(id, SEL, id, id, id))objc_msgSend)(
          weakSelf.manager, customSetter, json == (id)kCFNull ? nil : json, view, defaultView
        );
      };

    } else {

      // Disect keypath
      NSString *key = name;
      NSArray *parts = [keyPath componentsSeparatedByString:@"."];
      if (parts) {
        key = parts.lastObject;
        parts = [parts subarrayWithRange:(NSRange){0, parts.count - 1}];
      }

      // Get property getter
      SEL getter = NSSelectorFromString(key);

      // Get property setter
      SEL setter = NSSelectorFromString([NSString stringWithFormat:@"set%@%@:",
                                         [key substringToIndex:1].uppercaseString,
                                         [key substringFromIndex:1]]);

      // Build setter block
      void (^setterBlock)(id target, id source, id json) = nil;
      NSMethodSignature *typeSignature = [[RCTConvert class] methodSignatureForSelector:type];
      switch (typeSignature.methodReturnType[0]) {

#define RCT_CASE(_value, _type) \
        case _value: { \
          _type (*convert)(id, SEL, id) = (typeof(convert))objc_msgSend; \
          _type (*get)(id, SEL) = (typeof(get))objc_msgSend; \
          void (*set)(id, SEL, _type) = (typeof(set))objc_msgSend; \
          setterBlock = ^(id target, id source, id json) { \
            set(target, setter, json ? convert([RCTConvert class], type, json) : get(source, getter)); \
          }; \
          break; \
        }

          RCT_CASE(_C_SEL, SEL)
          RCT_CASE(_C_CHARPTR, const char *)
          RCT_CASE(_C_CHR, char)
          RCT_CASE(_C_UCHR, unsigned char)
          RCT_CASE(_C_SHT, short)
          RCT_CASE(_C_USHT, unsigned short)
          RCT_CASE(_C_INT, int)
          RCT_CASE(_C_UINT, unsigned int)
          RCT_CASE(_C_LNG, long)
          RCT_CASE(_C_ULNG, unsigned long)
          RCT_CASE(_C_LNG_LNG, long long)
          RCT_CASE(_C_ULNG_LNG, unsigned long long)
          RCT_CASE(_C_FLT, float)
          RCT_CASE(_C_DBL, double)
          RCT_CASE(_C_BOOL, BOOL)
          RCT_CASE(_C_PTR, void *)
          RCT_CASE(_C_ID, id)

        case _C_STRUCT_B:
        default: {

          NSInvocation *typeInvocation = [NSInvocation invocationWithMethodSignature:typeSignature];
          typeInvocation.selector = type;
          typeInvocation.target = [RCTConvert class];

          __block NSInvocation *sourceInvocation = nil;
          __block NSInvocation *targetInvocation = nil;

          setterBlock = ^(id target, id source, id json) { \

            // Get value
            void *value = malloc(typeSignature.methodReturnLength);
            if (json) {
              [typeInvocation setArgument:&json atIndex:2];
              [typeInvocation invoke];
              [typeInvocation getReturnValue:value];
            } else {
              if (!sourceInvocation && source) {
                NSMethodSignature *signature = [source methodSignatureForSelector:getter];
                sourceInvocation = [NSInvocation invocationWithMethodSignature:signature];
                sourceInvocation.selector = getter;
              }
              [sourceInvocation invokeWithTarget:source];
              [sourceInvocation getReturnValue:value];
            }

            // Set value
            if (!targetInvocation && target) {
              NSMethodSignature *signature = [target methodSignatureForSelector:setter];
              targetInvocation = [NSInvocation invocationWithMethodSignature:signature];
              targetInvocation.selector = setter;
            }
            [targetInvocation setArgument:value atIndex:2];
            [targetInvocation invokeWithTarget:target];
            free(value);
          };
          break;
        }
      }

      propBlock = ^(__unused id view, __unused id json) {

        // Follow keypath
        id target = view;
        for (NSString *part in parts) {
          target = [target valueForKey:part];
        }

        if (json == (id)kCFNull) {

          // Copy default property
          id source = defaultView;
          for (NSString *part in parts) {
            source = [source valueForKey:part];
          }
          setterBlock(target, source, nil);

        } else {

          // Set property with json
          setterBlock(target, nil, json);
        }
      };
    }

    if (RCT_DEBUG) {

      // Provide more useful log feedback if there's an error
      RCTPropBlock unwrappedBlock = propBlock;
      propBlock = ^(id<RCTComponent> view, id json) {
        NSString *logPrefix = [NSString stringWithFormat:
                               @"Error setting property '%@' of %@ with tag #%@: ",
                               name, weakSelf.name, view.reactTag];

        RCTPerformBlockWithLogPrefix(^{ unwrappedBlock(view, json); }, logPrefix);
      };
    }

    propBlocks[name] = [propBlock copy];
  }
  return propBlock;
}

- (void)setProps:(NSDictionary *)props forView:(id<RCTComponent>)view
{
  if (!view) {
    return;
  }

  if (!_defaultView) {
    _defaultView = [self createViewWithTag:nil props:nil];
  }

  [props enumerateKeysAndObjectsUsingBlock:^(NSString *key, id json, __unused BOOL *stop) {
    [self propBlockForKey:key defaultView:_defaultView](view, json);
  }];
}

- (void)setProps:(NSDictionary *)props forShadowView:(RCTShadowView *)shadowView
{
  if (!shadowView) {
    return;
  }

  if (!_defaultShadowView) {
    _defaultShadowView = [self createShadowViewWithTag:nil];
  }

  [props enumerateKeysAndObjectsUsingBlock:^(NSString *key, id json, __unused BOOL *stop) {
    [self propBlockForKey:key defaultView:_defaultShadowView](shadowView, json);
  }];

  [shadowView updateLayout];
}

- (NSDictionary *)viewConfig
{
  Class managerClass = [_manager class];
  NSMutableDictionary *propTypes = [NSMutableDictionary new];

  unsigned int count = 0;
  Method *methods = class_copyMethodList(object_getClass(managerClass), &count);
  for (unsigned int i = 0; i < count; i++) {
    Method method = methods[i];
    SEL selector = method_getName(method);
    NSString *methodName = NSStringFromSelector(selector);
    if ([methodName hasPrefix:@"propConfig"]) {
      NSRange nameRange = [methodName rangeOfString:@"_"];
      if (nameRange.length) {
        NSString *name = [methodName substringFromIndex:nameRange.location + 1];
        NSString *type = ((NSArray *(*)(id, SEL))objc_msgSend)(managerClass, selector)[0];
        if (RCT_DEBUG && propTypes[name] && ![propTypes[name] isEqualToString:type]) {
          RCTLogError(@"Property '%@' of component '%@' redefined from '%@' "
                      "to '%@'", name, _name, propTypes[name], type);
        }
        propTypes[name] = type;
      }
    }
  }
  free(methods);

  return propTypes;
}

@end
