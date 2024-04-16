
if ENV['COVERAGE']
  require 'simplecov'
  SimpleCov.start
end

require 'bundler/setup'

Bundler.setup :test

$LOAD_PATH.unshift(File.dirname(__FILE__))
$LOAD_PATH.unshift(File.join(File.dirname(__FILE__), '..', 'lib'))

require 'algoliasearch'
require 'rspec'
require 'webmock/rspec'
require 'algolia/webmock'
require 'time'

raise 'missing ALGOLIA_APPLICATION_ID or ALGOLIA_API_KEY environment variables' if ENV['ALGOLIA_APPLICATION_ID'].nil? || ENV['ALGOLIA_API_KEY'].nil?
Algolia.init :application_id => ENV['ALGOLIA_APPLICATION_ID'], :api_key => ENV['ALGOLIA_API_KEY']

RSpec.configure do |config|
  config.mock_with :rspec

  config.before(:suite) do
    WebMock.disable!
  end

  config.after(:suite) do
    WebMock.disable!
  end
end

# avoid concurrent access to the same index
def safe_index_name(name)
  return name if ENV['TRAVIS'].to_s != "true"
  id = ENV['TRAVIS_JOB_NUMBER']
  "TRAVIS_RUBY_#{name}-#{id}"
end

# avoid concurrent access to the same index and follows the CTS standards.
def index_name(name)
  date = DateTime.now.strftime('%Y-%m-%d_%H:%M:%S')

  instance = ENV['TRAVIS'].to_s == 'true' ? ENV['TRAVIS_JOB_NUMBER'] : 'unknown'

  'ruby_%s_%s_%s' % [date, instance, name]
end

def auto_retry(options = {})
  return if !block_given?

  max_retry = options[:max_retry] || 10
  retry_count = 0

  loop do
    begin
      return yield
    rescue => e
      retry_count += 1
      if retry_count >= max_retry
        raise e
      else
        sleep retry_count
      end
    end
  end
end
