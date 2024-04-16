# The Pod modules name-spaces all the classes of CocoaPods.
#
module Pod
  require 'cocoapods-core/gem_version'

  # Indicates a runtime error **not** caused by a bug.
  #
  class PlainInformative < StandardError; end

  # Indicates a user error.
  #
  class Informative < PlainInformative; end

  require 'pathname'
  require 'cocoapods-core/vendor'

  require 'active_support'
  require 'active_support/core_ext'

  autoload :Version,        'cocoapods-core/version'
  autoload :Requirement,    'cocoapods-core/requirement'
  autoload :Dependency,     'cocoapods-core/dependency'

  autoload :CoreUI,         'cocoapods-core/core_ui'
  autoload :DSLError,       'cocoapods-core/standard_error'
  autoload :GitHub,         'cocoapods-core/github'
  autoload :HTTP,           'cocoapods-core/http'
  autoload :Lockfile,       'cocoapods-core/lockfile'
  autoload :Metrics,        'cocoapods-core/metrics'
  autoload :Platform,       'cocoapods-core/platform'
  autoload :Podfile,        'cocoapods-core/podfile'
  autoload :Source,         'cocoapods-core/source'
  autoload :CDNSource,      'cocoapods-core/cdn_source'
  autoload :TrunkSource,    'cocoapods-core/trunk_source'
  autoload :Specification,  'cocoapods-core/specification'
  autoload :StandardError,  'cocoapods-core/standard_error'
  autoload :YAMLHelper,     'cocoapods-core/yaml_helper'
  autoload :BuildType,      'cocoapods-core/build_type'

  # TODO: Fix
  #
  Spec = Specification
end
