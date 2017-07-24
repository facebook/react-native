// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JSBase.h>
#import <React/RCTDefines.h>

#if RCT_DEV

@interface RCTInspectorDevServerHelper : NSObject

+ (void)connectForContext:(JSGlobalContextRef)context
            withBundleURL:(NSURL *)bundleURL;
@end

#endif
