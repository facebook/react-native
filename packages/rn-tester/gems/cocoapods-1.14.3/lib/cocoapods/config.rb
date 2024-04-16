require 'active_support/multibyte/unicode'

module Pod
  # Stores the global configuration of CocoaPods.
  #
  class Config
    # The default settings for the configuration.
    #
    # Users can specify custom settings in `~/.cocoapods/config.yaml`.
    # An example of the contents of this file might look like:
    #
    #     ---
    #     skip_repo_update: true
    #     new_version_message: false
    #
    DEFAULTS = {
      :verbose             => false,
      :silent              => false,
      :skip_download_cache => !ENV['COCOAPODS_SKIP_CACHE'].nil?,

      :new_version_message => ENV['COCOAPODS_SKIP_UPDATE_MESSAGE'].nil?,

      :cache_root          => Pathname.new(Dir.home) + 'Library/Caches/CocoaPods',
    }

    # Applies the given changes to the config for the duration of the given
    # block.
    #
    # @param [Hash<#to_sym,Object>] changes
    #        the changes to merge temporarily with the current config
    #
    # @yield [] is called while the changes are applied
    #
    def with_changes(changes)
      old = {}
      changes.keys.each do |key|
        key = key.to_sym
        old[key] = send(key) if respond_to?(key)
      end
      configure_with(changes)
      yield if block_given?
    ensure
      configure_with(old)
    end

    public

    #-------------------------------------------------------------------------#

    # @!group UI

    # @return [Boolean] Whether CocoaPods should provide detailed output about the
    #         performed actions.
    #
    attr_accessor :verbose
    alias_method :verbose?, :verbose

    # @return [Boolean] Whether CocoaPods should produce not output.
    #
    attr_accessor :silent
    alias_method :silent?, :silent

    # @return [Boolean] Whether CocoaPods is allowed to run as root.
    #
    attr_accessor :allow_root
    alias_method :allow_root?, :allow_root

    # @return [Boolean] Whether a message should be printed when a new version of
    #         CocoaPods is available.
    #
    attr_accessor :new_version_message
    alias_method :new_version_message?, :new_version_message

    #-------------------------------------------------------------------------#

    # @!group Installation

    # @return [Boolean] Whether the installer should skip the download cache.
    #
    attr_accessor :skip_download_cache
    alias_method :skip_download_cache?, :skip_download_cache

    public

    #-------------------------------------------------------------------------#

    # @!group Cache

    # @return [Pathname] The directory where CocoaPods should cache remote data
    #         and other expensive to compute information.
    #
    attr_accessor :cache_root

    def cache_root
      @cache_root.mkpath unless @cache_root.exist?
      @cache_root
    end

    public

    #-------------------------------------------------------------------------#

    # @!group Initialization

    def initialize(use_user_settings = true)
      configure_with(DEFAULTS)

      unless ENV['CP_HOME_DIR'].nil?
        @cache_root = home_dir + 'cache'
      end

      if use_user_settings && user_settings_file.exist?
        require 'yaml'
        user_settings_contents = File.read(user_settings_file)
        user_settings = YAML.safe_load(user_settings_contents)
        configure_with(user_settings)
      end

      unless ENV['CP_CACHE_DIR'].nil?
        @cache_root = Pathname.new(ENV['CP_CACHE_DIR']).expand_path
      end
    end

    def verbose
      @verbose && !silent
    end

    public

    #-------------------------------------------------------------------------#

    # @!group Paths

    # @return [Pathname] the directory where repos, templates and configuration
    #         files are stored.
    #
    def home_dir
      @home_dir ||= Pathname.new(ENV['CP_HOME_DIR'] || '~/.cocoapods').expand_path
    end

    # @return [Pathname] the directory where the CocoaPods sources are stored.
    #
    def repos_dir
      @repos_dir ||= Pathname.new(ENV['CP_REPOS_DIR'] || (home_dir + 'repos')).expand_path
    end

    attr_writer :repos_dir

    # @return [Source::Manager] the source manager for the spec repos in `repos_dir`
    #
    def sources_manager
      return @sources_manager if @sources_manager && @sources_manager.repos_dir == repos_dir
      @sources_manager = Source::Manager.new(repos_dir)
    end

    # @return [Pathname] the directory where the CocoaPods templates are stored.
    #
    def templates_dir
      @templates_dir ||= Pathname.new(ENV['CP_TEMPLATES_DIR'] || (home_dir + 'templates')).expand_path
    end

    # @return [Pathname] the root of the CocoaPods installation where the
    #         Podfile is located.
    #
    def installation_root
      @installation_root ||= begin
        current_dir = Pathname.new(Dir.pwd.unicode_normalize(:nfkc))
        current_path = current_dir
        until current_path.root?
          if podfile_path_in_dir(current_path)
            installation_root = current_path
            unless current_path == current_dir
              UI.puts("[in #{current_path}]")
            end
            break
          else
            current_path = current_path.parent
          end
        end
        installation_root || current_dir
      end
    end

    attr_writer :installation_root
    alias_method :project_root, :installation_root

    # @return [Pathname] The root of the sandbox.
    #
    def sandbox_root
      @sandbox_root ||= installation_root + 'Pods'
    end

    attr_writer :sandbox_root
    alias_method :project_pods_root, :sandbox_root

    # @return [Sandbox] The sandbox of the current project.
    #
    def sandbox
      @sandbox ||= Sandbox.new(sandbox_root)
    end

    # @return [Podfile] The Podfile to use for the current execution.
    # @return [Nil] If no Podfile is available.
    #
    def podfile
      @podfile ||= Podfile.from_file(podfile_path) if podfile_path
    end
    attr_writer :podfile

    # @return [Lockfile] The Lockfile to use for the current execution.
    # @return [Nil] If no Lockfile is available.
    #
    def lockfile
      @lockfile ||= Lockfile.from_file(lockfile_path) if lockfile_path
    end

    # Returns the path of the Podfile.
    #
    # @note The Podfile can be named either `CocoaPods.podfile.yaml`,
    #       `CocoaPods.podfile` or `Podfile`.  The first two are preferred as
    #       they allow to specify an OS X UTI.
    #
    # @return [Pathname]
    # @return [Nil]
    #
    def podfile_path
      @podfile_path ||= podfile_path_in_dir(installation_root)
    end

    # Returns the path of the Lockfile.
    #
    # @note The Lockfile is named `Podfile.lock`.
    #
    def lockfile_path
      @lockfile_path ||= installation_root + 'Podfile.lock'
    end

    # Returns the path of the default Podfile pods.
    #
    # @note The file is expected to be named Podfile.default
    #
    # @return [Pathname]
    #
    def default_podfile_path
      @default_podfile_path ||= templates_dir + 'Podfile.default'
    end

    # Returns the path of the default Podfile test pods.
    #
    # @note The file is expected to be named Podfile.test
    #
    # @return [Pathname]
    #
    def default_test_podfile_path
      @default_test_podfile_path ||= templates_dir + 'Podfile.test'
    end

    # @return [Pathname] The file to use to cache the search data.
    #
    def search_index_file
      cache_root + 'search_index.json'
    end

    private

    #-------------------------------------------------------------------------#

    # @!group Private helpers

    # @return [Pathname] The path of the file which contains the user settings.
    #
    def user_settings_file
      home_dir + 'config.yaml'
    end

    # Sets the values of the attributes with the given hash.
    #
    # @param  [Hash{String,Symbol => Object}] values_by_key
    #         The values of the attributes grouped by key.
    #
    # @return [void]
    #
    def configure_with(values_by_key)
      return unless values_by_key
      values_by_key.each do |key, value|
        if key.to_sym == :cache_root
          value = Pathname.new(value).expand_path
        end
        instance_variable_set("@#{key}", value)
      end
    end

    # @return [Array<String>] The filenames that the Podfile can have ordered
    #         by priority.
    #
    PODFILE_NAMES = [
      'CocoaPods.podfile.yaml',
      'CocoaPods.podfile',
      'Podfile',
      'Podfile.rb',
    ].freeze

    public

    # Returns the path of the Podfile in the given dir if any exists.
    #
    # @param  [Pathname] dir
    #         The directory where to look for the Podfile.
    #
    # @return [Pathname] The path of the Podfile.
    # @return [Nil] If not Podfile was found in the given dir
    #
    def podfile_path_in_dir(dir)
      PODFILE_NAMES.each do |filename|
        candidate = dir + filename
        if candidate.file?
          return candidate
        end
      end
      nil
    end

    # Excludes the given dir from Time Machine backups.
    #
    # @param  [Pathname] dir
    #         The directory to exclude from Time Machine backups.
    #
    # @return [void]
    #
    def exclude_from_backup(dir)
      return if Gem.win_platform?
      system('tmutil', 'addexclusion', dir.to_s, %i(out err) => File::NULL)
    end

    public

    #-------------------------------------------------------------------------#

    # @!group Singleton

    # @return [Config] the current config instance creating one if needed.
    #
    def self.instance
      @instance ||= new
    end

    # Sets the current config instance. If set to nil the config will be
    # recreated when needed.
    #
    # @param  [Config, Nil] the instance.
    #
    # @return [void]
    #
    class << self
      attr_writer :instance
    end

    # Provides support for accessing the configuration instance in other
    # scopes.
    #
    module Mixin
      def config
        Config.instance
      end
    end
  end
end
