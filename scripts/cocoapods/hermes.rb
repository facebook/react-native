# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

def install_hermes_if_enabled(hermes_enabled, react_native_path)
    unless hermes_enabled
        return
    end

    prepare_hermes = 'node scripts/hermes/prepare-hermes-for-build'
    react_native_dir = Pod::Config.instance.installation_root.join(react_native_path)
    prep_output, prep_status = Open3.capture2e(prepare_hermes, :chdir => react_native_dir)
    prep_output.split("\n").each { |line| Pod::UI.info line }
    abort unless prep_status == 0

    pod 'React-hermes', :path => "#{react_native_path}/ReactCommon/hermes"
    pod 'libevent', '~> 2.1.12'
    pod 'hermes-engine', :podspec => "#{react_native_path}/sdks/hermes/hermes-engine.podspec"
end
