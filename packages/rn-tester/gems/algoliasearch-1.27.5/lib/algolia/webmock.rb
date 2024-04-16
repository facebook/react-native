begin
  require 'webmock'
rescue LoadError
  puts 'WebMock was not found, please add "gem \'webmock\'" to your Gemfile.'
  exit 1
end

module Algolia
  class WebMock
    def self.mock!
      # list indexes
      ::WebMock.stub_request(:get, /.*\.algolia(net\.com|\.net)\/1\/indexes/).to_return(:body => '{ "items": [] }')
      # query index
      ::WebMock.stub_request(:get, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+/).to_return(:body => '{ "hits": [ { "objectID": 42 } ], "page": 1, "hitsPerPage": 1, "nbHits": 1, "nbPages": 1 }')
      # delete index
      ::WebMock.stub_request(:delete, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+/).to_return(:body => '{ "taskID": 42 }')
      # clear index
      ::WebMock.stub_request(:post, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/clear/).to_return(:body => '{ "taskID": 42 }')
      # add object
      ::WebMock.stub_request(:post, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+/).to_return(:body => '{ "taskID": 42 }')
      # save object
      ::WebMock.stub_request(:put, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/[^\/]+/).to_return(:body => '{ "taskID": 42 }')
      # partial update
      ::WebMock.stub_request(:put, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/[^\/]+\/partial/).to_return(:body => '{ "taskID": 42 }')
      # get object
      ::WebMock.stub_request(:get, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/[^\/]+/).to_return(:body => '{}')
      # delete object
      ::WebMock.stub_request(:delete, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/[^\/]+/).to_return(:body => '{ "taskID": 42 }')
      # batch
      ::WebMock.stub_request(:post, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/batch/).to_return(:body => '{ "taskID": 42 }')
      # settings
      ::WebMock.stub_request(:get, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/settings/).to_return(:body => '{}')
      ::WebMock.stub_request(:put, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/settings/).to_return(:body => '{ "taskID": 42 }')
      # browse
      ::WebMock.stub_request(:get, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/browse/).to_return(:body => '{ "hits": [] }')
      # operations
      ::WebMock.stub_request(:post, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/operation/).to_return(:body => '{ "taskID": 42 }')
      # tasks
      ::WebMock.stub_request(:get, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/task\/[^\/]+/).to_return(:body => '{ "status": "published" }')
      # index keys
      ::WebMock.stub_request(:post, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/keys/).to_return(:body => '{ }')
      ::WebMock.stub_request(:get, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/keys/).to_return(:body => '{ "keys": [] }')
      # global keys
      ::WebMock.stub_request(:post, /.*\.algolia(net\.com|\.net)\/1\/keys/).to_return(:body => '{ }')
      ::WebMock.stub_request(:get, /.*\.algolia(net\.com|\.net)\/1\/keys/).to_return(:body => '{ "keys": [] }')
      ::WebMock.stub_request(:get, /.*\.algolia(net\.com|\.net)\/1\/keys\/[^\/]+/).to_return(:body => '{ }')
      ::WebMock.stub_request(:delete, /.*\.algolia(net\.com|\.net)\/1\/keys\/[^\/]+/).to_return(:body => '{ }')
      # query POST
      ::WebMock.stub_request(:post, /.*\.algolia(net\.com|\.net)\/1\/indexes\/[^\/]+\/query/).to_return(:body => '{ "hits": [ { "objectID": 42 } ], "page": 1, "hitsPerPage": 1, "nbHits": 1, "nbPages": 1 }')
    end
  end
end

Algolia::WebMock.mock!
