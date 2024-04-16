require File.expand_path("../lib/#{File.basename(__FILE__, '.gemspec')}/version", __FILE__)

Gem::Specification.new do |s|
  s.name = 'ffi'
  s.version = FFI::VERSION
  s.author = 'Wayne Meissner'
  s.email = 'wmeissner@gmail.com'
  s.homepage = 'https://github.com/ffi/ffi/wiki'
  s.summary = 'Ruby FFI'
  s.description = 'Ruby FFI library'
  if s.respond_to?(:metadata)
    s.metadata['bug_tracker_uri'] = 'https://github.com/ffi/ffi/issues'
    s.metadata['changelog_uri'] = 'https://github.com/ffi/ffi/blob/master/CHANGELOG.md'
    s.metadata['documentation_uri'] = 'https://github.com/ffi/ffi/wiki'
    s.metadata['wiki_uri'] = 'https://github.com/ffi/ffi/wiki'
    s.metadata['source_code_uri'] = 'https://github.com/ffi/ffi/'
    s.metadata['mailing_list_uri'] = 'http://groups.google.com/group/ruby-ffi'
  end
  s.files = `git ls-files -z`.split("\x0").reject do |f|
    f =~ /^(\.|bench|gen|libtest|nbproject|spec)/
  end

  # Add libffi git files
  lfs = `git --git-dir ext/ffi_c/libffi/.git ls-files -z`.split("\x0")
  # Add autoconf generated files of libffi
  lfs += %w[ compile configure config.guess config.sub install-sh ltmain.sh missing fficonfig.h.in ]
  # Add automake generated files of libffi
  lfs += `git --git-dir ext/ffi_c/libffi/.git ls-files -z *.am */*.am`.gsub(".am\0", ".in\0").split("\x0")
  s.files += lfs.map do |f|
    File.join("ext/ffi_c/libffi", f)
  end

  s.extensions << 'ext/ffi_c/extconf.rb'
  s.rdoc_options = %w[--exclude=ext/ffi_c/.*\.o$ --exclude=ffi_c\.(bundle|so)$]
  s.license = 'BSD-3-Clause'
  s.require_paths << 'ext/ffi_c'
  s.required_ruby_version = '>= 2.5'
  s.add_development_dependency 'rake', '~> 13.0'
  s.add_development_dependency 'rake-compiler', '~> 1.1'
  s.add_development_dependency 'rake-compiler-dock', '~> 1.0'
  s.add_development_dependency 'rspec', '~> 2.14.1'
end
