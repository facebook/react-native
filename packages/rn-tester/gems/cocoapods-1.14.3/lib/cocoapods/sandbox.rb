require 'fileutils'

module Pod
  # The sandbox provides support for the directory that CocoaPods uses for an
  # installation. In this directory the Pods projects, the support files and
  # the sources of the Pods are stored.
  #
  # CocoaPods assumes to have control of the sandbox.
  #
  # Once completed the sandbox will have the following file structure:
  #
  #     Pods
  #     |
  #     +-- Headers
  #     |   +-- Private
  #     |   |   +-- [Pod Name]
  #     |   +-- Public
  #     |       +-- [Pod Name]
  #     |
  #     +-- Local Podspecs
  #     |   +-- External Sources
  #     |   +-- Normal Sources
  #     |
  #     +-- Target Support Files
  #     |   +-- [Target Name]
  #     |       +-- Pods-acknowledgements.markdown
  #     |       +-- Pods-acknowledgements.plist
  #     |       +-- Pods-dummy.m
  #     |       +-- Pods-prefix.pch
  #     |       +-- Pods.xcconfig
  #     |
  #     +-- [Pod Name]
  #     |
  #     +-- Manifest.lock
  #     |
  #     +-- Pods.xcodeproj
  #  (if installation option 'generate_multiple_pod_projects' is enabled)
  #     |
  #     +-- PodTarget1.xcodeproj
  #     |
  #    ...
  #     |
  #     +-- PodTargetN.xcodeproj
  #
  #
  class Sandbox
    autoload :FileAccessor,  'cocoapods/sandbox/file_accessor'
    autoload :HeadersStore,  'cocoapods/sandbox/headers_store'
    autoload :PathList,      'cocoapods/sandbox/path_list'
    autoload :PodDirCleaner, 'cocoapods/sandbox/pod_dir_cleaner'
    autoload :PodspecFinder, 'cocoapods/sandbox/podspec_finder'

    # @return [Pathname] the root of the sandbox.
    #
    attr_reader :root

    # @return [HeadersStore] the header directory for the user targets.
    #
    attr_reader :public_headers

    # Initialize a new instance
    #
    # @param [String, Pathname] root @see #root
    #
    def initialize(root)
      FileUtils.mkdir_p(root)
      @root = Pathname.new(root).realpath
      @public_headers = HeadersStore.new(self, 'Public', :public)
      @predownloaded_pods = []
      @downloaded_pods = []
      @checkout_sources = {}
      @development_pods = {}
      @pods_with_absolute_path = []
      @stored_podspecs = {}
    end

    # @return [Lockfile] the manifest which contains the information about the
    #         installed pods or `nil` if one is not present.
    #
    def manifest
      @manifest ||= begin
        Lockfile.from_file(manifest_path) if manifest_path.exist?
      end
    end

    # Removes the files of the Pod with the given name from the sandbox.
    #
    # @param [String] name The name of the pod, which is used to calculate additional paths to clean.
    # @param [String] pod_dir The directory of the pod to clean.
    #
    # @return [void]
    #
    def clean_pod(name, pod_dir)
      pod_dir.rmtree if pod_dir&.exist?
      podspec_path = specification_path(name)
      podspec_path.rmtree if podspec_path&.exist?
      pod_target_project_path = pod_target_project_path(name)
      pod_target_project_path.rmtree if pod_target_project_path&.exist?
    end

    # Prepares the sandbox for a new installation removing any file that will
    # be regenerated and ensuring that the directories exists.
    #
    def prepare
      FileUtils.mkdir_p(headers_root)
      FileUtils.mkdir_p(sources_root)
      FileUtils.mkdir_p(specifications_root)
      FileUtils.mkdir_p(target_support_files_root)
    end

    # @return [String] a string representation suitable for debugging.
    #
    def inspect
      "#<#{self.class}> with root #{root}"
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Paths

    # @return [Pathname] the path of the manifest.
    #
    def manifest_path
      root + 'Manifest.lock'
    end

    # @return [Pathname] the path of the Pods project.
    #
    def project_path
      root + 'Pods.xcodeproj'
    end

    # @return [Pathname] the path of the installation cache.
    #
    def project_installation_cache_path
      root.join('.project_cache', 'installation_cache.yaml')
    end

    # @return [Pathname] the path of the metadata cache.
    #
    def project_metadata_cache_path
      root.join('.project_cache', 'metadata_cache.yaml')
    end

    # @return [Pathname] the path of the version cache.
    #
    def project_version_cache_path
      root.join('.project_cache', 'version')
    end

    # @param [String] pod_target_name
    # Name of the pod target used to generate the path of its Xcode project.
    #
    # @return [Pathname] the path of the project for a pod target.
    #
    def pod_target_project_path(pod_target_name)
      root + "#{pod_target_name}.xcodeproj"
    end

    # Returns the path for the directory where the support files of
    # a target are stored.
    #
    # @param  [String] name
    #         The name of the target.
    #
    # @return [Pathname] the path of the support files.
    #
    def target_support_files_dir(name)
      target_support_files_root + name
    end

    # Returns the path where the Pod with the given name is stored, taking into
    # account whether the Pod is locally sourced.
    #
    # @param  [String] name
    #         The name of the Pod.
    #
    # @return [Pathname] the path of the Pod.
    #
    def pod_dir(name)
      root_name = Specification.root_name(name)
      if local?(root_name)
        Pathname.new(development_pods[root_name].dirname)
      else
        sources_root + root_name
      end
    end

    # Returns true if the path as originally specified was absolute.
    #
    # @param  [String] name
    #
    # @return [Boolean] true if originally absolute
    #
    def local_path_was_absolute?(name)
      @pods_with_absolute_path.include? name
    end

    # @return [Pathname] The directory where headers are stored.
    #
    def headers_root
      root + 'Headers'
    end

    # @return [Pathname] The directory where the downloaded sources of
    #         the Pods are stored.
    #
    def sources_root
      root
    end

    # @return [Pathname] the path for the directory where the
    #         specifications are stored.
    #
    def specifications_root
      root + 'Local Podspecs'
    end

    # @return [Pathname] The directory where the files generated by
    #         CocoaPods to support the umbrella targets are stored.
    #
    def target_support_files_root
      root + 'Target Support Files'
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Specification store

    # Returns the specification for the Pod with the given name.
    #
    # @param  [String] name
    #         the name of the Pod for which the specification is requested.
    #
    # @return [Specification] the specification if the file is found.
    #
    def specification(name)
      @stored_podspecs[name] ||= if file = specification_path(name)
                                   original_path = development_pods[name]
                                   Specification.from_file(original_path || file)
      end
    end

    # Returns the path of the specification for the Pod with the
    # given name, if one is stored.
    #
    # @param  [String] name
    #         the name of the Pod for which the podspec file is requested.
    #
    # @return [Pathname] the path or nil.
    # @return [Nil] if the podspec is not stored.
    #
    def specification_path(name)
      name = Specification.root_name(name)
      path = specifications_root + "#{name}.podspec"
      if path.exist?
        path
      else
        path = specifications_root + "#{name}.podspec.json"
        if path.exist?
          path
        end
      end
    end

    # Stores a specification in the `Local Podspecs` folder.
    #
    # @param  [String] name
    #         the name of the pod
    #
    # @param  [String, Pathname, Specification] podspec
    #         The contents of the specification (String) or the path to a
    #         podspec file (Pathname).
    #
    # @return [void]
    #
    #
    def store_podspec(name, podspec, _external_source = false, json = false)
      file_name = json ? "#{name}.podspec.json" : "#{name}.podspec"
      output_path = specifications_root + file_name

      spec =
        case podspec
        when String
          Sandbox.update_changed_file(output_path, podspec)
          Specification.from_file(output_path)
        when Pathname
          unless podspec.exist?
            raise Informative, "No podspec found for `#{name}` in #{podspec}"
          end
          FileUtils.copy(podspec, output_path)
          Specification.from_file(podspec)
        when Specification
          raise ArgumentError, 'can only store Specification objects as json' unless json
          Sandbox.update_changed_file(output_path, podspec.to_pretty_json)
          podspec.dup
        else
          raise ArgumentError, "Unknown type for podspec: #{podspec.inspect}"
        end

      # we force the file to be the file in the sandbox, so specs that have been serialized to
      # json maintain a consistent checksum.
      # this is safe to do because `spec` is always a clean instance
      spec.defined_in_file = output_path

      unless spec.name == name
        raise Informative, "The name of the given podspec `#{spec.name}` doesn't match the expected one `#{name}`"
      end
      @stored_podspecs[spec.name] = spec
    end

    #-------------------------------------------------------------------------#

    public

    # @!group Pods information

    # Marks a Pod as pre-downloaded
    #
    # @param  [String] name
    #         The name of the Pod.
    #
    # @return [void]
    #
    def store_pre_downloaded_pod(name)
      root_name = Specification.root_name(name)
      predownloaded_pods << root_name
    end

    # @return [Array<String>] The names of the pods that have been
    #         pre-downloaded from an external source.
    #
    attr_reader :predownloaded_pods

    # Checks if a Pod has been pre-downloaded by the resolver in order to fetch
    # the podspec.
    #
    # @param  [String] name
    #         The name of the Pod.
    #
    # @return [Boolean] Whether the Pod has been pre-downloaded.
    #
    def predownloaded?(name)
      root_name = Specification.root_name(name)
      predownloaded_pods.include?(root_name)
    end

    #--------------------------------------#

    # Marks a Pod as downloaded
    #
    # @param  [String] name
    #         The name of the Pod.
    #
    # @return [void]
    #
    def store_downloaded_pod(name)
      root_name = Specification.root_name(name)
      downloaded_pods << root_name
    end

    # Checks if a Pod has been downloaded before the installation
    # process.
    #
    # @param  [String] name
    #         The name of the Pod.
    #
    # @return [Boolean] Whether the Pod has been downloaded.
    #
    def downloaded?(name)
      root_name = Specification.root_name(name)
      downloaded_pods.include?(root_name)
    end

    # @return [Array<String>] The names of the pods that have been
    #         downloaded before the installation process begins.
    #         These are distinct from the pre-downloaded pods in
    #         that these do not necessarily come from external
    #         sources, and are only downloaded right before
    #         installation if the parallel_pod_downloads option is on.
    #
    attr_reader :downloaded_pods

    #--------------------------------------#

    # Stores the local path of a Pod.
    #
    # @param  [String] name
    #         The name of the Pod.
    #
    # @param  [Hash] source
    #         The hash which contains the options as returned by the
    #         downloader.
    #
    # @return [void]
    #
    def store_checkout_source(name, source)
      root_name = Specification.root_name(name)
      checkout_sources[root_name] = source
    end

    # Removes the checkout source of a Pod.
    #
    # @param  [String] name
    #         The name of the Pod.
    #
    # @return [void]
    #
    def remove_checkout_source(name)
      root_name = Specification.root_name(name)
      checkout_sources.delete(root_name)
    end

    # Removes local podspec a Pod.
    #
    # @param  [String] name
    #         The name of the Pod.
    #
    # @return [void]
    #
    def remove_local_podspec(name)
      local_podspec = specification_path(name)
      FileUtils.rm(local_podspec) if local_podspec
    end

    # @return [Hash{String=>Hash}] The options necessary to recreate the exact
    #         checkout of a given Pod grouped by its name.
    #
    attr_reader :checkout_sources

    #--------------------------------------#

    # Stores the local path of a Pod.
    #
    # @param  [String] name
    #         The name of the Pod.
    #
    # @param  [Pathname, String] path
    #         The path to the local Podspec
    #
    # @param  [Boolean] was_absolute
    #         True if the specified local path was absolute.
    #
    # @return [void]
    #
    def store_local_path(name, path, was_absolute = false)
      root_name = Specification.root_name(name)
      path = Pathname.new(path) unless path.is_a?(Pathname)
      development_pods[root_name] = path
      @pods_with_absolute_path << root_name if was_absolute
    end

    # @return [Hash{String=>Pathname}] The path of the Pods' podspecs with a local source
    #         grouped by their root name.
    #
    attr_reader :development_pods

    # Checks if a Pod is locally sourced?
    #
    # @param  [String] name
    #         The name of the Pod.
    #
    # @return [Boolean] Whether the Pod is locally sourced.
    #
    def local?(name)
      !local_podspec(name).nil?
    end

    # @param  [String] name
    #         The name of a locally specified Pod
    #
    # @return [Pathname] Path to the local Podspec of the Pod
    #
    def local_podspec(name)
      root_name = Specification.root_name(name)
      development_pods[root_name]
    end

    # @!group Convenience Methods

    # Writes a file if it does not exist or if its contents have changed.
    #
    # @param  [Pathname] path
    #         The path to read from and write to.
    #
    # @param  [String] contents
    #         The contents to write if they do not match or the file does not exist.
    #
    # @return [void]
    #
    def self.update_changed_file(path, contents)
      if path.exist?
        content_stream = StringIO.new(contents)
        identical = File.open(path, 'rb') { |f| FileUtils.compare_stream(f, content_stream) }
        return if identical
      end
      File.open(path, 'w') { |f| f.write(contents) }
    end

    #-------------------------------------------------------------------------#
  end
end
