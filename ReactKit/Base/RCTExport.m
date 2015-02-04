// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTExport.h"

#import <dlfcn.h>
#import <libkern/OSAtomic.h>
#import <mach-o/getsect.h>
#import <mach-o/dyld.h>
#import <objc/runtime.h>
#import <objc/message.h>

#import "RCTConvert.h"
#import "RCTModuleMethod.h"
#import "RCTUtils.h"

static NSDictionary *_methodsByModule;

@interface _RCTExportLoader : NSObject

@end

@implementation _RCTExportLoader

+ (NSString *)methodNameForSelector:(SEL)selector
{
  NSString *methodName = NSStringFromSelector(selector);
  NSRange colonRange = [methodName rangeOfString:@":"];
  if (colonRange.location != NSNotFound) {
    methodName = [methodName substringToIndex:colonRange.location];
  }
  return methodName;
}

+ (NSIndexSet *)blockArgumentIndexesForMethod:(Method)method
{
  unsigned int argumentCount = method_getNumberOfArguments(method);

  NSMutableIndexSet *blockArgumentIndexes = [NSMutableIndexSet indexSet];
  static const char *blockType = @encode(typeof(^{}));
  for (unsigned int i = 2; i < argumentCount; i++) {
    char *type = method_copyArgumentType(method, i);
    if (!strcmp(type, blockType)) {
      [blockArgumentIndexes addIndex:i - 2];
    }
    free(type);
  }
  return [blockArgumentIndexes copy];
}

+ (void)load
{
  static uint32_t _exportsLoaded = 0;
  if (OSAtomicTestAndSetBarrier(1, &_exportsLoaded)) {
    return;
  }

#ifdef __LP64__
  typedef uint64_t RCTExportValue;
  typedef struct section_64 RCTExportSection;
#define RCTGetSectByNameFromHeader getsectbynamefromheader_64
#else
  typedef uint32_t RCTExportValue;
  typedef struct section RCTExportSection;
#define RCTGetSectByNameFromHeader getsectbynamefromheader
#endif

  Dl_info info;
  dladdr(&RCTExportedMethodsByModule, &info);

  const RCTExportValue mach_header = (RCTExportValue)info.dli_fbase;
  const RCTExportSection *section = RCTGetSectByNameFromHeader((void *)mach_header, _RCTExportSegmentName, _RCTExportSectionName);

  if (section == NULL) {
    return;
  }

  NSMutableDictionary *methodsByModule = [NSMutableDictionary dictionary];
  NSCharacterSet *plusMinusCharacterSet = [NSCharacterSet characterSetWithCharactersInString:@"+-"];

  for (RCTExportValue addr = section->offset;
       addr < section->offset + section->size;
       addr += sizeof(RCTExportEntry)) {
    
    RCTExportEntry *entry = (RCTExportEntry *)(mach_header + addr);

    NSScanner *scanner = [NSScanner scannerWithString:@(entry->func)];

    NSString *plusMinus;
    if (![scanner scanCharactersFromSet:plusMinusCharacterSet intoString:&plusMinus]) continue;
    if (![scanner scanString:@"[" intoString:NULL]) continue;

    NSString *className;
    if (![scanner scanUpToString:@" " intoString:&className]) continue;
    [scanner scanString:@" " intoString:NULL];

    NSString *selectorName;
    if (![scanner scanUpToString:@"]" intoString:&selectorName]) continue;

    Class class = NSClassFromString(className);
    if (class == Nil) continue;

    SEL selector = NSSelectorFromString(selectorName);
    Method method = ([plusMinus characterAtIndex:0] == '+' ? class_getClassMethod : class_getInstanceMethod)(class, selector);
    if (method == nil) continue;

    NSString *JSMethodName = strlen(entry->js_name) ? @(entry->js_name) : [self methodNameForSelector:selector];
    RCTModuleMethod *moduleMethod =
    [[RCTModuleMethod alloc] initWithSelector:selector
                                       JSMethodName:JSMethodName
                                              arity:method_getNumberOfArguments(method) - 2
                               blockArgumentIndexes:[self blockArgumentIndexesForMethod:method]];

    // TODO: store these by class name, not module name, then we don't need to call moduleName here
    NSString *moduleName = [class respondsToSelector:@selector(moduleName)] ? [class moduleName] : className;
    NSArray *moduleMap = methodsByModule[moduleName];
    methodsByModule[moduleName] = (moduleMap != nil) ? [moduleMap arrayByAddingObject:moduleMethod] : @[moduleMethod];
  }

  _methodsByModule = [methodsByModule copy];
}

@end

NSDictionary *RCTExportedMethodsByModule(void)
{
  return _methodsByModule;
}

NSString *RCTExportedModuleNameAtSortedIndex(NSUInteger index)
{
  static dispatch_once_t onceToken;
  static NSArray *sortedModuleNames;
  dispatch_once(&onceToken, ^{
    sortedModuleNames = [RCTExportedMethodsByModule().allKeys sortedArrayUsingSelector:@selector(compare:)];
  });
  return sortedModuleNames[index];
}

static NSString *RCTGuessTypeEncoding(id target, NSString *key, id value, NSString *encoding)
{
  // TODO (#5906496): handle more cases
  if ([key rangeOfString:@"color" options:NSCaseInsensitiveSearch].location != NSNotFound) {
    if ([target isKindOfClass:[CALayer class]]) {
      return @(@encode(CGColorRef));
    } else {
      return @"@\"UIColor\"";
    }
  }
  
  return nil;
}

static NSDictionary *RCTConvertValue(id value, NSString *encoding)
{
  static NSDictionary *converters = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    
    id (^numberConvert)(id) = ^(id val){
      return [RCTConvert NSNumber:val];
    };
    
    id (^boolConvert)(id) = ^(id val){
      return @([RCTConvert BOOL:val]);
    };
    
    // TODO (#5906496): add the rest of RCTConvert here
    converters =
    @{
      @(@encode(char)): boolConvert,
      @(@encode(int)): numberConvert,
      @(@encode(short)): numberConvert,
      @(@encode(long)): numberConvert,
      @(@encode(long long)): numberConvert,
      @(@encode(unsigned char)): numberConvert,
      @(@encode(unsigned int)): numberConvert,
      @(@encode(unsigned short)): numberConvert,
      @(@encode(unsigned long)): numberConvert,
      @(@encode(unsigned long long)): numberConvert,
      @(@encode(float)): numberConvert,
      @(@encode(double)): numberConvert,
      @(@encode(bool)): boolConvert,
      @(@encode(UIEdgeInsets)): ^(id val) {
        return [NSValue valueWithUIEdgeInsets:[RCTConvert UIEdgeInsets:val]];
      },
      @(@encode(CGPoint)): ^(id val) {
        return [NSValue valueWithCGPoint:[RCTConvert CGPoint:val]];
      },
      @(@encode(CGSize)): ^(id val) {
        return [NSValue valueWithCGSize:[RCTConvert CGSize:val]];
      },
      @(@encode(CGRect)): ^(id val) {
        return [NSValue valueWithCGRect:[RCTConvert CGRect:val]];
      },
      @(@encode(CGColorRef)): ^(id val) {
        return (id)[RCTConvert CGColor:val];
      },
      @(@encode(CGAffineTransform)): ^(id val) {
        return [NSValue valueWithCGAffineTransform:[RCTConvert CGAffineTransform:val]];
      },
      @(@encode(CATransform3D)): ^(id val) {
        return [NSValue valueWithCATransform3D:[RCTConvert CATransform3D:val]];
      },
      @"@\"NSString\"": ^(id val) {
        return [RCTConvert NSString:val];
      },
      @"@\"NSURL\"": ^(id val) {
        return [RCTConvert NSURL:val];
      },
      @"@\"UIColor\"": ^(id val) {
        return [RCTConvert UIColor:val];
      },
      @"@\"UIImage\"": ^(id val) {
        return [RCTConvert UIImage:val];
      },
      @"@\"NSDate\"": ^(id val) {
        return [RCTConvert NSDate:val];
      },
      @"@\"NSTimeZone\"": ^(id val) {
        return [RCTConvert NSTimeZone:val];
      },
    };
  });

  // Handle null values
  if (value == [NSNull null] && ![encoding isEqualToString:@"@\"NSNull\""]) {
    return nil;
  }
  
  // Convert value
  id (^converter)(id) = converters[encoding];
  return converter ? converter(value) : value;
}

BOOL RCTSetProperty(id target, NSString *keypath, id value)
{
  // Split keypath
  NSArray *parts = [keypath componentsSeparatedByString:@"."];
  NSString *key = [parts lastObject];
  for (NSUInteger i = 0; i < parts.count - 1; i++) {
    target = [target valueForKey:parts[i]];
    if (!target) {
      return NO;
    }
  }

  // Check target class for property definition
  NSString *encoding = nil;
  objc_property_t property = class_getProperty([target class], [key UTF8String]);
  if (property) {
    
    // Get type info
    char *typeEncoding = property_copyAttributeValue(property, "T");
    encoding = @(typeEncoding);
    free(typeEncoding);
    
  } else {
    
    // Check if setter exists
    SEL setter = NSSelectorFromString([NSString stringWithFormat:@"set%@%@:",
                                       [[key substringToIndex:1] uppercaseString],
                                       [key substringFromIndex:1]]);
    
    if (![target respondsToSelector:setter]) {
      return NO;
    }
    
    // Get type of first method argument
    Method method = class_getInstanceMethod([target class], setter);
    char *typeEncoding = method_copyArgumentType(method, 2);
    if (typeEncoding) {
      encoding = @(typeEncoding);
      free(typeEncoding);
    }
  }
  
  if (encoding.length == 0 || [encoding isEqualToString:@(@encode(id))]) {
    // Not enough info about the type encoding to be useful, so
    // try to guess the type from the value and property name
    encoding = RCTGuessTypeEncoding(target, key, value, encoding);
  }
  
  // Special case for numeric encodings, which may be enums
  if ([value isKindOfClass:[NSString class]] &&
      [@"iIsSlLqQ" containsString:[encoding substringToIndex:1]]) {
    
    /**
     * NOTE: the property names below may seem weird, but it's
     * because they are tested as case-sensitive suffixes, so
     * "apitalizationType" will match any of the following
     *
     * - capitalizationType
     * - autocapitalizationType
     * - autoCapitalizationType
     * - titleCapitalizationType
     * - etc.
     */
    static NSDictionary *converters = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      converters =
      @{
        @"apitalizationType": ^(id val) {
          return [RCTConvert UITextAutocapitalizationType:val];
        },
        @"eyboardType": ^(id val) {
          return [RCTConvert UIKeyboardType:val];
        },
        @"extAlignment": ^(id val) {
          return [RCTConvert NSTextAlignment:val];
        },
      };
    });
    for (NSString *subkey in converters) {
      if ([key hasSuffix:subkey]) {
        NSInteger (^converter)(NSString *) = converters[subkey];
        value = @(converter(value));
        break;
      }
    }
  }
  
  // Another nasty special case
  if ([target isKindOfClass:[UITextField class]]) {
    static NSDictionary *specialCases = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      specialCases = @{
        @"autocapitalizationType": ^(UITextField *f, NSInteger v){ f.autocapitalizationType = v; },
        @"autocorrectionType": ^(UITextField *f, NSInteger v){ f.autocorrectionType = v; },
        @"spellCheckingType": ^(UITextField *f, NSInteger v){ f.spellCheckingType = v; },
        @"keyboardType": ^(UITextField *f, NSInteger v){ f.keyboardType = v; },
        @"keyboardAppearance": ^(UITextField *f, NSInteger v){ f.keyboardAppearance = v; },
        @"returnKeyType": ^(UITextField *f, NSInteger v){ f.returnKeyType = v; },
        @"enablesReturnKeyAutomatically": ^(UITextField *f, NSInteger v){ f.enablesReturnKeyAutomatically = !!v; },
        @"secureTextEntry": ^(UITextField *f, NSInteger v){ f.secureTextEntry = !!v; }};
    });
    
    void (^block)(UITextField *f, NSInteger v) = specialCases[key];
    if (block)
    {
      block(target, [value integerValue]);
      return YES;
    }
  }
  
  // Set converted value
  [target setValue:RCTConvertValue(value, encoding) forKey:key];
  return YES;
}

BOOL RCTCopyProperty(id target, id source, NSString *keypath)
{
  // Split keypath
  NSArray *parts = [keypath componentsSeparatedByString:@"."];
  NSString *key = [parts lastObject];
  for (NSUInteger i = 0; i < parts.count - 1; i++) {
    source = [source valueForKey:parts[i]];
    target = [target valueForKey:parts[i]];
    if (!source || !target) {
      return NO;
    }
  }

  // Check class for property definition
  if (!class_getProperty([source class], [key UTF8String])) {
    // Check if setter exists
    SEL setter = NSSelectorFromString([NSString stringWithFormat:@"set%@%@:",
                                       [[key substringToIndex:1] uppercaseString],
                                       [key substringFromIndex:1]]);
    
    if (![source respondsToSelector:setter]
        || ![target respondsToSelector:setter]) {
      return NO;
    }
  }

  [target setValue:[source valueForKey:key] forKey:key];
  return YES;
}

BOOL RCTCallSetter(id target, SEL setter, id value)
{
  // Get property name
  NSString *propertyName = NSStringFromSelector(setter);
  RCTCAssert([propertyName hasPrefix:@"set"] && [propertyName hasSuffix:@":"],
             @"%@ is not a valid setter name", propertyName);
  propertyName = [[[propertyName substringWithRange:(NSRange){3,1}] lowercaseString] stringByAppendingString:[propertyName substringWithRange:(NSRange){4,propertyName.length - 5}]];
  
  // Set property
  return RCTSetProperty(target, propertyName, value);
}
