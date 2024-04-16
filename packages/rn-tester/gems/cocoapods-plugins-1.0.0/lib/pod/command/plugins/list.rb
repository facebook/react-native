require 'pod/command/plugins_helper'
require 'pod/command/gem_helper'

module Pod
  class Command
    class Plugins
      # The list subcommand. Used to list all known plugins
      #
      class List < Plugins
        self.summary = 'List all known plugins'
        self.description = <<-DESC
                List all known plugins (according to the list
                hosted on github.com/CocoaPods/cocoapods-plugins)
        DESC

        def self.options
          super.reject { |option, _| option == '--silent' }
        end

        def run
          plugins = PluginsHelper.known_plugins
          GemHelper.download_and_cache_specs if self.verbose?

          UI.title 'Available CocoaPods Plugins:' do
            plugins.each do |plugin|
              PluginsHelper.print_plugin plugin, self.verbose?
            end
          end
        end
      end
    end
  end
end
