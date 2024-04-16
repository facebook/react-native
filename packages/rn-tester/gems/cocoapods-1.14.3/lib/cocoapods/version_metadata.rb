module Pod
  module VersionMetadata
    CACHE_VERSION = '003'.freeze

    def self.gem_version
      Pod::VERSION
    end

    def self.project_cache_version
      [
        gem_version,
        cocoapods_sha,
        'project-cache',
        CACHE_VERSION,
      ].compact.join('.')
    end

    def self.cocoapods_sha
      return unless gemspec = Gem.loaded_specs['cocoapods']
      return unless source = gemspec.source
      return unless source.respond_to?(:revision)
      source.revision
    end
    private_class_method :cocoapods_sha
  end
end
