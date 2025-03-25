/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLocalizedString.h"

#if !defined(WITH_FBI18N) || !(WITH_FBI18N)

extern "C" {

static NSString *FBTStringByConvertingIntegerToBase64(uint64_t number)
{
  const NSUInteger base = 64;
  const char *symbols = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
  char converted[9]; // output will take at most 8 symbols
  char *p = converted + sizeof(converted) - 1;
  *p = 0;
  do {
    *--p = symbols[number % base];
    number = number / base;
  } while (number > 0);
  return [[NSString alloc] initWithCString:p encoding:NSASCIIStringEncoding];
}

__attribute__((noinline)) uint64_t FBcoreLocalexxHash48(const char *input, uint64_t length, uint64_t seed)
{
  const uint64_t k48BitsMask = 0xffffffffffffL;
  return FBxxHash64(input, length, seed) & k48BitsMask;
}

NSString *RCTLocalizedStringFromKey(uint64_t key, NSString *defaultValue)
{
  static NSBundle *bundle = [NSBundle bundleWithPath:[[NSBundle mainBundle] pathForResource:@"RCTI18nStrings"
                                                                                     ofType:@"bundle"]];
  if (bundle == nil) {
    return defaultValue;
  } else {
    return [bundle localizedStringForKey:FBTStringByConvertingIntegerToBase64(key) value:defaultValue table:nil];
  }
}
}

#endif
