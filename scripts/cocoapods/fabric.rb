# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


# It sets up the faric dependencies.
#
# @parameter prefix: prefix to use to reach react-native
# @parameter new_arch_enabled: whether the new arch is enabled or not
# @parameter codegen_output_dir: the directory where the code is generated
def setup_fabric!(prefix)
    pod 'React-Fabric', :path => "#{prefix}/ReactCommon"
    pod 'React-rncore', :path => "#{prefix}/ReactCommon"
    pod 'React-graphics', :path => "#{prefix}/ReactCommon/react/renderer/graphics"
    pod 'React-jsi/Fabric', :path => "#{prefix}/ReactCommon/jsi"
    pod 'React-RCTFabric', :path => "#{prefix}/React", :modular_headers => true
    pod 'RCT-Folly/Fabric', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec"
end
