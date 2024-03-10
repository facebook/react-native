# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require_relative './helpers.rb'

# It builds the codegen CLI if it is not present
#
# Parameters:
# - react_native_path: the path to the react native installation
# - relative_installation_root: the path to the relative installation root of the pods
# - dir_manager: a class that implements the `Dir` interface. Defaults to `Dir`, the Dependency can be injected for testing purposes.
# @throws an error if it could not find the codegen folder.
def build_codegen!(react_native_path, relative_installation_root, dir_manager: Dir)
  codegen_repo_path = "#{basePath(react_native_path, relative_installation_root)}/../react-native-codegen"
  return unless dir_manager.exist?(codegen_repo_path) && !dir_manager.exist?("#{codegen_repo_path}/lib")

  Pod::UI.puts "[Codegen] building #{codegen_repo_path}"
  system("#{codegen_repo_path}/scripts/oss/build.sh")
end

# keeping the run_codegen! method for testing purposes
def run_codegen!(
  app_path,
  config_file_dir,
  new_arch_enabled: false,
  disable_codegen: false,
  react_native_path: "../node_modules/react-native",
  fabric_enabled: false,
  hermes_enabled: true,
  codegen_output_dir: 'build/generated/ios',
  config_key: 'codegenConfig',
  package_json_file: '~/app/package.json',
  folly_version: Helpers::Constants.folly_config()[:version],
  codegen_utils: CodegenUtils.new()
  )

  codegen_utils.use_react_native_codegen_discovery!(
    disable_codegen,
    app_path,
    :react_native_path => react_native_path,
    :fabric_enabled => fabric_enabled,
    :hermes_enabled => hermes_enabled,
    :config_file_dir => config_file_dir,
    :codegen_output_dir => codegen_output_dir,
    :config_key => config_key,
    :folly_version => folly_version
  )
end

def basePath(react_native_path, relative_installation_root)
  expanded_path = File.expand_path(react_native_path)
  if expanded_path == react_native_path
    react_native_path
  else
    File.join(relative_installation_root.to_s, react_native_path)
  end
end
