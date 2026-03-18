# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, TypeVar

from natsort import natsort_keygen

if TYPE_CHECKING:
    from .scope import Scope

# Pre-create natsort key function for efficiency
_natsort_key = natsort_keygen()


class ScopeKind(ABC):
    def __init__(self, name) -> None:
        self.name: str = name

    @abstractmethod
    def to_string(self, scope: Scope) -> str:
        pass

    def close(self, scope: Scope) -> None:
        """Called when the scope is closed. Override to perform cleanup."""
        pass

    def print_scope(self, scope: Scope) -> None:
        print(self.to_string(scope))


ScopeKindT = TypeVar("ScopeKindT", bound=ScopeKind)
