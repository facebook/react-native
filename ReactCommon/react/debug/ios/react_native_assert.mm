/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/NSException.h>
#import <glog/logging.h>
#import <react/debug/react_native_assert.h>

#ifdef REACT_NATIVE_DEBUG

extern "C" void react_native_assert_fail(const char *func, const char *file, int line, const char *expr)
{
  // flush logs because some might be lost on iOS if an assert is hit right after
  // this. If you are trying to debug something actively and have added lots of
  // LOG statements to track down an issue, there is race between flushing the
  // final logs and stopping execution when the assert hits. Thus, if we know an
  // assert will fail, we force flushing to happen right before the assert.
  LOG(ERROR) << "react_native_assert failure: " << expr;
  google::FlushLogFiles(google::GLOG_INFO /*min_severity*/);

  NSCAssert(false, @"%s:%d: function %s: assertion failed (%s)", file, line, func, expr);
}

#endif
