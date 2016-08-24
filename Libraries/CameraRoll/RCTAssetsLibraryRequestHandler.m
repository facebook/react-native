/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAssetsLibraryRequestHandler.h"

#if !TARGET_OS_TV
#import <AssetsLibrary/AssetsLibrary.h>
#endif

#import <libkern/OSAtomic.h>
#import <MobileCoreServices/MobileCoreServices.h>

#import "RCTBridge.h"
#import "RCTUtils.h"

@implementation RCTAssetsLibraryRequestHandler

#if !TARGET_OS_TV
{
  ALAssetsLibrary *_assetsLibrary;
}
#endif //TARGET_OS_TV

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

#if !TARGET_OS_TV
- (ALAssetsLibrary *)assetsLibrary
{
  return _assetsLibrary ?: (_assetsLibrary = [ALAssetsLibrary new]);
}
#endif //TARGET_OS_TV

#pragma mark - RCTURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
#if TARGET_OS_TV
  return NO;
#else
  return [request.URL.scheme caseInsensitiveCompare:@"assets-library"] == NSOrderedSame;
#endif
}

- (id)sendRequest:(NSURLRequest *)request
     withDelegate:(id<RCTURLRequestDelegate>)delegate
{
#if TARGET_OS_TV
  return nil;
#else
  __block volatile uint32_t cancelled = 0;
  void (^cancellationBlock)(void) = ^{
    OSAtomicOr32Barrier(1, &cancelled);
  };

  [[self assetsLibrary] assetForURL:request.URL resultBlock:^(ALAsset *asset) {
    if (cancelled) {
      return;
    }

    if (asset) {

      ALAssetRepresentation *representation = [asset defaultRepresentation];
      NSInteger length = (NSInteger)representation.size;
      
        
      CFStringRef MIMEType = UTTypeCopyPreferredTagWithClass((__bridge CFStringRef _Nonnull)(representation.UTI), kUTTagClassMIMEType);

      NSURLResponse *response =
      [[NSURLResponse alloc] initWithURL:request.URL
                                MIMEType:(__bridge NSString *)(MIMEType)
                   expectedContentLength:length
                        textEncodingName:nil];

      [delegate URLRequest:cancellationBlock didReceiveResponse:response];

      NSError *error = nil;
      uint8_t *buffer = (uint8_t *)malloc((size_t)length);
      if ([representation getBytes:buffer
                        fromOffset:0
                            length:length
                             error:&error]) {

        NSData *data = [[NSData alloc] initWithBytesNoCopy:buffer
                                                    length:length
                                              freeWhenDone:YES];

        [delegate URLRequest:cancellationBlock didReceiveData:data];
        [delegate URLRequest:cancellationBlock didCompleteWithError:nil];

      } else {
        free(buffer);
        [delegate URLRequest:cancellationBlock didCompleteWithError:error];
      }

    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Failed to load asset"
                                " at URL %@ with no error message.", request.URL];
      NSError *error = RCTErrorWithMessage(errorMessage);
      [delegate URLRequest:cancellationBlock didCompleteWithError:error];
    }
  } failureBlock:^(NSError *loadError) {
    if (cancelled) {
      return;
    }
    [delegate URLRequest:cancellationBlock didCompleteWithError:loadError];
  }];

  return cancellationBlock;
#endif //TARGET_OS_TV
}

- (void)cancelRequest:(id)requestToken
{
  ((void (^)(void))requestToken)();
}

@end

@implementation RCTBridge (RCTAssetsLibraryImageLoader)

- (ALAssetsLibrary *)assetsLibrary
{
  return [[self moduleForClass:[RCTAssetsLibraryRequestHandler class]] assetsLibrary];
}

@end
