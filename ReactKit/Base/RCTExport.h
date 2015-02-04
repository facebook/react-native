// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

#import "RCTLog.h"

@class RCTBridge;
@class RCTSparseArray;
@class RCTUIManager;

typedef void (^RCTViewManagerUIBlock)(RCTUIManager *uiManager, RCTSparseArray *viewRegistry);

@class RCTEventDispatcher;
@class RCTShadowView;

/* ------------------------------------------------------------------- */
typedef struct {
  const char *func;
  const char *js_name;
} RCTExportEntry;

#define _RCTExportSegmentName "__DATA"
#define _RCTExportSectionName "RCTExport"

extern NSString *RCTExportedModuleNameAtSortedIndex(NSUInteger index);
extern NSDictionary *RCTExportedMethodsByModule(void);

extern BOOL RCTSetProperty(id target, NSString *keypath, id value);
extern BOOL RCTCopyProperty(id target, id source, NSString *keypath);
extern BOOL RCTCallSetter(id target, SEL setter, id value);
/* ------------------------------------------------------------------- */


/**
 * The type of a block that is capable of sending a response to a bridged
 * operation. Use this for returning callback methods to JS.
 */
typedef void (^RCTResponseSenderBlock)(NSArray *response);


/**
 * Provides minimal interface needed to register a bridge module
 */
@protocol RCTNativeModule <NSObject>
@optional

/**
 * Optional initializer for modules that require access
 * to bridge features, such as sending events or making JS calls
 */
- (instancetype)initWithBridge:(RCTBridge *)bridge;

/**
 * Place this macro inside the method body of any method you want
 * to expose to JS. The optional js_name argument will be used as
 * the JS function name. If omitted, the JS function name will match
 * the Objective-C method selector name, up to the first colon.
 */
#define RCT_EXPORT(js_name) __attribute__((used, section(_RCTExportSegmentName "," \
_RCTExportSectionName))) static const RCTExportEntry __rct_export_entry__ = { __func__, #js_name }

/**
 * The module name exposed to JS. If omitted, this will be inferred
 * automatically by using the native module's class name.
 */
+ (NSString *)moduleName;

/**
 * Injects constants into JS. These constants are made accessible via
 * NativeModules.moduleName.X. Note that this method is not inherited when you
 * subclass a module, and you should not call [super constantsToExport] when
 * implementing it.
 */
+ (NSDictionary *)constantsToExport;

/**
 * An array of JavaScript methods that the module will call via the
 * -[RCTBridge enqueueJSCall:args:] method. Each method should be specified
 * as a string of the form "JSModuleName.jsMethodName". Attempting to call a
 * method that has not been registered will result in an error. If a method
 * has already been regsistered by another module, it is not necessary to
 * register it again, but it is good pratice. Registering the same method
 * more than once is silently ignored and will not result in an error.
 */
+ (NSArray *)JSMethods;

/**
 * Notifies the module that a batch of JS method invocations has just completed.
 */
- (void)batchDidComplete;

@end


/**
 * Provides minimal interface needed to register a UIViewManager module
 */
@protocol RCTNativeViewModule <NSObject>

/**
 * Designated initializer for view modules. The event dispatched can either be
 * used directly by the module, or passed on to instantiated views for event handling.
 */
- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher;

/**
 * This method instantiates a native view to be managed by the module. The method
 * will be called many times, and should return a fresh instance each time. The
 * view module MUST NOT cache the returned view and return the same instance
 * for subsequent calls.
 */
- (UIView *)view;

@optional

/**
 * The module name exposed to JS. If omitted, this will be inferred
 * automatically by using the view module's class name.
 */
+ (NSString *)moduleName;

/**
 * This method instantiates a shadow view to be managed by the module. If omitted,
 * an ordinary RCTShadowView instance will be created. As with the -view method,
 * the -shadowView method should return a fresh instance each time it is called.
 */
- (RCTShadowView *)shadowView;

/**
 * Informal protocol for setting view and shadowView properties.
 * Implement methods matching these patterns to set any properties that
 * require special treatment (e.g. where the type or name cannot be inferred).
 *
 * - (void)set_<propertyName>:(id)property
 *                    forView:(UIView *)view
 *            withDefaultView:(UIView *)defaultView;
 *
 * - (void)set_<propertyName>:(id)property
 *              forShadowView:(RCTShadowView *)view
 *            withDefaultView:(RCTShadowView *)defaultView;
 *
 * For simple cases, use the macros below:
 */

/**
 * This handles the simple case, where JS and native property names match
 * And the type can be automatically inferred.
 */
#define RCT_EXPORT_VIEW_PROPERTY(name) \
RCT_REMAP_VIEW_PROPERTY(name, name)

/**
 * This macro maps a named property on the module to an arbitrary key path
 * within the view.
 */
#define RCT_REMAP_VIEW_PROPERTY(name, keypath)                                 \
- (void)set_##name:(id)json forView:(id)view withDefaultView:(id)defaultView { \
  if (json) {                                                                  \
    if(!RCTSetProperty(view, @#keypath, json)) { \
      RCTLogMustFix(@"%@ does not have setter for `%s` property", [view class], #name); \
    } \
  } else { \
    [view setValue:[defaultView valueForKeyPath:@#keypath] forKeyPath:@#keypath]; \
  } \
}

/**
 * These are useful in cases where the module's superclass handles a
 * property, but you wish to "unhandle" it, so it will be ignored.
 */
#define RCT_IGNORE_VIEW_PROPERTY(name) \
- (void)set_##name:(id)value forView:(id)view withDefaultView:(id)defaultView {}

#define RCT_IGNORE_SHADOW_PROPERTY(name) \
- (void)set_##name:(id)value forShadowView:(id)view withDefaultView:(id)defaultView {}

/**
 * Returns a dictionary of config data passed to JS that defines eligible events
 * that can be placed on native views. This should return bubbling
 * directly-dispatched event types and specify what names should be used to
 * subscribe to either form (bubbling/capturing).
 *
 * Returned dictionary should be of the form: @{
 *   @"onTwirl": {
 *     @"phasedRegistrationNames": @{
 *       @"bubbled": @"onTwirl",
 *       @"captured": @"onTwirlCaptured"
 *     }
 *   }
 * }
 *
 * Note that this method is not inherited when you subclass a view module, and
 * you should not call [super customBubblingEventTypes] when implementing it.
 */
+ (NSDictionary *)customBubblingEventTypes;

/**
 * Returns a dictionary of config data passed to JS that defines eligible events
 * that can be placed on native views. This should return non-bubbling
 * directly-dispatched event types.
 *
 * Returned dictionary should be of the form: @{
 *   @"onTwirl": {
 *     @"registrationName": @"onTwirl"
 *   }
 * }
 *
 * Note that this method is not inherited when you subclass a view module, and
 * you should not call [super customDirectEventTypes] when implementing it.
 */
+ (NSDictionary *)customDirectEventTypes;

/**
 * Injects constants into JS. These constants are made accessible via
 * NativeModules.moduleName.X. Note that this method is not inherited when you
 * subclass a view module, and you should not call [super constantsToExport]
 * when implementing it.
 */
+ (NSDictionary *)constantsToExport;

/**
 * To deprecate, hopefully
 */
- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(RCTSparseArray *)shadowViewRegistry;

@end
