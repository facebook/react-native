# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

##
# Returns the absolute path to the specified npm package, searching from the
# given base directory. This function uses Node's module resolution algorithm
# searching "node_modules" in the base directory and its ancestors. If no
# matching package is found, this function returns an empty string.
#
# The first argument to this function is the base directory from which to begin
# searching. The second argument is the name of the npm package.
#
# Ex: $(call find-node-module,$(LOCAL_PATH),hermes-engine)
###
define find-node-module
$(strip \
	$(eval _base := $(strip $(1))) \
	$(eval _package := $(strip $(2))) \
	$(eval _candidate := $(abspath $(_base)/node_modules/$(_package))) \
	$(if $(realpath $(_candidate)), \
		$(_candidate), \
		$(if $(_base), \
				$(call find-node-module,$(patsubst %/,%,$(dir $(_base))),$(_package)) \
		) \
	) \
)
endef
