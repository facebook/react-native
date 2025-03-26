#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import <JSITooling/react/runtime/JSRuntimeFactory.h>
#import <JSITooling/react/runtime/JSRuntimeFactoryCAPI.h>

FOUNDATION_EXPORT double JSIToolingVersionNumber;
FOUNDATION_EXPORT const unsigned char JSIToolingVersionString[];
