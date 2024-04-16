require 'cocoapods/command/lib/create'
require 'cocoapods/command/lib/lint'

module Pod
  class Command
    class Lib < Command
      self.abstract_command = true
      self.summary = 'Develop pods'
    end
  end
end
