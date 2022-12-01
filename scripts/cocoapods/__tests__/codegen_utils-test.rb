# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require "json"
require_relative "../codegen_utils.rb"
require_relative "./test_utils/FileMock.rb"
require_relative "./test_utils/DirMock.rb"
require_relative "./test_utils/PodMock.rb"
require_relative "./test_utils/PathnameMock.rb"
require_relative "./test_utils/FinderMock.rb"
require_relative "./test_utils/CodegenUtilsMock.rb"
require_relative "./test_utils/CodegenScriptPhaseExtractorMock.rb"
require_relative "./test_utils/FileUtilsMock.rb"

class CodegenUtilsTests < Test::Unit::TestCase
    :base_path

    def setup
        CodegenUtils.set_react_codegen_discovery_done(false)
        CodegenUtils.set_react_codegen_podspec_generated(false)
        Pod::Config.reset()
        File.enable_testing_mode!
        Dir.enable_testing_mode!
        @base_path = "~/app/ios"
        Pathname.pwd!(@base_path)
        Pod::Config.instance.installation_root.relative_path_from = @base_path
    end

    def teardown
        FileUtils::FileUtilsStorage.reset()
        Finder.reset()
        Pathname.reset()
        Pod::UI.reset()
        Pod::Executable.reset()
        File.reset()
        Dir.reset()
    end

    # ================================== #
    # Test - GenerateReactCodegenPodspec #
    # ================================== #

    def testGenerateReactCodegenPodspec_whenItHasBeenAlreadyGenerated_doesNothing
        # Arrange
        spec = { :name => "Test Podspec" }
        codegen_output_dir = "build"
        CodegenUtils.set_react_codegen_podspec_generated(true)

        # Act
        CodegenUtils.new().generate_react_codegen_podspec!(spec, codegen_output_dir)

        # Assert
        assert_equal(Pod::UI.collected_messages, ["[Codegen] Skipping React-Codegen podspec generation."])
        assert_equal(Pathname.pwd_invocation_count, 0)
        assert_equal(Pod::Executable.executed_commands, [])
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 0)
        assert_true(CodegenUtils.react_codegen_podspec_generated)
    end

    def testGenerateReactCodegenPodspec_whenItHasNotBeenAlreadyGenerated_generatesIt
        # Arrange
        spec = { :name => "Test Podspec" }
        codegen_output_dir = "build"

        # Act
        CodegenUtils.new().generate_react_codegen_podspec!(spec, codegen_output_dir)

        # Assert
        assert_equal(Pathname.pwd_invocation_count, 1)
        assert_equal(Pod::Config.instance.installation_root.relative_path_from_invocation_count, 1)
        assert_equal(Pod::Executable.executed_commands, [{ "command" => 'mkdir', "arguments" => ["-p", "~/app/ios/build"]}])
        assert_equal(Pod::UI.collected_messages, ["[Codegen] Generating ~/app/ios/build/React-Codegen.podspec.json"])
        assert_equal(File.open_files_with_mode["~/app/ios/build/React-Codegen.podspec.json"], 'w')
        assert_equal(File.open_files[0].collected_write, ['{"name":"Test Podspec"}'])
        assert_equal(File.open_files[0].fsync_invocation_count, 1)

        assert_true(CodegenUtils.react_codegen_podspec_generated)
    end

    # ========================== #
    # Test - GetReactCodegenSpec #
    # ========================== #

    def testGetReactCodegenSpec_whenFabricDisabledAndNoScriptPhases_generatesAPodspec
        # Arrange
        File.files_to_read('package.json' => '{ "version": "99.98.97"}')

        # Act
        podspec = CodegenUtils.new().get_react_codegen_spec(
            'package.json',
            :fabric_enabled => false,
            :hermes_enabled => true,
            :script_phases => nil
        )

        # Assert
        assert_equal(podspec, get_podspec_no_fabric_no_script())
        assert_equal(Pod::UI.collected_messages, [])
    end

    def testGetReactCodegenSpec_whenFabricEnabledAndScriptPhases_generatesAPodspec
        # Arrange
        File.files_to_read('package.json' => '{ "version": "99.98.97"}')

        # Act
        podspec = CodegenUtils.new().get_react_codegen_spec(
            'package.json',
            :fabric_enabled => true,
            :hermes_enabled => true,
            :script_phases => "echo Test Script Phase"
        )

        # Assert
        assert_equal(podspec, get_podspec_fabric_and_script_phases("echo Test Script Phase"))
        assert_equal(Pod::UI.collected_messages, ["[Codegen] Adding script_phases to React-Codegen."])
    end

    # =============================== #
    # Test - GetCodegenConfigFromFile #
    # =============================== #

    def testGetCodegenConfigFromFile_whenFileDoesNotExists_returnEmpty
        # Arrange

        # Act
        codegen = CodegenUtils.new().get_codegen_config_from_file('package.json', 'codegenConfig')

        # Assert
        assert_equal(codegen, {})
    end

    def testGetCodegenConfigFromFile_whenFileExistsButHasNoKey_returnEmpty
        # Arrange
        File.mocked_existing_files(['package.json'])
        File.files_to_read('package.json' => '{ "codegenConfig": {}}')

        # Act
        codegen = CodegenUtils.new().get_codegen_config_from_file('package.json', 'codegen')

        # Assert
        assert_equal(codegen, {})
    end

    def testGetCodegenConfigFromFile_whenFileExistsAndHasKey_returnObject
        # Arrange
        File.mocked_existing_files(['package.json'])
        File.files_to_read('package.json' => '{ "codegenConfig": {"name": "MySpec"}}')

        # Act
        codegen = CodegenUtils.new().get_codegen_config_from_file('package.json', 'codegenConfig')

        # Assert
        assert_equal(codegen, { "name" => "MySpec"})
    end

    # ======================= #
    # Test - GetListOfJSSpecs #
    # ======================= #
    def testGetListOfJSSpecs_whenUsesLibraries_returnAListOfFiles
        # Arrange
        app_codegen_config = {
            'libraries' => [
                {
                    'name' => 'First Lib',
                    'jsSrcsDir' => './firstlib/js'
                },
                {
                    'name' => 'Second Lib',
                    'jsSrcsDir' => './secondlib/js'
                },
            ]
        }
        app_path = "~/MyApp/"
        Finder.set_files_for_paths({
            '~/MyApp/./firstlib/js' => ["MyFabricComponent1NativeComponent.js", "MyFabricComponent2NativeComponent.js"],
            '~/MyApp/./secondlib/js' => ["NativeModule1.js", "NativeModule2.js"],
        })

        # Act
        files = CodegenUtils.new().get_list_of_js_specs(app_codegen_config, app_path)

        # Assert
        assert_equal(Pod::UI.collected_warns , ["[Deprecated] You are using the old `libraries` array to list all your codegen.\\nThis method will be removed in the future.\\nUpdate your `package.json` with a single object."])
        assert_equal(Finder.captured_paths, ['~/MyApp/./firstlib/js', '~/MyApp/./secondlib/js'])
        assert_equal(files, [
            "${PODS_ROOT}/../MyFabricComponent1NativeComponent.js",
            "${PODS_ROOT}/../MyFabricComponent2NativeComponent.js",
            "${PODS_ROOT}/../NativeModule1.js",
            "${PODS_ROOT}/../NativeModule2.js",
        ])
    end

    def testGetListOfJSSpecs_whenDoesNotUsesLibraries_returnAListOfFiles
        # Arrange
        app_codegen_config = {
                'name' => 'First Lib',
                'jsSrcsDir' => './js'
            }

        app_path = "~/MyApp/"
        Finder.set_files_for_paths({
            '~/MyApp/./js' => ["MyFabricComponent1NativeComponent.js", "NativeModule1.js"],
        })

        # Act
        files = CodegenUtils.new().get_list_of_js_specs(app_codegen_config, app_path)

        # Assert
        assert_equal(Pod::UI.collected_warns , [])
        assert_equal(Finder.captured_paths, ['~/MyApp/./js'])
        assert_equal(files, [
            "${PODS_ROOT}/../MyFabricComponent1NativeComponent.js",
            "${PODS_ROOT}/../NativeModule1.js",
        ])
    end

    # ================================== #
    # Test - GetReactCodegenScriptPhases #
    # ================================== #

    def testGetReactCodegenScriptPhases_whenAppPathNotDefined_abort
        # Arrange

        # Act
        assert_raises() {
            CodegenUtils.new().get_react_codegen_script_phases(nil)
        }
        # Assert
        assert_equal(Pod::UI.collected_warns, ["[Codegen] error: app_path is requried to use codegen discovery."])
    end

    def testGetReactCodegenScriptPhases_returnTheScriptObject
        # Arrange
        app_path = "~/MyApp"
        input_files = ["${PODS_ROOT}/../MyFabricComponent1NativeComponent.js", "${PODS_ROOT}/../NativeModule1.js"]
        computed_script = "echo ScriptPhases"
        codegen_config = { "name" => "MyCodegenModule", "jsSrcsDir" => "./js"}
        codegen_utils_mock = CodegenUtilsMock.new(:js_spec_list => input_files, :codegen_config => codegen_config)
        script_phase_extractor_mock = CodegenScriptPhaseExtractorMock.new(computed_script)

        # Act

        scripts = CodegenUtils.new().get_react_codegen_script_phases(
            app_path,
            :codegen_utils => codegen_utils_mock,
            :script_phase_extractor => script_phase_extractor_mock
        )

        # Assert
        assert_equal(codegen_utils_mock.get_codegen_config_from_file_params, [{
            "config_key" => "codegenConfig",
            "config_path" => "~/MyApp/package.json"
        }])
        assert_equal(codegen_utils_mock.get_list_of_js_specs_params, [{
            "app_codegen_config" => {"jsSrcsDir"=>"./js", "name"=>"MyCodegenModule"},
            "app_path" => "~/MyApp"
        }])
        assert_equal(script_phase_extractor_mock.extract_script_phase_params, [{
            fabric_enabled: false,
            react_native_path: "../node_modules/react-native",
            relative_app_root: "~/MyApp",
            relative_config_file_dir: ""
        }])
        assert_equal(scripts, {
            'name': 'Generate Specs',
            'execution_position': :before_compile,
            'input_files' => input_files,
            'show_env_vars_in_log': true,
            'output_files': ["${DERIVED_FILE_DIR}/react-codegen.log"],
            'script': computed_script
        })
    end

    # ================================ #
    # Test - UseReactCodegenDiscovery! #
    # ================================ #

    def testUseReactCodegenDiscovery_whenCodegenDisabled_doNothing
        # Arrange

        # Act
        CodegenUtils.new().use_react_native_codegen_discovery!(true, nil)

        # Assert
        assert_false(CodegenUtils.react_codegen_discovery_done())
        assert_equal(Pod::UI.collected_messages, [])
        assert_equal(Pod::UI.collected_warns, [])
    end

    def testUseReactCodegenDiscovery_whenDiscoveryDone_doNothing
        # Arrange
        CodegenUtils.set_react_codegen_discovery_done(true)

        # Act
        CodegenUtils.new().use_react_native_codegen_discovery!(false, nil)

        # Assert
        assert_true(CodegenUtils.react_codegen_discovery_done())
        assert_equal(Pod::UI.collected_messages, ["[Codegen] Skipping use_react_native_codegen_discovery."])
        assert_equal(Pod::UI.collected_warns, [])
    end

    def testUseReactCodegenDiscovery_whenAppPathUndefined_abort
        # Arrange

        # Act
        assert_raises(){
            CodegenUtils.new().use_react_native_codegen_discovery!(false, nil)
        }

        # Assert
        assert_false(CodegenUtils.react_codegen_discovery_done())
        assert_equal(Pod::UI.collected_messages, [])
        assert_equal(Pod::UI.collected_warns, [
            '[Codegen] Error: app_path is required for use_react_native_codegen_discovery.',
            '[Codegen] If you are calling use_react_native_codegen_discovery! in your Podfile, please remove the call and pass `app_path` and/or `config_file_dir` to `use_react_native!`.'
        ])
    end

    def testUseReactCodegenDiscovery_whenParametersAreGood_executeCodegen
        # Arrange
        app_path = "~/app"
        computed_script = "echo TestScript"
        codegen_spec = {"name" => "React-Codegen"}

        codegen_utils_mock = CodegenUtilsMock.new(
            :react_codegen_script_phases => computed_script,
            :react_codegen_spec => codegen_spec
        )

        # Act
        CodegenUtils.new().use_react_native_codegen_discovery!(
            false,
            app_path,
            :codegen_utils => codegen_utils_mock
        )

        # Assert
        assert_true(CodegenUtils.react_codegen_discovery_done())
        assert_equal(Pod::UI.collected_warns, [
            '[Codegen] warn: using experimental new codegen integration'
        ])
        assert_equal(codegen_utils_mock.get_react_codegen_script_phases_params,  [{
            :app_path => "~/app",
            :config_file_dir => "",
            :config_key => "codegenConfig",
            :fabric_enabled => false,
            :react_native_path => "../node_modules/react-native"}
        ])
        assert_equal(codegen_utils_mock.get_react_codegen_spec_params,  [{
            :fabric_enabled => false,
            :folly_version=>"2021.07.22.00",
            :package_json_file => "../node_modules/react-native/package.json",
            :script_phases => "echo TestScript"
        }])
        assert_equal(codegen_utils_mock.generate_react_codegen_spec_params,  [{
            :codegen_output_dir=>"build/generated/ios",
            :react_codegen_spec=>{"name"=>"React-Codegen"}
        }])
        assert_equal(Pod::Executable.executed_commands, [
            {
                "command" => "node",
                "arguments"=> ["~/app/ios/../node_modules/react-native/scripts/generate-codegen-artifacts.js",
                    "-p", "~/app",
                    "-o", Pod::Config.instance.installation_root,
                    "-e", "false",
                    "-c", ""]
            }
        ])
    end

    # ============================= #
    # Test - CleanUpCodegenFolder #
    # ============================= #

    def testCleanUpCodegenFolder_whenCleanupDone_doNothing
        # Arrange
        CodegenUtils.set_cleanup_done(true)
        codegen_dir = "build/generated/ios"

        # Act
        CodegenUtils.clean_up_build_folder(@base_path, codegen_dir)

        # Assert
        assert_equal(FileUtils::FileUtilsStorage.rmrf_invocation_count, 0)
        assert_equal(FileUtils::FileUtilsStorage.rmrf_paths, [])
        assert_equal(CodegenUtils.cleanup_done(), true)
    end

    def testCleanUpCodegenFolder_whenFolderDoesNotExists_markAsCleanupDone
        # Arrange
        CodegenUtils.set_cleanup_done(false)
        codegen_dir = "build/generated/ios"

        # Act
        CodegenUtils.clean_up_build_folder(@base_path, codegen_dir)

        # Assert
        assert_equal(FileUtils::FileUtilsStorage.rmrf_invocation_count, 0)
        assert_equal(FileUtils::FileUtilsStorage.rmrf_paths, [])
        assert_equal(Dir.glob_invocation, [])
        assert_equal(CodegenUtils.cleanup_done(), true)
    end

    def testCleanUpCodegenFolder_whenFolderExists_deleteItAndSetCleanupDone
        # Arrange
        CodegenUtils.set_cleanup_done(false)
        codegen_dir = "build/generated/ios"
        codegen_path = "#{@base_path}/#{codegen_dir}"
        globs = [
            "/MyModuleSpecs/MyModule.h",
            "#{codegen_path}/MyModuleSpecs/MyModule.mm",
            "#{codegen_path}/react/components/MyComponent/ShadowNode.h",
            "#{codegen_path}/react/components/MyComponent/ShadowNode.mm",
        ]
        Dir.mocked_existing_dirs(codegen_path)
        Dir.mocked_existing_globs(globs, "#{codegen_path}/*")

        # Act
        CodegenUtils.clean_up_build_folder(@base_path, codegen_dir)

        # Assert
        assert_equal(Dir.exist_invocation_params, [codegen_path])
        assert_equal(Dir.glob_invocation, ["#{codegen_path}/*"])
        assert_equal(FileUtils::FileUtilsStorage.rmrf_invocation_count, 1)
        assert_equal(FileUtils::FileUtilsStorage.rmrf_paths, [globs])
        assert_equal(CodegenUtils.cleanup_done(), true)

    end

    private

    def get_podspec_no_fabric_no_script
        spec = {
          'name' => "React-Codegen",
          'version' => "99.98.97",
          'summary' => 'Temp pod for generated files for React Native',
          'homepage' => 'https://facebook.com/',
          'license' => 'Unlicense',
          'authors' => 'Facebook',
          'compiler_flags'  => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32 -Wno-documentation -Wno-nullability-completeness -std=c++17",
          'source' => { :git => '' },
          'header_mappings_dir' => './',
          'platforms' => {
            'ios' => '11.0',
          },
          'source_files' => "**/*.{h,mm,cpp}",
          'pod_target_xcconfig' => { "HEADER_SEARCH_PATHS" =>
            [
              "\"$(PODS_ROOT)/boost\"",
              "\"$(PODS_ROOT)/RCT-Folly\"",
              "\"${PODS_ROOT}/Headers/Public/React-Codegen/react/renderer/components\"",
              "\"$(PODS_ROOT)/Headers/Private/React-Fabric\"",
              "\"$(PODS_ROOT)/Headers/Private/React-RCTFabric\"",
            ].join(' ')
          },
          'dependencies': {
            "FBReactNativeSpec":  [],
            "React-jsiexecutor":  [],
            "RCT-Folly": [],
            "RCTRequired": [],
            "RCTTypeSafety": [],
            "React-Core": [],
            "React-jsi": [],
            "hermes-engine": [],
            "ReactCommon/turbomodule/bridging": [],
            "ReactCommon/turbomodule/core": []
          }
        }
    end

    def get_podspec_fabric_and_script_phases(script_phases)
        specs = get_podspec_no_fabric_no_script()

        specs[:dependencies].merge!({
            'React-graphics': [],
            'React-rncore':  [],
        })

        specs[:'script_phases'] = script_phases

        return specs
    end
end
