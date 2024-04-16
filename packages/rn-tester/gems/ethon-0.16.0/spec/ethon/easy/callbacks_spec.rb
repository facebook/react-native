# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy::Callbacks do
  let!(:easy) { Ethon::Easy.new }

  describe "#set_callbacks" do
    before do
      expect(Ethon::Curl).to receive(:set_option).exactly(3).times
    end

    it "sets write-, debug-, and headerfunction" do
      easy.set_callbacks
    end

    it "resets @response_body" do
      easy.set_callbacks
      expect(easy.instance_variable_get(:@response_body)).to eq("")
    end

    it "resets @response_headers" do
      easy.set_callbacks
      expect(easy.instance_variable_get(:@response_headers)).to eq("")
    end

    it "resets @debug_info" do
      easy.set_callbacks
      expect(easy.instance_variable_get(:@debug_info).to_a).to eq([])
    end
  end

  describe "#progress_callback" do
    it "returns 0" do
      expect(easy.progress_callback.call(0,1,1,1,1)).to be(0)
    end
  end

  describe "#body_write_callback" do
    let(:body_write_callback) { easy.instance_variable_get(:@body_write_callback) }
    let(:stream) { double(:read_string => "") }
    context "when body returns not :abort" do
      it "returns number bigger than 0" do
        expect(body_write_callback.call(stream, 1, 1, nil) > 0).to be(true)
      end
    end

    context "when body returns :abort" do
      before do
        easy.on_body.clear
        easy.on_body { :abort }
      end
      let(:body_write_callback) { easy.instance_variable_get(:@body_write_callback) }

      it "returns -1 to indicate abort to libcurl" do
        expect(body_write_callback.call(stream, 1, 1, nil)).to eq(-1)
      end
    end
  end

  describe "#header_write_callback" do
    let(:header_write_callback) { easy.instance_variable_get(:@header_write_callback) }
    let(:stream) { double(:read_string => "") }
    context "when header returns not :abort" do
      it "returns number bigger than 0" do
        expect(header_write_callback.call(stream, 1, 1, nil) > 0).to be(true)
      end
    end

    context "when header returns :abort" do
      before do
        easy.on_headers.clear
        easy.on_headers { :abort }
      end
      let(:header_write_callback) { easy.instance_variable_get(:@header_write_callback) }

      it "returns -1 to indicate abort to libcurl" do
        expect(header_write_callback.call(stream, 1, 1, nil)).to eq(-1)
      end
    end
  end
end
