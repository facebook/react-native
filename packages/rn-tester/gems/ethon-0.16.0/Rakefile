# frozen_string_literal: true
require "bundler"
Bundler.setup

require "rake"
require "rspec/core/rake_task"
$LOAD_PATH.unshift File.expand_path("../lib", __FILE__)
require "ethon/version"

task :gem => :build
task :build do
  system "gem build ethon.gemspec"
end

task :install => :build do
  system "gem install ethon-#{Ethon::VERSION}.gem"
end

task :release => :build do
  system "git tag -a v#{Ethon::VERSION} -m 'Tagging #{Ethon::VERSION}'"
  system "git push --tags"
  system "gem push ethon-#{Ethon::VERSION}.gem"
end

RSpec::Core::RakeTask.new(:spec) do |t|
  t.verbose = false
  t.ruby_opts = "-W -I./spec -rspec_helper"
end

desc "Start up the test servers"
task :start do
  require_relative 'spec/support/boot'
  begin
    Boot.start_servers(:rake)
  rescue Exception
  end
end

task :default => :spec

