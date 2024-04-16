module Xcodeproj
  require 'pathname'
  require 'claide'
  require 'colored2'

  class PlainInformative < StandardError
    include CLAide::InformativeError
  end

  class Informative < PlainInformative
    def message
      super !~ /\[!\]/ ? "[!] #{super}\n".red : super
    end
  end

  require 'xcodeproj/gem_version'
  require 'xcodeproj/user_interface'

  autoload :Command,          'xcodeproj/command'
  autoload :Config,           'xcodeproj/config'
  autoload :Constants,        'xcodeproj/constants'
  autoload :Differ,           'xcodeproj/differ'
  autoload :Helper,           'xcodeproj/helper'
  autoload :Plist,            'xcodeproj/plist'
  autoload :Project,          'xcodeproj/project'
  autoload :Workspace,        'xcodeproj/workspace'
  autoload :XCScheme,         'xcodeproj/scheme'
  autoload :XcodebuildHelper, 'xcodeproj/xcodebuild_helper'
end
