// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

#import "RCTBridgeModule.h"
#import "RCTConvert.h"
#import "RCTLog.h"

@class RCTBridge;
@class RCTEventDispatcher;
@class RCTShadowView;
@class RCTSparseArray;
@class RCTUIManager;

typedef void (^RCTViewManagerUIBlock)(RCTUIManager *uiManager, RCTSparseArray *viewRegistry);

@interface RCTViewManager : NSObject <RCTBridgeModule>

/**
 * The bridge can be used to access both the RCTUIIManager and the RCTEventDispatcher,
 * allowing the manager (or the views that it manages) to manipulate the view
 * hierarchy and send events back to the JS context.
 */
@property (nonatomic, strong) RCTBridge *bridge;

/**
 * The event dispatcher is used to send events back to the JavaScript application.
 * It can either be used directly by the module, or passed on to instantiated
 * view subclasses so that they can handle their own events.
 */
// TODO: remove this, as it can be accessed directly from bridge
@property (nonatomic, readonly) RCTEventDispatcher *eventDispatcher;

/**
 * The module name exposed to React JS. If omitted, this will be inferred
 * automatically by using the view module's class name. It is better to not
 * override this, and just follow standard naming conventions for your view
 * module subclasses.
 */
+ (NSString *)moduleName;

/**
 * This method instantiates a native view to be managed by the module. Override
 * this to return a custom view instance, which may be preconfigured with default
 * properties, subviews, etc. This method will be called many times, and should
 * return a fresh instance each time. The view module MUST NOT cache the returned
 * view and return the same instance for subsequent calls.
 */
- (UIView *)view;

/**
 * This method instantiates a shadow view to be managed by the module. If omitted,
 * an ordinary RCTShadowView instance will be created, which is typically fine for
 * most view types. As with the -view method, the -shadowView method should return
 * a fresh instance each time it is called.
 */
- (RCTShadowView *)shadowView;

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
 * you should not call [super customBubblingEventTypes] when overriding it.
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
 * you should not call [super customDirectEventTypes] when overriding it.
 */
+ (NSDictionary *)customDirectEventTypes;

/**
 * Called to notify manager that layout has finished, in case any calculated
 * properties need to be copied over from shadow view to view.
 */
- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(RCTShadowView *)shadowView;

/**
 * Called after view hierarchy manipulation has finished, and all shadow props
 * have been set, but before layout has been performed. Useful for performing
 * custo  layout logic or tasks that involve walking the view hierarchy.
 * To be deprecated, hopefully.
 */
- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(RCTSparseArray *)shadowViewRegistry;

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
  if ((json && !RCTSetProperty(view, @#keypath, json)) ||                      \
      (!json && !RCTCopyProperty(view, defaultView, @#keypath))) {             \
    RCTLogError(@"%@ does not have setter for `%s` property", [view class], #name); \
  } \
}

/**
 * These macros can be used when you need to provide custom logic for setting
 * view properties. The macro should be followed by a method body, which can
 * refer to "json", "view" and "defaultView" to implement the required logic.
 */
#define RCT_CUSTOM_VIEW_PROPERTY(name, viewType) \
- (void)set_##name:(id)json forView:(viewType)view withDefaultView:(viewType)defaultView

#define RCT_CUSTOM_SHADOW_PROPERTY(name, viewType) \
- (void)set_##name:(id)json forShadowView:(viewType)view withDefaultView:(viewType)defaultView

/**
 * These are useful in cases where the module's superclass handles a
 * property, but you wish to "unhandle" it, so it will be ignored.
 */
#define RCT_IGNORE_VIEW_PROPERTY(name) \
- (void)set_##name:(id)value forView:(id)view withDefaultView:(id)defaultView {}

#define RCT_IGNORE_SHADOW_PROPERTY(name) \
- (void)set_##name:(id)value forShadowView:(id)view withDefaultView:(id)defaultView {}

@end
