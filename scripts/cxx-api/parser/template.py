# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


class Template:
    def __init__(self, type: str, name: str, value: str | None) -> None:
        self.type: str = type
        self.name: str = name
        self.value: str | None = value

    def to_string(self) -> str:
        if self.value is None:
            return f"{self.type} {self.name}"
        else:
            return f"{self.type} {self.name} = {self.value}"


class TemplateList:
    def __init__(self) -> None:
        self.templates: [Template] = []

    def add(self, template: Template) -> None:
        self.templates.append(template)

    def to_string(self) -> str:
        return f"template <{', '.join([template.to_string() for template in self.templates])}>"
