$LOAD_PATH.unshift File.expand_path("../../lib", __dir__)

require_relative "object_binsize"
require "public_suffix"

list = PublicSuffix::List.default
puts "#{list.size} rules:"

prof = ObjectBinsize.new
prof.report(PublicSuffix::List.default, label: "PublicSuffix::List size")
prof.report(PublicSuffix::List.default.instance_variable_get(:@rules), label: "Size of rules")
