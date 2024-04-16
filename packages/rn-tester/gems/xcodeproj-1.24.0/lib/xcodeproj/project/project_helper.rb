module Xcodeproj
  class Project
    module ProjectHelper
      include Object

      # @!group Targets

      #-----------------------------------------------------------------------#

      # Creates a new target and adds it to the project.
      #
      # The target is configured for the given platform and its file reference it
      # is added to the {products_group}.
      #
      # The target is pre-populated with common build settings, and the
      # appropriate Framework according to the platform is added to to its
      # Frameworks phase.
      #
      # @param  [Project] project
      #         the project to which the target should be added.
      #
      # @param  [Symbol] type
      #         the type of target. Can be `:application`, `:dynamic_library`,
      #         `framework` or `:static_library`.
      #
      # @param  [String] name
      #         the name of the target product.
      #
      # @param  [Symbol] platform
      #         the platform of the target. Can be `:ios` or `:osx`.
      #
      # @param  [String] deployment_target
      #         the deployment target for the platform.
      #
      # @param  [PBXGroup] product_group
      #         the product group, where to add to a file reference of the
      #         created target.
      #
      # @param  [Symbol] language
      #         the primary language of the target, can be `:objc` or `:swift`.
      #
      # @return [PBXNativeTarget] the target.
      #
      def self.new_target(project, type, name, platform, deployment_target, product_group, language, product_basename)
        # Target
        target = project.new(PBXNativeTarget)
        project.targets << target
        target.name = name
        target.product_name = product_basename
        target.product_type = Constants::PRODUCT_TYPE_UTI[type]
        target.build_configuration_list = configuration_list(project, platform, deployment_target, type, language)

        # Product
        product = product_group.new_product_ref_for_target(target.product_name, type)
        target.product_reference = product

        # Build phases
        build_phases_for_target_type(type).each { |phase| target.build_phases << project.new(phase) }

        # Frameworks
        unless type == :static_library
          framework_name = (platform == :osx) ? 'Cocoa' : 'Foundation'
          target.add_system_framework(framework_name)
        end

        target
      end

      # Creates a new resource bundles target and adds it to the project.
      #
      # The target is configured for the given platform and its file reference it
      # is added to the {products_group}.
      #
      # The target is pre-populated with common build settings
      #
      # @param  [Project] project
      #         the project to which the target should be added.
      #
      # @param  [String] name
      #         the name of the resources bundle.
      #
      # @param  [Symbol] platform
      #         the platform of the resources bundle. Can be `:ios` or `:osx`.
      #
      # @param  [PBXGroup] product_group
      #         the product group, where to add to a file reference of the
      #         created target.
      #
      # @return [PBXNativeTarget] the target.
      #
      def self.new_resources_bundle(project, name, platform, product_group, product_basename)
        # Target
        target = project.new(PBXNativeTarget)
        project.targets << target
        target.name = name
        target.product_name = product_basename
        target.product_type = Constants::PRODUCT_TYPE_UTI[:bundle]

        # Configuration List
        cl = project.new(XCConfigurationList)
        cl.default_configuration_is_visible = '0'
        cl.default_configuration_name = 'Release'
        release_conf = project.new(XCBuildConfiguration)
        release_conf.name = 'Release'
        release_conf.build_settings = common_build_settings(nil, platform, nil, target.product_type)
        debug_conf = project.new(XCBuildConfiguration)
        debug_conf.name = 'Debug'
        debug_conf.build_settings = common_build_settings(nil, platform, nil, target.product_type)
        cl.build_configurations << release_conf
        cl.build_configurations << debug_conf
        target.build_configuration_list = cl

        # Product
        product = product_group.new_bundle(target.product_name)
        target.product_reference = product

        # Build phases
        build_phases_for_target_type(:bundle).each { |phase| target.build_phases << project.new(phase) }

        target
      end

      # Creates a new aggregate target and adds it to the project.
      #
      # The target is configured for the given platform.
      #
      # @param  [Project] project
      #         the project to which the target should be added.
      #
      # @param  [String] name
      #         the name of the aggregate target.
      #
      # @param  [Symbol] platform
      #         the platform of the aggregate target. Can be `:ios` or `:osx`.
      #
      # @param  [String] deployment_target
      #         the deployment target for the platform.
      #
      # @return [PBXAggregateTarget] the target.
      #
      def self.new_aggregate_target(project, name, platform, deployment_target)
        target = project.new(PBXAggregateTarget)
        project.targets << target
        target.name = name
        target.build_configuration_list = configuration_list(project, platform, deployment_target)
        target
      end

      # Creates a new legacy target and adds it to the project.
      #
      # The target is configured for the given platform.
      #
      # @param  [Project] project
      #         the project to which the target should be added.
      #
      # @param  [String] name
      #         the name of the aggregate target.
      #
      # @param  [String] build_tool_path
      #         the build tool path to use for this target.
      #
      # @param  [String] build_arguments_string
      #         the build arguments string to use for this target.
      #
      # @param  [String] build_working_directory
      #         the build working directory to use for this target.
      #
      # @param  [String] pass_build_settings_in_environment
      #         whether to pass build settings in the environment during execution of this target.
      #
      # @return [PBXLegacyTarget] the target.
      #
      def self.new_legacy_target(project, name, build_tool_path = '/usr/bin/make', build_arguments_string = '$(ACTION)',
                                 build_working_directory = nil, pass_build_settings_in_environment = '1')
        target = project.new(PBXLegacyTarget)
        project.targets << target
        target.name = name
        target.build_configuration_list = configuration_list(project)
        target.build_tool_path = build_tool_path
        target.build_arguments_string = build_arguments_string
        target.build_working_directory = build_working_directory
        target.pass_build_settings_in_environment = pass_build_settings_in_environment
        target
      end

      # @!group Private Helpers

      #-----------------------------------------------------------------------#

      # Returns a new configuration list, populated with release and debug
      # configurations with common build settings for the given platform.
      #
      # @param  [Project] project
      #         the project to which the configuration list should be added.
      #
      # @param  [Symbol] platform
      #         the platform for the configuration list, can be `:ios` or `:osx`.
      #
      # @param  [String] deployment_target
      #         the deployment target for the platform.
      #
      # @param  [Symbol] target_product_type
      #         the product type of the target, can be any of `Constants::PRODUCT_TYPE_UTI.values`
      #         or `Constants::PRODUCT_TYPE_UTI.keys`.
      #
      # @param  [Symbol] language
      #         the primary language of the target, can be `:objc` or `:swift`.
      #
      # @return [XCConfigurationList] the generated configuration list.
      #
      def self.configuration_list(project, platform = nil, deployment_target = nil, target_product_type = nil, language = nil)
        cl = project.new(XCConfigurationList)
        cl.default_configuration_is_visible = '0'
        cl.default_configuration_name = 'Release'

        release_conf = project.new(XCBuildConfiguration)
        release_conf.name = 'Release'
        release_conf.build_settings = common_build_settings(:release, platform, deployment_target, target_product_type, language)

        debug_conf = project.new(XCBuildConfiguration)
        debug_conf.name = 'Debug'
        debug_conf.build_settings = common_build_settings(:debug, platform, deployment_target, target_product_type, language)

        cl.build_configurations << release_conf
        cl.build_configurations << debug_conf

        existing_configurations = cl.build_configurations.map(&:name)
        project.build_configurations.each do |configuration|
          next if existing_configurations.include?(configuration.name)

          new_config = project.new(XCBuildConfiguration)
          new_config.name = configuration.name
          new_config.build_settings = common_build_settings(configuration.type, platform, deployment_target, target_product_type, language)
          cl.build_configurations << new_config
        end

        cl
      end

      # Returns the common build settings for a given platform and configuration
      # name.
      #
      # @param  [Symbol] type
      #         the type of the build configuration, can be `:release` or
      #         `:debug`.
      #
      # @param  [Symbol] platform
      #         the platform for the build settings, can be `:ios` or `:osx`.
      #
      # @param  [String] deployment_target
      #         the deployment target for the platform.
      #
      # @param  [Symbol] target_product_type
      #         the product type of the target, can be any of
      #         `Constants::PRODUCT_TYPE_UTI.values`
      #         or `Constants::PRODUCT_TYPE_UTI.keys`. Default is :application.
      #
      # @param  [Symbol] language
      #         the primary language of the target, can be `:objc` or `:swift`.
      #
      # @return [Hash] The common build settings
      #
      def self.common_build_settings(type, platform = nil, deployment_target = nil, target_product_type = nil, language = :objc)
        target_product_type = (Constants::PRODUCT_TYPE_UTI.find { |_, v| v == target_product_type } || [target_product_type || :application])[0]
        common_settings = Constants::COMMON_BUILD_SETTINGS

        # Use intersecting settings for all key sets as base
        settings = deep_dup(common_settings[:all])

        # Match further common settings by key sets
        keys = [type, platform, target_product_type, language].compact
        key_combinations = (1..keys.length).flat_map { |n| keys.combination(n).to_a }
        key_combinations.each do |key_combination|
          settings.merge!(deep_dup(common_settings[key_combination] || {}))
        end

        if deployment_target
          case platform
          when :ios
            settings['IPHONEOS_DEPLOYMENT_TARGET'] = deployment_target
            settings['CLANG_ENABLE_OBJC_WEAK'] = 'NO' if deployment_target < '5'
          when :osx
            settings['MACOSX_DEPLOYMENT_TARGET'] = deployment_target
            settings['CLANG_ENABLE_OBJC_WEAK'] = 'NO' if deployment_target < '10.7'
          when :tvos
            settings['TVOS_DEPLOYMENT_TARGET'] = deployment_target
          when :visionos
            settings['XROS_DEPLOYMENT_TARGET'] = deployment_target
          when :watchos
            settings['WATCHOS_DEPLOYMENT_TARGET'] = deployment_target
          end
        end

        settings
      end

      # Creates a deep copy of the given object
      #
      # @param  [Object] object
      #         the object to copy.
      #
      # @return [Object] The deep copy of the object.
      #
      def self.deep_dup(object)
        case object
        when Hash
          new_hash = {}
          object.each do |key, value|
            new_hash[key] = deep_dup(value)
          end
          new_hash
        when Array
          object.map { |value| deep_dup(value) }
        else
          object.dup
        end
      end

      # Returns the build phases, in order, that appear by default
      # on a target of the given type.
      #
      # @param  [Symbol] type
      #         the name of the target type.
      #
      # @return [Array<String>] The list of build phase class names for the target type.
      #
      def self.build_phases_for_target_type(type)
        case type
        when :static_library, :dynamic_library
          %w(Headers Sources Frameworks)
        when :framework
          %w(Headers Sources Frameworks Resources)
        when :command_line_tool
          %w(Sources Frameworks)
        else
          %w(Sources Frameworks Resources)
        end.map { |phase| "PBX#{phase}BuildPhase" }
      end

      #-----------------------------------------------------------------------#
    end
  end
end
