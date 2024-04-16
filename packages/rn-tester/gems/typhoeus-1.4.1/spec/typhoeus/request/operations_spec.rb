require 'spec_helper'

describe Typhoeus::Request::Operations do
  let(:base_url) { "localhost:3001" }
  let(:options) { {} }
  let(:request) { Typhoeus::Request.new(base_url, options) }

  describe "#run" do
    let(:easy) { Ethon::Easy.new }
    before { expect(Typhoeus::Pool).to receive(:get).and_return(easy) }

    it "grabs an easy" do
      request.run
    end

    it "generates settings" do
      expect(easy).to receive(:http_request)
      request.run
    end

    it "performs" do
      expect(easy).to receive(:perform)
      request.run
    end

    it "sets response" do
      request.run
      expect(request.response).to be
    end

    it "releases easy" do
      expect(Typhoeus::Pool).to receive(:release)
      request.run
    end

    it "calls on_body" do
      on_body_called = false
      request.on_body { |body, response| on_body_called = true }
      request.run
      expect(on_body_called).to be_truthy
      expect(request.response.body).to satisfy { |v| v.nil? || v == '' }
    end

    it "makes response headers available to on_body" do
      headers = nil
      request.on_body { |body, response| headers = response.headers }
      request.run
      expect(headers).to be
      expect(headers).to eq(request.response.headers)
    end

    it "calls on_headers and on_body" do
      headers = nil
      request.on_headers { |response| headers = response.headers }
      request.on_body { |body, response| expect(headers).not_to be_nil ; expect(response.headers).to eq(headers) }
      request.on_complete { |response| expect(response).not_to be_nil ; expect(response.headers).to eq(headers) ; expect(response.body).to be_empty }
      request.run
    end

    it "calls on_headers and on_complete" do
      headers = nil
      request.on_headers { |response| headers = response.headers }
      request.on_complete { |response| expect(response).not_to be_nil ; expect(response.headers).to eq(headers) ; expect(response.body).not_to be_empty }
      request.run
    end

    it "calls on_complete" do
      callback = double(:call)
      expect(callback).to receive(:call)
      request.instance_variable_set(:@on_complete, [callback])
      request.run
    end

    it "returns a response" do
      expect(request.run).to be_a(Typhoeus::Response)
    end
  end

  describe "#finish" do
    let(:response) { Typhoeus::Response.new }

    it "assigns response" do
      request.finish(response)
      expect(request.response).to be(response)
    end

    it "assigns request to response" do
      request.finish(response)
      expect(request.response.request).to be(request)
    end

    it "executes callbacks" do
      expect(request).to receive(:execute_callbacks)
      request.finish(response)
    end

    it "returns response" do
      expect(request.finish(response)).to be(response)
    end
  end
end
