$LOAD_PATH.unshift(File.dirname(__FILE__))
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), "..", "lib"))

require "bundler"
Bundler.setup
require "typhoeus"
require "rspec"

Dir[File.join(File.dirname(__FILE__), "support/**/*.rb")].each { |f| require f }

RSpec.configure do |config|
  config.order = :rand

  config.before(:suite) do
    LocalhostServer.new(TESTSERVER.new, 3001)
  end

  config.after do
    Typhoeus::Pool.clear
    Typhoeus::Expectation.clear
    Typhoeus.before.clear
    Typhoeus.on_complete.clear
    Typhoeus.on_success.clear
    Typhoeus.on_failure.clear
    Typhoeus::Config.verbose = false
    Typhoeus::Config.block_connection = false
    Typhoeus::Config.memoize = false
  end
end
