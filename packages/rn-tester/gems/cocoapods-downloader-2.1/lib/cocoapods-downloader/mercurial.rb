module Pod
  module Downloader
    class Mercurial < Base
      def self.options
        [:revision, :tag, :branch]
      end

      def options_specific?
        !(options[:revision] || options[:tag]).nil?
      end

      def checkout_options
        Dir.chdir(target_path) do
          options = {}
          options[:hg] = url
          options[:revision] = `hg --debug id -i`.chomp
          options
        end
      end

      private

      executable :hg

      def download!
        if options[:revision]
          download_revision!
        elsif options[:tag]
          download_tag!
        elsif options[:branch]
          download_branch!
        else
          download_head!
        end
      end

      def download_head!
        hg! 'clone', url, @target_path
      end

      def download_revision!
        hg! 'clone', url, '--rev', options[:revision], @target_path
      end

      def download_tag!
        hg! 'clone', url, '--updaterev', options[:tag], @target_path
      end

      def download_branch!
        hg! 'clone', url, '--updaterev', options[:branch], @target_path
      end

      def validate_input
        input = [url, options[:revision], options[:branch], options[:tag]].map(&:to_s)
        invalid = input.compact.any? { |value| value.start_with?('--') || value.include?(' --') }
        raise DownloaderError, "Provided unsafe input for hg #{options}." if invalid
      end
    end
  end
end
