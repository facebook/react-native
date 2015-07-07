/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTUtils.h"

#import <mach/mach_time.h>
#import <objc/runtime.h>

#import <UIKit/UIKit.h>

#import <CommonCrypto/CommonCrypto.h>

#import "RCTLog.h"

NSString *RCTJSONStringify(id jsonObject, NSError **error)
{
  NSData *jsonData = [NSJSONSerialization dataWithJSONObject:jsonObject options:(NSJSONWritingOptions)NSJSONReadingAllowFragments error:error];
  return jsonData ? [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding] : nil;
}

id RCTJSONParseWithOptions(NSString *jsonString, NSError **error, NSJSONReadingOptions options)
{
  if (!jsonString) {
    return nil;
  }
  NSData *jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding allowLossyConversion:NO];
  if (!jsonData) {
    jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding allowLossyConversion:YES];
    if (jsonData) {
      RCTLogWarn(@"RCTJSONParse received the following string, which could not be losslessly converted to UTF8 data: '%@'", jsonString);
    } else {
      RCTLogError(@"RCTJSONParse received invalid UTF8 data");
      return nil;
    }
  }
  return [NSJSONSerialization JSONObjectWithData:jsonData options:options error:error];
}

id RCTJSONParse(NSString *jsonString, NSError **error) {
  return RCTJSONParseWithOptions(jsonString, error, NSJSONReadingAllowFragments);
}

id RCTJSONParseMutable(NSString *jsonString, NSError **error) {
  return RCTJSONParseWithOptions(jsonString, error, NSJSONReadingMutableContainers|NSJSONReadingMutableLeaves);
}

id RCTJSONClean(id object)
{
  static dispatch_once_t onceToken;
  static NSSet *validLeafTypes;
  dispatch_once(&onceToken, ^{
    validLeafTypes = [[NSSet alloc] initWithArray:@[
      [NSString class],
      [NSMutableString class],
      [NSNumber class],
      [NSNull class],
    ]];
  });

  if ([validLeafTypes containsObject:[object classForCoder]]) {
    return object;
  }

  if ([object isKindOfClass:[NSDictionary class]]) {
    __block BOOL copy = NO;
    NSMutableDictionary *values = [[NSMutableDictionary alloc] initWithCapacity:[object count]];
    [object enumerateKeysAndObjectsUsingBlock:^(NSString *key, id item, __unused BOOL *stop) {
      id value = RCTJSONClean(item);
      values[key] = value;
      copy |= value != item;
    }];
    return copy ? values : object;
  }

  if ([object isKindOfClass:[NSArray class]]) {
    __block BOOL copy = NO;
    __block NSArray *values = object;
    [object enumerateObjectsUsingBlock:^(id item, NSUInteger idx, __unused BOOL *stop) {
      id value = RCTJSONClean(item);
      if (copy) {
        [(NSMutableArray *)values addObject:value];
      } else if (value != item) {
        // Converted value is different, so we'll need to copy the array
        values = [[NSMutableArray alloc] initWithCapacity:values.count];
        for (NSUInteger i = 0; i < idx; i++) {
          [(NSMutableArray *)values addObject:object[i]];
        }
        [(NSMutableArray *)values addObject:value];
        copy = YES;
      }
    }];
    return values;
  }

  return (id)kCFNull;
}

NSString *RCTMD5Hash(NSString *string)
{
  const char *str = [string UTF8String];
  unsigned char result[CC_MD5_DIGEST_LENGTH];
  CC_MD5(str, (CC_LONG)strlen(str), result);

  return [NSString stringWithFormat:@"%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x",
    result[0], result[1], result[2], result[3],
    result[4], result[5], result[6], result[7],
    result[8], result[9], result[10], result[11],
    result[12], result[13], result[14], result[15]
  ];
}

CGFloat RCTScreenScale()
{
  static CGFloat scale;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    if (![NSThread isMainThread]) {
      dispatch_sync(dispatch_get_main_queue(), ^{
        scale = [UIScreen mainScreen].scale;
      });
    } else {
      scale = [UIScreen mainScreen].scale;
    }
  });

  return scale;
}

CGSize RCTScreenSize()
{
  static CGSize size;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    if (![NSThread isMainThread]) {
      dispatch_sync(dispatch_get_main_queue(), ^{
        size = [UIScreen mainScreen].bounds.size;
      });
    } else {
      size = [UIScreen mainScreen].bounds.size;
    }
  });

  return size;
}

CGFloat RCTRoundPixelValue(CGFloat value)
{
  CGFloat scale = RCTScreenScale();
  return round(value * scale) / scale;
}

CGFloat RCTCeilPixelValue(CGFloat value)
{
  CGFloat scale = RCTScreenScale();
  return ceil(value * scale) / scale;
}

CGFloat RCTFloorPixelValue(CGFloat value)
{
  CGFloat scale = RCTScreenScale();
  return floor(value * scale) / scale;
}

void RCTSwapClassMethods(Class cls, SEL original, SEL replacement)
{
  Method originalMethod = class_getClassMethod(cls, original);
  IMP originalImplementation = method_getImplementation(originalMethod);
  const char *originalArgTypes = method_getTypeEncoding(originalMethod);

  Method replacementMethod = class_getClassMethod(cls, replacement);
  IMP replacementImplementation = method_getImplementation(replacementMethod);
  const char *replacementArgTypes = method_getTypeEncoding(replacementMethod);

  if (class_addMethod(cls, original, replacementImplementation, replacementArgTypes)) {
    class_replaceMethod(cls, replacement, originalImplementation, originalArgTypes);
  } else {
    method_exchangeImplementations(originalMethod, replacementMethod);
  }
}

void RCTSwapInstanceMethods(Class cls, SEL original, SEL replacement)
{
  Method originalMethod = class_getInstanceMethod(cls, original);
  IMP originalImplementation = method_getImplementation(originalMethod);
  const char *originalArgTypes = method_getTypeEncoding(originalMethod);

  Method replacementMethod = class_getInstanceMethod(cls, replacement);
  IMP replacementImplementation = method_getImplementation(replacementMethod);
  const char *replacementArgTypes = method_getTypeEncoding(replacementMethod);

  if (class_addMethod(cls, original, replacementImplementation, replacementArgTypes)) {
    class_replaceMethod(cls, replacement, originalImplementation, originalArgTypes);
  } else {
    method_exchangeImplementations(originalMethod, replacementMethod);
  }
}

BOOL RCTClassOverridesClassMethod(Class cls, SEL selector)
{
  return RCTClassOverridesInstanceMethod(object_getClass(cls), selector);
}

BOOL RCTClassOverridesInstanceMethod(Class cls, SEL selector)
{
  unsigned int numberOfMethods;
  Method *methods = class_copyMethodList(cls, &numberOfMethods);
  for (unsigned int i = 0; i < numberOfMethods; i++) {
    if (method_getName(methods[i]) == selector) {
      free(methods);
      return YES;
    }
  }
  free(methods);
  return NO;
}

NSDictionary *RCTMakeError(NSString *message, id toStringify, NSDictionary *extraData)
{
  if (toStringify) {
    message = [message stringByAppendingString:[toStringify description]];
  }

  NSMutableDictionary *error = [NSMutableDictionary dictionaryWithDictionary:extraData];
  error[@"message"] = message;
  return error;
}

NSDictionary *RCTMakeAndLogError(NSString *message, id toStringify, NSDictionary *extraData)
{
  id error = RCTMakeError(message, toStringify, extraData);
  RCTLogError(@"\nError: %@", error);
  return error;
}

BOOL RCTRunningInTestEnvironment(void)
{
  static BOOL isTestEnvironment = NO;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    isTestEnvironment = NSClassFromString(@"SenTestCase") || NSClassFromString(@"XCTest");
  });
  return isTestEnvironment;
}

BOOL RCTImageHasAlpha(CGImageRef image)
{
  switch (CGImageGetAlphaInfo(image)) {
    case kCGImageAlphaNone:
    case kCGImageAlphaNoneSkipLast:
    case kCGImageAlphaNoneSkipFirst:
      return NO;
    default:
      return YES;
  }
}

NSError *RCTErrorWithMessage(NSString *message)
{
  NSDictionary *errorInfo = @{NSLocalizedDescriptionKey: message};
  NSError *error = [[NSError alloc] initWithDomain:RCTErrorDomain code:0 userInfo:errorInfo];
  return error;
}

id RCTNullIfNil(id value)
{
  return value ?: (id)kCFNull;
}

id RCTNilIfNull(id value)
{
  return value == (id)kCFNull ? nil : value;
}

// TODO: Can we just replace RCTMakeError with this function instead?
NSDictionary *RCTJSErrorFromNSError(NSError *error)
{
  NSString *errorMessage;
  NSArray *stackTrace = [NSThread callStackSymbols];
  NSMutableDictionary *errorInfo =
  [NSMutableDictionary dictionaryWithObject:stackTrace forKey:@"nativeStackIOS"];

  if (error) {
    errorMessage = error.localizedDescription ?: @"Unknown error from a native module";
    errorInfo[@"domain"] = error.domain ?: RCTErrorDomain;
    errorInfo[@"code"] = @(error.code);
  } else {
    errorMessage = @"Unknown error from a native module";
    errorInfo[@"domain"] = RCTErrorDomain;
    errorInfo[@"code"] = @-1;
  }

  return RCTMakeError(errorMessage, nil, errorInfo);
}
