/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


#import "RCTFileReaderModule.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>

#import "RCTBlobManager.h"


@implementation RCTFileReaderModule

RCT_EXPORT_MODULE(FileReaderModule)

@synthesize bridge = _bridge;

RCT_EXPORT_METHOD(readAsText:(NSDictionary<NSString *, id> *)blob
                  encoding:(NSString *)encoding
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  RCTBlobManager *blobManager = [[self bridge] moduleForClass:[RCTBlobManager class]];
  NSData *data = [blobManager resolve:blob];

  if (data == nil) {
    reject(RCTErrorUnspecified,
           [NSString stringWithFormat:@"Unable to resolve data for blob: %@", [RCTConvert NSString:blob[@"blobId"]]], nil);
  } else {
    NSStringEncoding stringEncoding;

    if (encoding == nil) {
      stringEncoding = NSUTF8StringEncoding;
    } else {
      stringEncoding = CFStringConvertEncodingToNSStringEncoding(CFStringConvertIANACharSetNameToEncoding((CFStringRef) encoding));
    }

    NSString *text = [[NSString alloc] initWithData:data encoding:stringEncoding];

    resolve(text);
  }
}

RCT_EXPORT_METHOD(readAsDataURL:(NSDictionary<NSString *, id> *)blob
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
  RCTBlobManager *blobManager = [[self bridge] moduleForClass:[RCTBlobManager class]];
  NSData *data = [blobManager resolve:blob];

  if (data == nil) {
    reject(RCTErrorUnspecified,
           [NSString stringWithFormat:@"Unable to resolve data for blob: %@", [RCTConvert NSString:blob[@"blobId"]]], nil);
  } else {
    NSString *type = [RCTConvert NSString:blob[@"type"]];
    NSString *text = [NSString stringWithFormat:@"data:%@;base64,%@",
                      type != nil && [type length] > 0 ? type : @"application/octet-stream",
                      [data base64EncodedStringWithOptions:0]];

    resolve(text);
  }
}

@end
