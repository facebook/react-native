// Copyright 2004-present Facebook. All Rights Reserved.

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

/**
 * This must be invoked on iOS to set up platform dependencies before
 * creating an instance of JSCExecutor.
 */

void RCTPrepareJSCExecutor();
