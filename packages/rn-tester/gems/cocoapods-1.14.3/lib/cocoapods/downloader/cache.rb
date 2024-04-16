require 'fileutils'
require 'tmpdir'

module Pod
  module Downloader
    # The class responsible for managing Pod downloads, transparently caching
    # them in a cache directory.
    #
    class Cache
      # @return [Pathname] The root directory where this cache store its
      #         downloads.
      #
      attr_reader :root

      # Initialize a new instance
      #
      # @param  [Pathname,String] root
      #         see {#root}
      #
      def initialize(root)
        @root = Pathname(root)
        ensure_matching_version
      end

      # Downloads the Pod from the given `request`
      #
      # @param  [Request] request
      #         the request to be downloaded.
      #
      # @return [Response] the response from downloading `request`
      #
      def download_pod(request)
        cached_pod(request) || uncached_pod(request)
      rescue Informative
        raise
      rescue
        UI.puts("\n[!] Error installing #{request.name}".red)
        raise
      end

      # @return [Hash<String, Hash<Symbol, String>>]
      #         A hash whose keys are the pod name
      #         And values are a hash with the following keys:
      #         :spec_file : path to the spec file
      #         :name      : name of the pod
      #         :version   : pod version
      #         :release   : boolean to tell if that's a release pod
      #         :slug      : the slug path where the pod cache is located
      #
      def cache_descriptors_per_pod
        specs_dir = root + 'Specs'
        release_specs_dir = specs_dir + 'Release'
        return {} unless specs_dir.exist?

        spec_paths = specs_dir.find.select { |f| f.fnmatch('*.podspec.json') }
        spec_paths.reduce({}) do |hash, spec_path|
          spec = Specification.from_file(spec_path)
          hash[spec.name] ||= []
          is_release = spec_path.to_s.start_with?(release_specs_dir.to_s)
          request = Downloader::Request.new(:spec => spec, :released => is_release)
          hash[spec.name] << {
            :spec_file => spec_path,
            :name => spec.name,
            :version => spec.version,
            :release => is_release,
            :slug => root + request.slug,
          }
          hash
        end
      end

      # Convenience method for acquiring a shared lock to safely read from the
      # cache. See `Cache.lock` for more details.
      #
      # @param  [Pathname] location
      #         the path to require a lock for.
      #
      # @param  [block] &block
      #         the block to execute inside the lock.
      #
      # @return [void]
      #
      def self.read_lock(location, &block)
        Cache.lock(location, File::LOCK_SH, &block)
      end

      # Convenience method for acquiring an exclusive lock to safely write to
      # the cache. See `Cache.lock` for more details.
      #
      # @param  [Pathname] location
      #         the path to require a lock for.
      #
      # @param  [block] &block
      #         the block to execute inside the lock.
      #
      # @return [void]
      #
      def self.write_lock(location, &block)
        Cache.lock(location, File::LOCK_EX, &block)
      end

      # Creates a .lock file at `location`, aquires a lock of type
      # `lock_type`, checks that it is valid, and executes passed block while
      # holding on to that lock. Afterwards, the .lock file is deleted, which is
      # why validation of the lock is necessary, as you might have a lock on a
      # file that doesn't exist on the filesystem anymore.
      #
      # @param  [Pathname] location
      #         the path to require a lock for.
      #
      # @param  [locking_constant] lock_type
      #         the type of lock, either exclusive (File::LOCK_EX) or shared
      #         (File::LOCK_SH).
      #
      # @return [void]
      #
      def self.lock(location, lock_type)
        raise ArgumentError, 'no block given' unless block_given?
        lockfile = "#{location}.lock"
        f = nil
        loop do
          f.close if f
          f = File.open(lockfile, File::CREAT, 0o644)
          f.flock(lock_type)
          break if Cache.valid_lock?(f, lockfile)
        end
        begin
          yield location
        ensure
          if lock_type == File::LOCK_SH
            f.flock(File::LOCK_EX)
            File.delete(lockfile) if Cache.valid_lock?(f, lockfile)
          else
            File.delete(lockfile)
          end
          f.close
        end
      end

      # Checks that the lock is on a file that still exists on the filesystem.
      #
      # @param  [File] file
      #         the actual file that we have a lock for.
      #
      # @param  [String] filename
      #         the filename of the file that we have a lock for.
      #
      # @return [Boolean]
      #         true if `filename` still exists and is the same file as `file`
      #
      def self.valid_lock?(file, filename)
        file.stat.ino == File.stat(filename).ino
      rescue Errno::ENOENT
        false
      end

      private

      # Ensures the cache on disk was created with the same CocoaPods version as
      # is currently running.
      #
      # @return [Void]
      #
      def ensure_matching_version
        version_file = root + 'VERSION'
        version = version_file.read.strip if version_file.file?

        root.rmtree if version != Pod::VERSION && root.exist?
        root.mkpath

        version_file.open('w') { |f| f << Pod::VERSION }
      end

      # @param  [Request] request
      #         the request to be downloaded.
      #
      # @param  [Hash<Symbol,String>] slug_opts
      #         the download options that should be used in constructing the
      #         cache slug for this request.
      #
      # @return [Pathname] The path for the Pod downloaded from the given
      #         `request`.
      #
      def path_for_pod(request, slug_opts = {})
        root + request.slug(**slug_opts)
      end

      # @param  [Request] request
      #         the request to be downloaded.
      #
      # @param  [Hash<Symbol,String>] slug_opts
      #         the download options that should be used in constructing the
      #         cache slug for this request.
      #
      # @return [Pathname] The path for the podspec downloaded from the given
      #         `request`.
      #
      def path_for_spec(request, slug_opts = {})
        path = root + 'Specs' + request.slug(**slug_opts)
        Pathname.new(path.to_path + '.podspec.json')
      end

      # @param  [Request] request
      #         the request to be downloaded.
      #
      # @return [Response] The download response for the given `request` that
      #         was found in the download cache.
      #
      def cached_pod(request)
        cached_spec = cached_spec(request)
        path = path_for_pod(request)

        return unless cached_spec && path.directory?
        spec = request.spec || cached_spec
        Response.new(path, spec, request.params)
      end

      # @param  [Request] request
      #         the request to be downloaded.
      #
      # @return [Specification] The cached specification for the given
      #         `request`.
      #
      def cached_spec(request)
        path = path_for_spec(request)
        path.file? && Specification.from_file(path)
      rescue JSON::ParserError
        nil
      end

      # @param  [Request] request
      #         the request to be downloaded.
      #
      # @return [Response] The download response for the given `request` that
      #         was not found in the download cache.
      #
      def uncached_pod(request)
        in_tmpdir do |target|
          result, podspecs = download(request, target)
          result.location = nil

          podspecs.each do |name, spec|
            destination = path_for_pod(request, :name => name, :params => result.checkout_options)
            copy_and_clean(target, destination, spec)
            write_spec(spec, path_for_spec(request, :name => name, :params => result.checkout_options))
            if request.name == name
              result.location = destination
            end
          end

          result
        end
      end

      def download(request, target)
        Downloader.download_request(request, target)
      end

      # Performs the given block inside a temporary directory,
      # which is removed at the end of the block's scope.
      #
      # @return [Object] The return value of the given block
      #
      def in_tmpdir(&blk)
        tmpdir = Pathname(Dir.mktmpdir)
        blk.call(tmpdir)
      ensure
        FileUtils.remove_entry(tmpdir, :force => true) if tmpdir && tmpdir.exist?
      end

      # Copies the `source` directory to `destination`, cleaning the directory
      # of any files unused by `spec`.
      #
      # @param  [Pathname] source
      #
      # @param  [Pathname] destination
      #
      # @param  [Specification] spec
      #
      # @return [Void]
      #
      def copy_and_clean(source, destination, spec)
        specs_by_platform = group_subspecs_by_platform(spec)
        destination.parent.mkpath
        Cache.write_lock(destination) do
          FileUtils.rm_rf(destination)
          FileUtils.cp_r(source, destination)
          Pod::Installer::PodSourcePreparer.new(spec, destination).prepare!
          Sandbox::PodDirCleaner.new(destination, specs_by_platform).clean!
        end
      end

      def group_subspecs_by_platform(spec)
        specs_by_platform = {}
        [spec, *spec.recursive_subspecs].each do |ss|
          ss.available_platforms.each do |platform|
            specs_by_platform[platform] ||= []
            specs_by_platform[platform] << ss
          end
        end
        specs_by_platform
      end

      # Writes the given `spec` to the given `path`.
      #
      # @param  [Specification] spec
      #         the specification to be written.
      #
      # @param  [Pathname] path
      #         the path the specification is to be written to.
      #
      # @return [Void]
      #
      def write_spec(spec, path)
        path.dirname.mkpath
        Cache.write_lock(path) do
          path.open('w') { |f| f.write spec.to_pretty_json }
        end
      end
    end
  end
end
