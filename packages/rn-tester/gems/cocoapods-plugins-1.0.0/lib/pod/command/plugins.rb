require 'rest'
require 'json'

# The CocoaPods namespace
#
module Pod
  class Command
    # The pod plugins command.
    #
    class Plugins < Command
      require 'pod/command/plugins/list'
      require 'pod/command/plugins/search'
      require 'pod/command/plugins/create'
      require 'pod/command/plugins/publish'
      require 'pod/command/plugins/installed'

      self.abstract_command = true
      self.default_subcommand = 'list'

      self.summary = 'Show available CocoaPods plugins'
      self.description = <<-DESC
        Lists or searches the available CocoaPods plugins
        and show if you have them installed or not.

        Also allows you to quickly create a new Cocoapods
        plugin using a provided template.
      DESC
    end
  end
end
