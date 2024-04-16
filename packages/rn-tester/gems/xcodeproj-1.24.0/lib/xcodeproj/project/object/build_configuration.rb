module Xcodeproj
  class Project
    module Object
      # Encapsulates the information a specific build configuration referenced
      # by a {XCConfigurationList} which in turn might be referenced by a
      # {PBXProject} or a {PBXNativeTarget}.
      #
      class XCBuildConfiguration < AbstractObject
        MUTUAL_RECURSION_SENTINEL = 'xcodeproj.mutual_recursion_sentinel'.freeze

        private_constant :MUTUAL_RECURSION_SENTINEL

        # @!group Attributes

        # @return [String] the name of the configuration.
        #
        attribute :name, String

        # @return [Hash] the build settings to use for building the target.
        #
        attribute :build_settings, Hash, {}

        # @return [PBXFileReference] an optional file reference to a
        #         configuration file (`.xcconfig`).
        #
        has_one :base_configuration_reference, PBXFileReference

        public

        # @!group AbstractObject Hooks
        #---------------------------------------------------------------------#

        # @return [Hash{String => Hash}] A hash suitable to display the object
        #         to the user.
        #
        def pretty_print
          data = {}
          data['Build Settings'] = sorted_build_settings
          if base_configuration_reference
            data['Base Configuration'] = base_configuration_reference.pretty_print
          end
          { name => data }
        end

        def to_hash_as(method = :to_hash)
          super.tap do |hash|
            normalize_array_settings(hash['buildSettings'])
          end
        end

        # Sorts the build settings. Valid only in Ruby > 1.9.2 because in
        # previous versions the hash are not sorted.
        #
        # @return [void]
        #
        def sort(_options = nil)
          self.build_settings = sorted_build_settings
        end

        # @return [Boolean] Whether this configuration is configured for
        #         debugging.
        #
        def debug?
          gcc_preprocessor_definitions = resolve_build_setting('GCC_PREPROCESSOR_DEFINITIONS')
          gcc_preprocessor_definitions && gcc_preprocessor_definitions.include?('DEBUG=1')
        end

        # @return [Symbol] The symbolic type of this configuration, either
        #         `:debug` or `:release`.
        #
        def type
          debug? ? :debug : :release
        end

        # @!group Helpers
        #---------------------------------------------------------------------#

        # Gets the value for the given build setting considering any configuration
        # file present and resolving inheritance between them. It also takes in
        # consideration environment variables.
        #
        # @param [String] key
        #        the key of the build setting.
        #
        # @param [PBXNativeTarget] root_target
        #        use this to resolve complete recursion between project and targets.
        #
        # @param [String] previous_key
        #        use this to resolve complete recursion between different build settings.
        #
        # @return [String] The value of the build setting
        #
        def resolve_build_setting(key, root_target = nil, previous_key = nil)
          setting = build_settings[key]
          setting = resolve_variable_substitution(key, setting, root_target, previous_key)

          config_setting = config[key]
          config_setting = resolve_variable_substitution(key, config_setting, root_target, previous_key)

          project_setting = project.build_configuration_list[name]
          project_setting = nil if equal?(project_setting)
          project_setting &&= project_setting.resolve_build_setting(key, root_target)

          defaults = {
            'CONFIGURATION' => name,
            'SRCROOT' => project.project_dir.to_s,
          }

          # if previous_key is nil, it means that we're back at the first call, so we can replace our sentinel string
          # used to prevent recursion with nil
          if previous_key.nil? && setting == MUTUAL_RECURSION_SENTINEL
            setting = nil
          end

          [defaults[key], project_setting, config_setting, setting, ENV[key]].compact.reduce(nil) do |inherited, value|
            expand_build_setting(value, inherited)
          end
        end

        #---------------------------------------------------------------------#

        private

        VARIABLE_NAME_PATTERN =
          '( # capture block
            [_a-zA-Z0-9]+? # non-greedy lookup for everything contained in this list
          )'.freeze
        private_constant :VARIABLE_NAME_PATTERN

        CAPTURE_VARIABLE_IN_BUILD_CONFIG = /
            \$ # matches dollar sign literally
            (?: # non-capturing group
              [{] # matches a single character on this list
                #{VARIABLE_NAME_PATTERN}
              [}] # matches a single character on this list
              | # or
              [(] # matches a single character on this list
                #{VARIABLE_NAME_PATTERN}
              [)] # matches a single character on this list
            )
          /x
        private_constant :CAPTURE_VARIABLE_IN_BUILD_CONFIG

        def expand_build_setting(build_setting_value, config_value)
          if build_setting_value.is_a?(Array) && config_value.is_a?(String)
            config_value = split_build_setting_array_to_string(config_value)
          elsif build_setting_value.is_a?(String) && config_value.is_a?(Array)
            build_setting_value = split_build_setting_array_to_string(build_setting_value)
          end

          default = build_setting_value.is_a?(String) ? '' : []
          inherited = config_value || default

          return build_setting_value.gsub(Regexp.union(Constants::INHERITED_KEYWORDS), inherited) if build_setting_value.is_a? String
          build_setting_value.flat_map { |value| Constants::INHERITED_KEYWORDS.include?(value) ? inherited : value }
        end

        def resolve_variable_substitution(key, value, root_target, previous_key = nil)
          case value
          when Array
            return value.map { |v| resolve_variable_substitution(key, v, root_target) }
          when nil
            return
          when String
            # we know how to resolve strings!
            nil
          else
            raise ArgumentError, "Settings values can only be nil, string, or array, got #{value.inspect} for #{key}"
          end

          unless variable_match_data = value.match(CAPTURE_VARIABLE_IN_BUILD_CONFIG)
            # no variables left, return the value unchanged
            return value
          end
          variable_reference, variable = *variable_match_data.values_at(0, 1, 2).compact

          case variable
          when 'inherited'
            # this is handled separately, after resolving all other variable references
            value
          when key
            # to prevent infinite recursion
            nil
          when previous_key
            # to prevent infinite recursion; we don't return nil as for the self recursion because it needs to be
            # distinguished outside this method too
            MUTUAL_RECURSION_SENTINEL
          else
            configuration_to_resolve_against = root_target ? root_target.build_configuration_list[name] : self
            resolved_value_for_variable = configuration_to_resolve_against.resolve_build_setting(variable, root_target, key) || ''

            # we use this sentinel string instead of nil, because, otherwise, it would be swallowed by the default empty
            # string from the preceding line, and we want to distinguish between mutual recursion and other cases
            if resolved_value_for_variable == MUTUAL_RECURSION_SENTINEL
              return MUTUAL_RECURSION_SENTINEL
            end

            value = value.gsub(variable_reference, resolved_value_for_variable)
            resolve_variable_substitution(key, value, root_target)
          end
        end

        def sorted_build_settings
          sorted = {}
          build_settings.keys.sort.each do |key|
            sorted[key] = build_settings[key]
          end
          sorted
        end

        def normalize_array_settings(settings)
          return unless settings

          array_settings = BuildSettingsArraySettingsByObjectVersion[project.object_version]

          settings.keys.each do |key|
            next unless value = settings[key]
            stripped_key = key.sub(/\[[^\]]+\]$/, '')
            case value
            when String
              next unless array_settings.include?(stripped_key)
              array_value = split_build_setting_array_to_string(value)
              next unless array_value.size > 1
              settings[key] = array_value
            when Array
              next if value.size > 1 && array_settings.include?(stripped_key)
              settings[key] = value.join(' ')
            end
          end
        end

        def split_build_setting_array_to_string(string)
          regexp = / *((['"]?).*?[^\\]\2)(?=( |\z))/
          string.scan(regexp).map(&:first)
        end

        def config
          return {} unless base_configuration_reference
          @config ||=
            if base_configuration_reference.real_path.exist?
              Xcodeproj::Config.new(base_configuration_reference.real_path).to_hash.tap do |hash|
                normalize_array_settings(hash)
              end
            else
              {}
            end
        end

        #---------------------------------------------------------------------#
      end
    end
  end
end

require 'xcodeproj/project/object/helpers/build_settings_array_settings_by_object_version'
