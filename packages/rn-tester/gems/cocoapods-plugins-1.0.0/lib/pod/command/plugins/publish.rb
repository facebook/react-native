require 'json'
require 'cgi'

module Pod
  class Command
    class Plugins
      # The publish subcommand. Used to request to add a plugin
      # to the official list of plugins
      #
      class Publish < Plugins
        self.summary = 'Request to add the plugin to the official plugins list'
        self.description = <<-DESC
                This command is only useful for developers of CocoaPods plugins.

                It opens a new GitHub issue to request adding the plugin
                currently being developped to the list of official plugins.

                The current directory is expected to have one (and only one)
                `.gemspec` file describing the CocoaPods plugin gem.
        DESC

        def initialize(argv)
          @gemspec_files = Dir.glob('*.gemspec')
          super
        end

        def validate!
          super
          if @gemspec_files.count > 1
            help! 'There is more than one gemspec in the current directory'
          elsif @gemspec_files.empty?
            help! 'No `.gemspec` file found in the current directory.'
          end
        end

        def run
          gemspec = Gem::Specification.load(@gemspec_files.first)
          unless gemspec.name.start_with?('cocoapods-')
            UI.notice 'Your gem name should start with `cocoapods-` to be ' \
              'loaded as a plugin by CocoaPods'
          end

          json = json_from_gemspec(gemspec)

          title = "[plugins.json] Add #{gemspec.name}"
          body = 'Please add the following entry to the `plugins.json` file:' \
            "\n\n```\n#{json}\n```"
          open_new_issue_url(title, body)
        end

        private

        def json_from_gemspec(gemspec)
          JSON.pretty_generate(
            :gem => gemspec.name,
            :name => pretty_name_from_gemname(gemspec.name),
            :author => gemspec.authors.join(', '),
            :url => gemspec.homepage,
            :description => gemspec.summary || gemspec.description,
          )
        end

        def pretty_name_from_gemname(gemname)
          gemname.split('-').map(&:capitalize).join(' ').
            gsub(/cocoapods/i, 'CocoaPods')
        end

        def open_new_issue_url(title, body)
          url = 'https://github.com/CocoaPods/cocoapods-plugins/issues/new?' \
            "title=#{CGI.escape(title)}&body=#{CGI.escape(body)}"
          `open "#{url}"`
        end
      end
    end
  end
end
