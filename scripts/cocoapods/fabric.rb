# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# TODO: Move this to codegen.rb when we refactor that part
def build_codegen!(react_native_path, relative_installation_root)
    codegen_repo_path = "#{relative_installation_root}/#{react_native_path}/packages/react-native-codegen";
    codegen_npm_path = "#{relative_installation_root}/#{react_native_path}/../react-native-codegen";
    codegen_cli_path = ""

    if Dir.exist?(codegen_repo_path)
      codegen_cli_path = codegen_repo_path
    elsif Dir.exist?(codegen_npm_path)
      codegen_cli_path = codegen_npm_path
    else
      raise "[codegen] Couldn't not find react-native-codegen."
    end

    if !Dir.exist?("#{codegen_cli_path}/lib")
      Pod::UI.puts "[Codegen] building #{codegen_cli_path}."
      system("#{codegen_cli_path}/scripts/oss/build.sh")
    end
  end

# This is a temporary supporting function until we enable use_react_native_codegen_discovery by default.
def checkAndGenerateEmptyThirdPartyProvider!(react_native_path, new_arch_enabled, codegen_output_dir)
    return if new_arch_enabled

    relative_installation_root = Pod::Config.instance.installation_root.relative_path_from(Pathname.pwd)

    output_dir = "#{relative_installation_root}/#{codegen_output_dir}"

    provider_h_path = "#{output_dir}/RCTThirdPartyFabricComponentsProvider.h"
    provider_cpp_path ="#{output_dir}/RCTThirdPartyFabricComponentsProvider.cpp"

    if(!File.exist?(provider_h_path) || !File.exist?(provider_cpp_path))
        # build codegen
        build_codegen!(react_native_path, relative_installation_root)

        # Just use a temp empty schema list.
        temp_schema_list_path = "#{output_dir}/tmpSchemaList.txt"
        File.open(temp_schema_list_path, 'w') do |f|
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
        File.delete(temp_schema_list_path) if File.exist?(temp_schema_list_path)
    end
end

# It sets up the faric dependencies and it create the an EmptyThirdPartyProvider, if needed.
#
# @parameter prefix: prefix to use to reach react-native
# @parameter new_arch_enabled: whether the new arch is enabled or not
# @parameter codegen_output_dir: the directory where the code is generated
def setup_fabric!(prefix, new_arch_enabled, codegen_output_dir)
    checkAndGenerateEmptyThirdPartyProvider!(prefix, new_arch_enabled, codegen_output_dir)
    pod 'React-Fabric', :path => "#{prefix}/ReactCommon"
    pod 'React-rncore', :path => "#{prefix}/ReactCommon"
    pod 'React-graphics', :path => "#{prefix}/ReactCommon/react/renderer/graphics"
    pod 'React-jsi/Fabric', :path => "#{prefix}/ReactCommon/jsi"
    pod 'React-RCTFabric', :path => "#{prefix}/React", :modular_headers => true
    pod 'RCT-Folly/Fabric', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec"
end
