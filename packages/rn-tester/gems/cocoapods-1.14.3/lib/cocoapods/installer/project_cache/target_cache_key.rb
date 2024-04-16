module Pod
  class Installer
    module ProjectCache
      # Uniquely identifies a Target.
      #
      class TargetCacheKey
        require 'cocoapods/target/pod_target.rb'
        require 'cocoapods/target/aggregate_target.rb'
        require 'digest'

        # @return [Sandbox] The sandbox where the Pods should be installed.
        #
        attr_reader :sandbox

        # @return [Symbol]
        #         The type of target. Either aggregate or pod target.
        #
        attr_reader :type

        # @return [Hash{String => Object}]
        #         The hash containing key-value pairs that identify the target.
        #
        attr_reader :key_hash

        # Initialize a new instance.
        #
        # @param [Sandbox] sandbox see #sandbox
        # @param [Symbol] type @see #type
        # @param [Hash{String => Object}] key_hash @see #key_hash
        #
        def initialize(sandbox, type, key_hash)
          @sandbox = sandbox
          @type = type
          @key_hash = key_hash
        end

        # Equality function used to compare TargetCacheKey objects to each other.
        #
        # @param [TargetCacheKey] other
        #        Other object to compare itself against.
        #
        # @return [Symbol] The difference between this and another TargetCacheKey object.
        #         # Symbol :none means no difference.
        #
        def key_difference(other)
          if other.type != type
            :project
          else
            case type
            when :pod_target
              return :project if (other.key_hash.keys - key_hash.keys).any?
              return :project if other.key_hash['CHECKSUM'] != key_hash['CHECKSUM']
              return :project if other.key_hash['SPECS'] != key_hash['SPECS']
              return :project if other.key_hash['PROJECT_NAME'] != key_hash['PROJECT_NAME']
            end

            this_files = key_hash['FILES']
            other_files = other.key_hash['FILES']
            return :project if this_files != other_files

            this_resources = key_hash['RESOURCES']
            other_resources = other.key_hash['RESOURCES']
            return :project if this_resources != other_resources

            this_build_settings = key_hash['BUILD_SETTINGS_CHECKSUM']
            other_build_settings = other.key_hash['BUILD_SETTINGS_CHECKSUM']
            return :project if this_build_settings != other_build_settings

            this_checkout_options = key_hash['CHECKOUT_OPTIONS']
            other_checkout_options = other.key_hash['CHECKOUT_OPTIONS']
            return :project if this_checkout_options != other_checkout_options

            :none
          end
        end

        def to_h
          key_hash
        end

        # @return [String]
        #         The name of the project the target belongs to.
        #
        def project_name
          key_hash['PROJECT_NAME']
        end

        # Creates a TargetCacheKey instance from the given hash.
        #
        # @param [Sandbox] sandbox The sandbox to use to construct a TargetCacheKey object.
        #
        # @param [Hash{String => Object}] key_hash
        #        The hash used to construct a TargetCacheKey object.
        #
        # @return [TargetCacheKey]
        #
        def self.from_cache_hash(sandbox, key_hash)
          cache_hash = key_hash.dup
          if files = cache_hash['FILES']
            cache_hash['FILES'] = files.sort_by(&:downcase)
          end
          if specs = cache_hash['SPECS']
            cache_hash['SPECS'] = specs.sort_by(&:downcase)
          end
          if resources = cache_hash['RESOURCES']
            cache_hash['RESOURCES'] = resources.sort_by(&:downcase)
          end
          type = cache_hash['CHECKSUM'] ? :pod_target : :aggregate
          TargetCacheKey.new(sandbox, type, cache_hash)
        end

        # Constructs a TargetCacheKey instance from a PodTarget.
        #
        # @param [Sandbox] sandbox The sandbox to use to construct a TargetCacheKey object.
        #
        # @param [Hash] target_by_label
        #        Maps target names to PodTarget objects.
        #
        # @param [PodTarget] pod_target
        #        The pod target used to construct a TargetCacheKey object.
        #
        # @param [Boolean] is_local_pod
        #        Used to also include its local files in the cache key.
        #
        # @param [Hash] checkout_options
        #        The checkout options for this pod target.
        #
        # @return [TargetCacheKey]
        #
        def self.from_pod_target(sandbox, target_by_label, pod_target, is_local_pod: false, checkout_options: nil)
          build_settings = {}
          build_settings[pod_target.label.to_s] = Hash[pod_target.build_settings.map do |k, v|
            [k, Digest::MD5.hexdigest(v.xcconfig.to_s)]
          end]
          pod_target.test_spec_build_settings_by_config.each do |name, settings_by_config|
            build_settings[name] = Hash[settings_by_config.map { |k, v| [k, Digest::MD5.hexdigest(v.xcconfig.to_s)] }]
          end
          pod_target.app_spec_build_settings_by_config.each do |name, settings_by_config|
            build_settings[name] = Hash[settings_by_config.map { |k, v| [k, Digest::MD5.hexdigest(v.xcconfig.to_s)] }]
          end

          # find resources from upstream dependencies that will be named in the `{name}-resources.sh` script
          resource_dependencies = []
          pod_target.dependencies.each do |name|
            next unless target_by_label[name]

            upstream = target_by_label[name]

            # pod target
            resource_dependencies.append(upstream.resource_paths.values.flatten) if upstream.respond_to?(:resource_paths)

            # aggregate target
            resource_dependencies.append(upstream.resource_paths_by_config.values.flatten) if upstream.respond_to?(:resource_paths_by_config)
          end

          contents = {
            'CHECKSUM' => pod_target.root_spec.checksum,
            'SPECS' => pod_target.specs.map(&:to_s).sort_by(&:downcase),
            'BUILD_SETTINGS_CHECKSUM' => build_settings,
            'PROJECT_NAME' => pod_target.project_name,
          }
          if is_local_pod
            relative_file_paths = pod_target.all_files.map { |f| f.relative_path_from(sandbox.root).to_s }
            contents['FILES'] = relative_file_paths.sort_by(&:downcase)
          end
          contents['CHECKOUT_OPTIONS'] = checkout_options if checkout_options
          contents['RESOURCES'] = resource_dependencies.flatten.uniq.sort_by(&:downcase) if resource_dependencies.any?
          TargetCacheKey.new(sandbox, :pod_target, contents)
        end

        # Construct a TargetCacheKey instance from an AggregateTarget.
        #
        # @param [Sandbox] sandbox The sandbox to use to construct a TargetCacheKey object.
        #
        # @param [AggregateTarget] aggregate_target
        #        The aggregate target used to construct a TargetCacheKey object.
        #
        # @return [TargetCacheKey]
        #
        def self.from_aggregate_target(sandbox, target_by_label, aggregate_target)
          build_settings = {}
          aggregate_target.user_build_configurations.keys.each do |configuration|
            build_settings[configuration] = Digest::MD5.hexdigest(aggregate_target.build_settings(configuration).xcconfig.to_s)
          end

          # find resources from upstream dependencies that will be named in the `{name}-resources.sh` script
          resource_dependencies = []
          aggregate_target.pod_targets.each do |name|
            upstream = target_by_label[name]

            # pod target
            resource_dependencies.append(upstream.resource_paths.values.flatten) if upstream.respond_to?(:resource_paths)

            # aggregate target
            resource_dependencies.append(upstream.resource_paths_by_config.values.flatten) if upstream.respond_to?(:resource_paths_by_config)
          end

          contents = {
            'BUILD_SETTINGS_CHECKSUM' => build_settings,
          }
          if aggregate_target.includes_resources? || aggregate_target.includes_on_demand_resources?
            relative_resource_file_paths = aggregate_target.resource_paths_by_config.values.flatten.uniq
            relative_on_demand_resource_file_paths = aggregate_target.on_demand_resources.map do |res|
              res.relative_path_from(sandbox.project_path.dirname).to_s
            end
            contents['FILES'] = (relative_resource_file_paths + relative_on_demand_resource_file_paths).sort_by(&:downcase)
            contents['RESOURCES'] = resource_dependencies.flatten.uniq.sort_by(&:downcase) if resource_dependencies.any?
          end
          TargetCacheKey.new(sandbox, :aggregate, contents)
        end
      end
    end
  end
end
