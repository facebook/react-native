# frozen_string_literal: true

Dir.glob(File.expand_path("core_ext/*.rb", __dir__)).sort.each do |path|
  next if path.end_with?("core_ext/uri.rb")
  require path
end
