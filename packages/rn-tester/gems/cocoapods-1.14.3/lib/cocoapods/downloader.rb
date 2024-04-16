require 'cocoapods-downloader'
require 'claide/informative_error'
require 'fileutils'
require 'tmpdir'

module Pod
  module Downloader
    require 'cocoapods/downloader/cache'
    require 'cocoapods/downloader/request'
    require 'cocoapods/downloader/response'

    # Downloads a pod from the given `request` to the given `target` location.
    #
    # @return [Response] The download response for this download.
    #
    # @param  [Request] request
    #         the request that describes this pod download.
    #
    # @param  [Pathname,Nil] target
    #         the location to which this pod should be downloaded. If `nil`,
    #         then the pod will only be cached.
    #
    # @param  [Boolean] can_cache
    #         whether caching is allowed.
    #
    # @param  [Pathname,Nil] cache_path
    #         the path used to cache pod downloads.
    #
    def self.download(
      request,
      target,
      can_cache: true,
      cache_path: Config.instance.cache_root + 'Pods'
    )
      can_cache &&= !Config.instance.skip_download_cache

      request = preprocess_request(request)

      if can_cache
        raise ArgumentError, 'Must provide a `cache_path` when caching.' unless cache_path
        cache = Cache.new(cache_path)
        result = cache.download_pod(request)
      else
        raise ArgumentError, 'Must provide a `target` when caching is disabled.' unless target

        require 'cocoapods/installer/pod_source_preparer'
        result, = download_request(request, target)
        Installer::PodSourcePreparer.new(result.spec, result.location).prepare!
      end

      if target && result.location && target != result.location
        UI.message "Copying #{request.name} from `#{result.location}` to #{UI.path target}", '> ' do
          Cache.read_lock(result.location) do
            FileUtils.rm_rf target
            FileUtils.cp_r(result.location, target)
          end
        end
      end
      result
    end

    # Performs the download from the given `request` to the given `target` location.
    #
    # @return [Response, Hash<String,Specification>]
    #         The download response for this download, and the specifications
    #         for this download grouped by name.
    #
    # @param  [Request] request
    #         the request that describes this pod download.
    #
    # @param  [Pathname,Nil] target
    #         the location to which this pod should be downloaded. If `nil`,
    #         then the pod will only be cached.
    #
    def self.download_request(request, target)
      result = Response.new
      result.checkout_options = download_source(target, request.params)
      result.location = target

      if request.released_pod?
        result.spec = request.spec
        podspecs = { request.name => request.spec }
      else
        podspecs = Sandbox::PodspecFinder.new(target).podspecs
        podspecs[request.name] = request.spec if request.spec
        podspecs.each do |name, spec|
          if request.name == name
            result.spec = spec
          end
        end
      end

      [result, podspecs]
    end

    private

    # Downloads a pod with the given `params` to `target`.
    #
    # @param  [Pathname] target
    #
    # @param  [Hash<Symbol,String>] params
    #
    # @return [Hash] The checkout options required to re-download this exact
    #         same source.
    #
    def self.download_source(target, params)
      FileUtils.rm_rf(target)
      downloader = Downloader.for_target(target, params)
      downloader.download
      target.mkpath

      if downloader.options_specific?
        params
      else
        downloader.checkout_options
      end
    end

    # Return a new request after preprocessing by the downloader
    #
    # @param  [Request] request
    #         the request that needs preprocessing
    #
    # @return [Request] the preprocessed request
    #
    def self.preprocess_request(request)
      Request.new(
        :spec => request.spec,
        :released => request.released_pod?,
        :name => request.name,
        :params => Downloader.preprocess_options(request.params))
    end

    public

    class DownloaderError; include CLAide::InformativeError; end

    class Base
      override_api do
        def execute_command(executable, command, raise_on_failure = false)
          Executable.execute_command(executable, command, raise_on_failure)
        rescue CLAide::InformativeError => e
          raise DownloaderError, e.message
        end

        # Indicates that an action will be performed. The action is passed as a
        # block.
        #
        # @param  [String] message
        #         The message associated with the action.
        #
        # @yield  The action, this block is always executed.
        #
        # @return [void]
        #
        def ui_action(message)
          UI.section(" > #{message}", '', 1) do
            yield
          end
        end

        # Indicates that a minor action will be performed. The action is passed
        # as a block.
        #
        # @param  [String] message
        #         The message associated with the action.
        #
        # @yield  The action, this block is always executed.
        #
        # @return [void]
        #
        def ui_sub_action(message)
          UI.section(" > #{message}", '', 2) do
            yield
          end
        end

        # Prints an UI message.
        #
        # @param  [String] message
        #         The message associated with the action.
        #
        # @return [void]
        #
        def ui_message(message)
          UI.puts message
        end
      end
    end
  end
end
