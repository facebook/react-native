module Xcodeproj
  class Project
    module Object
      class AbstractTarget < AbstractObject
        # @!group Attributes

        # @return [String] The name of the Target.
        #
        attribute :name, String

        # @return [String] the name of the build product.
        #
        attribute :product_name, String

        # @return [String] Comments associated with this target.
        #
        #   This is apparently no longer used by Xcode.
        #
        attribute :comments, String

        # @return [XCConfigurationList] the list of the build configurations of
        #         the target. This list commonly include two configurations
        #         `Debug` and `Release`.
        #
        has_one :build_configuration_list, XCConfigurationList

        # @return [ObjectList<PBXTargetDependency>] the targets necessary to
        #         build this target.
        #
        has_many :dependencies, PBXTargetDependency

        public

        # @!group Helpers
        #--------------------------------------#

        # Gets the value for the given build setting in all the build
        # configurations or the value inheriting the value from the project
        # ones if needed.
        #
        # @param [String] key
        #        the key of the build setting.
        #
        # @param [Bool] resolve_against_xcconfig
        #        whether the resolved setting should take in consideration any
        #        configuration file present.
        #
        # @return [Hash{String => String}] The value of the build setting
        #         grouped by the name of the build configuration.
        #
        # TODO:   Full support for this would require to take into account
        #         the default values for the platform.
        #
        def resolved_build_setting(key, resolve_against_xcconfig = false)
          target_settings = build_configuration_list.get_setting(key, resolve_against_xcconfig, self)
          project_settings = project.build_configuration_list.get_setting(key, resolve_against_xcconfig)
          target_settings.merge(project_settings) do |_key, target_val, proj_val|
            target_includes_inherited = Constants::INHERITED_KEYWORDS.any? { |keyword| target_val.include?(keyword) } if target_val
            if target_includes_inherited && proj_val
              if target_val.is_a? String
                target_val.gsub(Regexp.union(Constants::INHERITED_KEYWORDS), proj_val)
              else
                target_val.flat_map { |value| Constants::INHERITED_KEYWORDS.include?(value) ? proj_val : value }
              end
            else
              target_val || proj_val
            end
          end
        end

        # Gets the value for the given build setting, properly inherited if
        # need, if shared across the build configurations.
        #
        # @param [String] key
        #        the key of the build setting.
        #
        # @param [Boolean] resolve_against_xcconfig
        #        whether the resolved setting should take in consideration any
        #        configuration file present.
        #
        # @raise  If the build setting has multiple values.
        #
        # @note   As it is common not to have a setting with no value for
        #         custom build configurations nil keys are not considered to
        #         determine if the setting is unique. This is an heuristic
        #         which might not closely match Xcode behaviour.
        #
        # @return [String] The value of the build setting.
        #
        def common_resolved_build_setting(key, resolve_against_xcconfig: false)
          values = resolved_build_setting(key, resolve_against_xcconfig).values.compact.uniq
          if values.count <= 1
            values.first
          else
            raise "[Xcodeproj] Consistency issue: build setting `#{key}` has multiple values: `#{resolved_build_setting(key)}`"
          end
        end

        # @return [String] the SDK that the target should use.
        #
        def sdk
          common_resolved_build_setting('SDKROOT')
        end

        # @return [Symbol] the name of the platform of the target.
        #
        def platform_name
          return unless sdk
          if sdk.include? 'iphoneos'
            :ios
          elsif sdk.include? 'macosx'
            :osx
          elsif sdk.include? 'appletvos'
            :tvos
          elsif sdk.include? 'xros'
            :visionos
          elsif sdk.include? 'watchos'
            :watchos
          end
        end

        # @return [String] the version of the SDK.
        #
        def sdk_version
          return unless sdk
          sdk.scan(/[0-9.]+/).first
        end

        # @visibility private
        #
        # @return [Hash<Symbol, String>]
        #         The name of the setting for the deployment target by platform
        #         name.
        #
        DEPLOYMENT_TARGET_SETTING_BY_PLATFORM_NAME = {
          :ios => 'IPHONEOS_DEPLOYMENT_TARGET',
          :osx => 'MACOSX_DEPLOYMENT_TARGET',
          :tvos => 'TVOS_DEPLOYMENT_TARGET',
          :visionos => 'XROS_DEPLOYMENT_TARGET',
          :watchos => 'WATCHOS_DEPLOYMENT_TARGET',
        }.freeze

        # @return [String] the deployment target of the target according to its
        #         platform.
        #
        def deployment_target
          return unless setting = DEPLOYMENT_TARGET_SETTING_BY_PLATFORM_NAME[platform_name]
          common_resolved_build_setting(setting)
        end

        # @param  [String] deployment_target the deployment target to set for
        #         the target according to its platform.
        #
        def deployment_target=(deployment_target)
          return unless setting = DEPLOYMENT_TARGET_SETTING_BY_PLATFORM_NAME[platform_name]
          build_configurations.each do |config|
            config.build_settings[setting] = deployment_target
          end
        end

        # @return [ObjectList<XCBuildConfiguration>] the build
        #         configurations of the target.
        #
        def build_configurations
          build_configuration_list.build_configurations
        end

        # Adds a new build configuration to the target and populates its with
        # default settings according to the provided type if one doesn't
        # exists.
        #
        # @note   If a build configuration with the given name is already
        #         present no new build configuration is added.
        #
        # @param  [String] name
        #         The name of the build configuration.
        #
        # @param  [Symbol] type
        #         The type of the build configuration used to populate the build
        #         settings, must be :debug or :release.
        #
        # @return [XCBuildConfiguration] the created build configuration or the
        #         existing one with the same name.
        #
        def add_build_configuration(name, type)
          if existing = build_configuration_list[name]
            existing
          else
            build_configuration = project.new(XCBuildConfiguration)
            build_configuration.name = name
            product_type = self.product_type if respond_to?(:product_type)
            build_configuration.build_settings = ProjectHelper.common_build_settings(type, platform_name, deployment_target, product_type)
            build_configuration_list.build_configurations << build_configuration
            build_configuration
          end
        end

        # @param  [String] build_configuration_name
        #         the name of a build configuration.
        #
        # @return [Hash] the build settings of the build configuration with the
        #         given name.
        #
        #
        def build_settings(build_configuration_name)
          build_configuration_list.build_settings(build_configuration_name)
        end

        # @!group Build Phases Helpers

        # @return [PBXFrameworksBuildPhase]
        #         the frameworks build phases of the target.
        #
        def frameworks_build_phases
          build_phases.find { |bp| bp.class == PBXFrameworksBuildPhase }
        end

        # @return [Array<PBXCopyFilesBuildPhase>]
        #         the copy files build phases of the target.
        #
        def copy_files_build_phases
          build_phases.grep(PBXCopyFilesBuildPhase)
        end

        # @return [Array<PBXShellScriptBuildPhase>]
        #         the shell script build phases of the target.
        #
        def shell_script_build_phases
          build_phases.grep(PBXShellScriptBuildPhase)
        end

        # Adds a dependency on the given target.
        #
        # @param  [AbstractTarget] target
        #         the target which should be added to the dependencies list of
        #         the receiver. The target may be a target of this target's
        #         project or of a subproject of this project. Note that the
        #         subproject must already be added to this target's project.
        #
        # @return [void]
        #
        def add_dependency(target)
          unless dependency_for_target(target)
            container_proxy = project.new(Xcodeproj::Project::PBXContainerItemProxy)
            if target.project == project
              container_proxy.container_portal = project.root_object.uuid
            else
              subproject_reference = project.reference_for_path(target.project.path)
              raise ArgumentError, 'add_dependency received target that belongs to a project that is not this project and is not a subproject of this project' unless subproject_reference
              container_proxy.container_portal = subproject_reference.uuid
            end
            container_proxy.proxy_type = Constants::PROXY_TYPES[:native_target]
            container_proxy.remote_global_id_string = target.uuid
            container_proxy.remote_info = target.name

            dependency = project.new(Xcodeproj::Project::PBXTargetDependency)
            dependency.name = target.name
            dependency.target = target if target.project == project
            dependency.target_proxy = container_proxy

            dependencies << dependency
          end
        end

        # Checks whether this target has a dependency on the given target.
        #
        # @param  [AbstractTarget] target
        #         the target to search for.
        #
        # @return [PBXTargetDependency]
        #
        def dependency_for_target(target)
          dependencies.find do |dep|
            if dep.target_proxy.remote?
              subproject_reference = project.reference_for_path(target.project.path)
              uuid = subproject_reference.uuid if subproject_reference
              dep.target_proxy.remote_global_id_string == target.uuid && dep.target_proxy.container_portal == uuid
            else
              dep.target.uuid == target.uuid
            end
          end
        end

        # Creates a new copy files build phase.
        #
        # @param  [String] name
        #         an optional name for the phase.
        #
        # @return [PBXCopyFilesBuildPhase] the new phase.
        #
        def new_copy_files_build_phase(name = nil)
          phase = project.new(PBXCopyFilesBuildPhase)
          phase.name = name
          build_phases << phase
          phase
        end

        # Creates a new shell script build phase.
        #
        # @param  (see #new_copy_files_build_phase)
        #
        # @return [PBXShellScriptBuildPhase] the new phase.
        #
        def new_shell_script_build_phase(name = nil)
          phase = project.new(PBXShellScriptBuildPhase)
          phase.name = name
          build_phases << phase
          phase
        end

        public

        # @!group System frameworks
        #--------------------------------------#

        # Adds a file reference for one or more system framework to the project
        # if needed and adds them to the Frameworks build phases.
        #
        # @param  [Array<String>, String] names
        #         The name or the list of the names of the framework.
        #
        # @note   Xcode behaviour is following: if the target has the same SDK
        #         of the project it adds the reference relative to the SDK root
        #         otherwise the reference is added relative to the Developer
        #         directory. This can create confusion or duplication of the
        #         references of frameworks linked by iOS and OS X targets. For
        #         this reason the new Xcodeproj behaviour is to add the
        #         frameworks in a subgroup according to the platform.
        #
        # @return [Array<PBXFileReference>] An array of the newly created file
        #         references.
        #
        def add_system_framework(names)
          Array(names).map do |name|
            case platform_name
            when :ios
              group = project.frameworks_group['iOS'] || project.frameworks_group.new_group('iOS')
              path_sdk_name = 'iPhoneOS'
              path_sdk_version = sdk_version || Constants::LAST_KNOWN_IOS_SDK
            when :osx
              group = project.frameworks_group['OS X'] || project.frameworks_group.new_group('OS X')
              path_sdk_name = 'MacOSX'
              path_sdk_version = sdk_version || Constants::LAST_KNOWN_OSX_SDK
            when :tvos
              group = project.frameworks_group['tvOS'] || project.frameworks_group.new_group('tvOS')
              path_sdk_name = 'AppleTVOS'
              path_sdk_version = sdk_version || Constants::LAST_KNOWN_TVOS_SDK
            when :visionos
              group = project.frameworks_group['visionOS'] || project.frameworks_group.new_group('visionOS')
              path_sdk_name = 'XROS'
              path_sdk_version = sdk_version || Constants::LAST_KNOWN_VISIONOS_SDK
            when :watchos
              group = project.frameworks_group['watchOS'] || project.frameworks_group.new_group('watchOS')
              path_sdk_name = 'WatchOS'
              path_sdk_version = sdk_version || Constants::LAST_KNOWN_WATCHOS_SDK
            else
              raise 'Unknown platform for target'
            end

            path = "Platforms/#{path_sdk_name}.platform/Developer/SDKs/#{path_sdk_name}#{path_sdk_version}.sdk/System/Library/Frameworks/#{name}.framework"
            unless ref = group.find_file_by_path(path)
              ref = group.new_file(path, :developer_dir)
            end
            frameworks_build_phase.add_file_reference(ref, true)
            ref
          end
        end
        alias_method :add_system_frameworks, :add_system_framework

        # Adds a file reference for one or more system dylib libraries to the project
        # if needed and adds them to the Frameworks build phases.
        #
        # @param  [Array<String>, String] names
        #         The name or the list of the names of the libraries.
        #
        # @return [void]
        #
        def add_system_library(names)
          add_system_library_extension(names, 'dylib')
        end
        alias_method :add_system_libraries, :add_system_library

        def add_system_library_extension(names, extension)
          Array(names).each do |name|
            path = "usr/lib/lib#{name}.#{extension}"
            files = project.frameworks_group.files
            unless reference = files.find { |ref| ref.path == path }
              reference = project.frameworks_group.new_file(path, :sdk_root)
            end
            frameworks_build_phase.add_file_reference(reference, true)
            reference
          end
        end
        private :add_system_library_extension

        # Adds a file reference for one or more system tbd libraries to the project
        # if needed and adds them to the Frameworks build phases.
        #
        # @param  [Array<String>, String] names
        #         The name or the list of the names of the libraries.
        #
        # @return [void]
        #
        def add_system_library_tbd(names)
          add_system_library_extension(names, 'tbd')
        end
        alias_method :add_system_libraries_tbd, :add_system_library_tbd

        public

        # @!group AbstractObject Hooks
        #--------------------------------------#

        # @return [Hash{String => Hash}] A hash suitable to display the object
        #         to the user.
        #
        def pretty_print
          {
            display_name => {
              'Build Phases' => build_phases.map(&:pretty_print),
              'Build Configurations' => build_configurations.map(&:pretty_print),
            },
          }
        end
      end

      #-----------------------------------------------------------------------#

      # Represents a target handled by Xcode.
      #
      class PBXNativeTarget < AbstractTarget
        # @!group Attributes

        # @return [PBXBuildRule] the build rules of this target.
        #
        has_many :build_rules, PBXBuildRule

        # @return [String] the build product type identifier.
        #
        attribute :product_type, String

        # @return [PBXFileReference] the reference to the product file.
        #
        has_one :product_reference, PBXFileReference

        # @return [ObjectList<XCSwiftPackageProductDependency>] the Swift package products necessary to
        #         build this target.
        #
        has_many :package_product_dependencies, XCSwiftPackageProductDependency

        # @return [String] the install path of the product.
        #
        attribute :product_install_path, String

        # @return [ObjectList<AbstractBuildPhase>] the build phases of the
        #         target.
        #
        # @note   Apparently only PBXCopyFilesBuildPhase and
        #         PBXShellScriptBuildPhase can appear multiple times in a
        #         target.
        #
        has_many :build_phases, AbstractBuildPhase

        public

        # @!group Helpers
        #--------------------------------------#

        # @return [Symbol] The type of the target expressed as a symbol.
        #
        def symbol_type
          Constants::PRODUCT_TYPE_UTI.key(product_type)
        end

        # @return [Boolean] Whether the target is a test target.
        #
        def test_target_type?
          case symbol_type
          when :octest_bundle, :unit_test_bundle, :ui_test_bundle
            true
          else
            false
          end
        end

        # @return [Boolean] Whether the target is an extension.
        #
        def extension_target_type?
          case symbol_type
          when :app_extension, :watch_extension, :watch2_extension, :tv_extension, :messages_extension
            true
          else
            false
          end
        end

        # @return [Boolean] Whether the target is launchable.
        #
        def launchable_target_type?
          case symbol_type
          when :application, :command_line_tool
            true
          else
            false
          end
        end

        # Adds source files to the target.
        #
        # @param  [Array<PBXFileReference>] file_references
        #         the files references of the source files that should be added
        #         to the target.
        #
        # @param  [String] compiler_flags
        #         the compiler flags for the source files.
        #
        # @yield_param [PBXBuildFile] each created build file.
        #
        # @return [Array<PBXBuildFile>] the created build files.
        #
        def add_file_references(file_references, compiler_flags = {})
          file_references.map do |file|
            extension = File.extname(file.path).downcase
            header_extensions = Constants::HEADER_FILES_EXTENSIONS
            is_header_phase = header_extensions.include?(extension)
            phase = is_header_phase ? headers_build_phase : source_build_phase

            unless build_file = phase.build_file(file)
              build_file = project.new(PBXBuildFile)
              build_file.file_ref = file
              phase.files << build_file
            end

            if compiler_flags && !compiler_flags.empty? && !is_header_phase
              (build_file.settings ||= {}).merge!('COMPILER_FLAGS' => compiler_flags) do |_, old, new|
                [old, new].compact.join(' ')
              end
            end

            yield build_file if block_given?

            build_file
          end
        end

        # Adds resource files to the resources build phase of the target.
        #
        # @param  [Array<PBXFileReference>] resource_file_references
        #         the files references of the resources to the target.
        #
        # @return [void]
        #
        def add_resources(resource_file_references)
          resource_file_references.each do |file|
            next if resources_build_phase.include?(file)
            build_file = project.new(PBXBuildFile)
            build_file.file_ref = file
            resources_build_phase.files << build_file
          end
        end

        # Adds on demand resources to the resources build phase of the target.
        #
        # @param  {String => [Array<PBXFileReference>]} on_demand_resource_tag_files
        #         the files references of the on demand resources to add to the target keyed by the tag.
        #
        # @return [void]
        #
        def add_on_demand_resources(on_demand_resource_tag_files)
          on_demand_resource_tag_files.each do |tag, file_refs|
            file_refs.each do |file_ref|
              if resources_build_phase.include?(file_ref)
                existing_build_file = resources_build_phase.build_file(file_ref)
                existing_build_file.settings ||= {}
                existing_build_file.settings['ASSET_TAGS'] ||= []
                existing_build_file.settings['ASSET_TAGS'] << tag
                existing_build_file.settings['ASSET_TAGS'].uniq!
                next
              end
              build_file = resources_build_phase.add_file_reference(file_ref, true)
              build_file.settings = (build_file.settings ||= {}).merge('ASSET_TAGS' => [tag])
            end
          end
        end

        # Remove on demand resources from the resources build phase of the target.
        #
        # @param  {String => [Array<PBXFileReference>]} on_demand_resource_tag_files
        #         the files references of the on demand resources to add to the target keyed by the tag.
        #
        # @return [void]
        #
        def remove_on_demand_resources(on_demand_resource_tag_files)
          on_demand_resource_tag_files.each do |tag, file_refs|
            file_refs.each do |file_ref|
              build_file = resources_build_phase.build_file(file_ref)
              next if build_file.nil?
              asset_tags = build_file.settings['ASSET_TAGS']
              asset_tags.delete(tag)
              resources_build_phase.remove_file_reference(file_ref) if asset_tags.empty?
            end
          end
        end

        # Finds or creates the headers build phase of the target.
        #
        # @note   A target should have only one headers build phase.
        #
        # @return [PBXHeadersBuildPhase] the headers build phase.
        #
        def headers_build_phase
          find_or_create_build_phase_by_class(PBXHeadersBuildPhase)
        end

        # Finds or creates the source build phase of the target.
        #
        # @note   A target should have only one source build phase.
        #
        # @return [PBXSourcesBuildPhase] the source build phase.
        #
        def source_build_phase
          find_or_create_build_phase_by_class(PBXSourcesBuildPhase)
        end

        # Finds or creates the frameworks build phase of the target.
        #
        # @note   A target should have only one frameworks build phase.
        #
        # @return [PBXFrameworksBuildPhase] the frameworks build phase.
        #
        def frameworks_build_phase
          find_or_create_build_phase_by_class(PBXFrameworksBuildPhase)
        end

        # Finds or creates the resources build phase of the target.
        #
        # @note   A target should have only one resources build phase.
        #
        # @return [PBXResourcesBuildPhase] the resources build phase.
        #
        def resources_build_phase
          find_or_create_build_phase_by_class(PBXResourcesBuildPhase)
        end

        private

        # @!group Internal Helpers
        #--------------------------------------#

        # Find or create a build phase by a given class
        #
        # @param [Class] phase_class the class of the build phase to find or create.
        #
        # @return [AbstractBuildPhase] the build phase whose class match the given phase_class.
        #
        def find_or_create_build_phase_by_class(phase_class)
          @phases ||= {}
          unless phase_class < AbstractBuildPhase
            raise ArgumentError, "#{phase_class} must be a subclass of #{AbstractBuildPhase.class}"
          end
          @phases[phase_class] ||= build_phases.find { |bp| bp.class == phase_class } ||
            project.new(phase_class).tap { |bp| build_phases << bp }
        end

        public

        # @!group AbstractObject Hooks
        #--------------------------------------#

        # Sorts the to many attributes of the object according to the display
        # name.
        #
        # Build phases are not sorted as they order is relevant.
        #
        def sort(_options = nil)
          attributes_to_sort = to_many_attributes.reject { |attr| attr.name == :build_phases }
          attributes_to_sort.each do |attrb|
            list = attrb.get_value(self)
            list.sort! do |x, y|
              x.display_name <=> y.display_name
            end
          end
        end

        def to_hash_as(method = :to_hash)
          hash_as = super
          if !hash_as['packageProductDependencies'].nil? && hash_as['packageProductDependencies'].empty?
            hash_as.delete('packageProductDependencies')
          end
          hash_as
        end

        def to_ascii_plist
          plist = super
          if !plist.value['packageProductDependencies'].nil? && plist.value['packageProductDependencies'].empty?
            plist.value.delete('packageProductDependencies')
          end
          plist
        end
      end

      #-----------------------------------------------------------------------#

      # Represents a target that only consists in a aggregate of targets.
      #
      # @todo Apparently it can't have build rules.
      #
      class PBXAggregateTarget < AbstractTarget
        # @!group Attributes

        # @return [PBXBuildRule] the build phases of the target.
        #
        # @note   Apparently only PBXCopyFilesBuildPhase and
        #         PBXShellScriptBuildPhase can appear multiple times in a
        #         target.
        #
        has_many :build_phases, [PBXCopyFilesBuildPhase, PBXShellScriptBuildPhase]
      end

      #-----------------------------------------------------------------------#

      # Represents a legacy target which uses an external build tool.
      #
      # Apparently it can't have any build phase but the attribute can be
      # present.
      #
      class PBXLegacyTarget < AbstractTarget
        # @!group Attributes

        # @return [String] e.g "Dir"
        #
        attribute :build_working_directory, String

        # @return [String] e.g "$(ACTION)"
        #
        attribute :build_arguments_string, String

        # @return [String] e.g "1"
        #
        attribute :pass_build_settings_in_environment, String

        # @return [String] e.g "/usr/bin/make"
        #
        attribute :build_tool_path, String

        # @return [PBXBuildRule] the build phases of the target.
        #
        # @note   Apparently only PBXCopyFilesBuildPhase and
        #         PBXShellScriptBuildPhase can appear multiple times in a
        #         target.
        #
        has_many :build_phases, AbstractBuildPhase
      end

      #-----------------------------------------------------------------------#
    end
  end
end
