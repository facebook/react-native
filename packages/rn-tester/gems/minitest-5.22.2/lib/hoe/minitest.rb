# :stopdoc:

class Hoe
end

module Hoe::Minitest
  def minitest?
    self.name == "minitest"
  end

  def initialize_minitest
    unless minitest? then
      dir = "../../minitest/dev/lib"
      Hoe.add_include_dirs dir if File.directory? dir
    end

    gem "minitest"
    require "minitest"
    version = Minitest::VERSION.split(/\./).first(2).join(".")

    dependency "minitest", "~> #{version}", :development unless
      minitest? or ENV["MT_NO_ISOLATE"]
  end

  def define_minitest_tasks
    self.testlib = :minitest
  end
end
