# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

def fb_xplat_platform_specific_rule(
        name,
        platform,
        rule,
        apple_configurator = None,
        apple_sdks = None,
        xplat_mangled_args = {},
        injected_args = {},
        repo = None,
        **kwargs):
    pass
