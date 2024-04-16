module Pod
  class Installer
    module ProjectCache
      # The result object from analyzing the project cache.
      #
      class ProjectCacheAnalysisResult
        # @return [Array<PodTarget>]
        #         The list of pod targets that need to be regenerated.
        #
        attr_reader :pod_targets_to_generate

        # @return [Array<AggregateTarget>]
        #         The list of aggregate targets that need to be regenerated. This can be nil if we don't want to
        #         generate ANY aggregate targets since we still want to be able to generate an empty list of aggregate
        #         targets.
        #
        attr_reader :aggregate_targets_to_generate

        # @return [Hash{String => TargetCacheKey}]
        #         Updated hash of target cache key by target label for all targets.
        #
        attr_reader :cache_key_by_target_label

        # @return [Hash{String => Symbol}]
        #         The build configurations to install with each target.
        #
        attr_reader :build_configurations

        # @return [Integer]
        #         The project object version to install with each target.
        #
        attr_reader :project_object_version

        # Initialize a new instance.
        #
        # @param [Array<PodTarget>] pod_targets_to_generate @see #pod_targets_to_generate
        # @param [Array<AggregateTarget] aggregate_targets_to_generate @see #aggregate_targets_to_generate
        # @param [Hash{String => TargetCacheKey}] cache_key_by_target_label @see #cache_key_by_target_label
        # @param [Hash{String => Symbol}] build_configurations @see #build_configurations
        # @param [Integer] project_object_version @see #project_object_version
        #
        def initialize(pod_targets_to_generate, aggregate_targets_to_generate, cache_key_by_target_label,
                       build_configurations, project_object_version)
          @pod_targets_to_generate = pod_targets_to_generate
          @aggregate_targets_to_generate = aggregate_targets_to_generate
          @cache_key_by_target_label = cache_key_by_target_label
          @build_configurations = build_configurations
          @project_object_version = project_object_version
        end
      end
    end
  end
end
