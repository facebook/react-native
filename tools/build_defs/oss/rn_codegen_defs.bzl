# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Provides macros for working with React Native Codegen."""
# @lint-ignore-every BUCKRESTRICTEDSYNTAX

load(
    "//packages/react-native-codegen:DEFS.bzl",
    _rn_codegen_components = "rn_codegen_components",
    _rn_codegen_modules = "rn_codegen_modules",
)

rn_codegen_components = _rn_codegen_components
rn_codegen_modules = _rn_codegen_modules
