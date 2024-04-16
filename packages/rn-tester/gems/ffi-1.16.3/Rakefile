require 'rbconfig'
require 'date'
require 'fileutils'
require 'yaml'
require 'rspec/core/rake_task'
require 'rubygems/package_task'
require 'rake/extensiontask'
require_relative "lib/ffi/version"
require_relative "rakelib/ffi_gem_helper"

BUILD_DIR = "build"
BUILD_EXT_DIR = File.join(BUILD_DIR, "#{RbConfig::CONFIG['arch']}", 'ffi_c', RUBY_VERSION)

gem_spec = Bundler.load_gemspec('ffi.gemspec')

RSpec::Core::RakeTask.new(:spec => :compile) do |config|
  config.rspec_opts = YAML.load_file 'spec/spec.opts'
end

desc "Build all packages"
task :package => %w[ gem:java gem:native ]

CLOBBER.include 'lib/ffi/types.conf'
CLOBBER.include 'pkg'
CLOBBER.include 'log'

CLEAN.include 'build'
CLEAN.include 'conftest.dSYM'
CLEAN.include 'spec/ffi/fixtures/libtest.{dylib,so,dll}'
CLEAN.include 'spec/ffi/fixtures/*.o'
CLEAN.include 'spec/ffi/embed-test/ext/*.{o,def}'
CLEAN.include 'spec/ffi/embed-test/ext/Makefile'
CLEAN.include "pkg/ffi-*-*/"
CLEAN.include 'lib/{2,3}.*'

# clean all shipped files, that are not in git
CLEAN.include(
    gem_spec.files -
    `git --git-dir ext/ffi_c/libffi/.git ls-files -z`.split("\x0").map { |f| File.join("ext/ffi_c/libffi", f) } -
    `git ls-files -z`.split("\x0")
)

task :distclean => :clobber

desc "Test the extension"
task :test => [ :spec ]


namespace :bench do
  ITER = ENV['ITER'] ? ENV['ITER'].to_i : 100000
  bench_files = Dir["bench/bench_*.rb"].sort.reject { |f| f == "bench/bench_helper.rb" }
  bench_files.each do |bench|
    task File.basename(bench, ".rb")[6..-1] => :compile do
      sh %{#{Gem.ruby} #{bench} #{ITER}}
    end
  end
  task :all => :compile do
    bench_files.each do |bench|
      sh %{#{Gem.ruby} #{bench}}
    end
  end
end

task 'spec:run' => :compile
task 'spec:specdoc' => :compile

task :default => :spec

namespace 'java' do

  java_gem_spec = gem_spec.dup.tap do |s|
    s.files.reject! { |f| File.fnmatch?("ext/*", f) }
    s.extensions = []
    s.platform = 'java'
  end

  Gem::PackageTask.new(java_gem_spec) do |pkg|
    pkg.need_zip = true
    pkg.need_tar = true
    pkg.package_dir = 'pkg'
  end
end

task 'gem:java' => 'java:gem'

FfiGemHelper.install_tasks
# Register windows gems to be pushed to rubygems.org
Bundler::GemHelper.instance.cross_platforms = %w[x86-mingw32 x64-mingw-ucrt x64-mingw32]
# These platforms are not yet enabled, since there are issues on musl-based distors (alpine-linux):
# + %w[x86-linux x86_64-linux arm-linux aarch64-linux x86_64-darwin arm64-darwin]

if RUBY_ENGINE == 'ruby' || RUBY_ENGINE == 'rbx'
  require 'rake/extensiontask'
  Rake::ExtensionTask.new('ffi_c', gem_spec) do |ext|
    ext.name = 'ffi_c'                                        # indicate the name of the extension.
    # ext.lib_dir = BUILD_DIR                                 # put binaries into this folder.
    ext.tmp_dir = BUILD_DIR                                   # temporary folder used during compilation.
    ext.cross_compile = true                                  # enable cross compilation (requires cross compile toolchain)
    ext.cross_platform = Bundler::GemHelper.instance.cross_platforms
    ext.cross_compiling do |spec|
      spec.files.reject! { |path| File.fnmatch?('ext/*', path) }
    end
    # Enable debug info for 'rake compile' but not for 'gem install'
    ext.config_options << "--enable-debug"

  end
else
  task :compile do
    STDERR.puts "Nothing to compile on #{RUBY_ENGINE}"
  end
end


namespace "gem" do
  task 'prepare' do
    require 'rake_compiler_dock'
    sh "bundle package --all"
  end

  Bundler::GemHelper.instance.cross_platforms.each do |plat|
    desc "Build all native binary gems in parallel"
    multitask 'native' => plat

    desc "Build the native gem for #{plat}"
    task plat => ['prepare', 'build'] do
      RakeCompilerDock.sh <<-EOT, platform: plat
        #{ "sudo apt-get update && sudo apt-get install -y libltdl-dev &&" if plat !~ /linux/ }
        bundle --local &&
        rake native:#{plat} pkg/#{gem_spec.full_name}-#{plat}.gem MAKE='nice make -j`nproc`' RUBY_CC_VERSION=${RUBY_CC_VERSION/:2.4.0/}
      EOT
    end
  end
end

directory "ext/ffi_c/libffi"
file "ext/ffi_c/libffi/autogen.sh" => "ext/ffi_c/libffi" do
  warn "Downloading libffi ..."
  sh "git submodule update --init --recursive"
end
task :libffi => "ext/ffi_c/libffi/autogen.sh"

LIBFFI_GIT_FILES = `git --git-dir ext/ffi_c/libffi/.git ls-files -z`.split("\x0")

# Generate files which are in the gemspec but not in libffi's git repo by running autogen.sh
gem_spec.files.select do |f|
  f =~ /ext\/ffi_c\/libffi\/(.*)/ && !LIBFFI_GIT_FILES.include?($1)
end.each do |f|
  file f => "ext/ffi_c/libffi/autogen.sh" do
    chdir "ext/ffi_c/libffi" do
      sh "sh ./autogen.sh"
    end
    touch f
    if gem_spec.files != Gem::Specification.load('./ffi.gemspec').files
      warn "gemspec files have changed -> Please restart rake!"
      exit 1
    end
  end
end

# Make sure we have all gemspec files before packaging
task :build => gem_spec.files
task :gem => :build


require_relative "lib/ffi/platform"
types_conf = File.expand_path(File.join(FFI::Platform::CONF_DIR, 'types.conf'))
logfile = File.join(File.dirname(__FILE__), 'types_log')

task types_conf do |task|
  require 'fileutils'
  require_relative "lib/ffi/tools/types_generator"
  options = {}
  FileUtils.mkdir_p(File.dirname(task.name), mode: 0755 )
  File.open(task.name, File::CREAT|File::TRUNC|File::RDWR, 0644) do |f|
    f.puts FFI::TypesGenerator.generate(options)
  end
  File.open(logfile, 'w') do |log|
    log.puts(types_conf)
  end
end

desc "Create or update type information for platform #{FFI::Platform::NAME}"
task :types_conf => types_conf

begin
  require 'yard'

  namespace :doc do
    YARD::Rake::YardocTask.new do |yard|
    end
  end
rescue LoadError
  warn "[warn] YARD unavailable"
end
