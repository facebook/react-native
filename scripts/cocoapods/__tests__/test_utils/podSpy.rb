# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This file contains the utilities required to mock properly the
# usage of the `pod` function.
#
# To use this file, just add `require_relative "path/to/podSpy.rb"` to your test file.
#
# Remember to invoke `podSpy_cleanUp` in your setup/teardown method, to start from a clean situation.
#
# Whenever your ruby script uses the `pod` function, the invocation is recorded in the `$podInvocation` global
# variable. A $podInvocationCount counter is increased as well.
#
# You can assert against these variables to check:
# * The `pod` function has been invoked X times: `assert_equal($podInvocationCount, X)`
# * A specific pod has been installed: `assert_equal($podInvocation["MyPod"][:version], "15.4.6")`


$podInvocation = {}
$podInvocationCount = 0

def podSpy_cleanUp
    $podInvocation = {}
    $podInvocationCount = 0
end

def pod(name, version = nil, path: nil, configurations: nil, modular_headers: nil, podspec: nil)
    $podInvocationCount += 1
    params = {}
    if version != nil then params[:version] = version end
    if path != nil then params[:path] = path end
    if configurations != nil then params[:configurations] = configurations end
    if modular_headers != nil then params[:modular_headers] = modular_headers end
    if podspec != nil then params[:podspec] = podspec end
    $podInvocation[name] = params
end
