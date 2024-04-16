require 'shellwords'

class Pathname
  # @return [String] a version of the path that is escaped to be safe to use in
  #         a shell.
  def shellescape
    to_s.shellescape
  end
end

module Pod
  module Downloader
    # The base class defines the common behaviour of the downloaders.
    #
    # @abstract Subclass and implement {#download}.
    #
    # @private
    #
    class Base
      extend APIExposable
      expose_api API

      # @abstract Override in subclasses.
      #
      # @return [Array<Symbol>] the options accepted by the concrete class.
      #
      def self.options
        []
      end

      # @return [Pathname] the destination folder for the download.
      #
      attr_reader :target_path

      # @return [String] the url of the remote source.
      #
      attr_reader :url

      # @return [Hash={Symbol=>String}] options specific to each concrete
      #         downloader.
      #
      attr_reader :options

      # @param  [String, Pathname] target_path @see target_path
      # @param  [String] url @see url
      # @param  [Hash={Symbol=>String}] options @see options
      #
      def initialize(target_path, url, options)
        require 'pathname'
        @target_path = Pathname.new(target_path)
        @url = url
        @options = options

        unrecognized_options = options.keys - self.class.options
        unless unrecognized_options.empty?
          raise DownloaderError, "Unrecognized options `#{unrecognized_options}`"
        end
      end

      # @return [String] the name of the downloader.
      #
      # @example Downloader::Mercurial name
      #
      #   "Mercurial"
      #
      def name
        self.class.name.split('::').last
      end

      #-----------------------------------------------------------------------#

      # @!group Downloading

      # Downloads the revision specified in the option of a source. If no
      # revision is specified it fall-back to {#download_head}.
      #
      # @return [void]
      #
      def download
        validate_input
        ui_action("#{name} download") do
          target_path.mkpath
          download!
        end
      end

      # Downloads the head revision of a source.
      #
      # @todo Spec for raise.
      #
      # @return [void]
      #
      def download_head
        ui_action("#{name} HEAD download") do
          if head_supported?
            download_head!
          else
            raise DownloaderError, "The `#{name}` downloader does not support " \
            'the HEAD option.'
          end
        end
      end

      # @return [Bool] Whether the downloader supports the head download
      #         strategy.
      #
      def head_supported?
        respond_to?(:download_head!, true)
      end

      # @return [Bool] Whether the options provided completely identify a source
      #         or could lead to the download of different files in future.
      #
      def options_specific?
        true
      end

      # @return [Hash{Symbol=>String}] The options that would allow to
      #         re-download the exact files.
      #
      def checkout_options
        raise 'Abstract method'
      end

      # Provides a before-download check for safety of the options in the
      # concrete downloader.
      #
      # @return [void]
      #
      def validate_input
      end

      # Returns a User-Agent string that itentifies http network requests as
      # originating from CocoaPods.
      # Contains version numbers from the CocoaPods Gem and the cocoapods-downloader Gem.
      #
      # @param  [module] base_module The Base CocoaPods Module to retrieve the version number from.
      # @return [String] the User-Agent string.
      #
      def self.user_agent_string(base_module = Pod)
        pods_version = base_module.const_defined?('VERSION') ? "CocoaPods/#{base_module::VERSION} " : ''
        "#{pods_version}cocoapods-downloader/#{Pod::Downloader::VERSION}"
      end

      #-----------------------------------------------------------------------#

      # Defines two methods for an executable, based on its name. The bang
      # version raises if the executable terminates with a non-zero exit code.
      #
      # For example
      #
      #     executable :git
      #
      # generates
      #
      #     def git(command)
      #       Hooks.execute_with_check("git", command, false)
      #     end
      #
      #     def git!(command)
      #       Hooks.execute_with_check("git", command, true)
      #     end
      #
      # @param  [Symbol] name
      #         the name of the executable.
      #
      # @return [void]
      #
      def self.executable(name)
        define_method(name) do |*command|
          execute_command(name.to_s, command.flatten, false)
        end

        define_method(name.to_s + '!') do |*command|
          execute_command(name.to_s, command.flatten, true)
        end
      end

      # preprocess download options
      #
      # Usage of this method is optional. concrete strategies should not
      # assume options are preprocessed for correct execution.
      #
      # @param  [Hash<Symbol,String>] options
      #         The request options to preprocess
      #
      # @return [Hash<Symbol,String>] the new options
      #
      def self.preprocess_options(options)
        options
      end
    end
  end
end
