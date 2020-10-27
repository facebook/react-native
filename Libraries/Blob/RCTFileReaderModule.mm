/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


#import <React/RCTFileReaderModule.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>

#import <React/RCTBlobManager.h>

#import "RCTBlobPlugins.h"

@interface RCTFileReaderModule() <NativeFileReaderModuleSpec>
@end

@implementation RCTFileReaderModule

RCT_EXPORT_MODULE(FileReaderModule)

@synthesize bridge = _bridge;
@synthesize turboModuleRegistry = _turboModuleRegistry;

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
  RCTBlobManager *blobManager = nil;
  if ([self bridge]) {
    blobManager = [[self bridge] moduleForClass:[RCTBlobManager class]];
  } else {
    blobManager = [[self turboModuleRegistry] moduleForName:[NSStringFromClass([RCTBlobManager class]) UTF8String]];
  }
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

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeFileReaderModuleSpecJSI>(params);
}

@end

Class RCTFileReaderModuleCls(void)
{
  return RCTFileReaderModule.class;
}
