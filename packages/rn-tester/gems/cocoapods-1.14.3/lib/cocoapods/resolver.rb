require 'molinillo'
require 'cocoapods/podfile'

module Pod
  class NoSpecFoundError < Informative
    def exit_status
      @exit_status ||= 31
    end
  end

  # The resolver is responsible of generating a list of specifications grouped
  # by target for a given Podfile.
  #
  class Resolver
    require 'cocoapods/resolver/lazy_specification'
    require 'cocoapods/resolver/resolver_specification'

    # @return [Sandbox] the Sandbox used by the resolver to find external
    #         dependencies.
    #
    attr_reader :sandbox

    # @return [Podfile] the Podfile used by the resolver.
    #
    attr_reader :podfile

    # @return [Array<Dependency>] the list of dependencies locked to a specific
    #         version.
    #
    attr_reader :locked_dependencies

    # @return [Array<Source>] The list of the sources which will be used for
    #         the resolution.
    #
    attr_reader :sources

    # @return [Boolean] Whether the resolver has sources repositories up-to-date.
    #
    attr_reader :specs_updated
    alias specs_updated? specs_updated

    # @return [Source::Manager] the manager to use for dependency resolution
    #
    attr_reader :sources_manager

    # Init a new Resolver
    #
    # @param  [Sandbox] sandbox @see sandbox
    # @param  [Podfile] podfile @see podfile
    # @param  [Array<Dependency>] locked_dependencies @see locked_dependencies
    # @param  [Array<Source>, Source] sources @see sources
    # @param  [Boolean] specs_updated @see specs_updated
    # @param  [PodfileDependencyCache] podfile_dependency_cache the podfile dependency cache to use
    #         within this Resolver.
    #
    def initialize(sandbox, podfile, locked_dependencies, sources, specs_updated,
                   podfile_dependency_cache: Installer::Analyzer::PodfileDependencyCache.from_podfile(podfile),
                   sources_manager: Config.instance.sources_manager)
      @sandbox = sandbox
      @podfile = podfile
      @locked_dependencies = locked_dependencies
      @sources = Array(sources)
      @specs_updated = specs_updated
      @podfile_dependency_cache = podfile_dependency_cache
      @sources_manager = sources_manager
      @platforms_by_dependency = Hash.new { |h, k| h[k] = [] }

      @cached_sets = {}
      @podfile_requirements_by_root_name = @podfile_dependency_cache.podfile_dependencies.group_by(&:root_name).each_value { |a| a.map!(&:requirement).freeze }.freeze
      @search = {}
      @validated_platforms = Set.new
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Resolution

    # Identifies the specifications that should be installed.
    #
    # @return [Hash{TargetDefinition => Array<ResolverSpecification>}] resolver_specs_by_target
    #         the resolved specifications that need to be installed grouped by target
    #         definition.
    #
    def resolve
      dependencies = @podfile_dependency_cache.target_definition_list.flat_map do |target|
        @podfile_dependency_cache.target_definition_dependencies(target).each do |dep|
          next unless target.platform
          @platforms_by_dependency[dep].push(target.platform)
        end
      end.uniq
      @platforms_by_dependency.each_value(&:uniq!)
      @activated = Molinillo::Resolver.new(self, self).resolve(dependencies, locked_dependencies)
      resolver_specs_by_target
    rescue Molinillo::ResolverError => e
      handle_resolver_error(e)
    end

    # @return [Hash{Podfile::TargetDefinition => Array<ResolverSpecification>}]
    #         returns the resolved specifications grouped by target.
    #
    # @note   The returned specifications can be subspecs.
    #
    def resolver_specs_by_target
      @resolver_specs_by_target ||= {}.tap do |resolver_specs_by_target|
        @podfile_dependency_cache.target_definition_list.each do |target|
          next if target.abstract? && !target.platform

          # can't use vertex.root? since that considers _all_ targets
          explicit_dependencies = @podfile_dependency_cache.target_definition_dependencies(target).map(&:name).to_set

          used_by_aggregate_target_by_spec_name = {}
          used_vertices_by_spec_name = {}

          # it's safe to make a single pass here since we iterate in topological order,
          # so all of the predecessors have been visited before we get to a node.
          # #tsort returns no-children vertices first, and we want them last (i.e. we want no-parent vertices first)
          @activated.tsort.reverse_each do |vertex|
            spec_name = vertex.name
            explicitly_included = explicit_dependencies.include?(spec_name)
            if explicitly_included || vertex.incoming_edges.any? { |edge| used_vertices_by_spec_name.key?(edge.origin.name) && edge_is_valid_for_target_platform?(edge, target.platform) }
              validate_platform(vertex.payload, target)
              used_vertices_by_spec_name[spec_name] = vertex
              used_by_aggregate_target_by_spec_name[spec_name] = vertex.payload.library_specification? &&
                (explicitly_included || vertex.predecessors.any? { |predecessor| used_by_aggregate_target_by_spec_name.fetch(predecessor.name, false) })
            end
          end

          resolver_specs_by_target[target] = used_vertices_by_spec_name.each_value.
            map do |vertex|
              payload = vertex.payload
              non_library = !used_by_aggregate_target_by_spec_name.fetch(vertex.name)
              spec_source = payload.respond_to?(:spec_source) && payload.spec_source
              ResolverSpecification.new(payload, non_library, spec_source)
            end.
            sort_by(&:name)
        end
      end
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Specification Provider

    include Molinillo::SpecificationProvider

    # Returns (and caches) the specification that satisfy the given dependency.
    #
    # @return [Array<Specification>] the specifications that satisfy the given
    #   `dependency`.
    #
    # @param  [Dependency] dependency the dependency that is being searched for.
    #
    def search_for(dependency)
      @search[dependency] ||= begin
        additional_requirements = if locked_requirement = requirement_for_locked_pod_named(dependency.name)
                                    [locked_requirement]
                                  else
                                    Array(@podfile_requirements_by_root_name[dependency.root_name])
                                  end

        specifications_for_dependency(dependency, additional_requirements).freeze
      end
    end

    # Returns the dependencies of `specification`.
    #
    # @return [Array<Specification>] all dependencies of `specification`.
    #
    # @param  [Specification] specification the specification whose own
    #         dependencies are being asked for.
    #
    def dependencies_for(specification)
      root_name = Specification.root_name(specification.name)
      specification.all_dependencies.map do |dependency|
        if dependency.root_name == root_name
          dependency.dup.tap { |d| d.specific_version = specification.version }
        else
          dependency
        end
      end
    end

    # Returns the name for the given `dependency`.
    #
    # @return [String] the name for the given `dependency`.
    #
    # @param  [Dependency] dependency the dependency whose name is being
    #         queried.
    #
    def name_for(dependency)
      dependency.name
    end

    # @return [String] the user-facing name for a {Podfile}.
    #
    def name_for_explicit_dependency_source
      'Podfile'
    end

    # @return [String] the user-facing name for a {Lockfile}.
    #
    def name_for_locking_dependency_source
      'Podfile.lock'
    end

    # Determines whether the given `requirement` is satisfied by the given
    # `spec`, in the context of the current `activated` dependency graph.
    #
    # @return [Boolean] whether `requirement` is satisfied by `spec` in the
    #         context of the current `activated` dependency graph.
    #
    # @param  [Dependency] requirement the dependency in question.
    #
    # @param  [Molinillo::DependencyGraph] activated the current dependency
    #         graph in the resolution process.
    #
    # @param  [Specification] spec the specification in question.
    #
    def requirement_satisfied_by?(requirement, activated, spec)
      version = spec.version
      return false unless requirement.requirement.satisfied_by?(version)
      return false unless valid_possibility_version_for_root_name?(requirement, activated, spec)
      return false unless spec_is_platform_compatible?(activated, requirement, spec)
      true
    end

    def valid_possibility_version_for_root_name?(requirement, activated, spec)
      return true if prerelease_requirement = requirement.prerelease? || requirement.external_source || !spec.version.prerelease?

      activated.each do |vertex|
        next unless vertex.payload
        next unless Specification.root_name(vertex.name) == requirement.root_name

        prerelease_requirement ||= vertex.requirements.any? { |r| r.prerelease? || r.external_source }

        if vertex.payload.respond_to?(:version)
          return true if vertex.payload.version == spec.version
          break
        end
      end

      prerelease_requirement
    end
    private :valid_possibility_version_for_root_name?

    # Sort dependencies so that the ones that are easiest to resolve are first.
    # Easiest to resolve is (usually) defined by:
    #   1) Is this dependency already activated?
    #   2) How relaxed are the requirements?
    #   3) Are there any conflicts for this dependency?
    #   4) How many possibilities are there to satisfy this dependency?
    #
    # @return [Array<Dependency>] the sorted dependencies.
    #
    # @param  [Array<Dependency>] dependencies the unsorted dependencies.
    #
    # @param  [Molinillo::DependencyGraph] activated the dependency graph of
    #         currently activated specs.
    #
    # @param  [{String => Array<Conflict>}] conflicts the current conflicts.
    #
    def sort_dependencies(dependencies, activated, conflicts)
      dependencies.sort_by! do |dependency|
        name = name_for(dependency)
        [
          activated.vertex_named(name).payload ? 0 : 1,
          dependency.external_source ? 0 : 1,
          dependency.prerelease? ? 0 : 1,
          conflicts[name] ? 0 : 1,
          search_for(dependency).count,
        ]
      end
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Resolver UI

    include Molinillo::UI

    # The UI object the resolver should use for displaying user-facing output.
    #
    # @return [UserInterface] the normal CocoaPods UI object.
    #
    def output
      UI
    end

    # Called before resolution starts.
    #
    # Completely silence this, as we show nothing.
    #
    # @return [Void]
    #
    def before_resolution
    end

    # Called after resolution ends.
    #
    # Completely silence this, as we show nothing.
    #
    # @return [Void]
    #
    def after_resolution
    end

    # Called during resolution to indicate progress.
    #
    # Completely silence this, as we show nothing.
    #
    # @return [Void]
    #
    def indicate_progress
    end

    #-------------------------------------------------------------------------#

    private

    # !@ Resolution context

    # @return [Hash<String => Set>] A cache that keeps tracks of the sets
    #         loaded by the resolution process.
    #
    # @note   Sets store the resolved dependencies and return the highest
    #         available specification found in the sources. This is done
    #         globally and not per target definition because there can be just
    #         one Pod installation, so different version of the same Pods for
    #         target definitions are not allowed.
    #
    attr_reader :cached_sets

    #-------------------------------------------------------------------------#

    private

    # @!group Private helpers

    # Returns available specifications which satisfy requirements of given dependency
    # and additional requirements.
    #
    # @param [Dependency] dependency
    #        The dependency whose requirements will be satisfied.
    #
    # @param [Array<Requirement>] additional_requirements
    #        List of additional requirements which should also be satisfied.
    #
    # @return [Array<Specification>] List of specifications satisfying given requirements.
    #
    def specifications_for_dependency(dependency, additional_requirements = [])
      requirement_list = dependency.requirement.as_list + additional_requirements.flat_map(&:as_list)
      requirement_list.uniq!
      requirement = Requirement.new(requirement_list)
      find_cached_set(dependency).
        all_specifications(warn_for_multiple_pod_sources, requirement).
        map { |s| s.subspec_by_name(dependency.name, false, true) }.
        compact
    end

    # @return [Set] Loads or returns a previously initialized set for the Pod
    #               of the given dependency.
    #
    # @param  [Dependency] dependency
    #         The dependency for which the set is needed.
    #
    # @return [Set] the cached set for a given dependency.
    #
    def find_cached_set(dependency)
      name = dependency.root_name
      cached_sets[name] ||= begin
        if dependency.external_source
          spec = sandbox.specification(name)
          unless spec
            raise StandardError, '[Bug] Unable to find the specification ' \
              "for `#{dependency}`."
          end
          set = Specification::Set::External.new(spec)
        else
          set = create_set_from_sources(dependency)
        end

        unless set
          raise Molinillo::NoSuchDependencyError.new(dependency) # rubocop:disable Style/RaiseArgs
        end

        set
      end
    end

    # @return [Requirement, Nil]
    #         The {Requirement} that locks the dependency with name `name` in
    #         {#locked_dependencies}.
    #
    def requirement_for_locked_pod_named(name)
      if vertex = locked_dependencies.vertex_named(name)
        if dependency = vertex.payload
          dependency.requirement
        end
      end
    end

    # @return [Set] Creates a set for the Pod of the given dependency from the
    #         sources. The set will contain all versions from all sources that
    #         include the Pod.
    #
    # @param  [Dependency] dependency
    #         The dependency for which the set is needed.
    #
    def create_set_from_sources(dependency)
      aggregate_for_dependency(dependency).search(dependency)
    end

    # @return [Source::Aggregate] The aggregate of the {#sources}.
    #
    def aggregate_for_dependency(dependency)
      if dependency && dependency.podspec_repo
        sources_manager.aggregate_for_dependency(dependency)
      elsif (locked_vertex = @locked_dependencies.vertex_named(dependency.name)) && (locked_dependency = locked_vertex.payload) && locked_dependency.podspec_repo
        sources_manager.aggregate_for_dependency(locked_dependency)
      else
        @aggregate ||= Source::Aggregate.new(sources)
      end
    end

    # Ensures that a specification is compatible with the platform of a target.
    #
    # @raise  If the specification is not supported by the target.
    #
    # @return [void]
    #
    def validate_platform(spec, target)
      return unless target_platform = target.platform
      return unless @validated_platforms.add?([spec.object_id, target_platform])
      unless spec.available_platforms.any? { |p| target_platform.to_sym == p.to_sym }
        raise Informative, "The platform of the target `#{target.name}` "     \
          "(#{target.platform}) is not compatible with `#{spec}`, which does "  \
          "not support `#{target.platform.string_name}`."
      end
    end

    # Handles errors that come out of a {Molinillo::Resolver}.
    #
    # @return [void]
    #
    # @param  [Molinillo::ResolverError] error
    #
    def handle_resolver_error(error)
      message = error.message
      type = Informative
      unless specs_updated?
        specs_update_message = "\n * out-of-date source repos which you can update with `pod repo update` or with `pod install --repo-update`."
      end
      case error
      when Molinillo::VersionConflict
        message = error.message_with_trees(
          :solver_name => 'CocoaPods',
          :possibility_type => 'pod',
          :version_for_spec => lambda(&:version),
          :additional_message_for_conflict => lambda do |o, name, conflict|
            local_pod_parent = conflict.requirement_trees.flatten.reverse.find(&:local?)
            if local_pod_parent && !specifications_for_dependency(conflict.requirement).empty? && !conflict.possibility && conflict.locked_requirement
              # Conflict was caused by a requirement from a local dependency.
              # Tell user to use `pod update`.
              o << "\n\nYou have either:#{specs_update_message}" \
                   "\n * changed the constraints of dependency `#{name}` inside your development pod `#{local_pod_parent.name}`." \
                   "\n   You should run `pod update #{name}` to apply changes you've made."
            elsif !conflict.possibility && conflict.locked_requirement && conflict.locked_requirement.external_source && conflict.locked_requirement.external_source[:podspec] &&
                                           conflict.requirement && conflict.requirement.external_source && conflict.requirement.external_source[:podspec]
              # The internal version of the Podspec doesn't match the external definition of a podspec
              o << "\nIt seems like you've changed the version of the dependency `#{name}` " \
              "and it differs from the version stored in `Pods/Local Podspecs`.\nYou should run `pod update #{name} --no-repo-update` to apply " \
              'changes made locally.'
            elsif (conflict.possibility && conflict.possibility.version.prerelease?) &&
                (conflict.requirement && !(
                conflict.requirement.prerelease? ||
                conflict.requirement.external_source)
                )
              # Conflict was caused by not specifying an explicit version for the requirement #[name],
              # and there is no available stable version satisfying constraints for the requirement.
              o << "\nThere are only pre-release versions available satisfying the following requirements:\n"
              conflict.requirements.values.flatten.uniq.each do |r|
                unless search_for(r).empty?
                  o << "\n\t'#{name}', '#{r.requirement}'\n"
                end
              end
              o << "\nYou should explicitly specify the version in order to install a pre-release version"
            elsif !conflict.existing
              conflicts = conflict.requirements.values.flatten.uniq
              found_conflicted_specs = conflicts.reject { |c| search_for(c).empty? }
              if found_conflicted_specs.empty?
                # There are no existing specification inside any of the spec repos with given requirements.
                type = NoSpecFoundError
                dependencies = conflicts.count == 1 ? 'dependency' : 'dependencies'
                o << "\nNone of your spec sources contain a spec satisfying "\
                  "the #{dependencies}: `#{conflicts.join(', ')}`." \
                  "\n\nYou have either:#{specs_update_message}" \
                  "\n * mistyped the name or version." \
                  "\n * not added the source repo that hosts the Podspec to your Podfile."

              else
                o << "\nSpecs satisfying the `#{conflicts.join(', ')}` dependency were found, " \
                  'but they required a higher minimum deployment target.'
              end
            end
          end,
        )
      when Molinillo::NoSuchDependencyError
        message += <<-EOS


You have either:#{specs_update_message}
 * mistyped the name or version.
 * not added the source repo that hosts the Podspec to your Podfile.
        EOS
      end
      raise type.new(message).tap { |e| e.set_backtrace(error.backtrace) }
    end

    # Returns whether the given spec is platform-compatible with the dependency
    # graph, taking into account the dependency that has required the spec.
    #
    # @param  [Molinillo::DependencyGraph] dependency_graph
    #
    # @param  [Dependency] dependency
    #
    # @param  [Specification] spec
    #
    # @return [Boolean]
    #
    def spec_is_platform_compatible?(dependency_graph, dependency, spec)
      # This is safe since a pod will only be in locked dependencies if we're
      # using the same exact version
      return true if locked_dependencies.vertex_named(spec.name)

      vertex = dependency_graph.vertex_named(dependency.name)
      predecessors = vertex.recursive_predecessors.select(&:root?)
      predecessors << vertex if vertex.root?
      platforms_to_satisfy = predecessors.flat_map(&:explicit_requirements).flat_map { |r| @platforms_by_dependency[r] }.uniq

      available_platforms = spec.available_platforms

      platforms_to_satisfy.all? do |platform_to_satisfy|
        available_platforms.all? do |spec_platform|
          next true unless spec_platform.name == platform_to_satisfy.name
          # For non library specs all we care is to match by the platform name, not to satisfy the version.
          next true if spec.non_library_specification?
          platform_to_satisfy.supports?(spec_platform)
        end
      end
    end

    class EdgeAndPlatform
      def initialize(edge, target_platform)
        @edge = edge
        @target_platform = target_platform
      end
      attr_reader :edge, :target_platform

      def eql?(other)
        edge.equal?(other.edge) && target_platform.eql?(other.target_platform)
      end

      def hash
        edge.object_id ^ target_platform.hash
      end
    end
    private_constant :EdgeAndPlatform

    # Whether the given `edge` should be followed to find dependencies for the
    # given `target_platform`.
    #
    # @return [Boolean]
    #
    def edge_is_valid_for_target_platform?(edge, target_platform)
      @edge_validity ||= Hash.new do |hash, edge_and_platform|
        e = edge_and_platform.edge
        platform = edge_and_platform.target_platform
        requirement_name = e.requirement.name

        hash[edge_and_platform] = e.origin.payload.all_dependencies(platform).any? do |dep|
          dep.name == requirement_name
        end
      end

      @edge_validity[EdgeAndPlatform.new(edge, target_platform)]
    end

    # @return [Boolean] whether to emit a warning when a pod is found in multiple sources
    #
    def warn_for_multiple_pod_sources
      podfile.installation_options.warn_for_multiple_pod_sources
    end
  end
end
