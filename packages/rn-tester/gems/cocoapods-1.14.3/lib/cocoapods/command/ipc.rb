require 'cocoapods/command/ipc/list'
require 'cocoapods/command/ipc/podfile'
require 'cocoapods/command/ipc/podfile_json'
require 'cocoapods/command/ipc/repl'
require 'cocoapods/command/ipc/spec'
require 'cocoapods/command/ipc/update_search_index'

module Pod
  class Command
    class IPC < Command
      self.abstract_command = true
      self.summary = 'Inter-process communication'

      def output_pipe
        STDOUT
      end
    end
  end
end
