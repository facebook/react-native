# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


# Set up Bridgeless dependencies
#
# @parameter react_native_path: relative path to react-native
def setup_bridgeless!(react_native_path: "../node_modules/react-native", use_hermes: true)
    pod "React-jsitracing", :path => "#{react_native_path}/ReactCommon/hermes/executor/"
    pod "React-runtimescheduler", :path => "#{react_native_path}/ReactCommon/react/renderer/runtimescheduler"
    pod 'React-BridgelessCore', :path => "#{react_native_path}/ReactCommon/react/bridgeless"
    pod 'React-BridgelessApple', :path => "#{react_native_path}/ReactCommon/react/bridgeless/platform/ios"
    if use_hermes
        pod 'React-BridgelessHermes', :path => "#{react_native_path}/ReactCommon/react/bridgeless"
    end
end
