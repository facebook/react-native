/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageStoreManager.h"

#import "RCTAssert.h"
#import "RCTUtils.h"

@implementation RCTImageStoreManager
{
  NSMutableDictionary *_store;
  int *_id;
}

@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if ((self = [super init])) {

    // TODO: need a way to clear this store
    _store = [NSMutableDictionary new];
    _id = 0;
  }
  return self;
}

- (void)removeImageForTag:(NSString *)imageTag
{
  RCTAssertMainThread();
  [_store removeObjectForKey:imageTag];
}

- (NSString *)storeImage:(NSData *)image
{
  RCTAssertMainThread();
  NSString *tag = [NSString stringWithFormat:@"rct-image-store://%tu", _id];
  _id = _id + 1;
  _store[tag] = image;
  return tag;
}

- (NSData *)imageForTag:(NSString *)imageTag
{
  RCTAssertMainThread();
  return _store[imageTag];
}

- (void)removeImageForTag:(NSString *)imageTag withBlock:(void (^)())block
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self removeImageForTag:imageTag];
    if (block) {
      block();
    }
  });
}

- (void)storeImage:(NSData *)image withBlock:(void (^)(NSString *imageTag))block
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSString *imageTag = [self storeImage:image];
    if (block) {
      block(imageTag);
    }
  });
}

- (void)getImageForTag:(NSString *)imageTag withBlock:(void (^)(NSData *image))block
{
  RCTAssert(block != nil, @"block must not be nil");
  dispatch_async(dispatch_get_main_queue(), ^{
    block([self imageForTag:imageTag]);
  });
}

// TODO (#5906496): Name could be more explicit - something like getBase64EncodedJPEGDataForTag:?
RCT_EXPORT_METHOD(getBase64ForTag:(NSString *)imageTag
                  successCallback:(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback)
{
  [self getImageForTag:imageTag withBlock:^(NSData *image) {
    if (!image) {
      errorCallback(RCTErrorWithMessage([NSString stringWithFormat:@"Invalid imageTag: %@", imageTag]));
      return;
    }
    dispatch_async(_methodQueue, ^{
      NSString *base64 = [image base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithLineFeed];
      successCallback(@[[base64 stringByReplacingOccurrencesOfString:@"\n" withString:@""]]);
    });
  }];
}

RCT_EXPORT_METHOD(addImageFromBase64:(NSString *)base64String
                  successCallback:(RCTResponseSenderBlock)successCallback
                  errorCallback:(RCTResponseErrorBlock)errorCallback)

{
  NSData *image = [[NSData alloc] initWithBase64EncodedString:base64String options:0];
  if (image) {
    [self storeImage:image withBlock:^(NSString *imageTag) {
      successCallback(@[imageTag]);
    }];
  } else {
    errorCallback(RCTErrorWithMessage(@"Failed to add image from base64String"));
  }
}

#pragma mark - RCTImageLoader

- (BOOL)canLoadImageURL:(NSURL *)requestURL
{
  return [requestURL.scheme.lowercaseString isEqualToString:@"rct-image-store"];
}

- (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL size:(CGSize)size scale:(CGFloat)scale resizeMode:(UIViewContentMode)resizeMode progressHandler:(RCTImageLoaderProgressBlock)progressHandler completionHandler:(RCTImageLoaderCompletionBlock)completionHandler
{
  NSString *imageTag = imageURL.absoluteString;
  [self getImageForTag:imageTag withBlock:^(NSData *image) {
    if (image) {
      completionHandler(nil, [UIImage imageWithData:image]);
    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Unable to load image from image store: %@", imageTag];
      NSError *error = RCTErrorWithMessage(errorMessage);
      completionHandler(error, nil);
    }
  }];

  return nil;
}

@end

@implementation RCTBridge (RCTImageStoreManager)

- (RCTImageStoreManager *)imageStoreManager
{
  return self.modules[RCTBridgeModuleNameForClass([RCTImageStoreManager class])];
}

@end
