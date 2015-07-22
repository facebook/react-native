// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#import "JSContextRef.h"

extern "C" {

JSValueRef nativeProfilerStart(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception);

JSValueRef nativeProfilerEnd(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception);

}
