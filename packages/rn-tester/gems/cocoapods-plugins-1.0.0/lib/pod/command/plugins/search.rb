require 'pod/command/plugins_helper'
require 'pod/command/gem_helper'

module Pod
  class Command
    class Plugins
      # The search subcommand.
      # Used to search a plugin in the list of known plugins,
      # searching into the name, author description fields
      #
      class Search < Plugins
        self.summary = 'Search for known plugins'
        self.description = <<-DESC
                Searches plugins whose 'name' contains the given `QUERY`.
                `QUERY` is a regular expression, ignoring case.

                With `--full`, it also searches by 'author' and 'description'.
        DESC

        self.arguments = [
          CLAide::Argument.new('QUERY', true),
        ]

        def self.options
          [
            ['--full',  'Search by name, author, and description'],
          ].concat(super.reject { |option, _| option == '--silent' })
        end

        def initialize(argv)
          @full_text_search = argv.flag?('full')
          @query = argv.shift_argument unless argv.arguments.empty?
          super
        end

        def validate!
          super
          help! 'A search query is required.' if @query.nil? || @query.empty?
          begin
            /#{@query}/
          rescue RegexpError
            help! 'A valid regular expression is required.'
          end
        end

        def run
          plugins = PluginsHelper.matching_plugins(@query, @full_text_search)
          GemHelper.download_and_cache_specs if self.verbose?

          UI.title "Available CocoaPods Plugins matching '#{@query}':"
          plugins.each do |plugin|
            PluginsHelper.print_plugin plugin, self.verbose?
          end
        end
      end
    end
  end
end
