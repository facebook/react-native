// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>

#import "RCTJSMethodRegistrar.h"

@class RCTBridge;

/**
 * The type of a block that is capable of sending a response to a bridged
 * operation. Use this for returning callback methods to JS.
 */
typedef void (^RCTResponseSenderBlock)(NSArray *response);

/**
 * Provides the interface needed to register a bridge module.
 */
@protocol RCTBridgeModule <RCTJSMethodRegistrar>
@optional

/**
 * Optional initializer for modules that require access
 * to bridge features, such as sending events or making JS calls
 */
- (instancetype)initWithBridge:(RCTBridge *)bridge;

/**
 * The module name exposed to JS. If omitted, this will be inferred
 * automatically by using the native module's class name.
 */
+ (NSString *)moduleName;

/**
 * Place this macro inside the method body of any method you want to expose
 * to JS. The optional js_name argument will be used as the JS method name
 * (the method will be namespaced to the module name, as specified above).
 * If omitted, the JS method name will match the first part of the Objective-C
 * method selector name (up to the first colon).
 */
#define RCT_EXPORT(js_name) __attribute__((used, section("__DATA,RCTExport" \
))) static const char *__rct_export_entry__[] = { __func__, #js_name }

/**
 * Injects constants into JS. These constants are made accessible via
 * NativeModules.moduleName.X. Note that this method is not inherited when you
 * subclass a module, and you should not call [super constantsToExport] when
 * implementing it.
 */
+ (NSDictionary *)constantsToExport;

/**
 * Some "constants" are not really constant, and need to be re-generated
 * each time the bridge module is created. Support for this feature is
 * deprecated and may be going away or changing, but for now you can use
 * the -constantsToExport instance method to register these "pseudo-constants".
 */
- (NSDictionary *)constantsToExport;

/**
 * Notifies the module that a batch of JS method invocations has just completed.
 */
- (void)batchDidComplete;

@end
