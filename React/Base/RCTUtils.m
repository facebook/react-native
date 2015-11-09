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
#import <objc/message.h>

#import <UIKit/UIKit.h>

#import <CommonCrypto/CommonCrypto.h>

#import <zlib.h>
#import <dlfcn.h>

#import "RCTLog.h"

NSString *RCTJSONStringify(id jsonObject, NSError **error)
{
  static SEL JSONKitSelector = NULL;
  static NSSet<Class> *collectionTypes;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    SEL selector = NSSelectorFromString(@"JSONStringWithOptions:error:");
    if ([NSDictionary instancesRespondToSelector:selector]) {
      JSONKitSelector = selector;
      collectionTypes = [NSSet setWithObjects:
                         [NSArray class], [NSMutableArray class],
                         [NSDictionary class], [NSMutableDictionary class], nil];
    }
  });

  // Use JSONKit if available and object is not a fragment
  if (JSONKitSelector && [collectionTypes containsObject:[jsonObject classForCoder]]) {
    return ((NSString *(*)(id, SEL, int, NSError **))objc_msgSend)(jsonObject, JSONKitSelector, 0, error);
  }

  // Use Foundation JSON method
  NSData *jsonData = [NSJSONSerialization
                      dataWithJSONObject:jsonObject
                      options:(NSJSONWritingOptions)NSJSONReadingAllowFragments
                      error:error];
  return jsonData ? [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding] : nil;
}

static id _RCTJSONParse(NSString *jsonString, BOOL mutable, NSError **error)
{
  static SEL JSONKitSelector = NULL;
  static SEL JSONKitMutableSelector = NULL;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    SEL selector = NSSelectorFromString(@"objectFromJSONStringWithParseOptions:error:");
    if ([NSString instancesRespondToSelector:selector]) {
      JSONKitSelector = selector;
      JSONKitMutableSelector = NSSelectorFromString(@"mutableObjectFromJSONStringWithParseOptions:error:");
    }
  });

  if (jsonString) {

    // Use JSONKit if available and string is not a fragment
    if (JSONKitSelector) {
      NSInteger length = jsonString.length;
      for (NSInteger i = 0; i < length; i++) {
        unichar c = [jsonString characterAtIndex:i];
        if (strchr("{[", c)) {
          static const int options = (1 << 2); // loose unicode
          SEL selector = mutable ? JSONKitMutableSelector : JSONKitSelector;
          return ((id (*)(id, SEL, int, NSError **))objc_msgSend)(jsonString, selector, options, error);
        }
        if (!strchr(" \r\n\t", c)) {
          break;
        }
      }
    }

    // Use Foundation JSON method
    NSData *jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    if (!jsonData) {
      jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding allowLossyConversion:YES];
      if (jsonData) {
        RCTLogWarn(@"RCTJSONParse received the following string, which could "
                   "not be losslessly converted to UTF8 data: '%@'", jsonString);
      } else {
        NSString *errorMessage = @"RCTJSONParse received invalid UTF8 data";
        if (error) {
          *error = RCTErrorWithMessage(errorMessage);
        } else {
          RCTLogError(@"%@", errorMessage);
        }
        return nil;
      }
    }
    NSJSONReadingOptions options = NSJSONReadingAllowFragments;
    if (mutable) {
      options |= NSJSONReadingMutableContainers;
    }
    return [NSJSONSerialization JSONObjectWithData:jsonData
                                           options:options
                                             error:error];
  }
  return nil;
}

id RCTJSONParse(NSString *jsonString, NSError **error)
{
  return _RCTJSONParse(jsonString, NO, error);
}

id RCTJSONParseMutable(NSString *jsonString, NSError **error)
{
  return _RCTJSONParse(jsonString, YES, error);
}

id RCTJSONClean(id object)
{
  static dispatch_once_t onceToken;
  static NSSet<Class> *validLeafTypes;
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
  const char *str = string.UTF8String;
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
  NSDictionary *error = RCTMakeError(message, toStringify, extraData);
  RCTLogError(@"\nError: %@", error);
  return error;
}

// TODO: Can we just replace RCTMakeError with this function instead?
NSDictionary *RCTJSErrorFromNSError(NSError *error)
{
  NSString *errorMessage;
  NSArray<NSString *> *stackTrace = [NSThread callStackSymbols];
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

BOOL RCTRunningInTestEnvironment(void)
{
  static BOOL isTestEnvironment = NO;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    isTestEnvironment = NSClassFromString(@"SenTestCase") || NSClassFromString(@"XCTest");
  });
  return isTestEnvironment;
}

BOOL RCTRunningInAppExtension(void)
{
  return [[[[NSBundle mainBundle] bundlePath] pathExtension] isEqualToString:@"appex"];
}

UIApplication *RCTSharedApplication(void)
{
  if (RCTRunningInAppExtension()) {
    return nil;
  }
  return [[UIApplication class] performSelector:@selector(sharedApplication)];
}

UIWindow *RCTKeyWindow(void)
{
  if (RCTRunningInAppExtension()) {
    return nil;
  }

  // TODO: replace with a more robust solution
  return RCTSharedApplication().keyWindow;
}

UIAlertView *RCTAlertView(NSString *title,
                          NSString *message,
                          id delegate,
                          NSString *cancelButtonTitle,
                          NSArray<NSString *> *otherButtonTitles)
{
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"RCTAlertView is unavailable when running in an app extension");
    return nil;
  }

  UIAlertView *alertView = [UIAlertView new];
  alertView.title = title;
  alertView.message = message;
  alertView.delegate = delegate;
  if (cancelButtonTitle != nil) {
    [alertView addButtonWithTitle:cancelButtonTitle];
    alertView.cancelButtonIndex = 0;
  }
  for (NSString *buttonTitle in otherButtonTitles) {
    [alertView addButtonWithTitle:buttonTitle];
  }
  return alertView;
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
  return [[NSError alloc] initWithDomain:RCTErrorDomain code:0 userInfo:errorInfo];
}

id RCTNullIfNil(id value)
{
  return value ?: (id)kCFNull;
}

id RCTNilIfNull(id value)
{
  return value == (id)kCFNull ? nil : value;
}

NSURL *RCTDataURL(NSString *mimeType, NSData *data)
{
  return [NSURL URLWithString:
          [NSString stringWithFormat:@"data:%@;base64,%@", mimeType,
           [data base64EncodedStringWithOptions:(NSDataBase64EncodingOptions)0]]];
}

BOOL RCTIsGzippedData(NSData *); // exposed for unit testing purposes
BOOL RCTIsGzippedData(NSData *data)
{
  UInt8 *bytes = (UInt8 *)data.bytes;
  return (data.length >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b);
}

NSData *RCTGzipData(NSData *input, float level)
{
  if (input.length == 0 || RCTIsGzippedData(input)) {
    return input;
  }

  void *libz = dlopen("/usr/lib/libz.dylib", RTLD_LAZY);
  int (*deflateInit2_)(z_streamp, int, int, int, int, int, const char *, int) = dlsym(libz, "deflateInit2_");
  int (*deflate)(z_streamp, int) = dlsym(libz, "deflate");
  int (*deflateEnd)(z_streamp) = dlsym(libz, "deflateEnd");

  z_stream stream;
  stream.zalloc = Z_NULL;
  stream.zfree = Z_NULL;
  stream.opaque = Z_NULL;
  stream.avail_in = (uint)input.length;
  stream.next_in = (Bytef *)input.bytes;
  stream.total_out = 0;
  stream.avail_out = 0;

  static const NSUInteger RCTGZipChunkSize = 16384;

  NSMutableData *output = nil;
  int compression = (level < 0.0f)? Z_DEFAULT_COMPRESSION: (int)(roundf(level * 9));
  if (deflateInit2(&stream, compression, Z_DEFLATED, 31, 8, Z_DEFAULT_STRATEGY) == Z_OK) {
    output = [NSMutableData dataWithLength:RCTGZipChunkSize];
    while (stream.avail_out == 0) {
      if (stream.total_out >= output.length) {
        output.length += RCTGZipChunkSize;
      }
      stream.next_out = (uint8_t *)output.mutableBytes + stream.total_out;
      stream.avail_out = (uInt)(output.length - stream.total_out);
      deflate(&stream, Z_FINISH);
    }
    deflateEnd(&stream);
    output.length = stream.total_out;
  }

  dlclose(libz);

  return output;
}

NSString *RCTBundlePathForURL(NSURL *URL)
{
  if (!URL.fileURL) {
    // Not a file path
    return nil;
  }
  NSString *path = URL.path;
  NSString *bundlePath = [[NSBundle mainBundle] resourcePath];
  if (![path hasPrefix:bundlePath]) {
    // Not a bundle-relative file
    return nil;
  }
  return [path substringFromIndex:bundlePath.length + 1];
}

BOOL RCTIsXCAssetURL(NSURL *imageURL)
{
  NSString *name = RCTBundlePathForURL(imageURL);
  if (name.pathComponents.count != 1) {
    // URL is invalid, or is a file path, not an XCAsset identifier
    return NO;
  }
  NSString *extension = [name pathExtension];
  if (extension.length && ![extension isEqualToString:@"png"]) {
    // Not a png
    return NO;
  }
  extension = extension.length ? nil : @"png";
  if ([[NSBundle mainBundle] pathForResource:name ofType:extension]) {
    // File actually exists in bundle, so is not an XCAsset
    return NO;
  }
  return YES;
}
