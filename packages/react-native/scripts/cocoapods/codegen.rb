# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# It builds the codegen CLI if it is not present
#
# Parameters:
# - react_native_path: the path to the react native installation
# - relative_installation_root: the path to the relative installation root of the pods
# - dir_manager: a class that implements the `Dir` interface. Defaults to `Dir`, the Dependency can be injected for testing purposes.
# @throws an error if it could not find the codegen folder.
def build_codegen!(react_native_path, relative_installation_root, dir_manager: Dir)
    codegen_repo_path = "#{relative_installation_root}/#{react_native_path}/../react-native-codegen";
    codegen_npm_path = "#{relative_installation_root}/#{react_native_path}/../@react-native/codegen";
    codegen_cli_path = ""

    if dir_manager.exist?(codegen_repo_path)
      codegen_cli_path = codegen_repo_path
    elsif dir_manager.exist?(codegen_npm_path)
      codegen_cli_path = codegen_npm_path
    else
      raise "[codegen] Could not find react-native-codegen."
    end

    if !dir_manager.exist?("#{codegen_cli_path}/lib")
      Pod::UI.puts "[Codegen] building #{codegen_cli_path}."
      system("#{codegen_cli_path}/scripts/oss/build.sh")
    end
  end

# It generates an empty `ThirdPartyProvider`, required by Fabric to load the components
#
# Parameters:
# - react_native_path: path to the react native framework
# - new_arch_enabled: whether the New Architecture is enabled or not
# - dir_manager: a class that implements the `Dir` interface. Defaults to `Dir`, the Dependency can be injected for testing purposes.
# - file_manager: a class that implements the `File` interface. Defaults to `File`, the Dependency can be injected for testing purposes.
def checkAndGenerateEmptyThirdPartyProvider!(react_native_path, new_arch_enabled, dir_manager: Dir, file_manager: File)
    return if new_arch_enabled

    relative_installation_root = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)

    output_dir = "#{react_native_path}/React/Fabric"

    provider_h_path = "#{output_dir}/RCTThirdPartyFabricComponentsProvider.h"
    provider_cpp_path ="#{output_dir}/RCTThirdPartyFabricComponentsProvider.mm"

    if(!file_manager.exist?(provider_h_path) || !file_manager.exist?(provider_cpp_path))
        # build codegen
        build_codegen!(react_native_path, relative_installation_root, dir_manager: dir_manager)

        # Just use a temp empty schema list.
        temp_schema_list_path = "#{output_dir}/tmpSchemaList.txt"
        file_manager.open(temp_schema_list_path, 'w') do |f|
            f.write('[]')
            f.fsync
        end

        Pod::UI.puts '[Codegen] generating an empty RCTThirdPartyFabricComponentsProvider'
        Pod::Executable.execute_command(
        'node',
        [
            "#{relative_installation_root}/#{react_native_path}/scripts/generate-provider-cli.js",
            "--platform", 'ios',
            "--schemaListPath", temp_schema_list_path,
            "--outputDir", "#{output_dir}"
        ])
        file_manager.delete(temp_schema_list_path) if file_manager.exist?(temp_schema_list_path)
    end
end

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
  folly_version: '2021.07.22.00',
  codegen_utils: CodegenUtils.new()
  )

  if new_arch_enabled
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
  else
    # Generate a podspec file for generated files.
    # This gets generated in use_react_native_codegen_discovery when codegen discovery is enabled.
    react_codegen_spec = codegen_utils.get_react_codegen_spec(
      package_json_file,
      :fabric_enabled => fabric_enabled,
      :hermes_enabled => hermes_enabled
    )
    codegen_utils.generate_react_codegen_podspec!(react_codegen_spec, codegen_output_dir)
  end
end
