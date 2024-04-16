require 'active_support/core_ext/array'
require 'active_support/core_ext/string/inflections'
require 'cocoapods/xcode'

module Pod
  class Installer
    class Xcode
      class PodsProjectGenerator
        # Creates the target for the Pods libraries in the Pods project and the
        # relative support files.
        #
        class PodTargetInstaller < TargetInstaller
          require 'cocoapods/installer/xcode/pods_project_generator/app_host_installer'

          # @return [Array<Pathname>] Array of umbrella header paths in the headers directory
          #
          attr_reader :umbrella_header_paths

          # @return [PodTarget] @see TargetInstaller#target
          #
          attr_reader :target

          # Initialize a new instance
          #
          # @param [Sandbox] sandbox @see TargetInstaller#sandbox
          # @param [Pod::Project] project @see TargetInstaller#project
          # @param [PodTarget] target @see TargetInstaller#target
          # @param [Array<Pathname>] umbrella_header_paths @see #umbrella_header_paths
          #
          def initialize(sandbox, project, target, umbrella_header_paths = nil)
            super(sandbox, project, target)
            @umbrella_header_paths = umbrella_header_paths
          end

          # Creates the target in the Pods project and the relative support files.
          #
          # @return [TargetInstallationResult] the result of the installation of this target.
          #
          def install!
            UI.message "- Installing target `#{target.name}` #{target.platform}" do
              create_support_files_dir
              library_file_accessors = target.file_accessors.select { |fa| fa.spec.library_specification? }
              test_file_accessors = target.file_accessors.select { |fa| fa.spec.test_specification? }
              app_file_accessors = target.file_accessors.select { |fa| fa.spec.app_specification? }

              native_target = if target.should_build?
                                add_target
                              else
                                # For targets that should not be built (e.g. pre-built vendored frameworks etc), we add a placeholder
                                # PBXAggregateTarget that will be used to wire up dependencies later.
                                add_placeholder_target
                              end

              resource_bundle_targets = add_resources_bundle_targets(library_file_accessors).values.flatten

              test_native_targets = add_test_targets
              test_app_host_targets = add_test_app_host_targets
              test_resource_bundle_targets = add_resources_bundle_targets(test_file_accessors)

              app_native_targets = add_app_targets
              app_resource_bundle_targets = add_resources_bundle_targets(app_file_accessors)

              add_files_to_build_phases(native_target, test_native_targets, app_native_targets)
              targets_to_validate = test_native_targets + app_native_targets.values
              targets_to_validate << native_target if target.should_build?
              validate_targets_contain_sources(targets_to_validate)
              validate_xcframeworks if target.should_build?

              create_copy_xcframeworks_script unless target.xcframeworks.values.all?(&:empty?)

              create_xcconfig_file(native_target, resource_bundle_targets)
              create_test_xcconfig_files(test_native_targets, test_resource_bundle_targets)
              create_app_xcconfig_files(app_native_targets, app_resource_bundle_targets)

              if target.should_build? && target.defines_module? && !skip_modulemap?(target.library_specs)
                create_module_map(native_target) do |generator|
                  generator.headers.concat module_map_additional_headers
                end
                create_umbrella_header(native_target) do |generator|
                  generator.imports += library_file_accessors.flat_map do |file_accessor|
                    header_dir = if !target.build_as_framework? && dir = file_accessor.spec_consumer.header_dir
                                   Pathname.new(dir)
                                 end

                    file_accessor.public_headers.map do |public_header|
                      public_header = if header_mappings_dir(file_accessor)
                                        public_header.relative_path_from(header_mappings_dir(file_accessor))
                                      else
                                        public_header.basename
                                      end
                      if header_dir
                        public_header = header_dir.join(public_header)
                      end
                      public_header
                    end
                  end
                end
              end

              if target.should_build? && target.build_as_framework?
                unless skip_info_plist?(native_target)
                  create_info_plist_file(target.info_plist_path, native_target, target.version, target.platform,
                                         :additional_entries => target.info_plist_entries)
                end
                create_build_phase_to_symlink_header_folders(native_target)
              end

              if target.should_build? && target.build_as_library? && target.uses_swift?
                add_swift_library_compatibility_header_phase(native_target)
              end

              project_directory = project.path.dirname

              if target.should_build? && !skip_pch?(target.library_specs)
                path = target.prefix_header_path
                create_prefix_header(path, library_file_accessors, target.platform, native_target, project_directory)
                add_file_to_support_group(path)
              end
              unless skip_pch?(target.test_specs)
                target.test_specs.each do |test_spec|
                  path = target.prefix_header_path_for_spec(test_spec)
                  test_spec_consumer = test_spec.consumer(target.platform)
                  test_native_target = test_native_target_from_spec(test_spec_consumer.spec, test_native_targets)
                  create_prefix_header(path, test_file_accessors, target.platform, test_native_target, project_directory)
                  add_file_to_support_group(path)
                end
              end
              unless skip_pch?(target.app_specs)
                target.app_specs.each do |app_spec|
                  path = target.prefix_header_path_for_spec(app_spec)
                  app_spec_consumer = app_spec.consumer(target.platform)
                  app_native_target = app_native_targets[app_spec_consumer.spec]
                  create_prefix_header(path, app_file_accessors, target.platform, app_native_target, project_directory)
                  add_file_to_support_group(path)
                end
              end
              create_dummy_source(native_target) if target.should_build?
              create_copy_dsyms_script
              clean_support_files_temp_dir
              TargetInstallationResult.new(target, native_target, resource_bundle_targets,
                                           test_native_targets, test_resource_bundle_targets, test_app_host_targets,
                                           app_native_targets, app_resource_bundle_targets)
            end
          end

          private

          # Adds the target for the library to the Pods project with the
          # appropriate build configurations.
          #
          # @note   Overrides the superclass implementation to remove settings that are set in the pod target xcconfig
          #
          # @return [PBXNativeTarget] the native target that was added.
          #
          def add_target
            super.tap do |native_target|
              remove_pod_target_xcconfig_overrides_from_target(target.build_settings, native_target)
            end
          end

          # Removes overrides of the `pod_target_xcconfig` settings from the target's
          # build configurations.
          #
          # @param [Hash{Symbol => Pod::Target::BuildSettings}] build_settings_by_config the build settings by config
          #        of the target.
          #
          # @param [PBXNativeTarget] native_target
          #        the native target to remove pod target xcconfig overrides from.
          #
          # @return [Void]
          #
          #
          def remove_pod_target_xcconfig_overrides_from_target(build_settings_by_config, native_target)
            native_target.build_configurations.each do |configuration|
              build_settings = build_settings_by_config[target.user_build_configurations[configuration.name]]
              unless build_settings.nil?
                build_settings.merged_pod_target_xcconfigs.each_key do |setting|
                  configuration.build_settings.delete(setting)
                end
              end
            end
          end

          # @param [Array<Specification>] specs
          #        the specs to check against whether `.pch` generation should be skipped or not.
          #
          # @return [Boolean] Whether the target should build a pch file.
          #
          def skip_pch?(specs)
            specs.any? { |spec| spec.root.prefix_header_file.is_a?(FalseClass) }
          end

          def skip_modulemap?(specs)
            specs.any? { |spec| spec.module_map.is_a?(FalseClass) }
          end

          # True if info.plist generation should be skipped
          #
          # @param [PXNativeTarget] native_target
          #
          # @return [Boolean] Whether the target should build an Info.plist file
          #
          def skip_info_plist?(native_target)
            existing_setting = native_target.resolved_build_setting('INFOPLIST_FILE', true).values.compact
            !existing_setting.empty?
          end

          # Remove the default headers folder path settings for static library pod
          # targets.
          #
          # @return [Hash{String => String}]
          #
          def custom_build_settings
            settings = super
            unless target.build_as_framework?
              settings['PRIVATE_HEADERS_FOLDER_PATH'] = ''
              settings['PUBLIC_HEADERS_FOLDER_PATH'] = ''
            end

            settings['PRODUCT_NAME'] = target.product_basename
            settings['PRODUCT_MODULE_NAME'] = target.product_module_name

            settings['CODE_SIGN_IDENTITY[sdk=appletvos*]'] = ''
            settings['CODE_SIGN_IDENTITY[sdk=iphoneos*]'] = ''
            settings['CODE_SIGN_IDENTITY[sdk=watchos*]'] = ''

            settings['SWIFT_ACTIVE_COMPILATION_CONDITIONS'] = '$(inherited) '

            if target.swift_version
              settings['SWIFT_VERSION'] = target.swift_version
            end

            if info_plist_bundle_id
              settings['PRODUCT_BUNDLE_IDENTIFIER'] = info_plist_bundle_id
            end

            settings
          end

          # @return [String] Bundle Identifier found in the custom Info.plist entries
          #
          def info_plist_bundle_id
            return @plist_bundle_id if defined?(@plist_bundle_id)
            unless target.info_plist_entries.nil?
              @plist_bundle_id = target.info_plist_entries['CFBundleIdentifier']
              unless @plist_bundle_id.nil?
                message = "The `#{target.name}` target " \
              "sets a Bundle Identifier of `#{@plist_bundle_id}` in it's info.plist file. " \
              'The Bundle Identifier should be set using pod_target_xcconfig: ' \
              "s.pod_target_xcconfig = { 'PRODUCT_BUNDLE_IDENTIFIER': '#{@plist_bundle_id}' }`."
                UI.warn message
              end
              @plist_bundle_id
            end
          end

          # Filters the given resource file references discarding empty paths which are
          # added by their parent directory. This will also include references to the parent [PBXVariantGroup]
          # for all resources underneath it.
          #
          # @param  [Array<Pathname>] resource_file_references
          #         The array of all resource file references to filter.
          #
          # @yield_param  [Array<PBXFileReference>} The filtered resource file references to be installed
          #               in the copy resources phase.
          #
          # @yield_param  [Array<PBXFileReference>} The filtered resource file references to be installed
          #               in the compile sources phase.
          #
          # @note   Core Data model directories (.xcdatamodeld) and RealityKit projects (.rcproject)
          #         used to be added to the `Copy Resources` build phase like all other resources,
          #         since they would compile correctly in either the resources or compile phase. In
          #         recent versions of xcode, there's an exception for data models that generate
          #         headers. These need to be added to the compile sources phase of a real
          #         target for the headers to be built in time for code in the target to
          #         use them. These kinds of models generally break when added to resource
          #         bundles.
          #
          def filter_resource_file_references(resource_file_references)
            file_references = resource_file_references.map do |resource_file_reference|
              ref = project.reference_for_path(resource_file_reference)

              # Some nested files are not directly present in the Xcode project, such as the contents
              # of an .xcdatamodeld directory. These files are implicitly included by including their
              # parent directory.
              next if ref.nil?

              # For variant groups, the variant group itself is added, not its members.
              next ref.parent if ref.parent.is_a?(Xcodeproj::Project::Object::PBXVariantGroup)

              ref
            end.compact.uniq
            compile_phase_matcher = lambda { |ref| !(ref.path =~ /.*\.(xcdatamodeld|rcproject)/i).nil? }
            compile_phase_refs, resources_phase_refs = file_references.partition(&compile_phase_matcher)
            yield compile_phase_refs, resources_phase_refs
          end

          #-----------------------------------------------------------------------#

          # Adds the build files of the pods to the target and adds a reference to
          # the frameworks of the Pods.
          #
          # @note   The Frameworks are used only for presentation purposes as the
          #         xcconfig is the authoritative source about their information.
          #
          # @note   Core Data model directories (.xcdatamodeld) defined in the `resources`
          #         property are currently added to the `Copy Resources` build phase like
          #         all other resources. The Xcode UI adds these to the `Compile Sources`
          #         build phase, but they will compile correctly either way.
          #
          # @return [void]
          #
          def add_files_to_build_phases(library_native_target, test_native_targets, app_native_targets)
            target.file_accessors.each do |file_accessor|
              consumer = file_accessor.spec_consumer

              native_target =  case consumer.spec.spec_type
                               when :library
                                 library_native_target
                               when :test
                                 test_native_target_from_spec(consumer.spec, test_native_targets)
                               when :app
                                 app_native_targets[consumer.spec]
                               else
                                 raise ArgumentError, "Unknown spec type #{consumer.spec.spec_type}."
                               end

              next if native_target.is_a?(Xcodeproj::Project::Object::PBXAggregateTarget)

              headers = file_accessor.headers
              public_headers = file_accessor.public_headers.map(&:realpath)
              project_headers = file_accessor.project_headers.map(&:realpath)
              private_headers = file_accessor.private_headers.map(&:realpath)
              other_source_files = file_accessor.other_source_files

              {
                true => file_accessor.arc_source_files,
                false => file_accessor.non_arc_source_files,
              }.each do |arc, source_files|
                next if source_files.empty?
                source_files = source_files - headers - other_source_files
                swift_source_files, non_swift_source_files = source_files.partition { |file| file.extname == '.swift' }
                {
                  :objc => non_swift_source_files,
                  :swift => swift_source_files,
                }.each do |language, files|
                  compiler_flags = compiler_flags_for_consumer(consumer, arc, language)
                  file_refs = project_file_references_array(files, 'source')
                  native_target.add_file_references(file_refs, compiler_flags)
                end
              end

              header_file_refs = project_file_references_array(headers, 'header')
              native_target.add_file_references(header_file_refs) do |build_file|
                add_header(file_accessor, build_file, public_headers, project_headers, private_headers, native_target)
              end

              other_file_refs = project_file_references_array(other_source_files, 'other source')
              native_target.add_file_references(other_file_refs, nil)

              next unless target.build_as_framework?

              filter_resource_file_references(file_accessor.resources.flatten) do |compile_phase_refs, resource_phase_refs|
                native_target.add_file_references(compile_phase_refs, nil)

                if target.build_as_static_framework? && consumer.spec.library_specification?
                  resource_phase_refs = resource_phase_refs.select do |ref|
                    filename = ref.name || ref.path
                    Target.resource_extension_compilable?(File.extname(filename))
                  end
                end

                native_target.add_resources(resource_phase_refs)
              end
            end
          end

          # Adds the test targets for the library to the Pods project with the
          # appropriate build configurations.
          #
          # @return [Array<PBXNativeTarget>] the test native targets created.
          #
          def add_test_targets
            target.test_specs.map do |test_spec|
              spec_consumer = test_spec.consumer(target.platform)
              test_type = spec_consumer.test_type
              product_type = target.product_type_for_test_type(test_type)
              name = target.test_target_label(test_spec)
              platform_name = target.platform.name
              language = target.uses_swift_for_spec?(test_spec) ? :swift : :objc
              product_basename = target.product_basename_for_spec(test_spec)
              embedded_content_contains_swift = target.dependent_targets_for_test_spec(test_spec).any?(&:uses_swift?)
              test_native_target = project.new_target(product_type, name, platform_name,
                                                      target.deployment_target_for_non_library_spec(test_spec), nil,
                                                      language, product_basename)
              test_native_target.product_reference.name = name

              target.user_build_configurations.each do |bc_name, type|
                test_native_target.add_build_configuration(bc_name, type)
              end

              test_native_target.build_configurations.each do |configuration|
                configuration.build_settings.merge!(custom_build_settings)
                # target_installer will automatically add an empty `OTHER_LDFLAGS`. For test
                # targets those are set via a test xcconfig file instead.
                configuration.build_settings.delete('OTHER_LDFLAGS')
                # target_installer will automatically set the product name to the module name if the target
                # requires frameworks. For tests we always use the test target name as the product name
                # irrelevant to whether we use frameworks or not.
                configuration.build_settings['PRODUCT_NAME'] = name
                # target_installer sets 'MACH_O_TYPE' for static frameworks ensure this does not propagate
                # to test target.
                configuration.build_settings.delete('MACH_O_TYPE')
                # Use xcode default product module name, which is $(PRODUCT_NAME:c99extidentifier)
                # this gives us always valid name that is distinct from the parent spec module name
                # which allow tests to use either import or @testable import to access the parent framework
                configuration.build_settings.delete('PRODUCT_MODULE_NAME')
                # We must codesign iOS XCTest bundles that contain binary frameworks to allow them to be launchable in the simulator
                unless target.platform == :osx
                  configuration.build_settings['CODE_SIGNING_REQUIRED'] = 'YES'
                  configuration.build_settings['CODE_SIGNING_ALLOWED'] = 'YES'
                end
                # For macOS we do not code sign the XCTest bundle because we do not code sign the frameworks either.
                if target.platform == :osx
                  configuration.build_settings['CODE_SIGN_IDENTITY'] = ''
                elsif target.platform == :ios
                  configuration.build_settings['CODE_SIGN_IDENTITY'] = 'iPhone Developer'
                end
                # Ensure swift stdlib gets copied in if needed, even when the target contains no swift files,
                # because a dependency uses swift
                configuration.build_settings['ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES'] = 'YES' if embedded_content_contains_swift
              end

              remove_pod_target_xcconfig_overrides_from_target(target.test_spec_build_settings_by_config[test_spec.name], test_native_target)

              # Test native targets also need frameworks and resources to be copied over to their xctest bundle.
              create_test_target_embed_frameworks_script(test_spec)
              create_test_target_copy_resources_script(test_spec)

              # Generate vanilla Info.plist for test target similar to the one Xcode generates for new test target.
              # This creates valid test bundle accessible at the runtime, allowing tests to load bundle resources
              # defined in podspec.
              additional_entries = spec_consumer.info_plist
              path = target.info_plist_path_for_spec(test_spec)
              create_info_plist_file(path, test_native_target, '1.0', target.platform, :bndl, :additional_entries => additional_entries)

              test_native_target
            end
          end

          # Adds the test app host targets for the library to the Pods project with the
          # appropriate build configurations.
          #
          # @return [Array<PBXNativeTarget>] the app host targets created.
          #
          def add_test_app_host_targets
            target.test_spec_consumers.reject(&:requires_app_host?).select(&:app_host_name).each do |test_spec_consumer|
              raise Informative, "`#{target.label}-#{test_spec_consumer.test_type}-Tests` manually specifies an app host but has not specified `requires_app_host = true`."
            end

            target.test_spec_consumers.select(&:requires_app_host?).reject(&:app_host_name).group_by { |consumer| target.app_host_target_label(consumer.spec) }.
              map do |(_, target_name), _|
                AppHostInstaller.new(sandbox, project, target.platform, target_name, target.pod_name, target_name).install!
              end
          end

          # Adds the app targets for the library to the Pods project with the
          # appropriate build configurations.
          #
          # @return [Hash{Specification => PBXNativeTarget}] the app native targets created, keyed by their app spec
          #
          def add_app_targets
            target.app_specs.each_with_object({}) do |app_spec, hash|
              spec_consumer = app_spec.consumer(target.platform)
              spec_name = app_spec.parent.name
              subspec_name = target.subspec_label(app_spec)
              app_target_label = target.app_target_label(app_spec)
              platform = Platform.new(target.platform.symbolic_name, target.deployment_target_for_non_library_spec(app_spec))
              info_plist_entries = spec_consumer.info_plist
              resources = target.file_accessors.find { |fa| fa.spec == app_spec }.resources
              add_launchscreen_storyboard = resources.none? { |resource| resource.basename.to_s == 'LaunchScreen.storyboard' } && platform.name == :ios
              embedded_content_contains_swift = target.dependent_targets_for_app_spec(app_spec).any?(&:uses_swift?)
              app_native_target = AppHostInstaller.new(sandbox, project, platform, subspec_name, spec_name,
                                                       app_target_label, :add_main => false,
                                                                         :add_launchscreen_storyboard => add_launchscreen_storyboard,
                                                                         :info_plist_entries => info_plist_entries,
                                                                         :product_basename => target.product_basename_for_spec(app_spec)).install!

              app_native_target.product_reference.name = app_target_label
              target.user_build_configurations.each do |bc_name, type|
                app_native_target.add_build_configuration(bc_name, type)
              end

              app_native_target.build_configurations.each do |configuration|
                configuration.build_settings.merge!(custom_build_settings)

                # target_installer will automatically add an empty `OTHER_LDFLAGS`. For app
                # targets those are set via an app xcconfig file instead.
                configuration.build_settings.delete('OTHER_LDFLAGS')
                # target_installer will automatically set the product name to the module name if the target
                # requires frameworks. For apps we always use the app target name as the product name
                # irrelevant to whether we use frameworks or not.
                configuration.build_settings['PRODUCT_NAME'] = app_target_label
                # target_installer sets 'MACH_O_TYPE' for static frameworks ensure this does not propagate
                # to app target.
                configuration.build_settings.delete('MACH_O_TYPE')
                # Use xcode default product module name, which is $(PRODUCT_NAME:c99extidentifier)
                # this gives us always valid name that is distinct from the parent spec module name
                # which allow the app to use import to access the parent framework
                configuration.build_settings.delete('PRODUCT_MODULE_NAME')

                # We must codesign iOS app bundles that contain binary frameworks to allow them to be launchable in the simulator
                unless target.platform == :osx
                  configuration.build_settings['CODE_SIGNING_REQUIRED'] = 'YES'
                  configuration.build_settings['CODE_SIGNING_ALLOWED'] = 'YES'
                end
                # For macOS we do not code sign the appbundle because we do not code sign the frameworks either.
                configuration.build_settings['CODE_SIGN_IDENTITY'] = '' if target.platform == :osx
                # For iOS, we delete the target_installer empty values that get set for libraries since CocoaPods will
                # code sign the libraries manually but for apps this is not true.
                if target.platform == :ios
                  configuration.build_settings.delete('CODE_SIGN_IDENTITY[sdk=appletvos*]')
                  configuration.build_settings.delete('CODE_SIGN_IDENTITY[sdk=iphoneos*]')
                  configuration.build_settings.delete('CODE_SIGN_IDENTITY[sdk=watchos*]')
                end
                # Ensure swift stdlib gets copied in if needed, even when the target contains no swift files,
                # because a dependency uses swift
                configuration.build_settings['ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES'] = 'YES' if embedded_content_contains_swift
              end

              remove_pod_target_xcconfig_overrides_from_target(target.app_spec_build_settings_by_config[app_spec.name], app_native_target)

              create_app_target_embed_frameworks_script(app_spec)
              create_app_target_copy_resources_script(app_spec)
              add_resources_to_target(resources, app_native_target)

              hash[app_spec] = app_native_target
            end
          end

          # Adds the resources to the compile resources phase of the target.
          #
          # @param  [Array<Pathname>] paths the paths to add to the target.
          #
          # @param  [PBXNativeTarget] target the target resources are added to.
          #
          # @return [Boolean] whether any compile phase references were added.
          #
          def add_resources_to_target(paths, target)
            filter_resource_file_references(paths) do |compile_phase_refs, resource_phase_refs|
              # Resource bundles are only meant to have resources, so install everything
              # into the resources phase. See note in filter_resource_file_references.
              target.add_resources(resource_phase_refs + compile_phase_refs)
              !compile_phase_refs.empty?
            end
          end

          # Adds the resources of the Pods to the Pods project.
          #
          # @note   The source files are grouped by Pod and in turn by subspec
          #         (recursively) in the resources group.
          #
          # @param  [Array<Sandbox::FileAccessor>] file_accessors
          #         the file accessors list to generate resource bundles for.
          #
          # @return [Hash{String=>Array<PBXNativeTarget>}] the resource bundle native targets created.
          #
          def add_resources_bundle_targets(file_accessors)
            file_accessors.each_with_object({}) do |file_accessor, hash|
              hash[file_accessor.spec.name] = file_accessor.resource_bundles.map do |bundle_name, paths|
                label = target.resources_bundle_target_label(bundle_name)
                resource_bundle_target = project.new_resources_bundle(label, file_accessor.spec_consumer.platform_name, nil, bundle_name)
                resource_bundle_target.product_reference.name = label
                contains_compile_phase_refs = add_resources_to_target(paths, resource_bundle_target)

                target.user_build_configurations.each do |bc_name, type|
                  resource_bundle_target.add_build_configuration(bc_name, type)
                end
                resource_bundle_target.deployment_target = if file_accessor.spec.non_library_specification?
                                                             target.deployment_target_for_non_library_spec(file_accessor.spec)
                                                           else
                                                             deployment_target
                                                           end
                # Create Info.plist file for bundle
                path = target.info_plist_path
                path.dirname.mkdir unless path.dirname.exist?
                info_plist_path = path.dirname + "ResourceBundle-#{bundle_name}-#{path.basename}"
                create_info_plist_file(info_plist_path, resource_bundle_target, target.version, target.platform, :bndl)

                resource_bundle_target.build_configurations.each do |configuration|
                  configuration.build_settings['PRODUCT_NAME'] = bundle_name
                  # Do not set the CONFIGURATION_BUILD_DIR for resource bundles that are only meant for test targets.
                  # This is because the test target itself also does not set this configuration build dir and it expects
                  # all bundles to be copied from the default path.
                  unless file_accessor.spec.test_specification?
                    configuration.build_settings['CONFIGURATION_BUILD_DIR'] = target.configuration_build_dir('$(BUILD_DIR)/$(CONFIGURATION)$(EFFECTIVE_PLATFORM_NAME)')
                  end

                  # Set the 'IBSC_MODULE' build settings for resource bundles so that Storyboards and Xibs can load
                  # classes from the parent module.
                  configuration.build_settings['IBSC_MODULE'] = target.product_module_name

                  # Xcode 14.x throws an error about code signing on resource bundles, turn it off for now.
                  configuration.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'

                  # Set the `SWIFT_VERSION` build setting for resource bundles that could have resources that get
                  # compiled such as an `xcdatamodeld` file which has 'Swift' as its code generation language.
                  if contains_compile_phase_refs && file_accessors.any? { |fa| target.uses_swift_for_spec?(fa.spec) }
                    configuration.build_settings['SWIFT_VERSION'] = target.swift_version
                  end

                  # Set the correct device family for this bundle, based on the platform
                  device_family_by_platform = {
                    :ios => '1,2',
                    :tvos => '3',
                    :watchos => '1,2,4',
                  }

                  if (family = device_family_by_platform[target.platform.name])
                    configuration.build_settings['TARGETED_DEVICE_FAMILY'] = family
                  end
                end

                remove_pod_target_xcconfig_overrides_from_target(target.build_settings_by_config_for_spec(file_accessor.spec), resource_bundle_target)

                resource_bundle_target
              end
            end
          end

          # Generates the contents of the xcconfig file and saves it to disk.
          #
          # @param  [PBXNativeTarget] native_target
          #         the native target to link the xcconfig file into.
          #
          # @param  [Array<PBXNativeTarget>] resource_bundle_targets
          #         the additional resource bundle targets to link the xcconfig file into.
          #
          # @return [void]
          #
          def create_xcconfig_file(native_target, resource_bundle_targets)
            target.user_config_names_by_config_type.each do |config, names|
              path = target.xcconfig_path(config)
              update_changed_file(target.build_settings[config], path)
              xcconfig_file_ref = add_file_to_support_group(path)

              # also apply the private config to resource bundle targets.
              apply_xcconfig_file_ref_to_targets([native_target] + resource_bundle_targets, xcconfig_file_ref, names)
            end
          end

          # Generates the contents of the xcconfig file used for each test target type and saves it to disk.
          #
          # @param  [Array<PBXNativeTarget>] test_native_targets
          #         the test native target to link the xcconfig file into.
          #
          # @param  [Hash{String=>Array<PBXNativeTarget>}] test_resource_bundle_targets
          #         the additional test resource bundle targets to link the xcconfig file into.
          #
          # @return [void]
          #
          def create_test_xcconfig_files(test_native_targets, test_resource_bundle_targets)
            target.test_specs.each do |test_spec|
              spec_consumer = test_spec.consumer(target.platform)
              test_type = spec_consumer.test_type
              test_native_target = test_native_target_from_spec(spec_consumer.spec, test_native_targets)

              target.user_config_names_by_config_type.each do |config, names|
                path = target.xcconfig_path("#{test_type.capitalize}-#{target.subspec_label(test_spec)}.#{config}")
                test_spec_build_settings = target.build_settings_for_spec(test_spec, :configuration => config)
                update_changed_file(test_spec_build_settings, path)
                test_xcconfig_file_ref = add_file_to_support_group(path)

                # also apply the private config to resource bundle test targets related to this test spec.
                scoped_test_resource_bundle_targets = test_resource_bundle_targets[test_spec.name]
                apply_xcconfig_file_ref_to_targets([test_native_target] + scoped_test_resource_bundle_targets, test_xcconfig_file_ref, names)
              end
            end
          end

          # Creates a script that copies the resources to the bundle of the test target.
          #
          # @param [Specification] test_spec
          #        The test spec to create the copy resources script for.
          #
          # @return [void]
          #
          def create_test_target_copy_resources_script(test_spec)
            path = target.copy_resources_script_path_for_spec(test_spec)
            host_target_spec_names = target.app_host_dependent_targets_for_spec(test_spec).flat_map do |pt|
              pt.specs.map(&:name)
            end.uniq
            resource_paths_by_config = target.user_build_configurations.each_with_object({}) do |(config_name, config), resources_by_config|
              resources_by_config[config_name] = target.dependent_targets_for_test_spec(test_spec, :configuration => config).flat_map do |pod_target|
                spec_paths_to_include = pod_target.library_specs.map(&:name)
                spec_paths_to_include -= host_target_spec_names
                spec_paths_to_include << test_spec.name if pod_target == target
                pod_target.resource_paths.values_at(*spec_paths_to_include).flatten.compact
              end
            end
            unless resource_paths_by_config.each_value.all?(&:empty?)
              generator = Generator::CopyResourcesScript.new(resource_paths_by_config, target.platform)
              update_changed_file(generator, path)
              add_file_to_support_group(path)
            end
          end

          # Creates a script that embeds the frameworks to the bundle of the test target.
          #
          # @param [Specification] test_spec
          #        The test spec to create the embed frameworks script for.
          #
          # @return [void]
          #
          def create_test_target_embed_frameworks_script(test_spec)
            path = target.embed_frameworks_script_path_for_spec(test_spec)
            host_target_spec_names = target.app_host_dependent_targets_for_spec(test_spec).flat_map do |pt|
              pt.specs.map(&:name)
            end.uniq
            framework_paths_by_config = target.user_build_configurations.each_with_object({}) do |(config_name, config), paths_by_config|
              paths_by_config[config_name] = target.dependent_targets_for_test_spec(test_spec, :configuration => config).flat_map do |pod_target|
                spec_paths_to_include = pod_target.library_specs.map(&:name)
                spec_paths_to_include -= host_target_spec_names
                spec_paths_to_include << test_spec.name if pod_target == target
                pod_target.framework_paths.values_at(*spec_paths_to_include).flatten.compact.uniq
              end
            end
            xcframeworks_by_config = target.user_build_configurations.each_with_object({}) do |(config_name, config), paths_by_config|
              paths_by_config[config_name] = target.dependent_targets_for_test_spec(test_spec, :configuration => config).flat_map do |pod_target|
                spec_paths_to_include = pod_target.library_specs.map(&:name)
                spec_paths_to_include -= host_target_spec_names
                spec_paths_to_include << test_spec.name if pod_target == target
                pod_target.xcframeworks.values_at(*spec_paths_to_include).flatten.compact.uniq
              end
            end
            unless framework_paths_by_config.each_value.all?(&:empty?) && xcframeworks_by_config.each_value.all?(&:empty?)
              generator = Generator::EmbedFrameworksScript.new(framework_paths_by_config, xcframeworks_by_config)
              update_changed_file(generator, path)
              add_file_to_support_group(path)
            end
          end

          # Generates the contents of the xcconfig file used for each app target type and saves it to disk.
          #
          # @param  [Hash{Specification => PBXNativeTarget}] app_native_targets
          #         the app native targets to link the xcconfig file into.
          #
          # @param  [Hash{String=>Array<PBXNativeTarget>}] app_resource_bundle_targets
          #         the additional app resource bundle targets to link the xcconfig file into.
          #
          # @return [void]
          #
          def create_app_xcconfig_files(app_native_targets, app_resource_bundle_targets)
            target.app_specs.each do |app_spec|
              spec_consumer = app_spec.consumer(target.platform)
              app_native_target = app_native_targets[spec_consumer.spec]

              target.user_config_names_by_config_type.each do |config, names|
                path = target.xcconfig_path("#{target.subspec_label(app_spec)}.#{config}")
                app_spec_build_settings = target.build_settings_for_spec(app_spec, :configuration => config)
                update_changed_file(app_spec_build_settings, path)
                app_xcconfig_file_ref = add_file_to_support_group(path)

                # also apply the private config to resource bundle app targets related to this app spec.
                scoped_app_resource_bundle_targets = app_resource_bundle_targets[app_spec.name]
                apply_xcconfig_file_ref_to_targets([app_native_target] + scoped_app_resource_bundle_targets, app_xcconfig_file_ref, names)
              end
            end
          end

          # Creates a script that copies the resources to the bundle of the app target.
          #
          # @param [Specification] app_spec
          #        The app spec to create the copy resources script for.
          #
          # @return [void]
          #
          def create_app_target_copy_resources_script(app_spec)
            path = target.copy_resources_script_path_for_spec(app_spec)
            resource_paths_by_config = target.user_build_configurations.each_with_object({}) do |(config_name, config), resources_by_config|
              pod_targets = target.dependent_targets_for_app_spec(app_spec, :configuration => config)
              resources_by_config[config_name] = pod_targets.flat_map do |pod_target|
                spec_paths_to_include = pod_target.library_specs.map(&:name)
                spec_paths_to_include << app_spec.name if pod_target == target
                pod_target.resource_paths.values_at(*spec_paths_to_include).flatten.compact
              end
            end
            unless resource_paths_by_config.each_value.all?(&:empty?)
              generator = Generator::CopyResourcesScript.new(resource_paths_by_config, target.platform)
              update_changed_file(generator, path)
              add_file_to_support_group(path)
            end
          end

          # Creates a script that embeds the frameworks to the bundle of the app target.
          #
          # @param [Specification] app_spec
          #        The app spec to create the embed frameworks script for.
          #
          # @return [void]
          #
          def create_app_target_embed_frameworks_script(app_spec)
            path = target.embed_frameworks_script_path_for_spec(app_spec)
            framework_paths_by_config = target.user_build_configurations.each_with_object({}) do |(config_name, config), paths_by_config|
              paths_by_config[config_name] = target.dependent_targets_for_app_spec(app_spec, :configuration => config).flat_map do |pod_target|
                spec_paths_to_include = pod_target.library_specs.map(&:name)
                spec_paths_to_include << app_spec.name if pod_target == target
                pod_target.framework_paths.values_at(*spec_paths_to_include).flatten.compact.uniq
              end
            end
            xcframeworks_by_config = target.user_build_configurations.each_with_object({}) do |(config_name, config), paths_by_config|
              paths_by_config[config_name] = target.dependent_targets_for_app_spec(app_spec, :configuration => config).flat_map do |pod_target|
                spec_paths_to_include = pod_target.library_specs.map(&:name)
                spec_paths_to_include << app_spec.name if pod_target == target
                pod_target.xcframeworks.values_at(*spec_paths_to_include).flatten.compact.uniq
              end
            end

            unless framework_paths_by_config.each_value.all?(&:empty?) && xcframeworks_by_config.each_value.all?(&:empty?)
              generator = Generator::EmbedFrameworksScript.new(framework_paths_by_config, xcframeworks_by_config)
              update_changed_file(generator, path)
              add_file_to_support_group(path)
            end
          end

          # Creates a script that copies and strips vendored dSYMs and bcsymbolmaps.
          #
          # @return [void]
          #
          def create_copy_dsyms_script
            dsym_paths = PodTargetInstaller.dsym_paths(target)
            bcsymbolmap_paths = PodTargetInstaller.bcsymbolmap_paths(target)
            path = target.copy_dsyms_script_path
            unless dsym_paths.empty? && bcsymbolmap_paths.empty?
              generator = Generator::CopydSYMsScript.new(dsym_paths, bcsymbolmap_paths)
              update_changed_file(generator, path)
              add_file_to_support_group(path)
            end
          end

          # Creates a script that copies the appropriate xcframework slice to the build dir.
          #
          # @note   We can't use Xcode default link libraries phase, because
          #         we need to ensure that we only copy the frameworks which are
          #         relevant for the current build configuration.
          #
          # @return [void]
          #
          def create_copy_xcframeworks_script
            path = target.copy_xcframeworks_script_path
            generator = Generator::CopyXCFrameworksScript.new(target.xcframeworks.values.flatten, sandbox.root, target.platform)
            update_changed_file(generator, path)
            add_file_to_support_group(path)
          end

          # Creates a build phase which links the versioned header folders
          # of the OS X framework into the framework bundle's root directory.
          # This is only necessary because the way how headers are copied
          # via custom copy file build phases in combination with
          # header_mappings_dir interferes with xcodebuild's expectations
          # about the existence of private or public headers.
          #
          # @param  [PBXNativeTarget] native_target
          #         the native target to add the script phase into.
          #
          # @return [void]
          #
          def create_build_phase_to_symlink_header_folders(native_target)
            # This is required on iOS for Catalyst, which uses macOS framework layouts
            return unless (target.platform.name == :osx || target.platform.name == :ios) && any_header_mapping_dirs?

            build_phase = native_target.new_shell_script_build_phase('Create Symlinks to Header Folders')
            build_phase.shell_script = <<-eos.strip_heredoc
              cd "$CONFIGURATION_BUILD_DIR/$WRAPPER_NAME" || exit 1
              if [ ! -d Versions ]; then
                # Not a versioned framework, so no need to do anything
                exit 0
              fi

              public_path="${PUBLIC_HEADERS_FOLDER_PATH\#\$CONTENTS_FOLDER_PATH/}"
              if [ ! -f "$public_path" ]; then
                ln -fs "${PUBLIC_HEADERS_FOLDER_PATH\#$WRAPPER_NAME/}" "$public_path"
              fi

              private_path="${PRIVATE_HEADERS_FOLDER_PATH\#\$CONTENTS_FOLDER_PATH/}"
              if [ ! -f "$private_path" ]; then
                ln -fs "${PRIVATE_HEADERS_FOLDER_PATH\#\$WRAPPER_NAME/}" "$private_path"
              fi
            eos
          end

          ENABLE_OBJECT_USE_OBJC_FROM = {
            :ios => Version.new('6'),
            :osx => Version.new('10.8'),
            :watchos => Version.new('2.0'),
            :tvos => Version.new('9.0'),
            :visionos => Version.new('1.0'),
          }.freeze

          # Returns the compiler flags for the source files of the given specification.
          #
          # The following behavior is regarding the `OS_OBJECT_USE_OBJC` flag. When
          # set to `0`, it will allow code to use `dispatch_release()` on >= iOS 6.0
          # and OS X 10.8.
          #
          # * New libraries that do *not* require ARC don’t need to care about this
          #   issue at all.
          #
          # * New libraries that *do* require ARC _and_ have a deployment target of
          #   >= iOS 6.0 or OS X 10.8:
          #
          #   These no longer use `dispatch_release()` and should *not* have the
          #   `OS_OBJECT_USE_OBJC` flag set to `0`.
          #
          #   **Note:** this means that these libraries *have* to specify the
          #             deployment target in order to function well.
          #
          # * New libraries that *do* require ARC, but have a deployment target of
          #   < iOS 6.0 or OS X 10.8:
          #
          #   These contain `dispatch_release()` calls and as such need the
          #   `OS_OBJECT_USE_OBJC` flag set to `1`.
          #
          #   **Note:** libraries that do *not* specify a platform version are
          #             assumed to have a deployment target of < iOS 6.0 or OS X 10.8.
          #
          #  For more information, see: https://opensource.apple.com/source/libdispatch/libdispatch-228.18/os/object.h
          #
          # @param  [Specification::Consumer] consumer
          #         The consumer for the specification for which the compiler flags
          #         are needed.
          #
          # @param  [Boolean] arc
          #         Whether the arc is enabled or not.
          #
          # @param  [Symbol] language
          #         The language these compiler warnings are for. Can be either :objc or :swift.
          #
          # @return [String] The compiler flags.
          #
          def compiler_flags_for_consumer(consumer, arc, language)
            flags = consumer.compiler_flags.dup
            if !arc && language == :objc
              flags << '-fno-objc-arc'
            else
              platform_name = consumer.platform_name
              spec_deployment_target = consumer.spec.deployment_target(platform_name)
              if spec_deployment_target.nil? || Version.new(spec_deployment_target) < ENABLE_OBJECT_USE_OBJC_FROM[platform_name]
                flags << '-DOS_OBJECT_USE_OBJC=0'
              end
            end
            if target.inhibit_warnings? && language == :objc
              flags << '-w -Xanalyzer -analyzer-disable-all-checks'
            end
            flags * ' '
          end

          def apply_xcconfig_file_ref_to_targets(targets, xcconfig_file_ref, configurations)
            targets.each do |config_target|
              config_target.build_configurations.each do |configuration|
                next unless configurations.include?(configuration.name)
                configuration.base_configuration_reference = xcconfig_file_ref
              end
            end
          end

          def create_module_map(native_target)
            return super(native_target) unless custom_module_map

            path = target.module_map_path_to_write
            UI.message "- Copying module map file to #{UI.path(path)}" do
              contents = custom_module_map.read
              unless target.build_as_framework?
                contents.gsub!(/^(\s*)framework\s+(module[^{}]+){/, '\1\2{')
              end
              generator = Generator::Constant.new(contents)
              update_changed_file(generator, path)
              add_file_to_support_group(path)

              linked_path = target.module_map_path
              if path != linked_path
                linked_path.dirname.mkpath
                source = path.relative_path_from(linked_path.dirname)
                FileUtils.ln_sf(source, linked_path)
              end

              relative_path = target.module_map_path.relative_path_from(sandbox.root).to_s
              native_target.build_configurations.each do |c|
                c.build_settings['MODULEMAP_FILE'] = relative_path.to_s
              end
            end
          end

          def module_map_additional_headers
            return [] unless umbrella_header_paths

            other_paths = umbrella_header_paths - [target.umbrella_header_path]
            other_paths.map do |module_map_path|
              # exclude other targets umbrella headers, to avoid
              # incomplete umbrella warnings
              Generator::ModuleMap::Header.new(module_map_path.basename, nil, nil, nil, true)
            end
          end

          def create_umbrella_header(native_target)
            super(native_target) unless custom_module_map
          end

          def custom_module_map
            @custom_module_map ||= target.file_accessors.first.module_map
          end

          def project_file_references_array(files, file_type)
            error_message_for_missing_reference = lambda do |sf, target|
              "Unable to find #{file_type} ref for `#{sf.basename}` for target `#{target.name}`."
            end

            # Remove all file ref under .docc folder, but preserve the .docc folder
            files = merge_to_docc_folder(files)
            files.map do |sf|
              begin
                project.reference_for_path(sf).tap do |ref|
                  raise Informative, error_message_for_missing_reference.call(sf, target) unless ref
                end
              rescue Errno::ENOENT
                # Normalize the error for Ruby < 2.7. Ruby 2.7 can crash on a different call of real path compared
                # to older versions. This ensures that the error message is consistent.
                raise Informative, error_message_for_missing_reference.call(sf, target)
              end
            end
          end

          def any_header_mapping_dirs?
            return @any_header_mapping_dirs if defined?(@any_header_mapping_dirs)
            @any_header_mapping_dirs = target.file_accessors.any? { |fa| fa.spec_consumer.header_mappings_dir }
          end

          def header_mappings_dir(file_accessor)
            @header_mappings_dirs ||= {}
            return @header_mappings_dirs[file_accessor] if @header_mappings_dirs.key?(file_accessor)
            @header_mappings_dirs[file_accessor] = if dir = file_accessor.spec_consumer.header_mappings_dir
                                                     file_accessor.path_list.root + dir
                                                   end
          end

          def add_header(file_accessor, build_file, public_headers, project_headers, private_headers, native_target)
            file_ref = build_file.file_ref
            acl = if !target.build_as_framework? # Headers are already rooted at ${PODS_ROOT}/Headers/P*/[pod]/...
                    'Project'
                  elsif public_headers.include?(file_ref.real_path)
                    'Public'
                  elsif project_headers.include?(file_ref.real_path)
                    'Project'
                  elsif private_headers.include?(file_ref.real_path)
                    'Private'
                  else
                    'Project'
                  end

            if target.build_as_framework? && !header_mappings_dir(file_accessor).nil? && acl != 'Project'
              relative_path = if mapping_dir = header_mappings_dir(file_accessor)
                                file_ref.real_path.relative_path_from(mapping_dir)
                              else
                                file_ref.real_path.relative_path_from(file_accessor.path_list.root)
                              end
              compile_build_phase_index = native_target.build_phases.index do |bp|
                bp.is_a?(Xcodeproj::Project::Object::PBXSourcesBuildPhase)
              end
              sub_dir = relative_path.dirname
              copy_phase_name = "Copy #{sub_dir} #{acl} Headers"
              copy_phase = native_target.copy_files_build_phases.find { |bp| bp.name == copy_phase_name } ||
                native_target.new_copy_files_build_phase(copy_phase_name)
              native_target.build_phases.move(copy_phase, compile_build_phase_index - 1) unless compile_build_phase_index.nil?
              copy_phase.symbol_dst_subfolder_spec = :products_directory
              copy_phase.dst_path = "$(#{acl.upcase}_HEADERS_FOLDER_PATH)/#{sub_dir}"
              copy_phase.add_file_reference(file_ref, true)
            else
              build_file.settings ||= {}
              build_file.settings['ATTRIBUTES'] = [acl]
            end
          end

          def support_files_group
            pod_name = target.pod_name
            dir = target.support_files_dir
            project.pod_support_files_group(pod_name, dir)
          end

          def test_native_target_from_spec(spec, test_native_targets)
            test_target_label = target.test_target_label(spec)
            test_native_targets.find do |test_native_target|
              test_native_target.name == test_target_label
            end
          end

          # Adds a placeholder native target for the library to the Pods project with the
          # appropriate build configurations.
          #
          # @return [PBXAggregateTarget] the native target that was added.
          #
          def add_placeholder_target
            native_target = project.new_aggregate_target(target.label, [], target.platform.name, deployment_target)
            target.user_build_configurations.each do |bc_name, type|
              native_target.add_build_configuration(bc_name, type)
            end
            unless target.archs.empty?
              native_target.build_configurations.each do |configuration|
                configuration.build_settings['ARCHS'] = target.archs
              end
            end
            native_target
          end

          # Adds a shell script phase, intended only for library targets that contain swift,
          # to copy the ObjC compatibility header (the -Swift.h file that the swift compiler generates)
          # to the built products directory. Additionally, the script phase copies the module map, appending a `.Swift`
          # submodule that references the (moved) compatibility header. Since the module map has been moved, the umbrella header
          # is _also_ copied, so that it is sitting next to the module map. This is necessary for a successful archive build.
          #
          # @param  [PBXNativeTarget] native_target
          #         the native target to add the Swift static library script phase into.
          #
          # @return [Void]
          #
          def add_swift_library_compatibility_header_phase(native_target)
            if custom_module_map
              raise Informative, 'Using Swift static libraries with custom module maps is currently not supported. ' \
                                 "Please build `#{target.label}` as a framework or remove the custom module map."
            end

            build_phase = native_target.new_shell_script_build_phase('Copy generated compatibility header')

            relative_module_map_path = target.module_map_path.relative_path_from(target.sandbox.root)
            relative_umbrella_header_path = target.umbrella_header_path.relative_path_from(target.sandbox.root)

            build_phase.shell_script = <<-SH.strip_heredoc
              COMPATIBILITY_HEADER_PATH="${BUILT_PRODUCTS_DIR}/Swift Compatibility Header/${PRODUCT_MODULE_NAME}-Swift.h"
              MODULE_MAP_PATH="${BUILT_PRODUCTS_DIR}/${PRODUCT_MODULE_NAME}.modulemap"

              ditto "${DERIVED_SOURCES_DIR}/${PRODUCT_MODULE_NAME}-Swift.h" "${COMPATIBILITY_HEADER_PATH}"
              ditto "${PODS_ROOT}/#{relative_module_map_path}" "${MODULE_MAP_PATH}"
              ditto "${PODS_ROOT}/#{relative_umbrella_header_path}" "${BUILT_PRODUCTS_DIR}"
              printf "\\n\\nmodule ${PRODUCT_MODULE_NAME}.Swift {\\n  header \\"${COMPATIBILITY_HEADER_PATH}\\"\\n  requires objc\\n}\\n" >> "${MODULE_MAP_PATH}"
            SH
            build_phase.input_paths = %W(
              ${DERIVED_SOURCES_DIR}/${PRODUCT_MODULE_NAME}-Swift.h
              ${PODS_ROOT}/#{relative_module_map_path}
              ${PODS_ROOT}/#{relative_umbrella_header_path}
            )
            build_phase.output_paths = %W(
              ${BUILT_PRODUCTS_DIR}/${PRODUCT_MODULE_NAME}.modulemap
              ${BUILT_PRODUCTS_DIR}/#{relative_umbrella_header_path.basename}
              ${BUILT_PRODUCTS_DIR}/Swift\ Compatibility\ Header/${PRODUCT_MODULE_NAME}-Swift.h
            )
          end

          def validate_targets_contain_sources(native_targets)
            native_targets.each do |native_target|
              next unless native_target.source_build_phase.files.empty?
              raise Informative, "Unable to install the `#{target.label}` pod, because the `#{native_target}` target in Xcode would have no sources to compile."
            end
          end

          # Raises if a vendored xcframework contains frameworks of mixed linkage or mixed packaging
          #
          def validate_xcframeworks
            target.xcframeworks.each_value do |xcframeworks|
              xcframeworks.each do |xcframework|
                if xcframework.slices.empty?
                  raise Informative, "Unable to install vendored xcframework `#{xcframework.name}` for Pod `#{target.label}` because it does not contain any binaries."
                end
                if xcframework.build_type.dynamic_library?
                  raise Informative, <<-MSG.strip_heredoc
                    Unable to install vendored xcframework `#{xcframework.name}` for Pod `#{target.label}` because it contains dynamic libraries which are not supported.
                    Use dynamic frameworks for dynamic linking instead.
                  MSG
                end
                if xcframework.build_type.static_library?
                  binary_names = xcframework.slices.map { |slice| File.basename(slice.binary_path, File.extname(slice.binary_path)) }.uniq
                  if binary_names.size > 1
                    raise Informative, <<-MSG.strip_heredoc
                      Unable to install vendored xcframework `#{xcframework.name}` for Pod `#{target.label}` because it contains static libraries
                      with differing binary names: #{binary_names.to_sentence}.
                    MSG
                  end
                end
                dynamic_slices, static_slices = xcframework.slices.partition(&:dynamic?)
                if !dynamic_slices.empty? && !static_slices.empty?
                  raise Informative, "Unable to install vendored xcframework `#{xcframework.name}` for Pod `#{target.label}`, because it contains both static and dynamic frameworks."
                end
                library_slices, framework_slices = xcframework.slices.partition(&:library?)
                if !library_slices.empty? && !framework_slices.empty?
                  raise Informative, "Unable to install vendored xcframework `#{xcframework.name}` for Pod `#{target.label}`, because it contains both libraries and frameworks."
                end
              end
            end
          end

          #-----------------------------------------------------------------------#

          class << self
            # @param [PodTarget] target the target to be installed
            #
            # @return [Array<String>] the dSYM paths for the given target
            #
            def dsym_paths(target)
              dsym_paths = target.framework_paths.values.flatten.reject { |fmwk_path| fmwk_path.dsym_path.nil? }.map(&:dsym_path)
              dsym_paths.concat(target.xcframeworks.values.flatten.flat_map { |xcframework| xcframework_dsyms(xcframework.path) })
              dsym_paths.map do |dsym_path|
                dsym_pathname = Pathname(dsym_path)
                dsym_path = "${PODS_ROOT}/#{dsym_pathname.relative_path_from(target.sandbox.root)}" unless dsym_pathname.relative?
                dsym_path
              end
            end

            # @param [PodTarget] target the target to be installed
            #
            # @return [Array<String>] the bcsymbolmap paths for the given target
            #
            def bcsymbolmap_paths(target)
              target.framework_paths.values.flatten.reject do |fmwk_path|
                fmwk_path.bcsymbolmap_paths.nil?
              end.flat_map(&:bcsymbolmap_paths).uniq
            end

            # @param  [Pathname] xcframework_path
            #         the base path of the .xcframework bundle
            #
            # @return [Array<Pathname>] all found .dSYM paths
            #
            def xcframework_dsyms(xcframework_path)
              basename = File.basename(xcframework_path, '.xcframework')
              dsym_basename = basename + '.dSYMs'
              path = xcframework_path.dirname + dsym_basename
              if File.directory?(path)
                Dir.glob(path + '*.dSYM')
              else
                []
              end
            end
          end
        end
      end
    end
  end
end
