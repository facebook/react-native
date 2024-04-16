require 'cocoapods/external_sources/abstract_external_source'
require 'cocoapods/external_sources/downloader_source'
require 'cocoapods/external_sources/path_source'
require 'cocoapods/external_sources/podspec_source'

module Pod
  # Provides support for initializing the correct concrete class of an external
  # source.
  #
  module ExternalSources
    # Instantiate a matching {AbstractExternalSource} for a given dependency.
    #
    # @param  [Dependency] dependency
    #         the dependency
    #
    # @param  [String] podfile_path
    #         @see AbstractExternalSource#podfile_path
    #
    # @param  [Boolean] can_cache
    #         @see AbstractExternalSource#can_cache
    #
    # @return [AbstractExternalSource] an initialized instance of the concrete
    #         external source class associated with the option specified in the
    #         hash.
    #
    def self.from_dependency(dependency, podfile_path, can_cache)
      from_params(dependency.external_source, dependency, podfile_path, can_cache)
    end

    def self.from_params(params, dependency, podfile_path, can_cache)
      name = dependency.root_name
      if klass = concrete_class_from_params(params)
        klass.new(name, params, podfile_path, can_cache)
      else
        msg = "Unknown external source parameters for `#{name}`: `#{params}`"
        raise Informative, msg
      end
    end

    # Get the class to represent the defined source type of a dependency
    #
    # @param  [Array<Symbol>] params
    #         the source params of the dependency
    #
    # @return [Class]
    #
    def self.concrete_class_from_params(params)
      if params.key?(:podspec)
        PodspecSource
      elsif params.key?(:path)
        PathSource
      elsif Downloader.strategy_from_options(params)
        DownloaderSource
      end
    end
  end
end
