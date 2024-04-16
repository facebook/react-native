require 'colored2'
require 'claide'
require 'molinillo/errors'

module Molinillo
  class ResolverError
    include CLAide::InformativeError
  end
end

module Pod
  class PlainInformative
    include CLAide::InformativeError
  end

  class Command < CLAide::Command
    require 'cocoapods/command/options/repo_update'
    require 'cocoapods/command/options/project_directory'
    include Options

    require 'cocoapods/command/cache'
    require 'cocoapods/command/env'
    require 'cocoapods/command/init'
    require 'cocoapods/command/install'
    require 'cocoapods/command/ipc'
    require 'cocoapods/command/lib'
    require 'cocoapods/command/list'
    require 'cocoapods/command/outdated'
    require 'cocoapods/command/repo'
    require 'cocoapods/command/setup'
    require 'cocoapods/command/spec'
    require 'cocoapods/command/update'

    self.abstract_command = true
    self.command = 'pod'
    self.version = VERSION
    self.description = 'CocoaPods, the Cocoa library package manager.'
    self.plugin_prefixes = %w(claide cocoapods)

    def self.options
      [
        ['--allow-root', 'Allows CocoaPods to run as root'],
        ['--silent', 'Show nothing'],
      ].concat(super)
    end

    def self.run(argv)
      ensure_not_root_or_allowed! argv
      verify_minimum_git_version!
      verify_xcode_license_approved!

      super(argv)
    ensure
      UI.print_warnings
    end

    def self.report_error(exception)
      case exception
      when Interrupt
        puts '[!] Cancelled'.red
        Config.instance.verbose? ? raise : exit(1)
      when SystemExit
        raise
      else
        if ENV['COCOA_PODS_ENV'] != 'development'
          puts UI::ErrorReport.report(exception)
          UI::ErrorReport.search_for_exceptions(exception)
          exit 1
        else
          raise exception
        end
      end
    end

    # @todo If a command is run inside another one some settings which where
    #       true might return false.
    #
    # @todo We should probably not even load colored unless needed.
    #
    # @todo Move silent flag to CLAide.
    #
    # @note It is important that the commands don't override the default
    #       settings if their flag is missing (i.e. their value is nil)
    #
    def initialize(argv)
      super
      config.silent = argv.flag?('silent', config.silent)
      config.allow_root = argv.flag?('allow-root', config.allow_root)
      config.verbose = self.verbose? unless verbose.nil?
      unless self.ansi_output?
        Colored2.disable!
        String.send(:define_method, :colorize) { |string, _| string }
      end
    end

    # Ensure root user
    #
    # @return [void]
    #
    def self.ensure_not_root_or_allowed!(argv, uid = Process.uid, is_windows = Gem.win_platform?)
      root_allowed = argv.include?('--allow-root') || !ENV['COCOAPODS_ALLOW_ROOT'].nil?
      help! 'You cannot run CocoaPods as root.' unless root_allowed || uid != 0 || is_windows
    end

    # Ensure that the master spec repo exists
    #
    # @return [void]
    #
    def ensure_master_spec_repo_exists!
      unless config.sources_manager.master_repo_functional?
        Setup.new(CLAide::ARGV.new([])).run
      end
    end

    #-------------------------------------------------------------------------#

    include Config::Mixin

    private

    # Returns a new {Gem::Version} based on the systems `git` version.
    #
    # @return [Gem::Version]
    #
    def self.git_version
      raw_version = Executable.capture_command('git', ['--version']).first
      unless match = raw_version.scan(/\d+\.\d+\.\d+/).first
        raise "Failed to extract git version from `git --version` (#{raw_version.inspect})"
      end
      Gem::Version.new(match)
    end

    # Checks that the git version is at least 1.8.5
    #
    # @raise If the git version is older than 1.8.5
    #
    # @return [void]
    #
    def self.verify_minimum_git_version!
      if git_version < Gem::Version.new('1.8.5')
        raise Informative, 'You need at least git version 1.8.5 to use CocoaPods'
      end
    end

    # Returns a new {Installer} parametrized from the {Config}.
    #
    # @return [Installer]
    #
    def installer_for_config
      Installer.new(config.sandbox, config.podfile, config.lockfile)
    end

    # Checks that the podfile exists.
    #
    # @raise  If the podfile does not exists.
    #
    # @return [void]
    #
    def verify_podfile_exists!
      unless config.podfile
        raise Informative, "No `Podfile' found in the project directory."
      end
    end

    # Checks that the lockfile exists.
    #
    # @raise  If the lockfile does not exists.
    #
    # @return [void]
    #
    def verify_lockfile_exists!
      unless config.lockfile
        raise Informative, "No `Podfile.lock' found in the project directory, run `pod install'."
      end
    end

    def self.verify_xcode_license_approved!
      if `/usr/bin/xcrun clang 2>&1` =~ /license/ && !$?.success?
        raise Informative, 'You have not agreed to the Xcode license, which ' \
          'you must do to use CocoaPods. Agree to the license by running: ' \
          '`xcodebuild -license`.'
      end
    end
  end
end
