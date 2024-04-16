source_version = ["", "ext/nkf/"].find do |dir|
  begin
    break File.open(File.join(__dir__, "#{dir}nkf.c")) {|f|
      f.gets("\n#define NKF_GEM_VERSION ")
      f.gets[/\s*"(.+)"/, 1]
    }
  rescue Errno::ENOENT
  end
end

Gem::Specification.new do |spec|
  spec.name          = "nkf"
  spec.version       = source_version
  spec.authors       = ["NARUSE Yui", "Charles Oliver Nutter"]
  spec.email         = ["naruse@airemix.jp", "headius@headius.com"]

  spec.summary       = %q{Ruby extension for Network Kanji Filter}
  spec.description   = %q{Ruby extension for Network Kanji Filter}
  spec.homepage      = "https://github.com/ruby/nkf"
  spec.required_ruby_version = Gem::Requirement.new(">= 2.3.0")
  spec.licenses      = ["Ruby", "BSD-2-Clause"]

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = spec.homepage

  # Specify which files should be added to the gem when it is released.
  # The `git ls-files -z` loads the files in the RubyGem that have been added into git.
  spec.files         = Dir.chdir(File.expand_path('..', __FILE__)) do
    `git ls-files -z`.split("\x0").reject { |f| f.match(%r{^(test|spec|features)/}) }
  end

  if Gem::Platform === spec.platform and spec.platform =~ 'java' or RUBY_ENGINE == 'jruby'
    spec.platform = 'java'
    spec.licenses      += ["EPL-2.0", "LGPL-2.1"]
    spec.files += Dir["lib/nkf.jar"]
  else
    spec.extensions    = ["ext/nkf/extconf.rb"]
  end

  spec.bindir        = "exe"
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]
end
