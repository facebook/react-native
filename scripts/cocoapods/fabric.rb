# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


# It sets up the Fabric dependencies.
#
# @parameter react_native_path: relative path to react-native
def setup_fabric!(react_native_path: "../node_modules/react-native", new_arch_enabled: false)
    pod 'React-Fabric', :path => "#{react_native_path}/ReactCommon"
    pod 'React-graphics', :path => "#{react_native_path}/ReactCommon/react/renderer/graphics"
    pod 'React-RCTFabric', :path => "#{react_native_path}/React", :modular_headers => true
    pod 'React-ImageManager', :path => "#{react_native_path}/ReactCommon/react/renderer/imagemanager/platform/ios"
    pod 'RCT-Folly/Fabric', :podspec => "#{react_native_path}/third-party-podspecs/RCT-Folly.podspec"
end
