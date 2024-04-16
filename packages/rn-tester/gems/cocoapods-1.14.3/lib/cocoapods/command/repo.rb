require 'fileutils'
require 'cocoapods/command/repo/add'
require 'cocoapods/command/repo/add_cdn'
require 'cocoapods/command/repo/lint'
require 'cocoapods/command/repo/list'
require 'cocoapods/command/repo/push'
require 'cocoapods/command/repo/remove'
require 'cocoapods/command/repo/update'

module Pod
  class Command
    class Repo < Command
      self.abstract_command = true

      # @todo should not show a usage banner!
      #
      self.summary = 'Manage spec-repositories'
      self.default_subcommand = 'list'

      #-----------------------------------------------------------------------#

      extend Executable
      executable :git

      def dir
        config.repos_dir + @name
      end
    end
  end
end
