/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class RCTBridge;

/**
 * The type of a block that is capable of sending a response to a bridged
 * operation. Use this for returning callback methods to JS.
 */
typedef void (^RCTResponseSenderBlock)(NSArray *response);

/**
 * Provides the interface needed to register a bridge module.
 */
@protocol RCTBridgeModule <NSObject>
@optional

/**
 * A reference to the RCTBridge. Useful for modules that require access
 * to bridge features, such as sending events or making JS calls. This
 * will be set automatically by the bridge when it initializes the module.
* To implement this in your module, just add @synthesize bridge = _bridge;
 */
@property (nonatomic, weak) RCTBridge *bridge;

/**
 * Place this macro in your class implementation to automatically register
 * your module with the bridge when it loads. The optional js_name argument
 * will be used as the JS module name. If omitted, the JS module name will
 * match the Objective-C class name.
 */
#define RCT_EXPORT_MODULE(js_name) \
  + (NSString *)moduleName { __attribute__((used, section("__DATA,RCTExportModule" \
  ))) static const char *__rct_export_entry__ = { __func__ }; return @#js_name; }

/**
 * Wrap the parameter line of your method implementation with this macro to
 * expose it to JS. By default the exposed method will match the first part of
 * the Objective-C method selector name (up to the first colon). Use
 * RCT_REMAP_METHOD to specify the JS name of the method.
 *
 * For example, in ModuleName.m:
 *
 * - (void)doSomething:(NSString *)aString withA:(NSInteger)a andB:(NSInteger)b
 * { ... }
 *
 * becomes
 *
 * RCT_EXPORT_METHOD(doSomething:(NSString *)aString
 *                   withA:(NSInteger)a
 *                   andB:(NSInteger)b)
 * { ... }
 *
 * and is exposed to JavaScript as `NativeModules.ModuleName.doSomething`.
 */
#define RCT_EXPORT_METHOD(method) \
  RCT_REMAP_METHOD(, method)

/**
 * Similar to RCT_EXPORT_METHOD but lets you set the JS name of the exported
 * method. Example usage:
 *
 * RCT_REMAP_METHOD(executeQueryWithParameters,
 *   executeQuery:(NSString *)query parameters:(NSDictionary *)parameters)
 * { ... }
 */
#define RCT_REMAP_METHOD(js_name, method) \
  RCT_EXTERN_REMAP_METHOD(js_name, method) \
  - (void)method

/**
 * Use this macro in a private Objective-C implementation file to automatically
 * register an external module with the bridge when it loads. This allows you to
 * register Swift or private Objective-C classes with the bridge.
 *
 * For example if one wanted to export a Swift class to the bridge:
 *
 * MyModule.swift:
 *
 *   @objc(MyModule) class MyModule: NSObject {
 *
 *     @objc func doSomething(string: String! withFoo a: Int, bar b: Int) { ... }
 *
 *   }
 *
 * MyModuleExport.m:
 *
 *   #import "RCTBridgeModule.h"
 *
 *   @interface RCT_EXTERN_MODULE(MyModule, NSObject)
 *
 *   RCT_EXTERN_METHOD(doSomething:(NSString *)string withFoo:(NSInteger)a bar:(NSInteger)b)
 *
 *   @end
 *
 * This will now expose MyModule and the method to JavaScript via
 * `NativeModules.MyModule.doSomething`
 */
#define RCT_EXTERN_MODULE(objc_name, objc_supername) \
  RCT_EXTERN_REMAP_MODULE(, objc_name, objc_supername)

/**
 * Similar to RCT_EXTERN_MODULE but allows setting a custom JavaScript name
 */
#define RCT_EXTERN_REMAP_MODULE(js_name, objc_name, objc_supername) \
  objc_name : objc_supername \
  @end \
  @interface objc_name (RCTExternModule) <RCTBridgeModule> \
  @end \
  @implementation objc_name (RCTExternModule) \
  RCT_EXPORT_MODULE(js_name)

/**
 * Use this macro in accordance with RCT_EXTERN_MODULE to export methods
 * of an external module.
 */
#define RCT_EXTERN_METHOD(method) \
  RCT_EXTERN_REMAP_METHOD(, method)

/**
 * Similar to RCT_EXTERN_REMAP_METHOD but allows setting a custom JavaScript name
 */
#define RCT_EXTERN_REMAP_METHOD(js_name, method) \
  - (void)__rct_export__##method { \
    __attribute__((used, section("__DATA,RCTExport"))) \
    __attribute__((__aligned__(1))) \
    static const char *__rct_export_entry__[] = { __func__, #method, #js_name }; \
  }

/**
 * Deprecated, do not use.
 */
#define RCT_EXPORT(js_name) \
  _Pragma("message(\"RCT_EXPORT is deprecated. Use RCT_EXPORT_METHOD instead.\")") \
  __attribute__((used, section("__DATA,RCTExport"))) \
  __attribute__((__aligned__(1))) \
  static const char *__rct_export_entry__[] = { __func__, #js_name, NULL }

/**
 * The queue that will be used to call all exported methods. If omitted, this
 * will call on the default background queue, which is avoids blocking the main
 * thread.
 *
 * If the methods in your module need to interact with UIKit methods, they will
 * probably need to call those on the main thread, as most of UIKit is main-
 * thread-only. You can tell React Native to call your module methods on the
 * main thread by returning a reference to the main queue, like this:
 *
 * - (dispatch_queue_t)methodQueue
 * {
 *   return dispatch_get_main_queue();
 * }
 *
 * If your methods perform heavy work such as synchronous filesystem or network
 * access, you probably don't want to block the default background queue, as
 * this will stall other methods. Instead, you should return a custom serial
 * queue, like this:
 *
 * - (dispatch_queue_t)methodQueue
 * {
 *   return dispatch_queue_create("com.mydomain.FileQueue", DISPATCH_QUEUE_SERIAL);
 * }
 *
 * Alternatively, if only some methods of the module should be executed on a
 * particular queue you can leave this method unimplemented, and simply
 * dispatch_async() to the required queue within the method itself.
 */
- (dispatch_queue_t)methodQueue;

/**
 * Injects constants into JS. These constants are made accessible via
 * NativeModules.ModuleName.X. This method is called when the module is
 * registered by the bridge. It is only called once for the lifetime of the
 * bridge, so it is not suitable for returning dynamic values, but may be
 * used for long-lived values such as session keys, that are regenerated only
 * as part of a reload of the entire React application.
 */
- (NSDictionary *)constantsToExport;

/**
 * Notifies the module that a batch of JS method invocations has just completed.
 */
- (void)batchDidComplete;

@end
