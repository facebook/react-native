/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file is required for the CSS podpsec because this is a header-files only
// module. Headers file only modules are not supported by Cocoapods when
// building in dynamic framework mode. In that case, the dynamicFramework is not
// generated because there is no binary to generate. This means that other
// frameworks that depends on this will not find the headers they need. Adding a
// simple empty dummy source file forces Cocoapods to generate the frameworks
// and fixes the issue.
