# frozen_string_literal: true

begin
  require "builder"
rescue LoadError => e
  $stderr.puts "You don't have builder installed in your application. Please add it to your Gemfile and run bundle install"
  raise e
end
