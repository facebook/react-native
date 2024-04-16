require 'cocoapods/podfile'

module Pod
  class Installer
    # Analyzes the Podfile, the Lockfile, and the sandbox manifest to generate
    # the information relative to a CocoaPods installation.
    #
    class Analyzer
      include Config::Mixin

      autoload :AnalysisResult,            'cocoapods/installer/analyzer/analysis_result'
      autoload :LockingDependencyAnalyzer, 'cocoapods/installer/analyzer/locking_dependency_analyzer'
      autoload :PodfileDependencyCache,    'cocoapods/installer/analyzer/podfile_dependency_cache'
      autoload :PodVariant,                'cocoapods/installer/analyzer/pod_variant'
      autoload :PodVariantSet,             'cocoapods/installer/analyzer/pod_variant_set'
      autoload :SandboxAnalyzer,           'cocoapods/installer/analyzer/sandbox_analyzer'
      autoload :SpecsState,                'cocoapods/installer/analyzer/specs_state'
      autoload :TargetInspectionResult,    'cocoapods/installer/analyzer/target_inspection_result'
      autoload :TargetInspector,           'cocoapods/installer/analyzer/target_inspector'

      # @return [String] The version of iOS which requires binaries with only 64-bit architectures
      #
      IOS_64_BIT_ONLY_VERSION = Version.new('11.0')

      # @return [Integer] The Xcode object version until which 64-bit architectures should be manually specified
      #
      # Xcode 10 will automatically select the correct architectures based on deployment target
      IOS_64_BIT_ONLY_PROJECT_VERSION = 50

      # @return [Sandbox] The sandbox to use for this analysis.
      #
      attr_reader :sandbox

      # @return [Podfile] The Podfile specification that contains the information of the Pods that should be installed.
      #
      attr_reader :podfile

      # @return [Lockfile, nil] The Lockfile, if available, that stores the information about the Pods previously installed.
      #
      attr_reader :lockfile

      # @return [Array<Source>] Sources provided by plugins or `nil`.
      #
      attr_reader :plugin_sources

      # @return [Boolean] Whether the analysis has dependencies and thus sources must be configured.
      #
      # @note   This is used by the `pod lib lint` command to prevent update of specs when not needed.
      #
      attr_reader :has_dependencies
      alias_method :has_dependencies?, :has_dependencies

      # @return [Hash, Boolean, nil] Pods that have been requested to be updated or true if all Pods should be updated.
      #         This can be false if no pods should be updated.
      #
      attr_reader :pods_to_update

      # @return [InstallationOptions] the installation options specified by the Podfile
      #
      attr_reader :installation_options

      # @return [Source::Manager] the sources manager to use when resolving dependencies
      #
      attr_reader :sources_manager

      # Initialize a new instance
      #
      # @param  [Sandbox] sandbox @see #sandbox
      # @param  [Podfile] podfile @see #podfile
      # @param  [Lockfile, nil] lockfile @see #lockfile
      # @param  [Array<Source>] plugin_sources @see #plugin_sources
      # @param  [Boolean] has_dependencies @see #has_dependencies
      # @param  [Hash, Boolean, nil] pods_to_update @see #pods_to_update
      # @param  [Source::Manager] sources_manager @see #sources_manager
      #
      def initialize(sandbox, podfile, lockfile = nil, plugin_sources = nil, has_dependencies = true,
                     pods_to_update = false, sources_manager = Source::Manager.new(config.repos_dir))
        @sandbox  = sandbox
        @podfile  = podfile
        @lockfile = lockfile
        @plugin_sources = plugin_sources
        @has_dependencies = has_dependencies
        @pods_to_update = pods_to_update
        @installation_options = podfile.installation_options
        @podfile_dependency_cache = PodfileDependencyCache.from_podfile(podfile)
        @sources_manager = sources_manager
        @path_lists = {}
        @result = nil
      end

      # Performs the analysis.
      #
      # The Podfile and the Lockfile provide the information necessary to
      # compute which specification should be installed. The manifest of the
      # sandbox returns which specifications are installed.
      #
      # @param  [Boolean] allow_fetches
      #         whether external sources may be fetched
      #
      # @return [AnalysisResult]
      #
      def analyze(allow_fetches = true)
        return @result if @result
        validate_podfile!
        validate_lockfile_version!
        if installation_options.integrate_targets?
          target_inspections = inspect_targets_to_integrate
        else
          verify_platforms_specified!
          target_inspections = {}
        end
        podfile_state = generate_podfile_state

        store_existing_checkout_options
        if allow_fetches == :outdated
          # special-cased -- we're only really resolving for outdated, rather than doing a full analysis
        elsif allow_fetches == true
          fetch_external_sources(podfile_state)
        elsif !dependencies_to_fetch(podfile_state).all?(&:local?)
          raise Informative, 'Cannot analyze without fetching dependencies since the sandbox is not up-to-date. Run `pod install` to ensure all dependencies have been fetched.' \
            "\n    The missing dependencies are:\n    \t#{dependencies_to_fetch(podfile_state).reject(&:local?).join("\n    \t")}"
        end

        locked_dependencies = generate_version_locking_dependencies(podfile_state)
        resolver_specs_by_target = resolve_dependencies(locked_dependencies)
        validate_platforms(resolver_specs_by_target)
        specifications = generate_specifications(resolver_specs_by_target)
        aggregate_targets, pod_targets = generate_targets(resolver_specs_by_target, target_inspections)
        sandbox_state = generate_sandbox_state(specifications)
        specs_by_target = resolver_specs_by_target.each_with_object({}) do |rspecs_by_target, hash|
          hash[rspecs_by_target[0]] = rspecs_by_target[1].map(&:spec)
        end
        specs_by_source = Hash[resolver_specs_by_target.values.flatten(1).group_by(&:source).map do |source, specs|
          [source, specs.map(&:spec).uniq]
        end]
        sources.each { |s| specs_by_source[s] ||= [] }
        @result = AnalysisResult.new(podfile_state, specs_by_target, specs_by_source, specifications, sandbox_state,
                                     aggregate_targets, pod_targets, @podfile_dependency_cache)
      end

      # Updates the git source repositories.
      #
      def update_repositories
        sources.each do |source|
          if source.updateable?
            sources_manager.update(source.name, true)
          else
            UI.message "Skipping `#{source.name}` update because the repository is not an updateable repository."
          end
        end
        @specs_updated = true
      end

      # Returns the sources used to query for specifications.
      #
      # When no explicit Podfile sources or plugin sources are defined, this defaults to the master spec repository.
      #
      # @return [Array<Source>] the sources to be used in finding specifications, as specified by the podfile or all
      #         sources.
      #
      def sources
        @sources ||= begin
          sources = podfile.sources
          plugin_sources = @plugin_sources || []

          # Add any sources specified using the :source flag on individual dependencies.
          dependency_sources = podfile_dependencies.map(&:podspec_repo).compact
          all_dependencies_have_sources = dependency_sources.count == podfile_dependencies.count

          if all_dependencies_have_sources
            sources = dependency_sources
          elsif has_dependencies? && sources.empty? && plugin_sources.empty?
            sources = [Pod::TrunkSource::TRUNK_REPO_URL] + dependency_sources
          else
            sources += dependency_sources
          end

          result = sources.uniq.map do |source_url|
            sources_manager.find_or_create_source_with_url(source_url)
          end
          unless plugin_sources.empty?
            result.insert(0, *plugin_sources)
            plugin_sources.each do |source|
              sources_manager.add_source(source)
            end
          end
          result
        end
      end

      #-----------------------------------------------------------------------#

      private

      # @!group Configuration

      # @return [Boolean] Whether the version of the dependencies which did not
      #         change in the Podfile should be locked.
      #
      def update_mode?
        pods_to_update != nil
      end

      # @return [Symbol] Whether and how the dependencies in the Podfile
      #                  should be updated.
      #
      def update_mode
        if !pods_to_update
          :none
        elsif pods_to_update == true
          :all
        elsif !pods_to_update[:pods].nil?
          :selected
        end
      end

      def podfile_dependencies
        @podfile_dependency_cache.podfile_dependencies
      end

      #-----------------------------------------------------------------------#

      def validate_podfile!
        validator = Installer::PodfileValidator.new(podfile, @podfile_dependency_cache)
        validator.validate

        unless validator.valid?
          raise Informative, validator.message
        end
        validator.warnings.uniq.each { |w| UI.warn(w) }
      end

      # @!group Analysis steps

      # @note   The warning about the version of the Lockfile doesn't use the
      #         `UI.warn` method because it prints the output only at the end
      #         of the installation. At that time CocoaPods could have crashed.
      #
      def validate_lockfile_version!
        if lockfile && lockfile.cocoapods_version > Version.new(VERSION)
          STDERR.puts '[!] The version of CocoaPods used to generate ' \
            "the lockfile (#{lockfile.cocoapods_version}) is "\
            "higher than the version of the current executable (#{VERSION}). " \
            'Incompatibility issues may arise.'.yellow
        end
      end

      # Compares the {Podfile} with the {Lockfile} in order to detect which
      # dependencies should be locked.
      #
      # @return [SpecsState] the states of the Podfile specs.
      #
      # @note   As the target definitions share the same sandbox they should have
      #         the same version of a Pod. For this reason this method returns
      #         the name of the Pod (root name of the dependencies) and doesn't
      #         group them by target definition.
      #
      # @return [SpecState]
      #
      def generate_podfile_state
        if lockfile
          pods_state = nil
          UI.section 'Finding Podfile changes' do
            pods_by_state = lockfile.detect_changes_with_podfile(podfile)
            pods_state = SpecsState.new(pods_by_state)
            pods_state.print if config.verbose?
          end
          pods_state
        else
          state = SpecsState.new
          state.added.merge(podfile_dependencies.map(&:root_name))
          state
        end
      end

      # Copies the pod targets of any of the app embedded aggregate targets into
      # their potential host aggregate target, if that potential host aggregate target's
      # user_target hosts any of the app embedded aggregate targets' user_targets
      #
      # @param  [AggregateTarget] aggregate_target the aggregate target whose user_target
      #         might host one or more of the embedded aggregate targets' user_targets
      #
      # @param  [Array<AggregateTarget>] embedded_aggregate_targets the aggregate targets
      #         representing the embedded targets to be integrated
      #
      # @param  [Boolean] libraries_only if true, only library-type embedded
      #         targets are considered, otherwise, all other types are have
      #         their pods copied to their host targets as well (extensions, etc.)
      #
      # @return [Hash{String=>Array<PodTarget>}] the additional pod targets to include to the host
      #          keyed by their configuration.
      #
      def embedded_target_pod_targets_by_host(aggregate_target, embedded_aggregate_targets, libraries_only)
        return {} if aggregate_target.requires_host_target?
        aggregate_user_target_uuids = Set.new(aggregate_target.user_targets.map(&:uuid))
        embedded_pod_targets_by_build_config = Hash.new([].freeze)
        embedded_aggregate_targets.each do |embedded_aggregate_target|
          # Skip non libraries in library-only mode
          next if libraries_only && !embedded_aggregate_target.library?
          next if aggregate_target.search_paths_aggregate_targets.include?(embedded_aggregate_target)
          next unless embedded_aggregate_target.user_targets.any? do |embedded_user_target|
            # You have to ask the host target's project for the host targets of
            # the embedded target, as opposed to asking user_project for the
            # embedded targets of the host target. The latter doesn't work when
            # the embedded target lives in a sub-project. The lines below get
            # the host target uuids for the embedded target and checks to see if
            # those match to any of the user_target uuids in the aggregate_target.
            host_target_uuids = Set.new(aggregate_target.user_project.host_targets_for_embedded_target(embedded_user_target).map(&:uuid))
            !aggregate_user_target_uuids.intersection(host_target_uuids).empty?
          end
          embedded_aggregate_target.user_build_configurations.each_key do |configuration_name|
            pod_target_names = Set.new(aggregate_target.pod_targets_for_build_configuration(configuration_name).map(&:name))
            embedded_pod_targets = embedded_aggregate_target.pod_targets_for_build_configuration(configuration_name).select do |pod_target|
              if !pod_target_names.include?(pod_target.name) &&
                 aggregate_target.pod_targets.none? { |aggregate_pod_target| (pod_target.specs - aggregate_pod_target.specs).empty? } &&
                 (libraries_only || pod_target.build_as_dynamic?)
                pod_target.name
              end
            end
            embedded_pod_targets_by_build_config[configuration_name] += embedded_pod_targets
          end
        end
        embedded_pod_targets_by_build_config
      end

      # Raises an error if there are embedded targets in the Podfile, but
      # their host targets have not been declared in the Podfile. As it
      # finds host targets, it collection information on host target types.
      #
      # @param  [Array<AggregateTarget>] aggregate_targets the generated
      #         aggregate targets
      #
      # @param  [Array<AggregateTarget>] embedded_aggregate_targets the aggregate targets
      #         representing the embedded targets to be integrated
      #
      def analyze_host_targets_in_podfile(aggregate_targets, embedded_aggregate_targets)
        target_definitions_by_uuid = {}
        cli_host_with_dynamic_linkage = []
        cli_product_type = 'com.apple.product-type.tool'
        # Collect aggregate target definitions by uuid to later lookup host target
        # definitions and verify their compatibility with their embedded targets
        aggregate_targets.each do |target|
          target.user_targets.each do |user_target|
            target_definition = target.target_definition
            target_definitions_by_uuid[user_target.uuid] = target_definition
            if user_target.product_type == cli_product_type && target_definition.build_type.linkage == :dynamic
              cli_host_with_dynamic_linkage << user_target
            end
          end
        end
        aggregate_target_user_projects = aggregate_targets.map(&:user_project)
        embedded_targets_missing_hosts = []
        host_uuid_to_embedded_target_definitions = {}
        # Search all of the known user projects for each embedded target's hosts
        embedded_aggregate_targets.each do |target|
          host_uuids = aggregate_target_user_projects.product(target.user_targets).flat_map do |user_project, user_target|
            user_project.host_targets_for_embedded_target(user_target).map(&:uuid)
          end
          # For each host, keep track of its embedded target definitions
          # to later verify each embedded target's compatiblity with its host,
          # ignoring the hosts that aren't known to CocoaPods (no target
          # definitions in the Podfile)
          host_uuids.each do |uuid|
            (host_uuid_to_embedded_target_definitions[uuid] ||= []) << target.target_definition if target_definitions_by_uuid.key? uuid
          end
          # If none of the hosts are known to CocoaPods (no target definitions
          # in the Podfile), add it to the list of targets missing hosts
          embedded_targets_missing_hosts << target unless host_uuids.any? do |uuid|
            target_definitions_by_uuid.key? uuid
          end
        end

        unless cli_host_with_dynamic_linkage.empty?
          UI.warn "The Podfile contains command line tool target(s) (#{cli_host_with_dynamic_linkage.map(&:name).to_sentence}) which are attempting to integrate dynamic frameworks or libraries." \
            "\n" \
            'This may not behave as expected, because command line tools are usually distributed as a single binary and cannot contain their own dynamic dependencies.'
        end

        unless embedded_targets_missing_hosts.empty?
          embedded_targets_missing_hosts_product_types = Set.new embedded_targets_missing_hosts.flat_map(&:user_targets).map(&:symbol_type)
          target_names = embedded_targets_missing_hosts.map do |target|
            target.name.sub('Pods-', '') # Make the target names more recognizable to the user
          end.join ', '
          #  If the targets missing hosts are only frameworks, then this is likely
          #  a project for doing framework development. In that case, just warn that
          #  the frameworks that these targets depend on won't be integrated anywhere
          if embedded_targets_missing_hosts_product_types.subset?(Set.new([:framework, :static_library]))
            UI.warn "The Podfile contains framework or static library targets (#{target_names}), for which the Podfile does not contain host targets (targets which embed the framework)." \
              "\n" \
              'If this project is for doing framework development, you can ignore this message. Otherwise, add a target to the Podfile that embeds these frameworks to make this message go away (e.g. a test target).'
          else
            raise Informative, "Unable to find host target(s) for #{target_names}. Please add the host targets for the embedded targets to the Podfile." \
                                "\n" \
                                'Certain kinds of targets require a host target. A host target is a "parent" target which embeds a "child" target. These are example types of targets that need a host target:' \
                                "\n- Framework" \
                                "\n- App Extension" \
                                "\n- Watch OS 1 Extension" \
                                "\n- Messages Extension (except when used with a Messages Application)"
          end
        end

        target_mismatches = []
        host_uuid_to_embedded_target_definitions.each do |uuid, target_definitions|
          host_target_definition = target_definitions_by_uuid[uuid]
          target_definitions.each do |target_definition|
            unless host_target_definition.uses_frameworks? == target_definition.uses_frameworks?
              target_mismatches << "- #{host_target_definition.name} (#{host_target_definition.uses_frameworks?}) and #{target_definition.name} (#{target_definition.uses_frameworks?}) do not both set use_frameworks!."
            end
          end
        end

        unless target_mismatches.empty?
          heading = 'Unable to integrate the following embedded targets with their respective host targets (a host target is a "parent" target which embeds a "child" target like a framework or extension):'
          raise Informative, heading + "\n\n" + target_mismatches.sort.uniq.join("\n")
        end
      end

      # Creates the models that represent the targets generated by CocoaPods.
      #
      # @param  [Hash{TargetDefinition => Array<ResolvedSpecification>}] resolver_specs_by_target
      #         mapping of targets to resolved specs (containing information about test usage)
      #         aggregate targets
      #
      # @param  [Hash{TargetDefinition => TargetInspectionResult}] target_inspections
      #         the user target inspections used to construct the aggregate and pod targets.
      #
      # @return [(Array<AggregateTarget>, Array<PodTarget>)] the list of aggregate targets generated,
      #         and the list of pod targets generated.
      #
      def generate_targets(resolver_specs_by_target, target_inspections)
        resolver_specs_by_target = resolver_specs_by_target.reject { |td, _| td.abstract? && !td.platform }
        pod_targets = generate_pod_targets(resolver_specs_by_target, target_inspections)
        pod_targets_by_target_definition = group_pod_targets_by_target_definition(pod_targets, resolver_specs_by_target)
        aggregate_targets = resolver_specs_by_target.keys.reject(&:abstract?).map do |target_definition|
          generate_aggregate_target(target_definition, target_inspections, pod_targets_by_target_definition)
        end
        aggregate_targets.each do |target|
          search_paths_aggregate_targets = aggregate_targets.select do |aggregate_target|
            target.target_definition.targets_to_inherit_search_paths.include?(aggregate_target.target_definition)
          end
          target.search_paths_aggregate_targets.concat(search_paths_aggregate_targets).freeze
        end

        aggregate_targets.each do |aggregate_target|
          is_app_extension = !(aggregate_target.user_targets.map(&:symbol_type) &
              [:app_extension, :watch_extension, :watch2_extension, :tv_extension, :messages_extension]).empty?
          is_app_extension ||= aggregate_target.user_targets.any? do |user_target|
            user_target.common_resolved_build_setting('APPLICATION_EXTENSION_API_ONLY', :resolve_against_xcconfig => true) == 'YES'
          end
          if is_app_extension
            aggregate_target.mark_application_extension_api_only
            aggregate_target.pod_targets.each(&:mark_application_extension_api_only)
          end

          build_library_for_distribution = aggregate_target.user_targets.any? do |user_target|
            user_target.common_resolved_build_setting('BUILD_LIBRARY_FOR_DISTRIBUTION', :resolve_against_xcconfig => true) == 'YES'
          end
          if build_library_for_distribution
            aggregate_target.mark_build_library_for_distribution
            aggregate_target.pod_targets.each(&:mark_build_library_for_distribution)
          end
        end

        if installation_options.integrate_targets?
          # Copy embedded target pods that cannot have their pods embedded as frameworks to
          # their host targets, and ensure we properly link library pods to their host targets
          embedded_targets = aggregate_targets.select(&:requires_host_target?)
          analyze_host_targets_in_podfile(aggregate_targets, embedded_targets)

          use_frameworks_embedded_targets, non_use_frameworks_embedded_targets = embedded_targets.partition(&:build_as_framework?)
          aggregate_targets = aggregate_targets.map do |aggregate_target|
            # For targets that require dynamic frameworks, we always have to copy their pods to their
            # host targets because those frameworks will all be loaded from the host target's bundle
            embedded_pod_targets = embedded_target_pod_targets_by_host(aggregate_target, use_frameworks_embedded_targets, false)

            # For targets that don't require dynamic frameworks, we only have to consider library-type
            # targets because their host targets will still need to link their pods
            embedded_pod_targets.merge!(embedded_target_pod_targets_by_host(aggregate_target, non_use_frameworks_embedded_targets, true))

            next aggregate_target if embedded_pod_targets.empty?
            aggregate_target.merge_embedded_pod_targets(embedded_pod_targets)
          end
        end
        [aggregate_targets, pod_targets]
      end

      # Setup the aggregate target for a single user target
      #
      # @param  [TargetDefinition] target_definition
      #         the target definition for the user target.
      #
      # @param  [Hash{TargetDefinition => TargetInspectionResult}] target_inspections
      #         the user target inspections used to construct the aggregate and pod targets.
      #
      # @param  [Hash{TargetDefinition => Array<PodTarget>}] pod_targets_by_target_definition
      #         the pod targets grouped by target.
      #
      # @return [AggregateTarget]
      #
      def generate_aggregate_target(target_definition, target_inspections, pod_targets_by_target_definition)
        if installation_options.integrate_targets?
          target_inspection = target_inspections[target_definition]
          raise "missing inspection for #{target_definition.inspect}" unless target_inspection
          target_requires_64_bit = Analyzer.requires_64_bit_archs?(target_definition.platform, target_inspection.project.object_version)
          user_project = target_inspection.project
          client_root = target_inspection.client_root
          user_target_uuids = target_inspection.project_target_uuids
          user_build_configurations = target_inspection.build_configurations
          archs = target_requires_64_bit ? ['$(ARCHS_STANDARD_64_BIT)'] : target_inspection.archs
        else
          target_requires_64_bit = Analyzer.requires_64_bit_archs?(target_definition.platform, nil)
          user_project = nil
          client_root = config.installation_root.realpath
          user_target_uuids = []
          user_build_configurations = target_definition.build_configurations || Target::DEFAULT_BUILD_CONFIGURATIONS
          archs = target_requires_64_bit ? ['$(ARCHS_STANDARD_64_BIT)'] : []
        end
        platform = target_definition.platform
        build_configurations = user_build_configurations.keys.concat(target_definition.all_whitelisted_configurations).uniq
        pod_targets_for_build_configuration = filter_pod_targets_for_target_definition(target_definition,
                                                                                       pod_targets_by_target_definition,
                                                                                       build_configurations)
        build_type = target_definition.uses_frameworks? ? BuildType.static_framework : BuildType.static_library
        AggregateTarget.new(sandbox, build_type, user_build_configurations, archs, platform, target_definition,
                            client_root, user_project, user_target_uuids, pod_targets_for_build_configuration)
      end

      # Returns a filtered list of pod targets that should or should not be part of the target definition. Pod targets
      # used by tests only are filtered.
      #
      # @return [Hash{TargetDefinition => Array<PodTarget>}]
      #
      def group_pod_targets_by_target_definition(pod_targets, resolver_specs_by_target)
        pod_targets_by_target_definition = Hash.new { |h, td| h[td] = [] }
        pod_targets.each do |pod_target|
          pod_target.target_definitions.each do |td|
            pod_targets_by_target_definition[td] << pod_target
          end
        end
        resolver_specs_by_target.each do |td, resolver_specs|
          specs_by_pod_name = resolver_specs.group_by { |s| s.root.name }
          specs_by_pod_name.reject! { |_, specs| specs.all?(&:used_by_non_library_targets_only?) }
          pod_targets_by_target_definition[td].keep_if { |pod_target| specs_by_pod_name.key?(pod_target.pod_name) }
        end

        pod_targets_by_target_definition
      end

      # Returns a filtered list of pod targets that should or should not be part of the target definition. Pod targets
      # used by tests only are filtered.
      #
      # @param [TargetDefinition] target_definition
      #        the target definition to use as the base for filtering
      #
      # @param  [Hash{TargetDefinition => Array<PodTarget>}] pod_targets_by_target_definition
      #         the pod targets grouped by target.
      #
      # @param  [Array<String>] build_configurations
      #         The list of all build configurations the targets will be built for.
      #
      # @return [Hash{String => Array<PodTarget>}]
      #         the filtered list of pod targets, grouped by build configuration.
      #
      def filter_pod_targets_for_target_definition(target_definition, pod_targets_by_target_definition,
                                                   build_configurations)
        pod_targets_by_build_config = Hash.new([].freeze)
        build_configurations.each { |config| pod_targets_by_build_config[config] = [] }

        dependencies_by_root_name = @podfile_dependency_cache.target_definition_dependencies(target_definition).group_by(&:root_name)

        pod_targets_by_target_definition[target_definition].each do |pod_target|
          pod_name = pod_target.pod_name
          dependencies = dependencies_by_root_name[pod_name] || []

          build_configurations.each do |configuration_name|
            whitelists = dependencies.map do |dependency|
              target_definition.pod_whitelisted_for_configuration?(dependency.name, configuration_name)
            end.uniq

            case whitelists
            when [], [true] then nil
            when [false] then next
            else
              raise Informative, "The subspecs of `#{pod_name}` are linked to " \
                "different build configurations for the `#{target_definition}` " \
                'target. CocoaPods does not currently support subspecs across ' \
                'different build configurations.'
            end

            pod_targets_by_build_config[configuration_name] << pod_target
          end
        end

        pod_targets_by_build_config
      end

      # Setup the pod targets for an aggregate target. Deduplicates resulting
      # targets by grouping by platform and subspec by their root
      # to create a {PodTarget} for each spec.
      #
      # @param  [Hash{TargetDefinition => Array<ResolvedSpecification>}] resolver_specs_by_target
      #         the resolved specifications grouped by target.
      #
      # @param  [Hash{TargetDefinition => TargetInspectionResult}] target_inspections
      #         the user target inspections used to construct the aggregate and pod targets.
      #
      # @return [Array<PodTarget>]
      #
      def generate_pod_targets(resolver_specs_by_target, target_inspections)
        if installation_options.deduplicate_targets?
          distinct_targets = resolver_specs_by_target.each_with_object({}) do |dependency, hash|
            target_definition, dependent_specs = *dependency
            dependent_specs.group_by(&:root).each do |root_spec, resolver_specs|
              all_specs = resolver_specs.map(&:spec)
              all_specs_by_type = all_specs.group_by(&:spec_type)
              library_specs = all_specs_by_type[:library] || []
              test_specs = all_specs_by_type[:test] || []
              app_specs = all_specs_by_type[:app] || []
              build_type = determine_build_type(root_spec, target_definition.build_type)
              pod_variant = PodVariant.new(library_specs, test_specs, app_specs, target_definition.platform, build_type)
              hash[root_spec] ||= {}
              (hash[root_spec][pod_variant] ||= []) << target_definition
              pod_variant_spec = hash[root_spec].keys.find { |k| k == pod_variant }
              pod_variant_spec.test_specs.concat(test_specs).uniq!
              pod_variant_spec.app_specs.concat(app_specs).uniq!
            end
          end

          # Remap pod variants to a new instance that includes the Swift version since we now have the full set
          # of target definitions.
          distinct_targets = Hash[distinct_targets.map do |root, target_definitions_by_variant|
            variants = Hash[target_definitions_by_variant.map do |variant, target_definitions|
              swift_version = determine_swift_version(variant.root_spec, target_definitions)
              [variant.scoped_with_swift_version(swift_version), target_definitions]
            end]
            [root, variants]
          end]

          pod_targets = distinct_targets.flat_map do |_root, target_definitions_by_variant|
            target_definitions_by_variant.each_value do |target_definitions|
              target_definitions.reject!(&:abstract?) unless target_definitions.all?(&:abstract?)
            end
            suffixes = PodVariantSet.new(target_definitions_by_variant.keys).scope_suffixes
            target_definitions_by_variant.map do |variant, target_definitions|
              all_specs = variant.specs + variant.test_specs + variant.app_specs
              generate_pod_target(target_definitions, variant.build_type, target_inspections, all_specs,
                                  :scope_suffix => suffixes[variant], :swift_version => variant.swift_version)
            end
          end

          all_specs = resolver_specs_by_target.values.flatten.map(&:spec).uniq.group_by(&:name)
          compute_pod_target_dependencies(pod_targets, all_specs)
        else
          dedupe_cache = {}
          resolver_specs_by_target.flat_map do |target_definition, specs|
            grouped_specs = specs.group_by(&:root).values.uniq
            pod_targets = grouped_specs.flat_map do |pod_specs|
              build_type = determine_build_type(pod_specs.first.spec, target_definition.build_type)
              swift_version = determine_swift_version(pod_specs.first.spec, [target_definition])
              generate_pod_target([target_definition], build_type, target_inspections, pod_specs.map(&:spec),
                                  :swift_version => swift_version).scoped(dedupe_cache)
            end

            compute_pod_target_dependencies(pod_targets, specs.map(&:spec).group_by(&:name))
          end
        end
      end

      # Compute the dependencies for the set of pod targets.
      #
      # @param  [Array<PodTarget>] pod_targets
      #         pod targets.
      #
      # @param  [Hash{String => Array<Specification>}] all_specs
      #         specifications grouped by name.
      #
      # @return [Array<PodTarget>]
      #
      def compute_pod_target_dependencies(pod_targets, all_specs)
        pod_targets_by_name = pod_targets.group_by(&:pod_name).each_with_object({}) do |(name, values), hash|
          # Sort the target by the number of activated subspecs, so that
          # we prefer a minimal target as transitive dependency.
          hash[name] = values.sort_by { |pt| pt.specs.count }
        end

        pod_targets.each do |target|
          dependencies_by_config = dependencies_for_specs(target.library_specs, target.platform, all_specs)
          target.dependent_targets_by_config = Hash[dependencies_by_config.map { |k, v| [k, filter_dependencies(v, pod_targets_by_name, target)] }]

          target.test_dependent_targets_by_spec_name_by_config = target.test_specs.each_with_object({}) do |test_spec, hash|
            test_dependencies_by_config = dependencies_for_specs([test_spec], target.platform, all_specs)
            test_dependencies_by_config.each { |config, deps| deps.delete_if { |k, _| dependencies_by_config[config].key? k } }
            hash[test_spec.name] = Hash[test_dependencies_by_config.map { |k, v| [k, filter_dependencies(v, pod_targets_by_name, target)] }]
          end

          target.app_dependent_targets_by_spec_name_by_config = target.app_specs.each_with_object({}) do |app_spec, hash|
            app_dependencies_by_config = dependencies_for_specs([app_spec], target.platform, all_specs)
            app_dependencies_by_config.each { |config, deps| deps.delete_if { |k, _| dependencies_by_config[config].key? k } }
            hash[app_spec.name] = Hash[app_dependencies_by_config.map { |k, v| [k, filter_dependencies(v, pod_targets_by_name, target)] }]
          end

          target.test_app_hosts_by_spec = target.test_specs.each_with_object({}) do |test_spec, hash|
            next unless app_host_name = test_spec.consumer(target.platform).app_host_name
            app_host_spec = pod_targets_by_name[Specification.root_name(app_host_name)].flat_map(&:app_specs).find do |pt|
              pt.name == app_host_name
            end
            app_host_dependencies = { app_host_spec.root => [app_host_spec] }
            hash[test_spec] = [app_host_spec, filter_dependencies(app_host_dependencies, pod_targets_by_name, target).first]
          end
        end
      end

      def filter_dependencies(dependencies, pod_targets_by_name, target)
        dependencies.map do |root_spec, deps|
          pod_targets_by_name[root_spec.name].find do |t|
            next false if t.platform.symbolic_name != target.platform.symbolic_name ||
              # In the case of variants we must ensure that the platform this target is meant for is the same
              # as the one we are interested in.
              t.target_definitions.first.platform != target.target_definitions.first.platform ||
              # rather than target type or requires_frameworks? since we want to group by what was specified in that
              # _target definition_.
              t.build_as_framework? != target.build_as_framework?
            spec_names = t.specs.map(&:name)
            deps.all? { |dep| spec_names.include?(dep.name) }
          end
        end
      end

      # Returns the specs upon which the given specs _directly_ depend.
      #
      # @note: This is implemented in the analyzer, because we don't have to
      #        care about the requirements after dependency resolution.
      #
      # @param  [Array<Specification>] specs
      #         The specs, whose dependencies should be returned.
      #
      # @param  [Platform] platform
      #         The platform for which the dependencies should be returned.
      #
      # @param  [Hash{String => Array<Specification>}] all_specs
      #         All specifications which are installed alongside.
      #
      # @return [Hash{Symbol => Set<Specification>}]
      #
      def dependencies_for_specs(specs, platform, all_specs)
        dependent_specs = {
          :debug => Set.new,
          :release => Set.new,
        }

        if !specs.empty? && !all_specs.empty?
          specs.each do |s|
            s.dependencies(platform).each do |dep|
              all_specs[dep.name].each do |spec|
                if spec.non_library_specification?
                  if s.test_specification? && spec.name == s.consumer(platform).app_host_name && spec.app_specification?
                    # This needs to be handled separately, since we _don't_ want to treat this as a "normal" dependency
                    next
                  end
                  raise Informative, "`#{s}` depends upon `#{spec}`, which is a `#{spec.spec_type}` spec."
                end

                dependent_specs.each do |config, set|
                  next unless s.dependency_whitelisted_for_configuration?(dep, config)
                  set << spec
                end
              end
            end
          end
        end

        Hash[dependent_specs.map { |k, v| [k, (v - specs).group_by(&:root)] }].freeze
      end

      # Create a target for each spec group
      #
      # @param  [Array<TargetDefinition>] target_definitions
      #         the target definitions of the pod target
      #
      # @param  [BuildType] build_type
      #         the BuildType to use for this pod target.
      #
      # @param  [Hash{TargetDefinition => TargetInspectionResult}] target_inspections
      #         the user target inspections used to construct the aggregate and pod targets.
      #
      # @param  [Array<Specification>] specs
      #         the specifications of an equal root.
      #
      # @param  [String] scope_suffix
      #         @see PodTarget#scope_suffix
      #
      # @param  [String] swift_version
      #         @see PodTarget#swift_version
      #
      # @return [PodTarget]
      #
      def generate_pod_target(target_definitions, build_type, target_inspections, specs, scope_suffix: nil,
                              swift_version: nil)
        target_inspections = target_inspections.select { |t, _| target_definitions.include?(t) }.values
        object_version = target_inspections.map { |ti| ti.project.object_version }.min
        target_requires_64_bit = target_definitions.all? { |td| Analyzer.requires_64_bit_archs?(td.platform, object_version) }
        if !target_inspections.empty?
          user_build_configurations = target_inspections.map(&:build_configurations).reduce({}, &:merge)
          archs = if target_requires_64_bit
                    ['$(ARCHS_STANDARD_64_BIT)']
                  else
                    target_inspections.flat_map(&:archs).compact.uniq.sort
                  end
        else
          user_build_configurations = Target::DEFAULT_BUILD_CONFIGURATIONS.merge(
            target_definitions.map { |td| td.build_configurations || {} }.reduce({}, &:merge),
          )
          archs = target_requires_64_bit ? ['$(ARCHS_STANDARD_64_BIT)'] : []
        end
        platform = determine_platform(specs, target_definitions, build_type)
        file_accessors = create_file_accessors(specs, platform)
        PodTarget.new(sandbox, build_type, user_build_configurations, archs, platform, specs, target_definitions,
                      file_accessors, scope_suffix, swift_version)
      end

      # Creates the file accessors for a given pod.
      #
      # @param [Array<Specification>] specs
      #        the specs to map each file accessor to.
      #
      # @param [Platform] platform
      #        the platform to use when generating each file accessor.
      #
      # @return [Array<FileAccessor>]
      #
      def create_file_accessors(specs, platform)
        name = specs.first.name
        pod_root = sandbox.pod_dir(name)
        path_list = @path_lists.fetch(pod_root) do |root|
          path_list = Sandbox::PathList.new(root)
          @path_lists[root] = path_list
        end
        specs.map do |spec|
          Sandbox::FileAccessor.new(path_list, spec.consumer(platform))
        end
      end

      # Calculates and returns the platform to use for the given list specs and target definitions.
      #
      # @note The platform is only determined by all library specs and ignores non library ones. Subspecs are always
      #       integrated in the same target as the root spec therefore the max deployment target is always returned
      #       across the specs passed.
      #
      # @param [Array<Specification>] specs
      #        the specs to inspect and calculate the platform for.
      #
      # @param [Array<TargetDefinition>] target_definitions
      #        the target definitions these specs are part of.
      #
      # @param [BuildType] build_type
      #        the #BuildType used for calculating the platform.
      #
      # @return [Platform]
      #
      def determine_platform(specs, target_definitions, build_type)
        library_specs = specs.select(&:library_specification?)
        platform_name = target_definitions.first.platform.name
        default = Podfile::TargetDefinition::PLATFORM_DEFAULTS[platform_name]
        deployment_target = library_specs.map do |library_spec|
          Version.new(library_spec.deployment_target(platform_name) || default)
        end.max
        if platform_name == :ios && build_type.framework?
          minimum = Version.new('8.0')
          deployment_target = [deployment_target, minimum].max
        end
        Platform.new(platform_name, deployment_target)
      end

      # Determines the Swift version for the given spec within a list of target definitions. If the pod author has
      # provided a set of Swift versions supported by their pod then the max Swift version is chosen, unless the target
      # definitions specify explicit requirements for supported Swift versions. Otherwise the Swift version is derived
      # by the target definitions that integrate this pod.
      #
      # @param [Specification] spec
      #        the specs to inspect and determine what Swift version to use.
      #
      # @param [Array<TargetDefinition>] target_definitions
      #        the target definitions the spec is part of.
      #
      # @return [String, nil] the computed Swift version or `nil` if the Swift version could not be determined.
      #
      def determine_swift_version(spec, target_definitions)
        if spec.swift_versions.empty?
          target_definitions.map(&:swift_version).compact.uniq.first
        else
          spec.swift_versions.sort.reverse_each.find do |swift_version|
            target_definitions.all? do |td|
              td.supports_swift_version?(swift_version)
            end
          end.to_s
        end
      end

      # Calculates and returns the #BuildType to use for the given spec. If the spec specifies `static_framework` then
      # it is honored as long as the host #BuildType also requires its pods to be integrated as frameworks.
      #
      # @param [Specification] spec
      #        the spec to determine the #BuildType for.
      #
      # @param [BuildType] target_definition_build_type
      #        The desired #BuildType by the target definition that integrates this target. If the pod target spec does
      #        not specify explicitly a `static_framework` #BuildType then the one from the target definition is used.
      #
      # @return [BuildType]
      #
      def determine_build_type(spec, target_definition_build_type)
        if target_definition_build_type.framework?
          root_spec = spec.root
          root_spec.static_framework ? BuildType.static_framework : target_definition_build_type
        else
          BuildType.static_library
        end
      end

      # Generates dependencies that require the specific version of the Pods
      # that haven't changed in the {Lockfile}.
      #
      # These dependencies are passed to the {Resolver}, unless the installer
      # is in update mode, to prevent it from upgrading the Pods that weren't
      # changed in the {Podfile}.
      #
      # @param [SpecState] podfile_state
      #        the state of the podfile for which dependencies have or have not changed, added, deleted or updated.
      #
      # @return [Molinillo::DependencyGraph<Dependency>] the dependencies
      #         generated by the lockfile that prevent the resolver to update
      #         a Pod.
      #
      def generate_version_locking_dependencies(podfile_state)
        if update_mode == :all || !lockfile
          LockingDependencyAnalyzer.unlocked_dependency_graph
        else
          deleted_and_changed = podfile_state.changed + podfile_state.deleted
          deleted_and_changed += pods_to_update[:pods] if update_mode == :selected
          local_pod_names = podfile_dependencies.select(&:local?).map(&:root_name)
          pods_to_unlock = local_pod_names.to_set.delete_if do |pod_name|
            next unless sandbox_specification = sandbox.specification(pod_name)
            sandbox_specification.checksum == lockfile.checksum(pod_name)
          end
          LockingDependencyAnalyzer.generate_version_locking_dependencies(lockfile, deleted_and_changed, pods_to_unlock)
        end
      end

      # Fetches the podspecs of external sources if modifications to the
      # sandbox are allowed.
      #
      # @note   In update mode all the external sources are refreshed while in
      #         normal mode they are refreshed only if added or changed in the
      #         Podfile. Moreover, in normal specifications for unchanged Pods
      #         which are missing or are generated from an local source are
      #         fetched as well.
      #
      # @note   It is possible to perform this step before the resolution
      #         process because external sources identify a single specific
      #         version (checkout). If the other dependencies are not
      #         compatible with the version reported by the podspec of the
      #         external source the resolver will raise.
      #
      # @param [SpecState] podfile_state
      #        the state of the podfile for which dependencies have or have not changed, added, deleted or updated.
      #
      # @return [void]
      #
      def fetch_external_sources(podfile_state)
        verify_no_pods_with_different_sources!
        deps = dependencies_to_fetch(podfile_state)
        pods = pods_to_fetch(podfile_state)
        return if deps.empty?
        UI.section 'Fetching external sources' do
          deps.sort.each do |dependency|
            fetch_external_source(dependency, !pods.include?(dependency.root_name))
          end
        end
      end

      def verify_no_pods_with_different_sources!
        deps_with_different_sources = podfile_dependencies.group_by(&:root_name).
          select { |_root_name, dependencies| dependencies.map(&:external_source).uniq.count > 1 }
        deps_with_different_sources.each do |root_name, dependencies|
          raise Informative, 'There are multiple dependencies with different ' \
          "sources for `#{root_name}` in #{UI.path podfile.defined_in_file}:" \
          "\n\n- #{dependencies.map(&:to_s).join("\n- ")}"
        end
      end

      def fetch_external_source(dependency, use_lockfile_options)
        source = if use_lockfile_options && lockfile && checkout_options = lockfile.checkout_options_for_pod_named(dependency.root_name)
                   ExternalSources.from_params(checkout_options, dependency, podfile.defined_in_file, installation_options.clean?)
                 else
                   ExternalSources.from_dependency(dependency, podfile.defined_in_file, installation_options.clean?)
                 end
        source.fetch(sandbox)
      end

      def dependencies_to_fetch(podfile_state)
        @deps_to_fetch ||= begin
          deps_to_fetch = []
          deps_with_external_source = podfile_dependencies.select(&:external_source)

          if update_mode == :all
            deps_to_fetch = deps_with_external_source
          else
            deps_to_fetch = deps_with_external_source.select { |dep| pods_to_fetch(podfile_state).include?(dep.root_name) }
            deps_to_fetch_if_needed = deps_with_external_source.select { |dep| podfile_state.unchanged.include?(dep.root_name) }
            deps_to_fetch += deps_to_fetch_if_needed.select do |dep|
              sandbox.specification_path(dep.root_name).nil? ||
                !dep.external_source[:path].nil? ||
                !sandbox.pod_dir(dep.root_name).directory? ||
                checkout_requires_update?(dep)
            end
          end
          deps_to_fetch.uniq(&:root_name)
        end
      end

      def checkout_requires_update?(dependency)
        return true unless lockfile && sandbox.manifest
        locked_checkout_options = lockfile.checkout_options_for_pod_named(dependency.root_name)
        sandbox_checkout_options = sandbox.manifest.checkout_options_for_pod_named(dependency.root_name)
        locked_checkout_options != sandbox_checkout_options
      end

      def pods_to_fetch(podfile_state)
        @pods_to_fetch ||= begin
          pods_to_fetch = podfile_state.added + podfile_state.changed
          if update_mode == :selected
            pods_to_fetch += pods_to_update[:pods]
          elsif update_mode == :all
            pods_to_fetch += podfile_state.unchanged + podfile_state.deleted
          end
          pods_to_fetch += podfile_dependencies.
            select { |dep| Hash(dep.external_source).key?(:podspec) && sandbox.specification_path(dep.root_name).nil? }.
            map(&:root_name)
          pods_to_fetch
        end
      end

      def store_existing_checkout_options
        return unless lockfile
        podfile_dependencies.select(&:external_source).each do |dep|
          if checkout_options = lockfile.checkout_options_for_pod_named(dep.root_name)
            sandbox.store_checkout_source(dep.root_name, checkout_options)
          end
        end
      end

      # Converts the Podfile in a list of specifications grouped by target.
      #
      # @note   As some dependencies might have external sources the resolver
      #         is aware of the {Sandbox} and interacts with it to download the
      #         podspecs of the external sources. This is necessary because the
      #         resolver needs their specifications to analyze their
      #         dependencies.
      #
      # @note   The specifications of the external sources which are added,
      #         modified or removed need to deleted from the sandbox before the
      #         resolution process. Otherwise the resolver might use an
      #         incorrect specification instead of pre-downloading it.
      #
      # @note   In update mode the resolver is set to always update the specs
      #         from external sources.
      #
      # @return [Hash{TargetDefinition => Array<Spec>}] the specifications
      #         grouped by target.
      #
      def resolve_dependencies(locked_dependencies)
        duplicate_dependencies = podfile_dependencies.group_by(&:name).
          select { |_name, dependencies| dependencies.count > 1 }
        duplicate_dependencies.each do |name, dependencies|
          UI.warn "There are duplicate dependencies on `#{name}` in #{UI.path podfile.defined_in_file}:\n\n" \
           "- #{dependencies.map(&:to_s).join("\n- ")}"
        end

        resolver_specs_by_target = nil
        UI.section "Resolving dependencies of #{UI.path(podfile.defined_in_file) || 'Podfile'}" do
          resolver = Pod::Resolver.new(sandbox, podfile, locked_dependencies, sources, @specs_updated, :sources_manager => sources_manager)
          resolver_specs_by_target = resolver.resolve
          resolver_specs_by_target.values.flatten(1).map(&:spec).each(&:validate_cocoapods_version)
        end
        resolver_specs_by_target
      end

      # Warns for any specification that is incompatible with its target.
      #
      # @param  [Hash{TargetDefinition => Array<Specification>}] resolver_specs_by_target
      #         the resolved specifications grouped by target.
      #
      def validate_platforms(resolver_specs_by_target)
        resolver_specs_by_target.each do |target, specs|
          specs.map(&:spec).each do |spec|
            next unless target_platform = target.platform
            unless spec.available_platforms.any? { |p| target_platform.supports?(p) }
              UI.warn "The platform of the target `#{target.name}` "     \
                "(#{target.platform}) may not be compatible with `#{spec}` which has "  \
                "a minimum requirement of #{spec.available_platforms.join(' - ')}."
            end
          end
        end
      end

      # Returns the list of all the resolved specifications.
      #
      # @param  [Hash{TargetDefinition => Array<Specification>}] resolver_specs_by_target
      #         the resolved specifications grouped by target.
      #
      # @return [Array<Specification>] the list of the specifications.
      #
      def generate_specifications(resolver_specs_by_target)
        resolver_specs_by_target.values.flatten.map(&:spec).uniq
      end

      # Computes the state of the sandbox respect to the resolved
      # specifications.
      #
      # @return [SpecsState] the representation of the state of the manifest
      #         specifications.
      #
      def generate_sandbox_state(specifications)
        sandbox_state = nil
        UI.section 'Comparing resolved specification to the sandbox manifest' do
          sandbox_analyzer = SandboxAnalyzer.new(sandbox, podfile, specifications, update_mode?)
          sandbox_state = sandbox_analyzer.analyze
          sandbox_state.print
        end
        sandbox_state
      end

      class << self
        # @param  [Platform] platform
        #         The platform to build against
        #
        # @param  [String, Nil] object_version
        #         The user project's object version, or nil if not available
        #
        # @return [Boolean] Whether the platform requires 64-bit architectures
        #
        def requires_64_bit_archs?(platform, object_version)
          return false unless platform
          case platform.name
          when :osx
            true
          when :ios
            if (version = object_version)
              platform.deployment_target >= IOS_64_BIT_ONLY_VERSION && version.to_i < IOS_64_BIT_ONLY_PROJECT_VERSION
            else
              platform.deployment_target >= IOS_64_BIT_ONLY_VERSION
            end
          when :watchos
            false
          when :tvos
            false
          end
        end
      end

      #-----------------------------------------------------------------------#

      # @!group Analysis sub-steps

      # Checks whether the platform is specified if not integrating
      #
      # @return [void]
      #
      def verify_platforms_specified!
        return if installation_options.integrate_targets?
        @podfile_dependency_cache.target_definition_list.each do |target_definition|
          if !target_definition.empty? && target_definition.platform.nil?
            raise Informative, 'It is necessary to specify the platform in the Podfile if not integrating.'
          end
        end
      end

      # Precompute information for each target_definition in the Podfile
      #
      # @note The platforms are computed and added to each target_definition
      #       because it might be necessary to infer the platform from the
      #       user targets.
      #
      # @return [Hash{TargetDefinition => TargetInspectionResult}]
      #
      def inspect_targets_to_integrate
        inspection_result = {}
        UI.section 'Inspecting targets to integrate' do
          inspectors = @podfile_dependency_cache.target_definition_list.map do |target_definition|
            next if target_definition.abstract?
            TargetInspector.new(target_definition, config.installation_root)
          end.compact
          inspectors.group_by(&:compute_project_path).each do |project_path, target_inspectors|
            project = Xcodeproj::Project.open(project_path)
            target_inspectors.each do |inspector|
              target_definition = inspector.target_definition
              results = inspector.compute_results(project)
              inspection_result[target_definition] = results
              UI.message('Using `ARCHS` setting to build architectures of ' \
                "target `#{target_definition.label}`: (`#{results.archs.join('`, `')}`)")
            end
          end
        end
        inspection_result
      end
    end
  end
end
