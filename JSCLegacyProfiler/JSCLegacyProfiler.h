// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#import "JSContextRef.h"

extern "C" {

void nativeProfilerStart(JSContextRef ctx, const char *title);
const char *nativeProfilerEnd(JSContextRef ctx, const char *title);

}
