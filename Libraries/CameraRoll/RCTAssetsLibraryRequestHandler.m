/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAssetsLibraryRequestHandler.h"

#import <stdatomic.h>
#import <dlfcn.h>
#import <objc/runtime.h>

#import <Photos/Photos.h>
#import <MobileCoreServices/MobileCoreServices.h>

#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

@implementation RCTAssetsLibraryRequestHandler

RCT_EXPORT_MODULE()

#pragma mark - RCTURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  if (![PHAsset class]) {
    return NO;
  }

  return [request.URL.scheme caseInsensitiveCompare:@"assets-library"] == NSOrderedSame
    || [request.URL.scheme caseInsensitiveCompare:@"ph"] == NSOrderedSame;
}

- (id)sendRequest:(NSURLRequest *)request
     withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  __block atomic_bool cancelled = ATOMIC_VAR_INIT(NO);
  void (^cancellationBlock)(void) = ^{
    atomic_store(&cancelled, YES);
  };
  
  if (!request.URL) {
    NSString *const msg = [NSString stringWithFormat:@"Cannot send request without URL"];
    [delegate URLRequest:cancellationBlock didCompleteWithError:RCTErrorWithMessage(msg)];
    return cancellationBlock;
  }
  
  PHFetchResult<PHAsset *> *fetchResult;
 
  if ([request.URL.scheme caseInsensitiveCompare:@"ph"] == NSOrderedSame) {
    // Fetch assets using PHAsset localIdentifier (recommended)
    NSString *const localIdentifier = [request.URL.absoluteString substringFromIndex:@"ph://".length];
    fetchResult = [PHAsset fetchAssetsWithLocalIdentifiers:@[localIdentifier] options:nil];
  } else if ([request.URL.scheme caseInsensitiveCompare:@"assets-library"] == NSOrderedSame) {
    // This is the older, deprecated way of fetching assets from assets-library
    // using the "assets-library://" protocol
    fetchResult = [PHAsset fetchAssetsWithALAssetURLs:@[request.URL] options:nil];
  } else {
    NSString *const msg = [NSString stringWithFormat:@"Cannot send request with unknown protocol: %@", request.URL];
    [delegate URLRequest:cancellationBlock didCompleteWithError:RCTErrorWithMessage(msg)];
    return cancellationBlock;
  }
  
  if (![fetchResult firstObject]) {
    NSString *errorMessage = [NSString stringWithFormat:@"Failed to load asset"
                              " at URL %@ with no error message.", request.URL];
    NSError *error = RCTErrorWithMessage(errorMessage);
    [delegate URLRequest:cancellationBlock didCompleteWithError:error];
    return cancellationBlock;
  }
  
  if (atomic_load(&cancelled)) {
    return cancellationBlock;
  }

  PHAsset *const _Nonnull asset = [fetchResult firstObject];

  // By default, allow downloading images from iCloud
  PHImageRequestOptions *const requestOptions = [PHImageRequestOptions new];
  requestOptions.networkAccessAllowed = YES;
  
  [[PHImageManager defaultManager] requestImageDataForAsset:asset
                                                    options:requestOptions
                                              resultHandler:^(NSData * _Nullable imageData,
                                                              NSString * _Nullable dataUTI,
                                                              UIImageOrientation orientation,
                                                              NSDictionary * _Nullable info) {
    NSError *const error = [info objectForKey:PHImageErrorKey];
    if (error) {
      [delegate URLRequest:cancellationBlock didCompleteWithError:error];
      return;
    }

    NSInteger const length = [imageData length];
    CFStringRef const dataUTIStringRef = (__bridge CFStringRef _Nonnull)(dataUTI);
    CFStringRef const mimeType = UTTypeCopyPreferredTagWithClass(dataUTIStringRef, kUTTagClassMIMEType);

    NSURLResponse *const response = [[NSURLResponse alloc] initWithURL:request.URL
                                                              MIMEType:(__bridge NSString *)(mimeType)
                                                 expectedContentLength:length
                                                      textEncodingName:nil];
    CFRelease(mimeType);
    
    [delegate URLRequest:cancellationBlock didReceiveResponse:response];
    
    [delegate URLRequest:cancellationBlock didReceiveData:imageData];
    [delegate URLRequest:cancellationBlock didCompleteWithError:nil];
  }];
  
  return cancellationBlock;
}

- (void)cancelRequest:(id)requestToken
{
  ((void (^)(void))requestToken)();
}

@end
