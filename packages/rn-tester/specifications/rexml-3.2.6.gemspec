# -*- encoding: utf-8 -*-
# stub: rexml 3.2.6 ruby lib

Gem::Specification.new do |s|
  s.name = "rexml".freeze
  s.version = "3.2.6"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Kouhei Sutou".freeze]
  s.date = "2023-07-27"
  s.description = "An XML toolkit for Ruby".freeze
  s.email = ["kou@cozmixng.org".freeze]
  s.extra_rdoc_files = ["LICENSE.txt".freeze, "NEWS.md".freeze, "README.md".freeze, "doc/rexml/context.rdoc".freeze, "doc/rexml/tasks/rdoc/child.rdoc".freeze, "doc/rexml/tasks/rdoc/document.rdoc".freeze, "doc/rexml/tasks/rdoc/element.rdoc".freeze, "doc/rexml/tasks/rdoc/node.rdoc".freeze, "doc/rexml/tasks/rdoc/parent.rdoc".freeze, "doc/rexml/tasks/tocs/child_toc.rdoc".freeze, "doc/rexml/tasks/tocs/document_toc.rdoc".freeze, "doc/rexml/tasks/tocs/element_toc.rdoc".freeze, "doc/rexml/tasks/tocs/master_toc.rdoc".freeze, "doc/rexml/tasks/tocs/node_toc.rdoc".freeze, "doc/rexml/tasks/tocs/parent_toc.rdoc".freeze, "doc/rexml/tutorial.rdoc".freeze]
  s.files = ["LICENSE.txt".freeze, "NEWS.md".freeze, "README.md".freeze, "doc/rexml/context.rdoc".freeze, "doc/rexml/tasks/rdoc/child.rdoc".freeze, "doc/rexml/tasks/rdoc/document.rdoc".freeze, "doc/rexml/tasks/rdoc/element.rdoc".freeze, "doc/rexml/tasks/rdoc/node.rdoc".freeze, "doc/rexml/tasks/rdoc/parent.rdoc".freeze, "doc/rexml/tasks/tocs/child_toc.rdoc".freeze, "doc/rexml/tasks/tocs/document_toc.rdoc".freeze, "doc/rexml/tasks/tocs/element_toc.rdoc".freeze, "doc/rexml/tasks/tocs/master_toc.rdoc".freeze, "doc/rexml/tasks/tocs/node_toc.rdoc".freeze, "doc/rexml/tasks/tocs/parent_toc.rdoc".freeze, "doc/rexml/tutorial.rdoc".freeze]
  s.homepage = "https://github.com/ruby/rexml".freeze
  s.licenses = ["BSD-2-Clause".freeze]
  s.rdoc_options = ["--main".freeze, "README.md".freeze]
  s.required_ruby_version = Gem::Requirement.new(">= 2.5.0".freeze)
  s.rubygems_version = "3.1.6".freeze
  s.summary = "An XML toolkit for Ruby".freeze

  s.installed_by_version = "3.1.6" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4
  end

  if s.respond_to? :add_runtime_dependency then
    s.add_development_dependency(%q<bundler>.freeze, [">= 0"])
    s.add_development_dependency(%q<rake>.freeze, [">= 0"])
    s.add_development_dependency(%q<test-unit>.freeze, [">= 0"])
  else
    s.add_dependency(%q<bundler>.freeze, [">= 0"])
    s.add_dependency(%q<rake>.freeze, [">= 0"])
    s.add_dependency(%q<test-unit>.freeze, [">= 0"])
  end
end
