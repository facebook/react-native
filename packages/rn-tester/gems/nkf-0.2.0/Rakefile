require "bundler/gem_tasks"
require "rake/testtask"

Rake::TestTask.new(:test) do |t|
  t.libs << "test"
  t.libs << "lib"
  t.test_files = FileList["test/**/test_*.rb"]
end

if RUBY_ENGINE == "jruby"
  require "rake/javaextensiontask"
  Rake::JavaExtensionTask.new("nkf") do |ext|
    ext.source_version = "1.8"
    ext.target_version = "1.8"
    ext.ext_dir = "ext/java"
  end

  task :build => :compile
else
  require 'rake/extensiontask'
  Rake::ExtensionTask.new("nkf")
end

task :default => :test
