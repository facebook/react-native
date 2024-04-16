# frozen_string_literal: true

require 'bundler/gem_tasks'
require 'rspec/core/rake_task'

RSpec::Core::RakeTask.new(:spec)

task default: [:spec]

if RUBY_VERSION >= '2.1'
  require 'rubocop/rake_task'
  RuboCop::RakeTask.new
  task default: :rubocop
end

task :generate_nextstep_mappings do
  require 'net/http'
  url = 'http://ftp.unicode.org/Public/MAPPINGS/VENDORS/NEXT/NEXTSTEP.TXT'
  mappings = Net::HTTP.get(URI(url))
                      .lines
                      .grep(/^[^#$]/)
                      .map { |l| l.split("\t", 3) }
                      .reduce('') do |f, (ns, uc, cm)|
    f << "      #{ns} => #{uc}, #{cm}"
  end
  map = <<-RUBY
# frozen-string-literal: true
module Nanaimo
  module Unicode
    # Taken from #{url}
    NEXT_STEP_MAPPING = {
#{mappings}    }.freeze
  end
end
  RUBY
  File.open('lib/nanaimo/unicode/next_step_mapping.rb', 'w') { |f| f << map }
end

task :generate_quote_maps do
  quote_map = {
    "\a" => '\\a',
    "\b" => '\\b',
    "\f" => '\\f',
    "\r" => '\\r',
    "\t" => '\\t',
    "\v" => '\\v',
    "\n" => '\\n',
    %(') => "\\'",
    %(") => '\\"',
    '\\' => '\\\\'
  }

  unquote_map = quote_map.each_with_object("\n" => "\n") do |(value, escaped), map|
    map[escaped[1..-1]] = value
    map
  end
  quote_map.delete("'")

  0.upto(31) { |i| quote_map[[i].pack('U')] ||= format('\\U%04x', i) }
  quote_regexp = Regexp.union(quote_map.keys)

  dump_hash = proc do |hash, indent = 4|
    hash.reduce("{\n") { |dumped, (k, v)| dumped << "#{' ' * (indent + 2)}#{k.dump} => #{v.dump},\n" } << ' ' * indent << '}.freeze'
  end

  map = <<-RUBY
# frozen-string-literal: true
module Nanaimo
  module Unicode
    QUOTE_MAP = #{dump_hash[quote_map]}

    UNQUOTE_MAP = #{dump_hash[unquote_map]}

    QUOTE_REGEXP = #{quote_regexp.inspect}
  end
end
  RUBY

  File.open('lib/nanaimo/unicode/quote_maps.rb', 'w') { |f| f << map }
end
