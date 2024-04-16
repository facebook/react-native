module Pod
  class Installer
    class Analyzer
      # A simple container produced after a analysis is completed by the {Analyzer}.
      #
      class AnalysisResult
        # @return [SpecsState] the states of the Podfile specs.
        #
        attr_reader :podfile_state

        # @return [Hash{TargetDefinition => Array<Specification>}] the specifications grouped by target.
        #
        attr_reader :specs_by_target

        # @return [Hash{Source => Array<Specification>}] the specifications grouped by spec repo source.
        #
        attr_reader :specs_by_source

        # @return [Array<Specification>] the specifications of the resolved version of Pods that should be installed.
        #
        attr_reader :specifications

        # @return [SpecsState] the states of the {Sandbox} respect the resolved specifications.
        #
        attr_reader :sandbox_state

        # @return [Array<AggregateTarget>] The aggregate targets created for each {TargetDefinition} from the {Podfile}.
        #
        attr_reader :targets

        # @return [Array<PodTarget>] The pod targets created for all the aggregate targets.
        #
        attr_reader :pod_targets

        # @return [PodfileDependencyCache] the cache of all dependencies in the podfile.
        #
        attr_reader :podfile_dependency_cache

        def initialize(podfile_state, specs_by_target, specs_by_source, specifications, sandbox_state, targets, pod_targets,
                       podfile_dependency_cache)
          @podfile_state = podfile_state
          @specs_by_target = specs_by_target
          @specs_by_source = specs_by_source
          @specifications = specifications
          @sandbox_state = sandbox_state
          @targets = targets
          @pod_targets = pod_targets
          @podfile_dependency_cache = podfile_dependency_cache
        end

        # @return [Hash{String=>Symbol}] A hash representing all the user build
        #         configurations across all integration targets. Each key
        #         corresponds to the name of a configuration and its value to
        #         its type (`:debug` or `:release`).
        #
        def all_user_build_configurations
          targets.reduce({}) do |result, target|
            result.merge(target.user_build_configurations)
          end
        end

        # @return [Boolean] Whether an installation should be performed or this
        #         CocoaPods project is already up to date.
        #
        def needs_install?
          podfile_needs_install? || sandbox_needs_install?
        end

        # @return [Boolean] Whether the podfile has changes respect to the lockfile.
        #
        def podfile_needs_install?
          state = podfile_state
          needing_install = state.added.length + state.changed.length + state.deleted.length
          needing_install > 0
        end

        # @return [Boolean] Whether the sandbox is in synch with the lockfile.
        #
        def sandbox_needs_install?
          state = sandbox_state
          needing_install = state.added.length + state.changed.length + state.deleted.length
          needing_install > 0
        end
      end
    end
  end
end
