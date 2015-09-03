// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

#import "RCTBridge.h"
#import "RCTImageLoader.h"
#import "RCTURLRequestHandler.h"

@interface RCTImageStoreManager : NSObject <RCTImageURLLoader>

/**
 * Set and get cached images. These must be called from the main thread.
 */
- (NSString *)storeImage:(UIImage *)image;
- (UIImage *)imageForTag:(NSString *)imageTag;

/**
 * Set and get cached images asynchronously. It is safe to call these from any
 * thread. The callbacks will be called on the main thread.
 */
- (void)storeImage:(UIImage *)image withBlock:(void (^)(NSString *imageTag))block;
- (void)getImageForTag:(NSString *)imageTag withBlock:(void (^)(UIImage *image))block;

@end

@interface RCTBridge (RCTImageStoreManager)

@property (nonatomic, readonly) RCTImageStoreManager *imageStoreManager;

@end
