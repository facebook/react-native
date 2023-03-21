# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class CodegenScriptPhaseExtractor
    def initialize()
    end

    def extract_script_phase(options)
        get_script_phases_with_codegen_discovery(options)
    end
end
