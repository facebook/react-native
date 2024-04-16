module Pod
  class Installer
    module ProjectCache
      # Represents the cache stored at Pods/.project/installation_cache
      #
      class ProjectInstallationCache
        require 'cocoapods/installer/project_cache/target_cache_key'

        # @return [Hash{String => TargetCacheKey}]
        #         Stored hash of target cache key objects for every pod target.
        #
        attr_reader :cache_key_by_target_label

        # @return [Hash{String => Symbol}]
        #         Build configurations stored in the cache.
        #
        attr_reader :build_configurations

        # @return [Integer]
        #         Project object stored in the cache.
        #
        attr_reader :project_object_version

        # @return [Hash<String, Hash>]
        #         Podfile plugins used with a particular install.
        #
        attr_reader :podfile_plugins

        # @return [Hash<Symbol, Object>]
        #         Configured installation options
        #
        attr_reader :installation_options

        # Initializes a new instance.
        #
        # @param [Hash{String => TargetCacheKey}] cache_key_by_target_label @see #cache_key_by_target_label
        # @param [Hash{String => Symbol}] build_configurations @see #build_configurations
        # @param [Integer] project_object_version @see #project_object_version
        # @param [Hash<String, Hash>] podfile_plugins @see #podfile_plugins
        # @param [Hash<Symbol, Object>] installation_options @see #installation_options
        #
        def initialize(cache_key_by_target_label = {}, build_configurations = nil, project_object_version = nil, podfile_plugins = {}, installation_options = {})
          @cache_key_by_target_label = cache_key_by_target_label
          @build_configurations = build_configurations
          @project_object_version = project_object_version
          @podfile_plugins = podfile_plugins
          @installation_options = installation_options
        end

        def update_cache_key_by_target_label!(cache_key_by_target_label)
          @cache_key_by_target_label = cache_key_by_target_label
        end

        def update_build_configurations!(build_configurations)
          @build_configurations = build_configurations
        end

        def update_project_object_version!(project_object_version)
          @project_object_version = project_object_version
        end

        def update_podfile_plugins!(podfile_plugins)
          @podfile_plugins = podfile_plugins
        end

        def update_installation_options!(installation_options)
          @installation_options = installation_options
        end

        def save_as(path)
          Pathname(path).dirname.mkpath
          Sandbox.update_changed_file(path, YAMLHelper.convert(to_hash))
        end

        def self.from_file(sandbox, path)
          return ProjectInstallationCache.new unless File.exist?(path)
          contents = YAMLHelper.load_file(path)
          cache_keys = contents.fetch('CACHE_KEYS', {})
          cache_key_by_target_label = Hash[cache_keys.map do |name, key_hash|
            [name, TargetCacheKey.from_cache_hash(sandbox, key_hash)]
          end]
          project_object_version = contents['OBJECT_VERSION']
          build_configurations = contents['BUILD_CONFIGURATIONS']
          podfile_plugins = contents['PLUGINS']
          installation_options = contents['INSTALLATION_OPTIONS']
          ProjectInstallationCache.new(cache_key_by_target_label, build_configurations, project_object_version, podfile_plugins, installation_options)
        end

        def to_hash
          cache_key_contents = Hash[cache_key_by_target_label.map do |label, key|
            [label, key.to_h]
          end]
          contents = { 'CACHE_KEYS' => cache_key_contents }
          contents['BUILD_CONFIGURATIONS'] = build_configurations if build_configurations
          contents['OBJECT_VERSION'] = project_object_version if project_object_version
          contents['PLUGINS'] = podfile_plugins if podfile_plugins
          contents['INSTALLATION_OPTIONS'] = installation_options if installation_options
          contents
        end
      end
    end
  end
end
