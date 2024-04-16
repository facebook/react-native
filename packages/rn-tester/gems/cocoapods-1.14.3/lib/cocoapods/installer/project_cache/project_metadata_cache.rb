module Pod
  class Installer
    module ProjectCache
      # Represents the metadata cache
      #
      class ProjectMetadataCache
        require 'cocoapods/installer/project_cache/target_metadata.rb'

        # @return [Sandbox] The sandbox where the Pods should be installed.
        #
        attr_reader :sandbox

        # @return [Hash{String => TargetMetadata}]
        #         Hash of string by target metadata.
        #
        attr_reader :target_label_by_metadata

        # Initialize a new instance.
        #
        # @param [Sandbox] sandbox see #sandbox
        # @param [Hash{String => TargetMetadata}] target_label_by_metadata @see #target_label_by_metadata
        #
        def initialize(sandbox, target_label_by_metadata = {})
          @sandbox = sandbox
          @target_label_by_metadata = target_label_by_metadata
        end

        def to_hash
          Hash[target_label_by_metadata.map do |target_label, metdata|
            [target_label, metdata.to_hash]
          end]
        end

        # Rewrites the entire cache to the given path.
        #
        # @param [String] path
        #
        # @return [void]
        #
        def save_as(path)
          Sandbox.update_changed_file(path, YAMLHelper.convert_hash(to_hash, nil))
        end

        # Updates the metadata cache based on installation results.
        #
        # @param [Hash{String => TargetInstallationResult}] pod_target_installation_results
        #        The installation results for pod targets installed.
        #
        # @param [Hash{String => TargetInstallationResult}] aggregate_target_installation_results
        #        The installation results for aggregate targets installed.
        #
        def update_metadata!(pod_target_installation_results, aggregate_target_installation_results)
          installation_results = pod_target_installation_results.values + aggregate_target_installation_results.values
          installation_results.each do |installation_result|
            native_target = installation_result.native_target
            target_label_by_metadata[native_target.name] = TargetMetadata.from_native_target(sandbox, native_target)
            # app targets need to be added to the cache because they can be used as app hosts for test targets, even if those test targets live inside a different pod (and thus project)
            installation_result.app_native_targets.each_value do |app_target|
              target_label_by_metadata[app_target.name] = TargetMetadata.from_native_target(sandbox, app_target)
            end
          end
        end

        def self.from_file(sandbox, path)
          return ProjectMetadataCache.new(sandbox) unless File.exist?(path)
          contents = YAMLHelper.load_file(path)
          target_by_label_metadata = Hash[contents.map { |target_label, hash| [target_label, TargetMetadata.from_hash(hash)] }]
          ProjectMetadataCache.new(sandbox, target_by_label_metadata)
        end
      end
    end
  end
end
