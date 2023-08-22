//
//  RCTAddressSanitizerCrashManager.mm
//  Pods
//

#import "RCTAddressSanitizerCrashManager.h"

@implementation RCTAddressSanitizerCrashManager

RCT_EXPORT_MODULE(ASANCrash)

RCT_EXPORT_METHOD(invokeMemoryCrash) {
    char *s = (char*)malloc(100);
    free(s);
    strcpy(s, "Hello world!"); // AddressSanitizer: heap-use-after-free
}

@end
