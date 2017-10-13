/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTUtils.h"

#import <dlfcn.h>
#import <mach/mach_time.h>
#import <objc/message.h>
#import <objc/runtime.h>
#import <zlib.h>

#import <UIKit/UIKit.h>

#import <CommonCrypto/CommonCrypto.h>

#import "RCTAssert.h"
#import "RCTLog.h"

NSString *const RCTErrorUnspecified = @"EUNSPECIFIED";

static NSString *__nullable _RCTJSONStringifyNoRetry(id __nullable jsonObject, NSError **error)
{
  if (!jsonObject) {
    return nil;
  }

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

  @try {

    // Use JSONKit if available and object is not a fragment
    if (JSONKitSelector && [collectionTypes containsObject:[jsonObject classForCoder]]) {
      return ((NSString *(*)(id, SEL, int, NSError **))objc_msgSend)(jsonObject, JSONKitSelector, 0, error);
    }

    // Use Foundation JSON method
    NSData *jsonData = [NSJSONSerialization
                        dataWithJSONObject:jsonObject options:(NSJSONWritingOptions)NSJSONReadingAllowFragments
                        error:error];

    return jsonData ? [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding] : nil;
  }
  @catch (NSException *exception) {

    // Convert exception to error
    if (error) {
      *error = [NSError errorWithDomain:RCTErrorDomain code:0 userInfo:@{
        NSLocalizedDescriptionKey: exception.description ?: @""
      }];
    }
    return nil;
  }
}

NSString *__nullable RCTJSONStringify(id __nullable jsonObject, NSError **error)
{
  if (error) {
    return _RCTJSONStringifyNoRetry(jsonObject, error);
  } else {
    NSError *localError;
    NSString *json = _RCTJSONStringifyNoRetry(jsonObject, &localError);
    if (localError) {
      RCTLogError(@"RCTJSONStringify() encountered the following error: %@",
                  localError.localizedDescription);
      // Sanitize the data, then retry. This is slow, but it prevents uncaught
      // data issues from crashing in production
      return _RCTJSONStringifyNoRetry(RCTJSONClean(jsonObject), NULL);
    }
    return json;
  }
}

static id __nullable _RCTJSONParse(NSString *__nullable jsonString, BOOL mutable, NSError **error)
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

id __nullable RCTJSONParse(NSString *__nullable jsonString, NSError **error)
{
  return _RCTJSONParse(jsonString, NO, error);
}

id __nullable RCTJSONParseMutable(NSString *__nullable jsonString, NSError **error)
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
    if ([object isKindOfClass:[NSNumber class]]) {
      return @(RCTZeroIfNaN([object doubleValue]));
    }
    if ([object isKindOfClass:[NSString class]]) {
      if ([object UTF8String] == NULL) {
        return (id)kCFNull;
      }
    }
    return object;
  }

  if ([object isKindOfClass:[NSDictionary class]]) {
    __block BOOL copy = NO;
    NSMutableDictionary<NSString *, id> *values = [[NSMutableDictionary alloc] initWithCapacity:[object count]];
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

BOOL RCTIsMainQueue()
{
  static void *mainQueueKey = &mainQueueKey;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    dispatch_queue_set_specific(dispatch_get_main_queue(),
                                mainQueueKey, mainQueueKey, NULL);
  });
  return dispatch_get_specific(mainQueueKey) == mainQueueKey;
}

void RCTExecuteOnMainQueue(dispatch_block_t block)
{
  if (RCTIsMainQueue()) {
    block();
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      block();
    });
  }
}

// Please do not use this method
// unless you know what you are doing.
void RCTUnsafeExecuteOnMainQueueSync(dispatch_block_t block)
{
  if (RCTIsMainQueue()) {
    block();
  } else {
    dispatch_sync(dispatch_get_main_queue(), ^{
      block();
    });
  }
}

static void RCTUnsafeExecuteOnMainQueueOnceSync(dispatch_once_t *onceToken, dispatch_block_t block)
{
  // The solution was borrowed from a post by Ben Alpert:
  // https://benalpert.com/2014/04/02/dispatch-once-initialization-on-the-main-thread.html
  // See also: https://www.mikeash.com/pyblog/friday-qa-2014-06-06-secrets-of-dispatch_once.html
  if (RCTIsMainQueue()) {
    dispatch_once(onceToken, block);
  } else {
    if (DISPATCH_EXPECT(*onceToken == 0L, NO)) {
      dispatch_sync(dispatch_get_main_queue(), ^{
        dispatch_once(onceToken, block);
      });
    }
  }
}

CGFloat RCTScreenScale()
{
  static dispatch_once_t onceToken;
  static CGFloat scale;

  RCTUnsafeExecuteOnMainQueueOnceSync(&onceToken, ^{
    scale = [UIScreen mainScreen].scale;
  });

  return scale;
}

CGSize RCTScreenSize()
{
  // FIXME: this caches the bounds at app start, whatever those were, and then
  // doesn't update when the device is rotated. We need to find another thread-
  // safe way to get the screen size.

  static CGSize size;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    RCTUnsafeExecuteOnMainQueueSync(^{
      size = [UIScreen mainScreen].bounds.size;
    });
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

CGSize RCTSizeInPixels(CGSize pointSize, CGFloat scale)
{
  return (CGSize){
    ceil(pointSize.width * scale),
    ceil(pointSize.height * scale),
  };
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

NSDictionary<NSString *, id> *RCTMakeError(NSString *message,
                                           id __nullable toStringify,
                                           NSDictionary<NSString *, id> *__nullable extraData)
{
  if (toStringify) {
    message = [message stringByAppendingString:[toStringify description]];
  }

  NSMutableDictionary<NSString *, id> *error = [extraData mutableCopy] ?: [NSMutableDictionary new];
  error[@"message"] = message;
  return error;
}

NSDictionary<NSString *, id> *RCTMakeAndLogError(NSString *message,
                                                 id __nullable toStringify,
                                                 NSDictionary<NSString *, id> *__nullable extraData)
{
  NSDictionary<NSString *, id> *error = RCTMakeError(message, toStringify, extraData);
  RCTLogError(@"\nError: %@", error);
  return error;
}

NSDictionary<NSString *, id> *RCTJSErrorFromNSError(NSError *error)
{
  NSString *codeWithDomain = [NSString stringWithFormat:@"E%@%lld", error.domain.uppercaseString, (long long)error.code];
  return RCTJSErrorFromCodeMessageAndNSError(codeWithDomain,
                                             error.localizedDescription,
                                             error);
}

// TODO: Can we just replace RCTMakeError with this function instead?
NSDictionary<NSString *, id> *RCTJSErrorFromCodeMessageAndNSError(NSString *code,
                                                                  NSString *message,
                                                                  NSError *__nullable error)
{
  NSString *errorMessage;
  NSArray<NSString *> *stackTrace = [NSThread callStackSymbols];
  NSMutableDictionary *userInfo;
  NSMutableDictionary<NSString *, id> *errorInfo =
  [NSMutableDictionary dictionaryWithObject:stackTrace forKey:@"nativeStackIOS"];

  if (error) {
    errorMessage = error.localizedDescription ?: @"Unknown error from a native module";
    errorInfo[@"domain"] = error.domain ?: RCTErrorDomain;
    if (error.userInfo) {
      userInfo = [error.userInfo mutableCopy];
      if (userInfo != nil && userInfo[NSUnderlyingErrorKey] != nil) {
        NSError *underlyingError = error.userInfo[NSUnderlyingErrorKey];
        NSString *underlyingCode = [NSString stringWithFormat:@"%d", (int)underlyingError.code];
        userInfo[NSUnderlyingErrorKey] = RCTJSErrorFromCodeMessageAndNSError(underlyingCode, @"underlying error", underlyingError);
      }
    }
  } else {
    errorMessage = @"Unknown error from a native module";
    errorInfo[@"domain"] = RCTErrorDomain;
    userInfo = nil;
  }
  errorInfo[@"code"] = code ?: RCTErrorUnspecified;
  errorInfo[@"userInfo"] = RCTNullIfNil(userInfo);

  // Allow for explicit overriding of the error message
  errorMessage = message ?: errorMessage;

  return RCTMakeError(errorMessage, nil, errorInfo);
}

BOOL RCTRunningInTestEnvironment(void)
{
  static BOOL isTestEnvironment = NO;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSDictionary *environment = [[NSProcessInfo processInfo] environment];
    isTestEnvironment = objc_lookUpClass("SenTestCase") || objc_lookUpClass("XCTest") ||
      [environment[@"IS_TESTING"] boolValue];
  });
  return isTestEnvironment;
}

BOOL RCTRunningInAppExtension(void)
{
  return [[[[NSBundle mainBundle] bundlePath] pathExtension] isEqualToString:@"appex"];
}

UIApplication *__nullable RCTSharedApplication(void)
{
  if (RCTRunningInAppExtension()) {
    return nil;
  }
  return [[UIApplication class] performSelector:@selector(sharedApplication)];
}

UIWindow *__nullable RCTKeyWindow(void)
{
  if (RCTRunningInAppExtension()) {
    return nil;
  }

  // TODO: replace with a more robust solution
  return RCTSharedApplication().keyWindow;
}

UIViewController *__nullable RCTPresentedViewController(void)
{
  if (RCTRunningInAppExtension()) {
    return nil;
  }

  UIViewController *controller = RCTKeyWindow().rootViewController;
  UIViewController *presentedController = controller.presentedViewController;
  while (presentedController && ![presentedController isBeingDismissed]) {
    controller = presentedController;
    presentedController = controller.presentedViewController;
  }

  return controller;
}

BOOL RCTForceTouchAvailable(void)
{
  static BOOL forceSupported;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    forceSupported = [UITraitCollection class] &&
    [UITraitCollection instancesRespondToSelector:@selector(forceTouchCapability)];
  });

  return forceSupported &&
    (RCTKeyWindow() ?: [UIView new]).traitCollection.forceTouchCapability == UIForceTouchCapabilityAvailable;
}

NSError *RCTErrorWithMessage(NSString *message)
{
  NSDictionary<NSString *, id> *errorInfo = @{NSLocalizedDescriptionKey: message};
  return [[NSError alloc] initWithDomain:RCTErrorDomain code:0 userInfo:errorInfo];
}

double RCTZeroIfNaN(double value)
{
  return isnan(value) || isinf(value) ? 0 : value;
}

double RCTSanitizeNaNValue(double value, NSString *property)
{
  if (!isnan(value) && !isinf(value)) {
    return value;
  }

  RCTLogWarn(@"The value `%@` equals NaN or INF and will be replaced by `0`.", property);
  return 0;
}

NSURL *RCTDataURL(NSString *mimeType, NSData *data)
{
  return [NSURL URLWithString:
          [NSString stringWithFormat:@"data:%@;base64,%@", mimeType,
           [data base64EncodedStringWithOptions:(NSDataBase64EncodingOptions)0]]];
}

BOOL RCTIsGzippedData(NSData *__nullable); // exposed for unit testing purposes
BOOL RCTIsGzippedData(NSData *__nullable data)
{
  UInt8 *bytes = (UInt8 *)data.bytes;
  return (data.length >= 2 && bytes[0] == 0x1f && bytes[1] == 0x8b);
}

NSData *__nullable RCTGzipData(NSData *__nullable input, float level)
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

NSString *__nullable RCTBundlePathForURL(NSURL *__nullable URL)
{
  if (!URL.fileURL) {
    // Not a file path
    return nil;
  }
  NSString *path = [NSString stringWithUTF8String:[URL fileSystemRepresentation]];
  NSString *bundlePath = [[NSBundle mainBundle] resourcePath];
  if (![path hasPrefix:bundlePath]) {
    // Not a bundle-relative file
    return nil;
  }
  path = [path substringFromIndex:bundlePath.length];
  if ([path hasPrefix:@"/"]) {
    path = [path substringFromIndex:1];
  }
  return path;
}

BOOL RCTIsLocalAssetURL(NSURL *__nullable imageURL)
{
  NSString *name = RCTBundlePathForURL(imageURL);
  if (!name) {
    return NO;
  }

  NSString *extension = [name pathExtension];
  return [extension isEqualToString:@"png"] || [extension isEqualToString:@"jpg"];
}

static NSString *bundleName(NSBundle *bundle)
{
  NSString *name = bundle.infoDictionary[@"CFBundleName"];
  if (!name) {
    name = [[bundle.bundlePath lastPathComponent] stringByDeletingPathExtension];
  }
  return name;
}

static NSBundle *bundleForPath(NSString *key)
{
  static NSMutableDictionary *bundleCache;
  if (!bundleCache) {
    bundleCache = [NSMutableDictionary new];
    bundleCache[@"main"] = [NSBundle mainBundle];

    // Initialize every bundle in the array
    for (NSString *path in [[NSBundle mainBundle] pathsForResourcesOfType:@"bundle" inDirectory:nil]) {
      [NSBundle bundleWithPath:path];
    }

    // The bundles initialized above will now also be in `allBundles`
    for (NSBundle *bundle in [NSBundle allBundles]) {
      bundleCache[bundleName(bundle)] = bundle;
    }
  }

  return bundleCache[key];
}

UIImage *__nullable RCTImageFromLocalAssetURL(NSURL *imageURL)
{
  NSString *imageName = RCTBundlePathForURL(imageURL);

  NSBundle *bundle = nil;
  NSArray *imagePathComponents = [imageName pathComponents];
  if ([imagePathComponents count] > 1 &&
      [[[imagePathComponents firstObject] pathExtension] isEqualToString:@"bundle"]) {
    NSString *bundlePath = [imagePathComponents firstObject];
    bundle = bundleForPath([bundlePath stringByDeletingPathExtension]);
    imageName = [imageName substringFromIndex:(bundlePath.length + 1)];
  }

  UIImage *image = nil;
  if (bundle) {
    image = [UIImage imageNamed:imageName inBundle:bundle compatibleWithTraitCollection:nil];
  } else {
    image = [UIImage imageNamed:imageName];
  }

  if (!image) {
    // Attempt to load from the file system
    NSData *fileData;
    if (imageURL.pathExtension.length == 0) {
      fileData = [NSData dataWithContentsOfURL:[imageURL URLByAppendingPathExtension:@"png"]];
    } else {
      fileData = [NSData dataWithContentsOfURL:imageURL];
    }
    image = [UIImage imageWithData:fileData];
  }

  if (!image && !bundle) {
    // We did not find the image in the mainBundle, check in other shipped frameworks.
    NSArray<NSURL *> *possibleFrameworks = [[NSFileManager defaultManager] contentsOfDirectoryAtURL:[[NSBundle mainBundle] privateFrameworksURL]
                                                                        includingPropertiesForKeys:@[]
                                                                                           options:0
                                                                                             error:nil];
    for (NSURL *frameworkURL in possibleFrameworks) {
      bundle = [NSBundle bundleWithURL:frameworkURL];
      image = [UIImage imageNamed:imageName inBundle:bundle compatibleWithTraitCollection:nil];
      if (image) {
        RCTLogWarn(@"Image %@ not found in mainBundle, but found in %@", imageName, bundle);
        break;
      }
    }
  }
  return image;
}

RCT_EXTERN NSString *__nullable RCTTempFilePath(NSString *extension, NSError **error)
{
  static NSError *setupError = nil;
  static NSString *directory;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    directory = [NSTemporaryDirectory() stringByAppendingPathComponent:@"ReactNative"];
    // If the temporary directory already exists, we'll delete it to ensure
    // that temp files from the previous run have all been deleted. This is not
    // a security measure, it simply prevents the temp directory from using too
    // much space, as the circumstances under which iOS clears it automatically
    // are not well-defined.
    NSFileManager *fileManager = [NSFileManager new];
    if ([fileManager fileExistsAtPath:directory]) {
      [fileManager removeItemAtPath:directory error:NULL];
    }
    if (![fileManager fileExistsAtPath:directory]) {
      NSError *localError = nil;
      if (![fileManager createDirectoryAtPath:directory
                  withIntermediateDirectories:YES
                                   attributes:nil
                                        error:&localError]) {
        // This is bad
        RCTLogError(@"Failed to create temporary directory: %@", localError);
        setupError = localError;
        directory = nil;
      }
    }
  });

  if (!directory || setupError) {
    if (error) {
      *error = setupError;
    }
    return nil;
  }

  // Append a unique filename
  NSString *filename = [NSUUID new].UUIDString;
  if (extension) {
    filename = [filename stringByAppendingPathExtension:extension];
  }
  return [directory stringByAppendingPathComponent:filename];
}

static void RCTGetRGBAColorComponents(CGColorRef color, CGFloat rgba[4])
{
  CGColorSpaceModel model = CGColorSpaceGetModel(CGColorGetColorSpace(color));
  const CGFloat *components = CGColorGetComponents(color);
  switch (model)
  {
    case kCGColorSpaceModelMonochrome:
    {
      rgba[0] = components[0];
      rgba[1] = components[0];
      rgba[2] = components[0];
      rgba[3] = components[1];
      break;
    }
    case kCGColorSpaceModelRGB:
    {
      rgba[0] = components[0];
      rgba[1] = components[1];
      rgba[2] = components[2];
      rgba[3] = components[3];
      break;
    }
    case kCGColorSpaceModelCMYK:
    case kCGColorSpaceModelDeviceN:
    case kCGColorSpaceModelIndexed:
    case kCGColorSpaceModelLab:
    case kCGColorSpaceModelPattern:
    case kCGColorSpaceModelUnknown:
    {

#ifdef RCT_DEBUG
      //unsupported format
      RCTLogError(@"Unsupported color model: %i", model);
#endif

      rgba[0] = 0.0;
      rgba[1] = 0.0;
      rgba[2] = 0.0;
      rgba[3] = 1.0;
      break;
    }
  }
}

NSString *RCTColorToHexString(CGColorRef color)
{
  CGFloat rgba[4];
  RCTGetRGBAColorComponents(color, rgba);
  uint8_t r = rgba[0]*255;
  uint8_t g = rgba[1]*255;
  uint8_t b = rgba[2]*255;
  uint8_t a = rgba[3]*255;
  if (a < 255) {
    return [NSString stringWithFormat:@"#%02x%02x%02x%02x", r, g, b, a];
  } else {
    return [NSString stringWithFormat:@"#%02x%02x%02x", r, g, b];
  }
}

// (https://github.com/0xced/XCDFormInputAccessoryView/blob/master/XCDFormInputAccessoryView/XCDFormInputAccessoryView.m#L10-L14)
NSString *RCTUIKitLocalizedString(NSString *string)
{
  NSBundle *UIKitBundle = [NSBundle bundleForClass:[UIApplication class]];
  return UIKitBundle ? [UIKitBundle localizedStringForKey:string value:string table:nil] : string;
}

NSString *__nullable RCTGetURLQueryParam(NSURL *__nullable URL, NSString *param)
{
  RCTAssertParam(param);
  if (!URL) {
    return nil;
  }

  NSURLComponents *components = [NSURLComponents componentsWithURL:URL
                                           resolvingAgainstBaseURL:YES];
  for (NSURLQueryItem *queryItem in [components.queryItems reverseObjectEnumerator]) {
    if ([queryItem.name isEqualToString:param]) {
      return queryItem.value;
    }
  }

  return nil;
}

NSURL *__nullable RCTURLByReplacingQueryParam(NSURL *__nullable URL, NSString *param, NSString *__nullable value)
{
  RCTAssertParam(param);
  if (!URL) {
    return nil;
  }

  NSURLComponents *components = [NSURLComponents componentsWithURL:URL
                                           resolvingAgainstBaseURL:YES];

  __block NSInteger paramIndex = NSNotFound;
  NSMutableArray<NSURLQueryItem *> *queryItems = [components.queryItems mutableCopy];
  [queryItems enumerateObjectsWithOptions:NSEnumerationReverse usingBlock:
   ^(NSURLQueryItem *item, NSUInteger i, BOOL *stop) {
     if ([item.name isEqualToString:param]) {
       paramIndex = i;
       *stop = YES;
     }
   }];

  if (!value) {
    if (paramIndex != NSNotFound) {
      [queryItems removeObjectAtIndex:paramIndex];
    }
  } else {
    NSURLQueryItem *newItem  = [NSURLQueryItem queryItemWithName:param
                                                           value:value];
    if (paramIndex == NSNotFound) {
      [queryItems addObject:newItem];
    } else {
      [queryItems replaceObjectAtIndex:paramIndex withObject:newItem];
    }
  }
  components.queryItems = queryItems;
  return components.URL;
}
