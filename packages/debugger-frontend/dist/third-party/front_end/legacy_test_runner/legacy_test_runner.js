// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../entrypoints/devtools_app/devtools_app.js';
import './test_runner/test_runner.js';
// @ts-expect-error
if (self.testRunner) {
    // @ts-expect-error
    testRunner.dumpAsText();
    // @ts-expect-error
    testRunner.waitUntilDone();
}
//# sourceMappingURL=legacy_test_runner.js.map