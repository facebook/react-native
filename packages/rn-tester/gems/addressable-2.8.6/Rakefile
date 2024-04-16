# frozen_string_literal: true

require 'rubygems'
require 'rake'

require File.join(File.dirname(__FILE__), 'lib', 'addressable', 'version')

PKG_DISPLAY_NAME   = 'Addressable'
PKG_NAME           = PKG_DISPLAY_NAME.downcase
PKG_VERSION        = Addressable::VERSION::STRING
PKG_FILE_NAME      = "#{PKG_NAME}-#{PKG_VERSION}"

RELEASE_NAME       = "REL #{PKG_VERSION}"

PKG_SUMMARY        = "URI Implementation"
PKG_DESCRIPTION    = <<-TEXT
Addressable is an alternative implementation to the URI implementation that is
part of Ruby's standard library. It is flexible, offers heuristic parsing, and
additionally provides extensive support for IRIs and URI templates.
TEXT

PKG_FILES = FileList[
    "data/**/*",
    "lib/**/*.rb",
    "spec/**/*.rb",
    "tasks/**/*.rake",
    "addressable.gemspec",
    "CHANGELOG.md",
    "Gemfile",
    "LICENSE.txt",
    "README.md",
    "Rakefile",
]

task :default => "spec"

WINDOWS = (RUBY_PLATFORM =~ /mswin|win32|mingw|bccwin|cygwin/) rescue false
SUDO = WINDOWS ? '' : ('sudo' unless ENV['SUDOLESS'])

Dir['tasks/**/*.rake'].each { |rake| load rake }
