module Pod
  class Installer
    module ProjectCache
      # Object that stores, loads, and holds the version of the project cache.
      #
      class ProjectCacheVersion
        # @return [Version] The version of the project cache.
        #
        attr_reader :version

        # Initialize a new instance.
        #
        # @param [Version] version @see #version
        #
        def initialize(version = Version.create('0'))
          @version = version
        end

        # Constructs a ProjectCacheVersion from a file.
        #
        # @param [String] path
        #        The path of the project cache
        #
        # @return [ProjectCacheVersion]
        #
        def self.from_file(path)
          return ProjectCacheVersion.new unless File.exist?(path)
          cached_version = Version.create(File.read(path))
          ProjectCacheVersion.new(cached_version)
        end

        # @return [void]
        #
        # @param [String] path
        #        The path of the project cache to save.
        #
        def save_as(path)
          Sandbox.update_changed_file(path, version.to_s)
        end
      end
    end
  end
end
