require 'cocoapods/xcode/framework_paths'
require 'cocoapods/xcode/xcframework'

module Pod
  # Stores the information relative to the target used to compile a single Pod.
  # A pod can have one or more activated spec, subspecs and test specs.
  #
  class PodTarget < Target
    # @return [Array<Specification>] the spec, subspecs and test specs of the target.
    #
    attr_reader :specs

    # @return [Array<Specification>] All of the test specs within this target.
    #         Subset of #specs.
    #
    attr_reader :test_specs

    # @return [Array<Specification>] All of the specs within this target that are library specs.
    #         Subset of #specs.
    #
    attr_reader :library_specs

    # @return [Array<Specification>] All of the specs within this target that are app specs.
    #         Subset of #specs.
    #
    attr_reader :app_specs

    # @return [Array<TargetDefinition>] the target definitions of the Podfile
    #         that generated this target.
    #
    attr_reader :target_definitions

    # @return [Array<Sandbox::FileAccessor>] the file accessors for the
    #         specifications of this target.
    #
    attr_reader :file_accessors

    # @return [String] the suffix used for this target when deduplicated. May be `nil`.
    #
    # @note This affects the value returned by #configuration_build_dir
    #       and accessors relying on this as #build_product_path.
    #
    attr_reader :scope_suffix

    # @return [HeadersStore] the header directory for the target.
    #
    attr_reader :build_headers

    # @return [Array<PodTarget>] the targets that this target has a dependency
    #         upon.
    #
    attr_reader :dependent_targets
    attr_reader :dependent_targets_by_config

    # @deprecated
    def dependent_targets=(dependent_targets)
      @dependent_targets = dependent_targets
      @dependent_targets_by_config = { :debug => dependent_targets, :release => dependent_targets }
    end

    def dependent_targets_by_config=(dependent_targets_by_config)
      @dependent_targets_by_config = dependent_targets_by_config
      @dependent_targets = dependent_targets_by_config.each_value.reduce([], &:|)
    end

    # @return [Hash{String=>Array<PodTarget>}] all target dependencies by test spec name.
    #
    attr_reader :test_dependent_targets_by_spec_name
    attr_reader :test_dependent_targets_by_spec_name_by_config

    # @deprecated
    def test_dependent_targets_by_spec_name=(test_dependent_targets_by_spec_name)
      @test_dependent_targets_by_spec_name = test_dependent_targets_by_spec_name
      @test_dependent_targets_by_spec_name_by_config = Hash[test_dependent_targets_by_spec_name.map do |k, v|
        [k, { :debug => v, :release => v }]
      end]
    end

    def test_dependent_targets_by_spec_name_by_config=(test_dependent_targets_by_spec_name_by_config)
      @test_dependent_targets_by_spec_name_by_config = test_dependent_targets_by_spec_name_by_config
      @test_dependent_targets_by_spec_name = Hash[test_dependent_targets_by_spec_name_by_config.map do |k, v|
        [k, v.each_value.reduce(Set.new, &:|).to_a]
      end]
    end

    # @return [Hash{String=>Array<PodTarget>}] all target dependencies by app spec name.
    #
    attr_reader :app_dependent_targets_by_spec_name
    attr_reader :app_dependent_targets_by_spec_name_by_config

    # @deprecated
    def app_dependent_targets_by_spec_name=(app_dependent_targets_by_spec_name)
      @app_dependent_targets_by_spec_name = app_dependent_targets_by_spec_name
      @app_dependent_targets_by_spec_name_by_config = Hash[app_dependent_targets_by_spec_name.map do |k, v|
        [k, { :debug => v, :release => v }]
      end]
    end

    def app_dependent_targets_by_spec_name_by_config=(app_dependent_targets_by_spec_name_by_config)
      @app_dependent_targets_by_spec_name_by_config = app_dependent_targets_by_spec_name_by_config
      @app_dependent_targets_by_spec_name = Hash[app_dependent_targets_by_spec_name_by_config.map do |k, v|
        [k, v.each_value.reduce(Set.new, &:|).to_a]
      end]
    end

    # @return [Hash{Specification => (Specification,PodTarget)}] tuples of app specs and pod targets by test spec.
    #
    attr_accessor :test_app_hosts_by_spec

    # @return [Hash{String => BuildSettings}] the test spec build settings for this target.
    #
    attr_reader :test_spec_build_settings
    attr_reader :test_spec_build_settings_by_config

    # @return [Hash{String => BuildSettings}] the app spec build settings for this target.
    #
    attr_reader :app_spec_build_settings
    attr_reader :app_spec_build_settings_by_config

    # @return [String] the Swift version for this target.
    #
    attr_reader :swift_version

    # Initialize a new instance
    #
    # @param [Sandbox] sandbox @see Target#sandbox
    # @param [BuildType] build_type @see Target#build_type
    # @param [Hash{String=>Symbol}] user_build_configurations @see Target#user_build_configurations
    # @param [Array<String>] archs @see Target#archs
    # @param [Platform] platform @see Target#platform
    # @param [Array<Specification>] specs @see #specs
    # @param [Array<TargetDefinition>] target_definitions @see #target_definitions
    # @param [Array<Sandbox::FileAccessor>] file_accessors @see #file_accessors
    # @param [String] scope_suffix @see #scope_suffix
    # @param [String] swift_version @see #swift_version
    #
    def initialize(sandbox, build_type, user_build_configurations, archs, platform, specs, target_definitions,
                   file_accessors = [], scope_suffix = nil, swift_version = nil)
      super(sandbox, build_type, user_build_configurations, archs, platform)
      raise "Can't initialize a PodTarget without specs!" if specs.nil? || specs.empty?
      raise "Can't initialize a PodTarget without TargetDefinition!" if target_definitions.nil? || target_definitions.empty?
      raise "Can't initialize a PodTarget with an empty string scope suffix!" if scope_suffix == ''
      @specs = specs.dup.freeze
      @target_definitions = target_definitions
      @file_accessors = file_accessors
      @scope_suffix = scope_suffix
      @swift_version = swift_version
      all_specs_by_type = @specs.group_by(&:spec_type)
      @library_specs = all_specs_by_type[:library] || []
      @test_specs = all_specs_by_type[:test] || []
      @app_specs = all_specs_by_type[:app] || []
      @build_headers = Sandbox::HeadersStore.new(sandbox, 'Private', :private)
      self.dependent_targets = []
      self.test_dependent_targets_by_spec_name = Hash[test_specs.map { |ts| [ts.name, []] }]
      self.app_dependent_targets_by_spec_name = Hash[app_specs.map { |as| [as.name, []] }]
      @test_app_hosts_by_spec = {}
      @build_config_cache = {}
      @test_spec_build_settings_by_config = create_test_build_settings_by_config
      @app_spec_build_settings_by_config = create_app_build_settings_by_config
    end

    # Scopes the current target based on the existing pod targets within the cache.
    #
    # @param [Hash{Array => PodTarget}] cache
    #        the cached target for a previously scoped target.
    #
    # @return [Array<PodTarget>] a scoped copy for each target definition.
    #
    def scoped(cache = {})
      target_definitions.map do |target_definition|
        cache_key = [specs, target_definition]
        cache[cache_key] ||= begin
          target = PodTarget.new(sandbox, build_type, user_build_configurations, archs, platform, specs,
                                 [target_definition], file_accessors, target_definition.label, swift_version)
          scope_dependent_targets = ->(dependent_targets) do
            dependent_targets.flat_map do |pod_target|
              pod_target.scoped(cache).select { |pt| pt.target_definitions == [target_definition] }
            end
          end

          target.dependent_targets_by_config = Hash[dependent_targets_by_config.map { |k, v| [k, scope_dependent_targets[v]] }]
          target.test_dependent_targets_by_spec_name_by_config = Hash[test_dependent_targets_by_spec_name_by_config.map do |spec_name, test_pod_targets_by_config|
            [spec_name, Hash[test_pod_targets_by_config.map { |k, v| [k, scope_dependent_targets[v]] }]]
          end]
          target.app_dependent_targets_by_spec_name_by_config = Hash[app_dependent_targets_by_spec_name_by_config.map do |spec_name, app_pod_targets_by_config|
            [spec_name, Hash[app_pod_targets_by_config.map { |k, v| [k, scope_dependent_targets[v]] }]]
          end]
          target.test_app_hosts_by_spec = Hash[test_app_hosts_by_spec.map do |spec, (app_host_spec, app_pod_target)|
            [spec, [app_host_spec, app_pod_target.scoped(cache).find { |pt| pt.target_definitions == [target_definition] }]]
          end]
          target
        end
      end
    end

    # @return [String] the label for the target.
    #
    def label
      if scope_suffix.nil? || scope_suffix[0] == '.'
        "#{root_spec.name}#{scope_suffix}"
      else
        "#{root_spec.name}-#{scope_suffix}"
      end
    end

    # @return [Array<Pathname>] The list of all files tracked.
    #
    def all_files
      Sandbox::FileAccessor.all_files(file_accessors)
    end

    # @return [Pathname] the pathname for headers in the sandbox.
    #
    def headers_sandbox
      Pathname.new(pod_name)
    end

    # @return [Hash{FileAccessor => Hash}] Hash of file accessors by header mappings.
    #
    def header_mappings_by_file_accessor
      valid_accessors = file_accessors.reject { |fa| fa.spec.non_library_specification? }
      Hash[valid_accessors.map do |file_accessor|
        # Private headers will always end up in Pods/Headers/Private/PodA/*.h
        # This will allow for `""` imports to work.
        [file_accessor, header_mappings(file_accessor, file_accessor.headers)]
      end]
    end

    # @return [Hash{FileAccessor => Hash}] Hash of file accessors by public header mappings.
    #
    def public_header_mappings_by_file_accessor
      valid_accessors = file_accessors.reject { |fa| fa.spec.non_library_specification? }
      Hash[valid_accessors.map do |file_accessor|
        # Public headers on the other hand will be added in Pods/Headers/Public/PodA/PodA/*.h
        # The extra folder is intentional in order for `<>` imports to work.
        [file_accessor, header_mappings(file_accessor, file_accessor.public_headers)]
      end]
    end

    # @return [Array<Version>] the Swift versions supported. Might be empty if the author has not
    #         specified any versions, most likely due to legacy reasons.
    #
    def spec_swift_versions
      root_spec.swift_versions
    end

    # @return [Podfile] The podfile which declares the dependency.
    #
    def podfile
      target_definitions.first.podfile
    end

    # @return [String] the project name derived from the target definitions that integrate this pod. If none is
    #         specified then the name of the pod is used by default.
    #
    # @note   The name is guaranteed to be the same across all target definitions and is validated by the target
    #         validator during installation.
    #
    def project_name
      target_definitions.map { |td| td.project_name_for_pod(pod_name) }.compact.first || pod_name
    end

    # @return [String] The name to use for the source code module constructed
    #         for this target, and which will be used to import the module in
    #         implementation source files.
    #
    def product_module_name
      root_spec.module_name
    end

    # @param [Specification] spec the specification
    #
    # @return [String] the product basename of the specification's target
    def product_basename_for_spec(spec)
      user_specified = build_settings_by_config_for_spec(spec).
                       each_value.
                       map { |settings| settings.merged_pod_target_xcconfigs['PRODUCT_NAME'] }.
                       compact.
                       uniq

      if user_specified.size == 1
        user_specified.first
      else
        spec_label(spec)
      end
    end

    # @return [Boolean] Whether or not this target should be built.
    #
    # A target should not be built if it has no source files.
    #
    def should_build?
      return @should_build if defined? @should_build
      accessors = file_accessors.select { |fa| fa.spec.library_specification? }
      source_files = accessors.flat_map(&:source_files)
      source_files -= accessors.flat_map(&:headers)
      @should_build = !source_files.empty?
    end

    # @return [Array<Specification::Consumer>] the specification consumers for
    #         the target.
    #
    def spec_consumers
      specs.map { |spec| spec.consumer(platform) }
    end

    # @return [Array<Specification::Consumer>] the test specification consumers for
    #         the target.
    #
    def test_spec_consumers
      test_specs.map { |test_spec| test_spec.consumer(platform) }
    end

    # @return [Array<Specification::Consumer>] the app specification consumers for
    #         the target.
    #
    def app_spec_consumers
      app_specs.map { |app_spec| app_spec.consumer(platform) }
    end

    # Checks whether the target itself plus its specs uses Swift code.
    # This check excludes source files from non library specs.
    # Note that if a target does not need to be built (no source code),
    # we fallback to check whether it indicates a swift version.
    #
    # @return [Boolean] Whether the target uses Swift code.
    #
    def uses_swift?
      return @uses_swift if defined? @uses_swift
      @uses_swift = (!should_build? && !spec_swift_versions.empty?) ||
        file_accessors.select { |a| a.spec.library_specification? }.any? do |file_accessor|
          uses_swift_for_spec?(file_accessor.spec)
        end
    end

    # Checks whether a specification uses Swift or not.
    #
    # @param  [Specification] spec
    #         The spec to query against.
    #
    # @return [Boolean] Whether the target uses Swift code within the requested non library spec.
    #
    def uses_swift_for_spec?(spec)
      @uses_swift_for_spec_cache ||= {}
      return @uses_swift_for_spec_cache[spec.name] if @uses_swift_for_spec_cache.key?(spec.name)
      @uses_swift_for_spec_cache[spec.name] = begin
        file_accessor = file_accessors.find { |fa| fa.spec == spec }
        raise "[Bug] Unable to find file accessor for spec `#{spec.inspect}` in pod target `#{label}`" unless file_accessor
        file_accessor.source_files.any? { |sf| sf.extname == '.swift' }
      end
    end

    # @return [Boolean] Whether the target defines a "module"
    #         (and thus will need a module map and umbrella header).
    #
    # @note   Static library targets can temporarily opt in to this behavior by setting
    #         `DEFINES_MODULE = YES` in their specification's `pod_target_xcconfig`.
    #
    def defines_module?
      return @defines_module if defined?(@defines_module)
      return @defines_module = true if uses_swift? || build_as_framework?

      explicit_target_definitions = target_definitions.select { |td| td.dependencies.any? { |d| d.root_name == pod_name } }
      tds_by_answer = explicit_target_definitions.group_by { |td| td.build_pod_as_module?(pod_name) }

      if tds_by_answer.size > 1
        UI.warn "Unable to determine whether to build `#{label}` as a module due to a conflict " \
          "between the following target definitions:\n\t- #{tds_by_answer.map do |a, td|
                                                              "`#{td.to_sentence}` #{a ? "requires `#{label}` as a module" : "does not require `#{label}` as a module"}"
                                                            end.join("\n\t- ")}\n\n" \
          "Defaulting to skip building `#{label}` as a module."
      elsif tds_by_answer.keys.first == true || target_definitions.all? { |td| td.build_pod_as_module?(pod_name) }
        return @defines_module = true
      end

      @defines_module = library_specs.any? { |s| s.consumer(platform).pod_target_xcconfig['DEFINES_MODULE'] == 'YES' }
    end

    # @return [Array<Hash{Symbol=>String}>] An array of hashes where each hash represents a single script phase.
    #
    def script_phases
      spec_consumers.flat_map(&:script_phases)
    end

    # @return [Boolean] Whether the target contains any script phases.
    #
    def contains_script_phases?
      !script_phases.empty?
    end

    # @return [Boolean] Whether the target has any tests specifications.
    #
    def contains_test_specifications?
      !test_specs.empty?
    end

    # @return [Boolean] Whether the target has any app specifications.
    #
    def contains_app_specifications?
      !app_specs.empty?
    end

    # @return [Hash{String=>Array<Xcode::FrameworkPaths>}] The vendored and non vendored framework paths this target
    #         depends upon keyed by spec name. For the root spec and subspecs the framework path of the target itself
    #         is included.
    #
    def framework_paths
      @framework_paths ||= begin
        file_accessors.each_with_object({}) do |file_accessor, hash|
          frameworks = file_accessor.vendored_dynamic_artifacts.map do |framework_path|
            relative_path_to_sandbox = framework_path.relative_path_from(sandbox.root)
            framework_source = "${PODS_ROOT}/#{relative_path_to_sandbox}"
            # Until this can be configured, assume the dSYM file uses the file name as the framework.
            # See https://github.com/CocoaPods/CocoaPods/issues/1698
            dsym_name = "#{framework_path.basename}.dSYM"
            dsym_path = Pathname.new("#{framework_path.dirname}/#{dsym_name}")
            dsym_source = if dsym_path.exist?
                            "${PODS_ROOT}/#{relative_path_to_sandbox}.dSYM"
                          end
            dirname = framework_path.dirname
            bcsymbolmap_paths = if dirname.exist?
                                  Dir.chdir(dirname) do
                                    Dir.glob('*.bcsymbolmap').map do |bcsymbolmap_file_name|
                                      bcsymbolmap_path = dirname + bcsymbolmap_file_name
                                      "${PODS_ROOT}/#{bcsymbolmap_path.relative_path_from(sandbox.root)}"
                                    end
                                  end
                                end
            Xcode::FrameworkPaths.new(framework_source, dsym_source, bcsymbolmap_paths)
          end
          if file_accessor.spec.library_specification? && should_build? && build_as_dynamic_framework?
            frameworks << Xcode::FrameworkPaths.new(build_product_path('${BUILT_PRODUCTS_DIR}'))
          end
          hash[file_accessor.spec.name] = frameworks
        end
      end
    end

    # @return [Hash{String=>Array<Xcode::XCFramework>}] The vendored xcframeworks this target
    #         depends upon keyed by spec name.
    #
    def xcframeworks
      @xcframeworks ||= begin
        file_accessors.each_with_object({}) do |file_accessor, hash|
          frameworks = file_accessor.vendored_xcframeworks.map do |framework_path|
            Xcode::XCFramework.new(file_accessor.spec.name, framework_path)
          end
          hash[file_accessor.spec.name] = frameworks
        end
      end
    end

    # @return [Hash{String=>Array<String>}] The resource and resource bundle paths this target depends upon keyed by
    #         spec name. Resource (not resource bundles) paths can vary depending on the type of spec:
    #           - App specs _always_ get their resource paths added to "Copy Bundle Resources" phase from
    #             [PodTargetInstaller] therefore their resource paths are never included here.
    #           - Test specs may have their resource paths added to "Copy Bundle Resources" if the target itself is
    #             built as a framework, which is again checked and handled by PodTargetInstaller. If that is true then
    #             the resource paths are not included, otherwise they are included and handled via the CocoaPods copy
    #             resources script phase.
    #           - Library specs _do not_ have per-configuration CocoaPods copy resources script phase and their resource
    #             paths will be added to "Copy Bundle Resources" phase if the target is built as a framework because
    #             it supports it. We always include the resource paths for library specs because they are also
    #             integrated to the user target.
    #
    def resource_paths
      @resource_paths ||= begin
        file_accessors.each_with_object({}) do |file_accessor, hash|
          resource_paths = if file_accessor.spec.app_specification? || (file_accessor.spec.test_specification? && build_as_framework?)
                             []
                           else
                             file_accessor.resources.map do |res|
                               "${PODS_ROOT}/#{res.relative_path_from(sandbox.project_path.dirname)}"
                             end
                           end
          prefix = Pod::Target::BuildSettings::CONFIGURATION_BUILD_DIR_VARIABLE
          prefix = configuration_build_dir unless file_accessor.spec.test_specification?
          resource_bundle_paths = file_accessor.resource_bundles.keys.map { |name| "#{prefix}/#{name.shellescape}.bundle" }
          hash[file_accessor.spec.name] = (resource_paths + resource_bundle_paths).map(&:to_s)
        end
      end
    end

    # @param [Specification] spec The non library spec to calculate the deployment target for.
    #
    # @return [String] The deployment target to use for the non library spec. If the non library spec explicitly
    #         specifies one then this is the one used otherwise the one that was determined by the analyzer is used.
    #
    def deployment_target_for_non_library_spec(spec)
      raise ArgumentError, 'Must be a non library spec.' unless spec.non_library_specification?
      spec.deployment_target(platform.name.to_s) || platform.deployment_target.to_s
    end

    # Returns the corresponding native product type to use given the test type.
    # This is primarily used when creating the native targets in order to produce the correct test bundle target
    # based on the type of tests included.
    #
    # @param  [Symbol] test_type
    #         The test type to map to provided by the test specification DSL.
    #
    # @return [Symbol] The native product type to use.
    #
    def product_type_for_test_type(test_type)
      case test_type
      when :unit
        :unit_test_bundle
      when :ui
        :ui_test_bundle
      else
        raise ArgumentError, "Unknown test type `#{test_type}`."
      end
    end

    # Returns the label to use for the given test type.
    # This is used to generate native target names for test specs.
    #
    # @param  [Symbol] test_type
    #         The test type to map to provided by the test specification DSL.
    #
    # @return [String] The native product type to use.
    #
    def label_for_test_type(test_type)
      case test_type
      when :unit
        'Unit'
      when :ui
        'UI'
      else
        raise ArgumentError, "Unknown test type `#{test_type}`."
      end
    end

    # @return [Specification] The root specification for the target.
    #
    def root_spec
      @root_spec ||= specs.first.root
    end

    # @return [String] The name of the Pod that this target refers to.
    #
    def pod_name
      root_spec.name
    end

    # @return [Pathname] the absolute path of the LLVM module map file that
    #         defines the module structure for the compiler.
    #
    def module_map_path
      basename = "#{label}.modulemap"
      if build_as_framework?
        super
      elsif file_accessors.any?(&:module_map)
        build_headers.root + product_module_name + basename
      else
        sandbox.public_headers.root + product_module_name + basename
      end
    end

    # @return [Pathname] the absolute path of the prefix header file.
    #
    def prefix_header_path
      support_files_dir + "#{label}-prefix.pch"
    end

    # @return [Hash] the additional entries to add to the generated Info.plist
    #
    def info_plist_entries
      root_spec.info_plist
    end

    # @param  [String] bundle_name
    #         The name of the bundle product, which is given by the +spec+.
    #
    # @return [String] The derived name of the resource bundle target.
    #
    def resources_bundle_target_label(bundle_name)
      "#{label}-#{bundle_name}"
    end

    # @param  [Specification] subspec
    #         The subspec to use for producing the label.
    #
    # @return [String] The derived name of the target.
    #
    def subspec_label(subspec)
      raise ArgumentError, 'Must not be a root spec' if subspec.root?
      subspec.name.split('/')[1..-1].join('-').to_s
    end

    # @param  [Specification] test_spec
    #         The test spec to use for producing the test label.
    #
    # @return [String] The derived name of the test target.
    #
    def test_target_label(test_spec)
      "#{label}-#{label_for_test_type(test_spec.test_type)}-#{subspec_label(test_spec)}"
    end

    # @param  [Specification] app_spec
    #         The app spec to use for producing the app label.
    #
    # @return [String] The derived name of the app target.
    #
    def app_target_label(app_spec)
      "#{label}-#{subspec_label(app_spec)}"
    end

    # @param  [Specification] test_spec
    #         the test spec to use for producing the app host target label.
    #
    # @return [(String,String)] a tuple, where the first item is the PodTarget#label of the pod target that defines the
    #         app host, and the second item is the target name of the app host
    #
    def app_host_target_label(test_spec)
      app_spec, app_target = test_app_hosts_by_spec[test_spec]

      if app_spec
        [app_target.name, app_target.app_target_label(app_spec)]
      elsif test_spec.consumer(platform).requires_app_host?
        [name, "AppHost-#{label}-#{label_for_test_type(test_spec.test_type)}-Tests"]
      end
    end

    # @param [Specification] spec
    #        the spec to return app host dependencies for
    #
    # @param [String] configuration
    #        the configuration to retrieve the app host dependent targets for.
    #
    # @return [Array<PodTarget>] the app host dependent targets for the given spec.
    #
    def app_host_dependent_targets_for_spec(spec, configuration: nil)
      return [] unless spec.test_specification? && spec.consumer(platform).test_type == :unit
      app_host_info = test_app_hosts_by_spec[spec]
      if app_host_info.nil?
        []
      else
        app_spec, app_target = *app_host_info
        app_target.dependent_targets_for_app_spec(app_spec, :configuration => configuration)
      end
    end

    def spec_label(spec)
      case spec.spec_type
      when :library then label
      when :test then test_target_label(spec)
      when :app then app_target_label(spec)
      else raise ArgumentError, "Unhandled spec type #{spec.spec_type.inspect} for #{spec.inspect}"
      end
    end
    # for backwards compatibility
    alias non_library_spec_label spec_label

    # @param  [Specification] spec
    #         The spec to return scheme configuration for.
    #
    # @return [Hash] The scheme configuration used or empty if none is specified.
    #
    def scheme_for_spec(spec)
      return {} if (spec.library_specification? && !spec.root?) || spec.available_platforms.none? do |p|
        p.name == platform.name
      end
      spec.consumer(platform).scheme
    end

    # @param  [Specification] spec
    #         The spec this copy resources script path is for.
    #
    # @return [Pathname] The absolute path of the copy resources script for the given spec.
    #
    def copy_resources_script_path_for_spec(spec)
      support_files_dir + "#{spec_label(spec)}-resources.sh"
    end

    # @param  [Specification] spec
    #         The spec this copy resources script path is for.
    #
    # @return [Pathname] The absolute path of the copy resources script input file list for the given spec.
    #
    def copy_resources_script_input_files_path_for_spec(spec)
      support_files_dir + "#{spec_label(spec)}-resources-input-files.xcfilelist"
    end

    # @param  [Specification] spec
    #         The spec this copy resources script path is for.
    #
    # @return [Pathname] The absolute path of the copy resources script output file list for the given spec.
    #
    def copy_resources_script_output_files_path_for_spec(spec)
      support_files_dir + "#{spec_label(spec)}-resources-output-files.xcfilelist"
    end

    # @param  [Specification] spec
    #         The spec this embed frameworks script path is for.
    #
    # @return [Pathname] The absolute path of the embed frameworks script for the given spec.
    #
    def embed_frameworks_script_path_for_spec(spec)
      support_files_dir + "#{spec_label(spec)}-frameworks.sh"
    end

    # @param  [Specification] spec
    #         The spec this embed frameworks script path is for.
    #
    # @return [Pathname] The absolute path of the embed frameworks script input file list for the given spec.
    #
    def embed_frameworks_script_input_files_path_for_spec(spec)
      support_files_dir + "#{spec_label(spec)}-frameworks-input-files.xcfilelist"
    end

    # @param  [Specification] spec
    #         The spec this embed frameworks script path is for.
    #
    # @return [Pathname] The absolute path of the embed frameworks script output file list for the given spec.
    #
    def embed_frameworks_script_output_files_path_for_spec(spec)
      support_files_dir + "#{spec_label(spec)}-frameworks-output-files.xcfilelist"
    end

    # @return [Pathname] The absolute path of the copy xcframeworks script.
    #
    def copy_xcframeworks_script_path
      support_files_dir + "#{label}-xcframeworks.sh"
    end

    # @return [String] The path of the copy xcframeworks input files file list
    #
    def copy_xcframeworks_script_input_files_path
      support_files_dir + "#{label}-xcframeworks-input-files.xcfilelist"
    end

    # @return [String] The path of the copy xcframeworks output files file list
    #
    def copy_xcframeworks_script_output_files_path
      support_files_dir + "#{label}-xcframeworks-output-files.xcfilelist"
    end

    # @param  [Specification] spec
    #         The spec this script path is for.
    #
    # @return [Pathname] The absolute path of the prepare artifacts script for the given spec.
    #
    # @deprecated
    #
    # @todo Remove in 2.0
    #
    def prepare_artifacts_script_path_for_spec(spec)
      support_files_dir + "#{spec_label(spec)}-artifacts.sh"
    end

    # @param  [Specification] spec
    #         The spec this script path is for.
    #
    # @return [Pathname] The absolute path of the prepare artifacts script input file list for the given spec.
    #
    # @deprecated
    #
    # @todo Remove in 2.0
    #
    def prepare_artifacts_script_input_files_path_for_spec(spec)
      support_files_dir + "#{spec_label(spec)}-artifacts-input-files.xcfilelist"
    end

    # @param  [Specification] spec
    #         The spec this script path is for.
    #
    # @return [Pathname] The absolute path of the prepare artifacts script output file list for the given spec.
    #
    # @deprecated
    #
    # @todo Remove in 2.0
    #
    def prepare_artifacts_script_output_files_path_for_spec(spec)
      support_files_dir + "#{spec_label(spec)}-artifacts-output-files.xcfilelist"
    end

    # @return [Pathname] The absolute path of the copy dSYMs script.
    #
    def copy_dsyms_script_path
      support_files_dir + "#{label}-copy-dsyms.sh"
    end

    # @return [Pathname] The absolute path of the copy dSYM script phase input file list.
    #
    def copy_dsyms_script_input_files_path
      support_files_dir + "#{label}-copy-dsyms-input-files.xcfilelist"
    end

    # @return [Pathname] The absolute path of the copy dSYM script phase output file list.
    #
    def copy_dsyms_script_output_files_path
      support_files_dir + "#{label}-copy-dsyms-output-files.xcfilelist"
    end

    # @param  [Specification] spec
    #         The spec this Info.plist path is for.
    #
    # @return [Pathname] The absolute path of the Info.plist for the given spec.
    #
    def info_plist_path_for_spec(spec)
      support_files_dir + "#{spec_label(spec)}-Info.plist"
    end

    # @param  [Specification] spec
    #         The spec this prefix header path is for.
    #
    # @return [Pathname] the absolute path of the prefix header file for the given spec.
    #
    def prefix_header_path_for_spec(spec)
      support_files_dir + "#{spec_label(spec)}-prefix.pch"
    end

    # @return [Array<String>] The names of the Pods on which this target
    #         depends.
    #
    def dependencies
      spec_consumers.flat_map do |consumer|
        consumer.dependencies.map { |dep| Specification.root_name(dep.name) }
      end.uniq
    end

    # Returns all dependent targets of this target. If a configuration is passed then the list can be scoped to a given
    # configuration.
    #
    # @param [String] configuration
    #        The configuration to return the dependent targets for or `nil` if all configurations should be included.
    #
    # @return [Array<PodTarget>] the recursive targets that this target has a dependency upon.
    #
    def recursive_dependent_targets(configuration: nil)
      @recursive_dependent_targets ||= begin
        hash = Hash[config_variants.map do |config|
          [config, _add_recursive_dependent_targets(Set.new, :configuration => config).delete(self).to_a.freeze]
        end]
        hash[nil] = hash.each_value.reduce(Set.new, &:|).to_a
        hash
      end
      @recursive_dependent_targets.fetch(configuration) { raise ArgumentError, "No configuration #{configuration} for #{self}, known configurations are #{@recursive_dependent_targets.keys}" }
    end

    def _add_recursive_dependent_targets(set, configuration: nil)
      if defined?(@recursive_dependent_targets)
        return set.merge(@recursive_dependent_targets[configuration])
      end
      dependent_targets = configuration ? dependent_targets_by_config[configuration] : self.dependent_targets
      dependent_targets.each do |target|
        target._add_recursive_dependent_targets(set, :configuration => configuration) if set.add?(target)
      end

      set
    end
    protected :_add_recursive_dependent_targets

    # @param [Specification] test_spec
    #        the test spec to scope dependencies for
    #
    # @param [String] configuration
    #        the configuration to retrieve the test dependent targets for.
    #
    # @return [Array<PodTarget>] the recursive targets that this target has a
    #         test dependency upon.
    #
    def recursive_test_dependent_targets(test_spec, configuration: nil)
      @recursive_test_dependent_targets ||= {}
      @recursive_test_dependent_targets[test_spec] ||= begin
        hash = Hash[config_variants.map do |config|
          [config, _add_recursive_test_dependent_targets(test_spec, Set.new, :configuration => config).to_a.freeze]
        end]
        hash[nil] = hash.each_value.reduce(Set.new, &:|).to_a.freeze
        hash
      end
      @recursive_test_dependent_targets[test_spec][configuration]
    end

    def _add_recursive_test_dependent_targets(test_spec, set, configuration: nil)
      raise ArgumentError, 'Must give a test spec' unless test_spec
      dependent_targets = configuration ? test_dependent_targets_by_spec_name_by_config[test_spec.name][configuration] : test_dependent_targets_by_spec_name[test_spec.name]
      raise ArgumentError, "Unable to find deps for #{test_spec} for config #{configuration.inspect} (out of #{test_dependent_targets_by_spec_name_by_config.inspect})" unless dependent_targets

      dependent_targets.each do |target|
        target._add_recursive_dependent_targets(set, :configuration => configuration) if set.add?(target)
      end

      set
    end
    private :_add_recursive_test_dependent_targets

    # @param [Specification] test_spec
    #        the test spec to scope dependencies for
    #
    # @param [String] configuration
    #        the configuration to retrieve the test dependent targets for.
    #
    # @return [Array<PodTarget>] the canonical list of dependent targets this target has a dependency upon.
    #         This list includes the target itself as well as its recursive dependent and test dependent targets.
    #
    def dependent_targets_for_test_spec(test_spec, configuration: nil)
      [self, *recursive_dependent_targets(:configuration => configuration), *recursive_test_dependent_targets(test_spec, :configuration => configuration)].uniq
    end

    # @param [Specification] app_spec
    #        the app spec to scope dependencies for
    #
    # @param [String] configuration
    #        the configuration to retrieve the app dependent targets for.
    #
    # @return [Array<PodTarget>] the recursive targets that this target has a
    #         app dependency upon.
    #
    def recursive_app_dependent_targets(app_spec, configuration: nil)
      @recursive_app_dependent_targets ||= {}
      @recursive_app_dependent_targets[app_spec] ||= begin
        hash = Hash[config_variants.map do |config|
          [config, _add_recursive_app_dependent_targets(app_spec, Set.new, :configuration => config).to_a.freeze]
        end]
        hash[nil] = hash.each_value.reduce(Set.new, &:|).to_a.freeze
        hash
      end
      @recursive_app_dependent_targets[app_spec][configuration]
    end

    def _add_recursive_app_dependent_targets(app_spec, set, configuration: nil)
      raise ArgumentError, 'Must give a app spec' unless app_spec
      dependent_targets = configuration ? app_dependent_targets_by_spec_name_by_config[app_spec.name][configuration] : app_dependent_targets_by_spec_name[app_spec.name]
      raise ArgumentError, "Unable to find deps for #{app_spec} for config #{configuration.inspect} #{app_dependent_targets_by_spec_name_by_config.inspect}" unless dependent_targets

      dependent_targets.each do |target|
        target._add_recursive_dependent_targets(set, :configuration => configuration) if set.add?(target)
      end

      set
    end
    private :_add_recursive_app_dependent_targets

    # @param [Specification] app_spec
    #        the app spec to scope dependencies for
    #
    # @param [String] configuration
    #        the configuration to retrieve the app dependent targets for.
    #
    # @return [Array<PodTarget>] the canonical list of dependent targets this target has a dependency upon.
    #         This list includes the target itself as well as its recursive dependent and app dependent targets.
    #
    def dependent_targets_for_app_spec(app_spec, configuration: nil)
      [self, *recursive_dependent_targets(:configuration => configuration), *recursive_app_dependent_targets(app_spec, :configuration => configuration)].uniq
    end

    # Checks if warnings should be inhibited for this pod.
    #
    # @return [Boolean]
    #
    def inhibit_warnings?
      return @inhibit_warnings if defined? @inhibit_warnings
      whitelists = target_definitions.map do |target_definition|
        target_definition.inhibits_warnings_for_pod?(root_spec.name)
      end.uniq

      if whitelists.empty?
        @inhibit_warnings = false
        false
      elsif whitelists.count == 1
        @inhibit_warnings = whitelists.first
        whitelists.first
      else
        UI.warn "The pod `#{pod_name}` is linked to different targets " \
          "(#{target_definitions.map { |td| "`#{td.name}`" }.to_sentence}), which contain different " \
          'settings to inhibit warnings. CocoaPods does not currently ' \
          'support different settings and will fall back to your preference ' \
          'set in the root target definition.'
        @inhibit_warnings = podfile.root_target_definitions.first.inhibits_warnings_for_pod?(root_spec.name)
      end
    end

    # @param  [String] dir
    #         The directory (which might be a variable) relative to which
    #         the returned path should be. This must be used if the
    #         $CONFIGURATION_BUILD_DIR is modified.
    #
    # @return [String] The absolute path to the configuration build dir
    #
    def configuration_build_dir(dir = BuildSettings::CONFIGURATION_BUILD_DIR_VARIABLE)
      "#{dir}/#{label}"
    end

    # @param  [String] dir
    #         @see #configuration_build_dir
    #
    # @return [String] The absolute path to the build product
    #
    def build_product_path(dir = BuildSettings::CONFIGURATION_BUILD_DIR_VARIABLE)
      "#{configuration_build_dir(dir)}/#{product_name}"
    end

    # @return [String] The source path of the root for this target relative to `$(PODS_ROOT)`
    #
    def pod_target_srcroot
      "${PODS_ROOT}/#{sandbox.pod_dir(pod_name).relative_path_from(sandbox.root)}"
    end

    # @return [String] The version associated with this target
    #
    def version
      version = root_spec.version
      [version.major, version.minor, version.patch].join('.')
    end

    # @param [Boolean] include_dependent_targets_for_test_spec
    #        whether to include header search paths for test dependent targets
    #
    # @param [Boolean] include_dependent_targets_for_app_spec
    #        whether to include header search paths for app dependent targets
    #
    # @param [Boolean] include_private_headers
    #        whether to include header search paths for private headers of this
    #        target
    #
    # @param [String] configuration
    #        the configuration to return header search paths for or `nil` for all configurations.
    #
    # @return [Array<String>] The set of header search paths this target uses.
    #
    def header_search_paths(include_dependent_targets_for_test_spec: nil, include_dependent_targets_for_app_spec: nil,
                            include_private_headers: true, configuration: nil)
      header_search_paths = []
      header_search_paths.concat(build_headers.search_paths(platform, nil, false)) if include_private_headers
      header_search_paths.concat(sandbox.public_headers.search_paths(platform, pod_name, uses_modular_headers?))
      dependent_targets = recursive_dependent_targets(:configuration => configuration)
      if include_dependent_targets_for_test_spec
        dependent_targets += recursive_test_dependent_targets(include_dependent_targets_for_test_spec, :configuration => configuration)
      end
      if include_dependent_targets_for_app_spec
        dependent_targets += recursive_app_dependent_targets(include_dependent_targets_for_app_spec, :configuration => configuration)
      end
      dependent_targets.uniq.each do |dependent_target|
        header_search_paths.concat(sandbox.public_headers.search_paths(platform, dependent_target.pod_name, defines_module? && dependent_target.uses_modular_headers?(false)))
      end
      header_search_paths.uniq
    end

    # @param [Specification] spec the specification to return build settings for.
    #
    # @param [String] configuration the configuration to scope the build settings.
    #
    # @return [BuildSettings::PodTargetSettings] The build settings for the given spec
    #
    def build_settings_for_spec(spec, configuration: nil)
      raise ArgumentError, 'Must give configuration' unless configuration
      configuration = user_build_configurations[configuration] if user_build_configurations.key?(configuration)
      build_settings_by_config_for_spec(spec)[configuration] || raise(ArgumentError, "No build settings for #{spec} (configuration #{configuration.inspect}) (known configurations #{config_variants})")
    end

    def build_settings_by_config_for_spec(spec)
      case spec.spec_type
      when :test then test_spec_build_settings_by_config[spec.name]
      when :app  then app_spec_build_settings_by_config[spec.name]
      else            build_settings
      end || raise(ArgumentError, "No build settings for #{spec}")
    end

    def user_config_names_by_config_type
      user_build_configurations.each_with_object({}) do |(user, type), hash|
        hash[type] ||= []
        hash[type] << user
      end.each_value(&:freeze).freeze
    end

    protected

    # Returns whether the pod target should use modular headers.
    #
    # @param  [Boolean] only_if_defines_modules
    #         whether the use of modular headers should require the target to define a module
    #
    # @note  This must return false when a pod has a `header_mappings_dir` or `header_dir`,
    #        as that allows the spec to customize the header structure, and
    #        therefore it might not be expecting the module name to be prepended
    #        to imports at all.
    #
    def uses_modular_headers?(only_if_defines_modules = true)
      return false if only_if_defines_modules && !defines_module?
      return @uses_modular_headers if defined? @uses_modular_headers
      @uses_modular_headers = spec_consumers.none?(&:header_mappings_dir) && spec_consumers.none?(&:header_dir)
    end

    private

    def config_variants
      if user_build_configurations.empty?
        %i(debug release)
      else
        user_build_configurations.values.uniq
      end
    end

    def create_build_settings
      Hash[config_variants.map do |config|
        [config, BuildSettings::PodTargetSettings.new(self, nil, :configuration => config)]
      end]
    end

    def create_test_build_settings_by_config
      Hash[test_specs.map do |test_spec|
        [test_spec.name, Hash[config_variants.map do |config|
          [config, BuildSettings::PodTargetSettings.new(self, test_spec, :configuration => config)]
        end]]
      end]
    end

    def create_app_build_settings_by_config
      Hash[app_specs.map do |app_spec|
        [app_spec.name, Hash[config_variants.map do |config|
          [config, BuildSettings::PodTargetSettings.new(self, app_spec, :configuration => config)]
        end]]
      end]
    end

    # Computes the destination sub-directory in the sandbox
    #
    # @param  [Sandbox::FileAccessor] file_accessor
    #         The consumer file accessor for which the headers need to be
    #         linked.
    #
    # @param  [Array<Pathname>] headers
    #         The absolute paths of the headers which need to be mapped.
    #
    # @return [Hash{Pathname => Array<Pathname>}] A hash containing the
    #         headers folders as the keys and the absolute paths of the
    #         header files as the values.
    #
    def header_mappings(file_accessor, headers)
      consumer = file_accessor.spec_consumer
      header_mappings_dir = consumer.header_mappings_dir
      dir = headers_sandbox
      dir += consumer.header_dir if consumer.header_dir

      mappings = {}
      headers.each do |header|
        next if header.to_s.include?('.framework/')

        sub_dir = dir
        if header_mappings_dir
          relative_path = header.relative_path_from(file_accessor.path_list.root + header_mappings_dir)
          sub_dir += relative_path.dirname
        end
        mappings[sub_dir] ||= []
        mappings[sub_dir] << header
      end
      mappings
    end

    # @!group Deprecated APIs
    # ----------------------------------------------------------------------- #

    public

    # @deprecated Use `test_app_hosts_by_spec` instead.
    #
    # @todo Remove in 2.0
    #
    # @return [Hash{String => (Specification,PodTarget)}] tuples of app specs and pod targets by test spec name.
    #
    def test_app_hosts_by_spec_name
      Hash[test_app_hosts_by_spec.map do |spec, value|
        [spec.name, value]
      end]
    end
  end
end
