/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <JavaScriptCore/JSObjectRef.h>

// These Symbols are included in JSC builds but not exported as part of the public headers.

#ifndef JSWeakPrivate_h
#define JSWeakPrivate_h

#ifdef __cplusplus
extern "C" {
#endif

typedef struct OpaqueJSWeak* JSWeakRef;

JSWeakRef JSWeakCreate(JSContextGroupRef, JSObjectRef);

void JSWeakRetain(JSContextGroupRef, JSWeakRef);
void JSWeakRelease(JSContextGroupRef, JSWeakRef);

JSObjectRef JSWeakGetObject(JSWeakRef);

#ifdef __cplusplus
}
#endif

#endif // JSWeakPrivate_h
