# frozen_string_literal: true

module Pod
  class Target
    # @since 1.5.0
    class BuildSettings
      #-------------------------------------------------------------------------#

      # @!group Constants

      # @return [Set<String>]
      #   The build settings that should be treated as arrays, rather than strings.
      #
      PLURAL_SETTINGS = %w(
        ALTERNATE_PERMISSIONS_FILES
        ARCHS
        BUILD_VARIANTS
        EXCLUDED_SOURCE_FILE_NAMES
        FRAMEWORK_SEARCH_PATHS
        GCC_PREPROCESSOR_DEFINITIONS
        GCC_PREPROCESSOR_DEFINITIONS_NOT_USED_IN_PRECOMPS
        HEADER_SEARCH_PATHS
        INCLUDED_SOURCE_FILE_NAMES
        INFOPLIST_PREPROCESSOR_DEFINITIONS
        LD_RUNPATH_SEARCH_PATHS
        LIBRARY_SEARCH_PATHS
        LOCALIZED_STRING_MACRO_NAMES
        OTHER_CFLAGS
        OTHER_CPLUSPLUSFLAGS
        OTHER_LDFLAGS
        OTHER_SWIFT_FLAGS
        REZ_SEARCH_PATHS
        SECTORDER_FLAGS
        SWIFT_ACTIVE_COMPILATION_CONDITIONS
        SWIFT_INCLUDE_PATHS
        SYSTEM_FRAMEWORK_SEARCH_PATHS
        SYSTEM_HEADER_SEARCH_PATHS
        USER_HEADER_SEARCH_PATHS
        WARNING_CFLAGS
        WARNING_LDFLAGS
      ).to_set.freeze

      # @return [String]
      #   The variable for the configuration build directory used when building pod targets.
      #
      CONFIGURATION_BUILD_DIR_VARIABLE = '${PODS_CONFIGURATION_BUILD_DIR}'

      # @return [String]
      #   The variable for the configuration intermediate frameworks directory used for building pod targets
      #   that contain vendored xcframeworks.
      #
      XCFRAMEWORKS_BUILD_DIR_VARIABLE = '${PODS_XCFRAMEWORKS_BUILD_DIR}'

      #-------------------------------------------------------------------------#

      # @!group DSL

      # Creates a method that calculates a part of the build settings for the {#target}.
      #
      # @!visibility private
      #
      # @param [Symbol,String] method_name
      #   The name of the method to define
      #
      # @param [Boolean] build_setting
      #   Whether the method name should be added (upcased) to {.build_setting_names}
      #
      # @param [Boolean] memoized
      #   Whether the method should be memoized
      #
      # @param [Boolean] sorted
      #   Whether the return value should be sorted
      #
      # @param [Boolean] uniqued
      #   Whether the return value should be uniqued
      #
      # @param [Boolean] compacted
      #   Whether the return value should be compacted
      #
      # @param [Boolean] frozen
      #   Whether the return value should be frozen
      #
      # @param [Boolean, Symbol] from_search_paths_aggregate_targets
      #   If truthy, the method from {Aggregate} that should be used to concatenate build settings from
      #   {::Pod::AggregateTarget#search_paths_aggregate_target}
      #
      # @param [Symbol] from_pod_targets_to_link
      #   If truthy, the `_to_import` values from `BuildSettings#pod_targets_to_link` will be concatenated
      #
      # @param [Block] implementation
      #
      # @macro  [attach] define_build_settings_method
      #         @!method $1
      #
      #         The `$1` build setting for the {#target}.
      #
      #         The return value from this method will be: `${1--1}`.
      #
      def self.define_build_settings_method(method_name, build_setting: false,
                                            memoized: false, sorted: false, uniqued: false, compacted: false, frozen: true,
                                            from_search_paths_aggregate_targets: false, from_pod_targets_to_link: false,
                                            &implementation)

        memoized_key = "#{self}##{method_name}"

        (@build_settings_names ||= Set.new) << method_name.to_s.upcase if build_setting

        raw_method_name = :"_raw_#{method_name}"
        define_method(raw_method_name, &implementation)
        private(raw_method_name)

        dup_before_freeze = frozen && (from_pod_targets_to_link || from_search_paths_aggregate_targets || uniqued || sorted)

        define_method(method_name) do
          if memoized
            retval = @__memoized.fetch(memoized_key, :not_found)
            return retval if :not_found != retval
          end

          retval = send(raw_method_name)
          if retval.nil?
            @__memoized[memoized_key] = retval if memoized
            return
          end

          retval = retval.dup if dup_before_freeze && retval.frozen?

          retval.concat(pod_targets_to_link.flat_map { |pod_target| pod_target.build_settings_for_spec(pod_target.root_spec, :configuration => configuration_name).public_send("#{method_name}_to_import") }) if from_pod_targets_to_link
          retval.concat(search_paths_aggregate_target_pod_target_build_settings.flat_map(&from_search_paths_aggregate_targets)) if from_search_paths_aggregate_targets

          retval.compact! if compacted
          retval.uniq! if uniqued
          retval.sort! if sorted
          retval.freeze if frozen

          @__memoized[memoized_key] = retval if memoized

          retval
        end
      end
      private_class_method :define_build_settings_method

      # @param [XCFramework] xcframework the xcframework slice that will be copied to the intermediates dir
      #
      # @return [String] the path to the directory containing the xcframework slice
      #
      def self.xcframework_intermediate_dir(xcframework)
        "#{XCFRAMEWORKS_BUILD_DIR_VARIABLE}/#{xcframework.target_name}"
      end

      class << self
        #-------------------------------------------------------------------------#

        # @!group Public API

        # @return [Set<String>] a set of all the build settings names that will
        # be present in the #xcconfig
        #
        attr_reader :build_settings_names
      end

      #-------------------------------------------------------------------------#

      # @!group Public API

      # @return [Target]
      #  The target this build settings object is generating build settings for
      #
      attr_reader :target

      # Initialize a new instance
      #
      # @param [Target] target
      #   see {#target}
      #
      def initialize(target)
        @target = target
        @__memoized = {}
      end

      def initialize_copy(other)
        super
        @__memoized = {}
      end

      # @return [Xcodeproj::Config]
      define_build_settings_method :xcconfig, :memoized => true do
        settings = add_inherited_to_plural(to_h)
        Xcodeproj::Config.new(settings)
      end

      alias generate xcconfig

      # Saves the generated xcconfig to the given path
      #
      # @return [Xcodeproj::Config]
      #
      # @see #xcconfig
      #
      # @param [String,Pathname] path
      #   The path the xcconfig will be saved to
      #
      def save_as(path)
        xcconfig.save_as(path)
      end

      #-------------------------------------------------------------------------#

      # @!group Build System

      # @return [String]
      define_build_settings_method :pods_build_dir, :build_setting => true do
        '${BUILD_DIR}'
      end

      # @return [String]
      define_build_settings_method :pods_configuration_build_dir, :build_setting => true do
        '${PODS_BUILD_DIR}/$(CONFIGURATION)$(EFFECTIVE_PLATFORM_NAME)'
      end

      define_build_settings_method :pods_xcframeworks_build_dir, :build_setting => true do
        '$(PODS_CONFIGURATION_BUILD_DIR)/XCFrameworkIntermediates'
      end

      # @return [String]
      define_build_settings_method :use_recursive_script_inputs_in_script_phases, :build_setting => true do
        'YES'
      end

      #-------------------------------------------------------------------------#

      # @!group Code Signing

      # @return [String]
      define_build_settings_method :code_sign_identity, :build_setting => true do
        return unless target.build_as_dynamic?
        return unless target.platform.to_sym == :osx
        ''
      end

      #-------------------------------------------------------------------------#

      # @!group Frameworks

      # @return [Array<String>]
      define_build_settings_method :frameworks do
        []
      end

      # @return [Array<String>]
      define_build_settings_method :weak_frameworks do
        []
      end

      # @return [Array<String>]
      define_build_settings_method :framework_search_paths, :build_setting => true, :memoized => true do
        framework_search_paths_to_import_developer_frameworks(frameworks + weak_frameworks)
      end

      # @param [Array<String>] frameworks
      #   The list of framework names
      #
      # @return [Array<String>]
      #   the `FRAMEWORK_SEARCH_PATHS` needed to import developer frameworks
      def framework_search_paths_to_import_developer_frameworks(frameworks)
        if frameworks.include?('XCTest') || frameworks.include?('SenTestingKit')
          %w[ $(PLATFORM_DIR)/Developer/Library/Frameworks ]
        else
          []
        end
      end

      #-------------------------------------------------------------------------#

      # @!group Libraries

      # @return [Array<String>]
      define_build_settings_method :libraries do
        []
      end

      #-------------------------------------------------------------------------#

      # @!group Clang

      # @return [Array<String>]
      define_build_settings_method :gcc_preprocessor_definitions, :build_setting => true do
        %w( COCOAPODS=1 )
      end

      # @return [Array<String>]
      define_build_settings_method :other_cflags, :build_setting => true, :memoized => true do
        module_map_files.map { |f| "-fmodule-map-file=#{f}" }
      end

      # @return [Array<String>]
      define_build_settings_method :module_map_files do
        []
      end

      #-------------------------------------------------------------------------#

      # @!group Swift

      # @return [Boolean]
      #   Whether `OTHER_SWIFT_FLAGS` should be generated when the target
      #   does not use swift.
      #
      def other_swift_flags_without_swift?
        false
      end

      # @return [Array<String>]
      define_build_settings_method :other_swift_flags, :build_setting => true, :memoized => true do
        return unless target.uses_swift? || other_swift_flags_without_swift?
        flags = %w(-D COCOAPODS)
        flags.concat module_map_files.flat_map { |f| ['-Xcc', "-fmodule-map-file=#{f}"] }
        flags
      end

      #-------------------------------------------------------------------------#

      # @!group Linking

      # @return [Boolean]
      define_build_settings_method :requires_objc_linker_flag? do
        false
      end

      # @return [Boolean]
      define_build_settings_method :requires_fobjc_arc? do
        false
      end

      # Xcode 12 turns on this warning by default which is problematic for CocoaPods-generated
      # imports which use double-quoted paths.
      # @return [Boolean]
      define_build_settings_method :clang_warn_quoted_include_in_framework_header, :build_setting => true do
        'NO'
      end

      # @return [Array<String>]
      #   the `LD_RUNPATH_SEARCH_PATHS` needed for dynamically linking the {#target}
      #
      # @param [Boolean] requires_host_target
      #
      # @param [Boolean] test_bundle
      #
      def _ld_runpath_search_paths(requires_host_target: false, test_bundle: false, uses_swift: false)
        paths = []
        if uses_swift
          paths << '/usr/lib/swift'
          paths << '$(PLATFORM_DIR)/Developer/Library/Frameworks' if test_bundle
        end
        if target.platform.symbolic_name == :osx
          paths << "'@executable_path/../Frameworks'"
          paths << if test_bundle
                     "'@loader_path/../Frameworks'"
                   else
                     "'@loader_path/Frameworks'"
                   end
          paths << '${TOOLCHAIN_DIR}/usr/lib/swift/${PLATFORM_NAME}' if uses_swift
        else
          paths << "'@executable_path/Frameworks'"
          paths << "'@loader_path/Frameworks'"
          paths << "'@executable_path/../../Frameworks'" if requires_host_target
        end
        paths
      end
      private :_ld_runpath_search_paths

      # @return [Array<String>]
      define_build_settings_method :other_ldflags, :build_setting => true, :memoized => true do
        ld_flags = []
        ld_flags << '-ObjC' if requires_objc_linker_flag?
        if requires_fobjc_arc?
          ld_flags << '-fobjc-arc'
        end
        libraries.each { |l| ld_flags << %(-l"#{l}") }
        frameworks.each { |f| ld_flags << '-framework' << %("#{f}") }
        weak_frameworks.each { |f| ld_flags << '-weak_framework' << %("#{f}") }
        ld_flags
      end

      #-------------------------------------------------------------------------#

      # @!group Private Methods

      private

      # @return [Hash<String => String|Array<String>>]
      def to_h
        hash = {}
        self.class.build_settings_names.sort.each do |setting|
          hash[setting] = public_send(setting.downcase)
        end
        hash
      end

      # @return [Hash<String => String>]
      def add_inherited_to_plural(hash)
        Hash[hash.map do |key, value|
          next [key, '$(inherited)'] if value.nil?
          if PLURAL_SETTINGS.include?(key)
            raise ArgumentError, "#{key} is a plural setting, cannot have #{value.inspect} as its value" unless value.is_a? Array

            value = "$(inherited) #{quote_array(value)}"
          else
            raise ArgumentError, "#{key} is not a plural setting, cannot have #{value.inspect} as its value" unless value.is_a? String
          end

          [key, value]
        end]
      end

      # @return [Array<String>]
      #
      # @param  [Array<String>] array
      #
      def quote_array(array)
        array.map do |element|
          case element
          when /\A([\w-]+?)=(.+)\z/
            key = Regexp.last_match(1)
            value = Regexp.last_match(2)
            value = %("#{value}") if value =~ /[^\w\d]/
            %(#{key}=#{value})
          when /[\$\[\]\ ]/
            %("#{element}")
          else
            element
          end
        end.join(' ')
      end

      # @param [Hash] xcconfig_values_by_consumer_by_key
      #
      # @param [#to_s] attribute
      #   The name of the attribute being merged
      #
      # @return [Hash<String, String>]
      #
      def merged_xcconfigs(xcconfig_values_by_consumer_by_key, attribute, overriding: {})
        xcconfig_values_by_consumer_by_key.each_with_object(overriding.dup) do |(key, values_by_consumer), xcconfig|
          uniq_values = values_by_consumer.values.uniq
          values_are_bools = uniq_values.all? { |v| v.is_a?(String) && v =~ /\A(yes|no)\z/i }
          if values_are_bools
            # Boolean build settings
            if uniq_values.count > 1
              UI.warn "Can't merge #{attribute} for pod targets: " \
                "#{values_by_consumer.keys.map(&:name)}. Boolean build " \
                "setting #{key} has different values."
            else
              xcconfig[key] = uniq_values.first
            end
          elsif PLURAL_SETTINGS.include? key
            # Plural build settings
            if xcconfig.key?(key)
              overridden = xcconfig[key]
              uniq_values.prepend(overridden)
            end
            xcconfig[key] = uniq_values.uniq.join(' ')
          elsif uniq_values.count > 1
            # Singular build settings
            UI.warn "Can't merge #{attribute} for pod targets: " \
              "#{values_by_consumer.keys.map(&:name)}. Singular build " \
              "setting #{key} has different values."
          else
            xcconfig[key] = uniq_values.first
          end
        end
      end

      # Merges the spec-defined xcconfig into the derived xcconfig,
      # overriding any singular settings and merging plural settings.
      #
      # @param  [Hash<String,String>] spec_xcconfig_hash the merged xcconfig defined in the spec.
      #
      # @param  [Xcodeproj::Config] xcconfig the config to merge into.
      #
      # @return [Xcodeproj::Config] the merged config.
      #
      def merge_spec_xcconfig_into_xcconfig(spec_xcconfig_hash, xcconfig)
        plural_configs, singlular_configs = spec_xcconfig_hash.partition { |k, _v| PLURAL_SETTINGS.include?(k) }.map { |a| Hash[a] }
        xcconfig.attributes.merge!(singlular_configs)
        xcconfig.merge!(plural_configs)
        xcconfig
      end

      # Filters out pod targets whose `specs` are a subset of
      # another target's.
      #
      # @param [Array<PodTarget>] pod_targets
      #
      # @return [Array<PodTarget>]
      #
      def select_maximal_pod_targets(pod_targets)
        subset_targets = []
        pod_targets.uniq.group_by(&:pod_name).each do |_pod_name, targets|
          targets.combination(2) do |a, b|
            if (a.specs - b.specs).empty?
              subset_targets << a
            elsif (b.specs - a.specs).empty?
              subset_targets << b
            end
          end
        end
        pod_targets - subset_targets
      end

      # @param  [String] target_name the name of the target this xcframework belongs to
      #
      # @param  [Pathname,String] path the path to the xcframework bundle
      #
      # @return [Xcode::XCFramework] the xcframework at the given path
      #
      def load_xcframework(target_name, path)
        Xcode::XCFramework.new(target_name, path)
      end

      # A subclass that generates build settings for a {PodTarget}
      class PodTargetSettings < BuildSettings
        #-------------------------------------------------------------------------#

        # @!group Public API

        # @see BuildSettings.build_settings_names
        def self.build_settings_names
          @build_settings_names | BuildSettings.build_settings_names
        end

        # @return [Boolean]
        #   whether settings are being generated for a test bundle
        #
        attr_reader :test_xcconfig
        alias test_xcconfig? test_xcconfig

        # @return [Boolean]
        #   whether settings are being generated for an application bundle
        #
        attr_reader :app_xcconfig
        alias app_xcconfig? app_xcconfig

        # @return [Boolean]
        #   whether settings are being generated for an library bundle
        #
        attr_reader :library_xcconfig
        alias library_xcconfig? library_xcconfig

        def non_library_xcconfig?
          !library_xcconfig?
        end

        # @return [Specification]
        #   The non-library specification these build settings are for or `nil`.
        #
        attr_reader :non_library_spec

        # Initializes a new instance
        #
        # @param [PodTarget] target
        #   see {#target}
        #
        # @param [Specification] non_library_spec
        #  see {#non_library_spec}
        #
        # @param [Symbol] configuration
        #  see {#configuration}
        #
        def initialize(target, non_library_spec = nil, configuration: nil)
          super(target)
          if @non_library_spec = non_library_spec
            @test_xcconfig = non_library_spec.test_specification?
            @app_xcconfig = non_library_spec.app_specification?
            @xcconfig_spec_type = non_library_spec.spec_type
            @library_xcconfig = false
          else
            @test_xcconfig = @app_xcconfig = false
            @xcconfig_spec_type = :library
            @library_xcconfig = true
          end
          (@configuration = configuration) || raise("No configuration for #{self}.")
        end

        # @return [Xcodeproj::Xconfig]
        define_build_settings_method :xcconfig, :memoized => true do
          xcconfig = super()
          merge_spec_xcconfig_into_xcconfig(merged_pod_target_xcconfigs, xcconfig)
        end

        #-------------------------------------------------------------------------#

        # @!group Paths

        # @return [String]
        define_build_settings_method :pods_root, :build_setting => true do
          '${SRCROOT}'
        end

        # @return [String]
        define_build_settings_method :pods_target_srcroot, :build_setting => true do
          target.pod_target_srcroot
        end

        # @return [String]
        define_build_settings_method :pods_development_language, :build_setting => true do
          '${DEVELOPMENT_LANGUAGE}'
        end

        #-------------------------------------------------------------------------#

        # @!group Frameworks

        # @return [Array<String>]
        define_build_settings_method :consumer_frameworks, :memoized => true do
          spec_consumers.flat_map(&:frameworks)
        end

        # @return [Array<String>]
        define_build_settings_method :frameworks, :memoized => true, :sorted => true, :uniqued => true do
          return [] if target.build_as_static? && library_xcconfig?

          frameworks = []
          frameworks.concat consumer_frameworks
          if library_xcconfig?
            # We know that this library target is being built dynamically based
            # on the guard above, so include any vendored static frameworks and vendored xcframeworks.
            if target.should_build?
              frameworks.concat vendored_static_frameworks.map { |l| File.basename(l, '.framework') }
              frameworks.concat vendored_xcframeworks.
                select { |xcf| xcf.build_type.static_framework? }.
                map(&:name).
                uniq

              # Include direct dynamic dependencies to the linker flags. We used to add those in the 'Link Binary With Libraries'
              # phase but we no longer do since we cannot differentiate between debug or release configurations within
              # that phase.
              frameworks.concat target.dependent_targets_by_config[@configuration].flat_map { |pt| pt.build_settings[@configuration].dynamic_frameworks_to_import }
            else
              # Also include any vendored dynamic frameworks of dependencies.
              frameworks.concat dependent_targets.reject(&:should_build?).flat_map { |pt| pt.build_settings[@configuration].dynamic_frameworks_to_import }
            end
          else
            frameworks.concat dependent_targets_to_link.flat_map { |pt| pt.build_settings[@configuration].frameworks_to_import }
          end

          frameworks
        end

        # @return [Array<String>]
        define_build_settings_method :static_frameworks_to_import, :memoized => true do
          static_frameworks_to_import = []
          static_frameworks_to_import.concat vendored_static_frameworks.map { |f| File.basename(f, '.framework') } unless target.should_build? && target.build_as_dynamic?
          unless target.should_build? && target.build_as_dynamic?
            static_frameworks_to_import.concat vendored_xcframeworks.
              select { |xcf| xcf.build_type.static_framework? }.
              map(&:name).
              uniq
          end
          static_frameworks_to_import << target.product_basename if target.should_build? && target.build_as_static_framework?
          static_frameworks_to_import
        end

        # @return [Array<String>]
        define_build_settings_method :dynamic_frameworks_to_import, :memoized => true do
          dynamic_frameworks_to_import = vendored_dynamic_frameworks.map { |f| File.basename(f, '.framework') }
          dynamic_frameworks_to_import.concat vendored_xcframeworks.
            select { |xcf| xcf.build_type.dynamic_framework? }.
            map(&:name).
            uniq
          dynamic_frameworks_to_import << target.product_basename if target.should_build? && target.build_as_dynamic_framework?
          dynamic_frameworks_to_import.concat consumer_frameworks
          dynamic_frameworks_to_import
        end

        # @return [Array<String>]
        define_build_settings_method :weak_frameworks, :memoized => true do
          return [] if target.build_as_static? && library_xcconfig?

          weak_frameworks = spec_consumers.flat_map(&:weak_frameworks)
          weak_frameworks.concat dependent_targets.flat_map { |pt| pt.build_settings[@configuration].weak_frameworks_to_import }
          weak_frameworks
        end

        # @return [Array<String>]
        define_build_settings_method :frameworks_to_import, :memoized => true, :sorted => true, :uniqued => true do
          static_frameworks_to_import + dynamic_frameworks_to_import
        end

        # @return [Array<String>]
        define_build_settings_method :weak_frameworks_to_import, :memoized => true, :sorted => true, :uniqued => true do
          spec_consumers.flat_map(&:weak_frameworks)
        end

        # @return [Array<String>]
        define_build_settings_method :framework_search_paths, :build_setting => true, :memoized => true, :sorted => true, :uniqued => true do
          paths = super().dup
          paths.concat dependent_targets.flat_map { |pt| pt.build_settings[@configuration].framework_search_paths_to_import }
          paths.concat framework_search_paths_to_import
          paths.delete(target.configuration_build_dir(CONFIGURATION_BUILD_DIR_VARIABLE)) if library_xcconfig?
          paths
        end

        # @return [String]
        define_build_settings_method :framework_header_search_path, :memoized => true do
          return unless target.build_as_framework?
          "#{target.build_product_path}/Headers"
        end

        # @return [Array<String>]
        define_build_settings_method :vendored_framework_search_paths, :memoized => true do
          search_paths = []
          search_paths.concat file_accessors.
            flat_map(&:vendored_frameworks).
            map { |f| File.join '${PODS_ROOT}', f.dirname.relative_path_from(target.sandbox.root) }
          xcframework_intermediates = vendored_xcframeworks.
                                      select { |xcf| xcf.build_type.framework? }.
                                      map { |xcf| BuildSettings.xcframework_intermediate_dir(xcf) }.
                                      uniq
          search_paths.concat xcframework_intermediates
          search_paths
        end

        # @return [Array<String>]
        define_build_settings_method :framework_search_paths_to_import, :memoized => true do
          paths = framework_search_paths_to_import_developer_frameworks(consumer_frameworks)
          paths.concat vendored_framework_search_paths
          return paths unless target.build_as_framework? && target.should_build?

          paths + [target.configuration_build_dir(CONFIGURATION_BUILD_DIR_VARIABLE)]
        end

        # @return [Array<String>]
        define_build_settings_method :vendored_static_frameworks, :memoized => true do
          file_accessors.flat_map(&:vendored_static_frameworks)
        end

        # @return [Array<String>]
        define_build_settings_method :vendored_dynamic_frameworks, :memoized => true do
          file_accessors.flat_map(&:vendored_dynamic_frameworks)
        end

        # @return [Array<Xcode::XCFramework>]
        define_build_settings_method :vendored_xcframeworks, :memoized => true do
          file_accessors.flat_map do |file_accessor|
            file_accessor.vendored_xcframeworks.map { |path| load_xcframework(file_accessor.spec.name, path) }
          end
        end

        # @return [Array<String>]
        define_build_settings_method :system_framework_search_paths, :build_setting => true, :memoized => true, :sorted => true, :uniqued => true do
          return ['$(PLATFORM_DIR)/Developer/Library/Frameworks'] if should_apply_xctunwrap_fix?
          []
        end

        #-------------------------------------------------------------------------#

        # @!group Libraries

        # Converts array of library path references to just the names to use
        # link each library, e.g. from '/path/to/libSomething.a' to 'Something'
        #
        # @param [Array<String>] libraries
        #
        # @return [Array<String>]
        #
        def linker_names_from_libraries(libraries)
          libraries.map { |l| File.basename(l, File.extname(l)).sub(/\Alib/, '') }
        end

        # @return [Array<String>]
        define_build_settings_method :libraries, :memoized => true, :sorted => true, :uniqued => true do
          return [] if library_xcconfig? && target.build_as_static?

          libraries = []
          if non_library_xcconfig? || target.build_as_dynamic?
            libraries.concat linker_names_from_libraries(vendored_static_libraries)
            libraries.concat libraries_to_import
            xcframework_libraries = vendored_xcframeworks.
                                    select { |xcf| xcf.build_type.static_library? }.
                                    flat_map { |xcf| linker_names_from_libraries([xcf.slices.first.binary_path]) }.
                                    uniq
            libraries.concat xcframework_libraries
          end
          if non_library_xcconfig?
            libraries.concat dependent_targets.flat_map { |pt| pt.build_settings[@configuration].dynamic_libraries_to_import }
            libraries.concat dependent_targets_to_link.flat_map { |pt| pt.build_settings[@configuration].static_libraries_to_import }
          end
          libraries
        end

        # @return [Array<String>]
        define_build_settings_method :static_libraries_to_import, :memoized => true do
          static_libraries_to_import = []
          unless target.should_build? && target.build_as_dynamic?
            static_libraries_to_import.concat linker_names_from_libraries(vendored_static_libraries)
            xcframework_libraries = vendored_xcframeworks.
                                    select { |xcf| xcf.build_type.static_library? }.
                                    flat_map { |xcf| linker_names_from_libraries([xcf.slices.first.binary_path]) }.
                                    uniq
            static_libraries_to_import.concat linker_names_from_libraries(xcframework_libraries)
          end
          static_libraries_to_import << target.product_basename if target.should_build? && target.build_as_static_library?
          static_libraries_to_import
        end

        # @return [Array<String>]
        define_build_settings_method :dynamic_libraries_to_import, :memoized => true do
          dynamic_libraries_to_import = linker_names_from_libraries(vendored_dynamic_libraries)
          dynamic_libraries_to_import.concat spec_consumers.flat_map(&:libraries)
          dynamic_libraries_to_import << target.product_basename if target.should_build? && target.build_as_dynamic_library?
          dynamic_libraries_to_import
        end

        # @return [Array<String>]
        define_build_settings_method :libraries_to_import, :memoized => true, :sorted => true, :uniqued => true do
          static_libraries_to_import + dynamic_libraries_to_import
        end

        # @return [Array<String>]
        define_build_settings_method :library_search_paths, :build_setting => true, :memoized => true, :sorted => true, :uniqued => true do
          library_search_paths = should_apply_xctunwrap_fix? ? ['$(PLATFORM_DIR)/Developer/usr/lib'] : []
          return library_search_paths if library_xcconfig? && target.build_as_static?

          library_search_paths.concat library_search_paths_to_import.dup
          library_search_paths.concat dependent_targets.flat_map { |pt| pt.build_settings[@configuration].vendored_dynamic_library_search_paths }
          if library_xcconfig?
            library_search_paths.delete(target.configuration_build_dir(CONFIGURATION_BUILD_DIR_VARIABLE))
          else
            library_search_paths.concat(dependent_targets.flat_map { |pt| pt.build_settings[@configuration].library_search_paths_to_import })
          end

          library_search_paths
        end

        # @return [Array<String>]
        define_build_settings_method :vendored_static_libraries, :memoized => true do
          file_accessors.flat_map(&:vendored_static_libraries)
        end

        # @return [Array<String>]
        define_build_settings_method :vendored_dynamic_libraries, :memoized => true do
          file_accessors.flat_map(&:vendored_dynamic_libraries)
        end

        # @return [Array<String>]
        define_build_settings_method :vendored_static_library_search_paths, :memoized => true do
          paths = vendored_static_libraries.map { |f| File.join '${PODS_ROOT}', f.dirname.relative_path_from(target.sandbox.root) }
          paths.concat vendored_xcframeworks.
            select { |xcf| xcf.build_type.static_library? }.
            map { |xcf| BuildSettings.xcframework_intermediate_dir(xcf) }
          paths
        end

        # @return [Array<String>]
        define_build_settings_method :vendored_dynamic_library_search_paths, :memoized => true do
          paths = vendored_dynamic_libraries.map { |f| File.join '${PODS_ROOT}', f.dirname.relative_path_from(target.sandbox.root) }
          paths.concat vendored_xcframeworks.
            select { |xcf| xcf.build_type.dynamic_library? }.
            map { |xcf| BuildSettings.xcframework_intermediate_dir(xcf) }
          paths
        end

        # @return [Array<String>]
        define_build_settings_method :library_search_paths_to_import, :memoized => true do
          search_paths = vendored_static_library_search_paths + vendored_dynamic_library_search_paths
          if target.uses_swift? || other_swift_flags_without_swift?
            search_paths << '/usr/lib/swift'
            search_paths << '${TOOLCHAIN_DIR}/usr/lib/swift/${PLATFORM_NAME}'
            search_paths << '$(PLATFORM_DIR)/Developer/Library/Frameworks' if test_xcconfig?
          end
          return search_paths if target.build_as_framework? || !target.should_build?

          search_paths << target.configuration_build_dir(CONFIGURATION_BUILD_DIR_VARIABLE)
        end

        #-------------------------------------------------------------------------#

        # @!group Clang

        # @return [Array<String>]
        define_build_settings_method :module_map_files, :memoized => true do
          dependent_targets.map { |pt| pt.build_settings[@configuration].module_map_file_to_import }.compact.sort
        end

        # @return [Array<String>]
        define_build_settings_method :module_map_file_to_import, :memoized => true do
          return unless target.should_build?
          return if target.build_as_framework? # framework module maps are automatically discovered
          return unless target.defines_module?

          if target.uses_swift?
            # for swift, we have a custom build phase that copies in the module map, appending the .Swift module
            "${PODS_CONFIGURATION_BUILD_DIR}/#{target.label}/#{target.product_module_name}.modulemap"
          else
            "${PODS_ROOT}/#{target.module_map_path.relative_path_from(target.sandbox.root)}"
          end
        end

        # @return [Array<String>]
        define_build_settings_method :header_search_paths, :build_setting => true, :memoized => true, :sorted => true do
          paths = target.header_search_paths(:include_dependent_targets_for_test_spec => test_xcconfig? && non_library_spec, :include_dependent_targets_for_app_spec => app_xcconfig? && non_library_spec, :configuration => @configuration)

          dependent_vendored_xcframeworks = []
          dependent_vendored_xcframeworks.concat vendored_xcframeworks
          dependent_vendored_xcframeworks.concat dependent_targets.flat_map { |pt| pt.build_settings[@configuration].vendored_xcframeworks }
          paths.concat dependent_vendored_xcframeworks.
            select { |xcf| xcf.build_type.static_library? }.
            map { |xcf| "#{BuildSettings.xcframework_intermediate_dir(xcf)}/Headers" }.
            compact
          paths
        end

        # @return [Array<String>]
        define_build_settings_method :public_header_search_paths, :memoized => true, :sorted => true do
          target.header_search_paths(:include_dependent_targets_for_test_spec => test_xcconfig? && non_library_spec, :include_dependent_targets_for_app_spec => app_xcconfig? && non_library_spec, :include_private_headers => false, :configuration => @configuration)
        end

        #-------------------------------------------------------------------------#

        # @!group Swift

        # @see BuildSettings#other_swift_flags_without_swift?
        def other_swift_flags_without_swift?
          return false if library_xcconfig?

          target.uses_swift_for_spec?(non_library_spec)
        end

        # @return [Array<String>]
        define_build_settings_method :other_swift_flags, :build_setting => true, :memoized => true do
          return unless target.uses_swift? || other_swift_flags_without_swift?

          flags = super()
          flags << '-suppress-warnings' if target.inhibit_warnings? && library_xcconfig?
          if !target.build_as_framework? && target.defines_module? && library_xcconfig?
            flags.concat %w( -import-underlying-module -Xcc -fmodule-map-file=${SRCROOT}/${MODULEMAP_FILE} )
          end
          flags
        end

        # @return [Array<String>]
        define_build_settings_method :swift_include_paths, :build_setting => true, :memoized => true, :sorted => true, :uniqued => true do
          paths = dependent_targets.flat_map { |pt| pt.build_settings[@configuration].swift_include_paths_to_import }
          paths.concat swift_include_paths_to_import if non_library_xcconfig?
          vendored_static_library_search_paths = dependent_targets.flat_map { |pt| pt.build_settings[@configuration].vendored_static_library_search_paths }
          paths.concat vendored_static_library_search_paths
          paths.concat ['$(PLATFORM_DIR)/Developer/usr/lib'] if should_apply_xctunwrap_fix?
          paths
        end

        # @return [Array<String>]
        define_build_settings_method :swift_include_paths_to_import, :memoized => true do
          return [] unless target.uses_swift? && !target.build_as_framework?

          [target.configuration_build_dir(CONFIGURATION_BUILD_DIR_VARIABLE)]
        end

        #-------------------------------------------------------------------------#

        # @!group Linking

        # @return [Boolean] whether the `-ObjC` linker flag is required.
        #
        # @note this is only true when generating build settings for a test bundle
        #
        def requires_objc_linker_flag?
          test_xcconfig? || app_xcconfig?
        end

        # @return [Boolean] whether the `-fobjc-arc` linker flag is required.
        #
        define_build_settings_method :requires_fobjc_arc?, :memoized => true do
          target.podfile.set_arc_compatibility_flag? &&
            file_accessors.any? { |fa| fa.spec_consumer.requires_arc? }
        end

        # @return [Array<String>]
        define_build_settings_method :ld_runpath_search_paths, :build_setting => true, :memoized => true do
          return if library_xcconfig?
          _ld_runpath_search_paths(:test_bundle => test_xcconfig?,
                                   :uses_swift => other_swift_flags_without_swift? || dependent_targets.any?(&:uses_swift?))
        end

        #-------------------------------------------------------------------------#

        # @!group Packaging

        # @return [String]
        define_build_settings_method :skip_install, :build_setting => true do
          'YES'
        end

        # @return [String]
        define_build_settings_method :product_bundle_identifier, :build_setting => true do
          'org.cocoapods.${PRODUCT_NAME:rfc1034identifier}'
        end

        # @return [String]
        define_build_settings_method :configuration_build_dir, :build_setting => true, :memoized => true do
          return if non_library_xcconfig?
          target.configuration_build_dir(CONFIGURATION_BUILD_DIR_VARIABLE)
        end

        # @return [String]
        define_build_settings_method :application_extension_api_only, :build_setting => true, :memoized => true do
          target.application_extension_api_only ? 'YES' : nil
        end

        # @return [String]
        define_build_settings_method :build_library_for_distribution, :build_setting => true, :memoized => true do
          target.build_library_for_distribution ? 'YES' : nil
        end

        #-------------------------------------------------------------------------#

        # @!group Target Properties

        # @return [Array<PodTarget>]
        define_build_settings_method :dependent_targets, :memoized => true do
          select_maximal_pod_targets(
            if test_xcconfig?
              target.dependent_targets_for_test_spec(non_library_spec, :configuration => @configuration)
            elsif app_xcconfig?
              target.dependent_targets_for_app_spec(non_library_spec, :configuration => @configuration)
            else
              target.recursive_dependent_targets(:configuration => @configuration)
            end,
          )
        end

        # @return [Array<PodTarget>]
        define_build_settings_method :dependent_targets_to_link, :memoized => true do
          if test_xcconfig?
            # we're embedding into an app defined by an app spec
            host_targets = target.app_host_dependent_targets_for_spec(non_library_spec, :configuration => @configuration)
            dependent_targets - host_targets
          else
            dependent_targets
          end
        end

        # Returns the +pod_target_xcconfig+ for the pod target and its spec
        # consumers grouped by keys
        #
        # @return [Hash{String,Hash{Target,String}]
        #
        def pod_target_xcconfig_values_by_consumer_by_key
          spec_consumers.each_with_object({}) do |spec_consumer, hash|
            spec_consumer.pod_target_xcconfig.each do |k, v|
              (hash[k] ||= {})[spec_consumer] = v
            end
          end
        end

        # Merges the +pod_target_xcconfig+ for all pod targets into a
        # single hash and warns on conflicting definitions.
        #
        # @return [Hash{String, String}]
        #
        define_build_settings_method :merged_pod_target_xcconfigs, :memoized => true do
          merged_xcconfigs(pod_target_xcconfig_values_by_consumer_by_key, :pod_target_xcconfig,
                           :overriding => non_library_xcconfig? ? target.build_settings[@configuration].merged_pod_target_xcconfigs : {})
        end

        # @return [Array<Sandbox::FileAccessor>]
        define_build_settings_method :file_accessors, :memoized => true do
          if non_library_xcconfig?
            target.file_accessors.select { |fa| non_library_spec == fa.spec }
          else
            target.file_accessors.select { |fa| fa.spec.spec_type == @xcconfig_spec_type }
          end
        end

        # @return [Array<Specification::Consumer>]
        define_build_settings_method :spec_consumers, :memoized => true do
          if non_library_xcconfig?
            target.spec_consumers.select { |sc| non_library_spec == sc.spec }
          else
            target.spec_consumers.select { |sc| sc.spec.spec_type == @xcconfig_spec_type }
          end
        end

        # Xcode 11 causes an issue with frameworks or libraries before 12.2 deployment target that link or are part of
        # test bundles that use XCTUnwrap. Apple has provided an official work around for this.
        #
        # @see https://developer.apple.com/documentation/xcode_release_notes/xcode_11_release_notes
        #
        # @return [Boolean] Whether to apply the fix or not.
        #
        define_build_settings_method :should_apply_xctunwrap_fix?, :memoized => true do
          library_xcconfig? &&
            target.platform.name == :ios &&
            Version.new(target.platform.deployment_target) < Version.new('12.2') &&
            (frameworks_to_import + weak_frameworks_to_import).uniq.include?('XCTest')
        end

        #-------------------------------------------------------------------------#
      end

      # A subclass that generates build settings for a `PodTarget`
      class AggregateTargetSettings < BuildSettings
        #-------------------------------------------------------------------------#

        # @!group Public API

        # @see BuildSettings.build_settings_names
        def self.build_settings_names
          @build_settings_names | BuildSettings.build_settings_names
        end

        # @return [Symbol]
        #   The build configuration these settings will be used for
        attr_reader :configuration_name

        # Initializes a new instance
        #
        # @param [AggregateTarget] target
        #   see {#target}
        #
        # @param [Symbol] configuration_name
        #   see {#configuration_name}
        #
        def initialize(target, configuration_name, configuration: nil)
          super(target)
          @configuration_name = configuration_name
          (@configuration = configuration) || raise("No configuration for #{self}.")
        end

        # @return [Xcodeproj::Config] xcconfig
        define_build_settings_method :xcconfig, :memoized => true do
          xcconfig = super()
          merge_spec_xcconfig_into_xcconfig(merged_user_target_xcconfigs, xcconfig)
        end

        #-------------------------------------------------------------------------#

        # @!group Paths

        # @return [String]
        define_build_settings_method :pods_podfile_dir_path, :build_setting => true, :memoized => true do
          target.podfile_dir_relative_path
        end

        # @return [String]
        define_build_settings_method :pods_root, :build_setting => true, :memoized => true do
          target.relative_pods_root
        end

        #-------------------------------------------------------------------------#

        # @!group Frameworks

        # @return [Array<String>]
        define_build_settings_method :frameworks, :memoized => true, :sorted => true, :uniqued => true, :from_pod_targets_to_link => true, :from_search_paths_aggregate_targets => :dynamic_frameworks_to_import do
          []
        end

        # @return [Array<String>]
        define_build_settings_method :weak_frameworks, :memoized => true, :sorted => true, :uniqued => true, :from_pod_targets_to_link => true, :from_search_paths_aggregate_targets => :weak_frameworks do
          []
        end

        # @return [Array<String>]
        define_build_settings_method :framework_search_paths, :build_setting => true, :memoized => true, :sorted => true, :uniqued => true, :from_pod_targets_to_link => true, :from_search_paths_aggregate_targets => :framework_search_paths_to_import do
          []
        end

        #-------------------------------------------------------------------------#

        # @!group Libraries

        # @return [Array<String>]
        define_build_settings_method :libraries, :memoized => true, :sorted => true, :uniqued => true, :from_pod_targets_to_link => true, :from_search_paths_aggregate_targets => :dynamic_libraries_to_import do
          []
        end

        # @return [Array<String>]
        define_build_settings_method :library_search_paths, :build_setting => true, :memoized => true, :sorted => true, :uniqued => true, :from_pod_targets_to_link => true, :from_search_paths_aggregate_targets => :vendored_dynamic_library_search_paths do
          []
        end

        #-------------------------------------------------------------------------#

        # @!group Clang

        # @return [Array<String>]
        define_build_settings_method :header_search_paths, :build_setting => true, :memoized => true, :sorted => true, :uniqued => true do
          paths = []

          if !target.build_as_framework? || !pod_targets.all?(&:should_build?)
            paths.concat target.sandbox.public_headers.search_paths(target.platform)
          end

          # Make frameworks headers discoverable with any syntax (quotes,
          # brackets, @import, etc.)
          paths.concat pod_targets.
            select { |pt| pt.build_as_framework? && pt.should_build? }.
            map { |pt| pt.build_settings[@configuration].framework_header_search_path }

          xcframework_library_headers = pod_targets.flat_map { |pt| pt.build_settings[@configuration].vendored_xcframeworks }.
                                        select { |xcf| xcf.build_type.static_library? }.
                                        map { |xcf| "#{BuildSettings.xcframework_intermediate_dir(xcf)}/Headers" }.
                                        compact

          paths.concat xcframework_library_headers

          paths.concat target.search_paths_aggregate_targets.flat_map { |at| at.build_settings(configuration_name).header_search_paths }

          paths
        end

        # @return [Array<String>]
        define_build_settings_method :other_cflags, :build_setting => true, :memoized => true do
          flags = super()

          pod_targets_inhibiting_warnings = pod_targets.select(&:inhibit_warnings?)

          silenced_headers = []
          silenced_frameworks = []
          pod_targets_inhibiting_warnings.each do |pt|
            if pt.build_as_framework? && pt.should_build?
              silenced_headers.append pt.build_settings[@configuration].framework_header_search_path
            else
              silenced_headers.concat pt.build_settings[@configuration].public_header_search_paths
            end
            silenced_frameworks.concat pt.build_settings[@configuration].framework_search_paths_to_import
          end

          flags += silenced_headers.uniq.flat_map { |p| ['-isystem', p] }
          flags += silenced_frameworks.uniq.flat_map { |p| ['-iframework', p] }

          flags
        end

        # @return [Array<String>]
        define_build_settings_method :module_map_files, :memoized => true, :sorted => true, :uniqued => true, :compacted => true, :from_search_paths_aggregate_targets => :module_map_file_to_import do
          pod_targets.map { |pt| pt.build_settings[@configuration].module_map_file_to_import }
        end

        #-------------------------------------------------------------------------#

        # @!group Swift

        # @see BuildSettings#other_swift_flags_without_swift?
        def other_swift_flags_without_swift?
          module_map_files.any?
        end

        # @return [Array<String>]
        define_build_settings_method :swift_include_paths, :build_setting => true, :memoized => true, :sorted => true, :uniqued => true, :from_pod_targets_to_link => true, :from_search_paths_aggregate_targets => :swift_include_paths_to_import do
          []
        end

        # @return [String]
        define_build_settings_method :always_embed_swift_standard_libraries, :build_setting => true, :memoized => true do
          return unless must_embed_swift?
          return if target_swift_version < EMBED_STANDARD_LIBRARIES_MINIMUM_VERSION

          'YES'
        end

        # @return [String]
        define_build_settings_method :embedded_content_contains_swift, :build_setting => true, :memoized => true do
          return unless must_embed_swift?
          return if target_swift_version >= EMBED_STANDARD_LIBRARIES_MINIMUM_VERSION

          'YES'
        end

        # @return [Boolean]
        define_build_settings_method :must_embed_swift?, :memoized => true do
          !target.requires_host_target? && pod_targets.any?(&:uses_swift?)
        end

        #-------------------------------------------------------------------------#

        # @!group Linking

        # @return [Array<String>]
        define_build_settings_method :ld_runpath_search_paths, :build_setting => true, :memoized => true, :uniqued => true do
          return unless pod_targets.any?(&:build_as_dynamic?) || any_vendored_dynamic_artifacts?
          symbol_type = target.user_targets.map(&:symbol_type).uniq.first
          test_bundle = symbol_type == :octest_bundle || symbol_type == :unit_test_bundle || symbol_type == :ui_test_bundle
          _ld_runpath_search_paths(:requires_host_target => target.requires_host_target?, :test_bundle => test_bundle,
                                   :uses_swift => pod_targets.any?(&:uses_swift?))
        end

        # @return [Boolean]
        define_build_settings_method :any_vendored_dynamic_artifacts?, :memoized => true do
          pod_targets.any? do |pt|
            pt.file_accessors.any? do |fa|
              !fa.vendored_dynamic_artifacts.empty? || !fa.vendored_dynamic_xcframeworks.empty?
            end
          end
        end

        # @return [Boolean]
        define_build_settings_method :any_vendored_static_artifacts?, :memoized => true do
          pod_targets.any? do |pt|
            pt.file_accessors.any? do |fa|
              !fa.vendored_static_artifacts.empty?
            end
          end
        end

        # @return [Boolean]
        define_build_settings_method :requires_objc_linker_flag?, :memoized => true do
          pod_targets.any?(&:build_as_static?) ||
            any_vendored_static_artifacts?
        end

        # @return [Boolean]
        define_build_settings_method :requires_fobjc_arc?, :memoized => true do
          target.podfile.set_arc_compatibility_flag? &&
          target.spec_consumers.any?(&:requires_arc?)
        end

        #-------------------------------------------------------------------------#

        # @!group Target Properties

        # @return [Version] the SWIFT_VERSION of the target being integrated
        #
        define_build_settings_method :target_swift_version, :memoized => true, :frozen => false do
          swift_version = target.target_definition.swift_version
          swift_version = nil if swift_version.blank?
          Version.new(swift_version)
        end

        EMBED_STANDARD_LIBRARIES_MINIMUM_VERSION = Version.new('2.3')
        private_constant :EMBED_STANDARD_LIBRARIES_MINIMUM_VERSION

        # Returns the {PodTarget}s which are active for the current
        # configuration name.
        #
        # @return [Array<PodTarget>]
        #
        define_build_settings_method :pod_targets, :memoized => true do
          target.pod_targets_for_build_configuration(configuration_name)
        end

        # @return [Array<PodTarget>]
        define_build_settings_method :pod_targets_to_link, :memoized => true do
          pod_targets -
            target.search_paths_aggregate_targets.flat_map { |at| at.build_settings(configuration_name).pod_targets_to_link }
        end

        # @return [Array<PodTarget>]
        define_build_settings_method :search_paths_aggregate_target_pod_target_build_settings, :memoized => true, :uniqued => true do
          pod_targets = target.search_paths_aggregate_targets.flat_map { |at| at.build_settings(configuration_name).pod_targets }
          pod_targets = select_maximal_pod_targets(pod_targets)
          pod_targets.map { |pt| pt.build_settings[@configuration] }
        end

        # Returns the +user_target_xcconfig+ for all pod targets and their spec
        # consumers grouped by keys
        #
        # @return [Hash{String,Hash{Target,String}]
        #
        def user_target_xcconfig_values_by_consumer_by_key
          targets = (pod_targets + target.search_paths_aggregate_targets.flat_map(&:pod_targets)).uniq
          targets.each_with_object({}) do |target, hash|
            target.spec_consumers.each do |spec_consumer|
              spec_consumer.user_target_xcconfig.each do |k, v|
                # TODO: Need to decide how we are going to ensure settings like these
                # are always excluded from the user's project.
                #
                # See https://github.com/CocoaPods/CocoaPods/issues/1216
                next if k == 'USE_HEADERMAP'
                (hash[k] ||= {})[spec_consumer] = v
              end
            end
          end
        end

        # Merges the +user_target_xcconfig+ for all pod targets into a
        # single hash and warns on conflicting definitions.
        #
        # @return [Hash{String, String}]
        #
        define_build_settings_method :merged_user_target_xcconfigs, :memoized => true do
          merged_xcconfigs(user_target_xcconfig_values_by_consumer_by_key, :user_target_xcconfig)
        end

        #-------------------------------------------------------------------------#
      end
    end
  end
end
