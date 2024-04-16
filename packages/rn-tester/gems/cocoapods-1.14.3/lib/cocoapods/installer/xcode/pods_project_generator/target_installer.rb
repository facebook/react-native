require 'stringio'

module Pod
  class Installer
    class Xcode
      class PodsProjectGenerator
        # Controller class responsible of creating and configuring the static
        # library target in Pods project. It also creates the support file needed
        # by the target.
        #
        class TargetInstaller
          include TargetInstallerHelper

          # @return [Sandbox] sandbox
          #         The sandbox where the support files should be generated.
          #
          attr_reader :sandbox

          # @return [Pod::Project]
          #         The project to install the target into.
          #
          attr_reader :project

          # @return [Target] target
          #         The library whose target needs to be generated.
          #
          attr_reader :target

          # Initialize a new instance
          #
          # @param [Sandbox] sandbox @see #sandbox
          # @param [Pod::Project] project @see #project
          # @param [Target] target  @see #target
          #
          def initialize(sandbox, project, target)
            @sandbox = sandbox
            @project = project
            @target = target
          end

          private

          #-----------------------------------------------------------------------#

          # @!group Installation steps

          # Adds the target for the library to the Pods project with the
          # appropriate build configurations.
          #
          # @note   The `PODS_HEADERS_SEARCH_PATHS` overrides the xcconfig.
          #
          # @return [PBXNativeTarget] the native target that was added.
          #
          def add_target
            product_type = target.product_type
            name = target.label
            platform = target.platform.name
            language = target.uses_swift? ? :swift : :objc
            native_target = project.new_target(product_type, name, platform, deployment_target, nil, language, target.product_basename)
            native_target.product_reference.name = name

            target.user_build_configurations.each do |bc_name, type|
              native_target.add_build_configuration(bc_name, type)
            end

            native_target.build_configurations.each do |configuration|
              configuration.build_settings.merge!(custom_build_settings)
            end

            native_target
          end

          # @return [String] The deployment target.
          #
          def deployment_target
            target.platform.deployment_target.to_s
          end

          # Returns the customized build settings which are overridden in the build
          # settings of the user target.
          #
          # @return [Hash{String => String}]
          #
          def custom_build_settings
            settings = {}

            unless target.archs.empty?
              settings['ARCHS'] = target.archs
            end

            if target.build_as_static_framework?
              settings['MACH_O_TYPE'] = 'staticlib'
            elsif target.build_as_static_library?
              settings.merge!('OTHER_LDFLAGS' => '', 'OTHER_LIBTOOLFLAGS' => '')
            end

            settings
          end

          # Creates the directory where to store the support files of the target.
          #
          def create_support_files_dir
            target.support_files_dir.mkpath
          end

          # Remove temp file whose store .prefix/config/dummy file.
          #
          def clean_support_files_temp_dir
            support_files_temp_dir.rmtree if support_files_temp_dir.exist?
          end

          # @return [String] The temp file path to store temporary files.
          #
          def support_files_temp_dir
            sandbox.target_support_files_dir('generated_files_tmp')
          end

          # Creates the Info.plist file which sets public framework attributes
          #
          # @param  [Pathname] path
          #         the path to save the generated Info.plist file.
          #
          # @param  [PBXNativeTarget] native_target
          #         the native target to link the generated Info.plist file into.
          #
          # @param  [Version] version
          #         the version to use for when generating this Info.plist file.
          #
          # @param  [Platform] platform
          #         the platform to use for when generating this Info.plist file.
          #
          # @param  [Symbol] bundle_package_type
          #         the CFBundlePackageType of the target this Info.plist file is for.
          #
          # @param  [Hash] additional_entries
          #         additional entries for the generated Info.plist
          #
          # @return [void]
          #
          def create_info_plist_file(path, native_target, version, platform, bundle_package_type = :fmwk, additional_entries: {})
            create_info_plist_file_with_sandbox(@sandbox, path, native_target, version, platform, bundle_package_type,
                                                :additional_entries => additional_entries)
            add_file_to_support_group(path)
          end

          # Creates the module map file which ensures that the umbrella header is
          # recognized with a customized path
          #
          # @param  [PBXNativeTarget] native_target
          #         the native target to link the module map file into.
          #
          # @return [void]
          #
          def create_module_map(native_target)
            path = target.module_map_path_to_write
            UI.message "- Generating module map file at #{UI.path(path)}" do
              generator = Generator::ModuleMap.new(target)
              yield generator if block_given?
              update_changed_file(generator, path)
              add_file_to_support_group(path)

              linked_path = target.module_map_path
              if path != linked_path
                linked_path.dirname.mkpath
                source = path.relative_path_from(linked_path.dirname)
                FileUtils.ln_sf(source, linked_path)
              end

              relative_path_string = target.module_map_path.relative_path_from(sandbox.root).to_s
              native_target.build_configurations.each do |c|
                c.build_settings['MODULEMAP_FILE'] = relative_path_string
              end
            end
          end

          # Generates a header which ensures that all header files are exported
          # in the module map
          #
          # @param  [PBXNativeTarget] native_target
          #         the native target to link the umbrella header file into.
          #
          # @yield_param [Generator::UmbrellaHeader]
          #              yielded once to configure the imports
          #
          # @return [void]
          #
          def create_umbrella_header(native_target)
            path = target.umbrella_header_path_to_write
            UI.message "- Generating umbrella header at #{UI.path(path)}" do
              generator = Generator::UmbrellaHeader.new(target)
              yield generator if block_given?
              update_changed_file(generator, path)

              # Add the file to the support group and the native target,
              # so it will been added to the header build phase
              file_ref = add_file_to_support_group(path)
              build_file = native_target.headers_build_phase.add_file_reference(file_ref)

              linked_path = target.umbrella_header_path
              if path != linked_path
                linked_path.dirname.mkpath
                source = path.relative_path_from(linked_path.dirname)
                FileUtils.ln_sf(source, linked_path)
              end

              acl = target.build_as_framework? ? 'Public' : 'Project'
              build_file.settings ||= {}
              build_file.settings['ATTRIBUTES'] = [acl]
            end
          end

          # Generates a dummy source file for each target so libraries that contain
          # only categories build.
          #
          # @param  [PBXNativeTarget] native_target
          #         the native target to link the dummy source file into.
          #
          # @return [void]
          #
          def create_dummy_source(native_target)
            path = target.dummy_source_path
            UI.message "- Generating dummy source at #{UI.path(path)}" do
              generator = Generator::DummySource.new(target.label)
              update_changed_file(generator, path)
              file_reference = add_file_to_support_group(path)
              native_target.source_build_phase.add_file_reference(file_reference)
            end
          end

          private

          #-----------------------------------------------------------------------#

          # @!group Private helpers.

          # @return [PBXGroup] the group where the file references to the support
          #         files should be stored.
          #
          attr_reader :support_files_group

          # Adds a reference to the given file in the support group of this target.
          #
          # @param  [Pathname] path
          #         The path of the file to which the reference should be added.
          #
          # @return [PBXFileReference] the file reference of the added file.
          #
          def add_file_to_support_group(path)
            support_files_group.new_file(path)
          end

          #-----------------------------------------------------------------------#
        end
      end
    end
  end
end
