require 'spec_helper'

describe Typhoeus::Errors::NoStub do
  let(:base_url) { "localhost:3001" }
  let(:request) { Typhoeus::Request.new(base_url) }
  let(:message) { "The connection is blocked and no stub defined: " }

  subject { Typhoeus::Errors::NoStub }

  it "displays the request url" do
    expect { raise subject.new(request) }.to raise_error(subject, message + base_url)
  end
end
