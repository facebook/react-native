module Pod
  module Downloader
    class Subversion < Base
      def self.options
        [:revision, :tag, :folder, :externals, :checkout]
      end

      def options_specific?
        !(options[:revision] || options[:tag]).nil?
      end

      def checkout_options
        Dir.chdir(target_path) do
          options = {}
          options[:svn] = url
          options[:revision] = @exported_revision
          options
        end
      end

      private

      executable :svn

      def download!
        output = svn!(*subcommand, *reference_url, @target_path)
        store_exported_revision(output)
      end

      def download_head!
        output = svn!(*subcommand, *trunk_url, @target_path)
        store_exported_revision(output)
      end

      def store_exported_revision(output)
        output =~ /Exported revision ([0-9]+)\./
        @exported_revision = Regexp.last_match[1] if Regexp.last_match
      end

      def subcommand
        result = if options[:checkout]
                   %w(checkout)
                 else
                   %w(export)
                 end

        result += %w(--non-interactive --trust-server-cert --force)
        result << '--ignore-externals' if options[:externals] == false
        result
      end

      def reference_url
        result = url.dup
        result << '/' << options[:folder] if options[:folder]
        result << '/tags/' << options[:tag] if options[:tag]
        result = [result]
        result << '-r' << options[:revision] if options[:revision]
        result
      end

      def trunk_url
        result = url.dup
        result << '/' << options[:folder] if options[:folder]
        result << '/trunk'
        [result]
      end
    end
  end
end
