/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

"use strict";

var fs = require("fs");
var glob = require("glob");
var mkdirp = require("mkdirp");
var optimist = require("optimist");
var path = require("path");
var removeMd = require("remove-markdown");
var extractDocs = require("./extractDocs");
var argv = optimist.argv;
var slugify = require("../core/slugify");

/* =========== Utils =========== */

function backtickify(str) {
  var escaped =
    "`" +
    str
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/{/g, "\\{") +
    "`";
  // Replace require( with require\( so node-haste doesn't replace example
  // require calls in the docs
  return escaped.replace(/require\(/g, "require\\(");
}

function removeCommentsFromDocblock(docblock) {
  return docblock
    .trim("\n ")
    .replace(/^\/\*+/, "")
    .replace(/\*\/$/, "")
    .split("\n")
    .map(function(line) {
      return line.trim().replace(/^\* ?/, "");
    })
    .join("\n");
}

function removeLineBreaks(content) {
  if (content) {
    return content.trim("").replace(/\n/g, "");
  }

  return content;
}

// Filesystem

function rmFile(file) {
  try {
    fs.unlinkSync(file);
  } catch (e) {
    /* seriously, unlink throws when the file doesn't exist :( */
  }
}

function writeFileAndCreateFolder(file, content) {
  mkdirp.sync(file.replace(new RegExp("/[^/]*$"), ""));
  fs.writeFileSync(file, content);
}

// Sorting
function sortByRequired(props, nameA, nameB) {
  var a = props[nameA];
  var b = props[nameB];

  if (a.required && !b.required) {
    return -1;
  }
  if (b.required && !a.required) {
    return 1;
  }

  if (a.deprecationMessage && !b.deprecationMessage) {
    return 1;
  }

  if (b.deprecationMessage && !a.deprecationMessage) {
    return -1;
  }

  return 0;
}

function sortByPlatform(props, nameA, nameB) {
  var a = props[nameA];
  var b = props[nameB];

  if (a.platforms && !b.platforms) {
    return 1;
  }
  if (b.platforms && !a.platforms) {
    return -1;
  }

  // Cheap hack: use < on arrays of strings to compare the two platforms
  if (a.platforms < b.platforms) {
    return -1;
  }
  if (a.platforms > b.platforms) {
    return 1;
  }

  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  return 0;
}

// Types

function getNamedTypes(typedefs) {
  const namedTypes = {};
  typedefs &&
    typedefs.forEach(typedef => {
      if (typedef.name) {
        const type = typedef.name.toLowerCase();
        namedTypes[type] = 1;
      }
    });
  return namedTypes;
}

function extractPlatformFromProps(props) {
  for (var key in props) {
    var prop = props[key];
    var description = prop.description || "";
    var platforms = description.match(/\@platform (.+)/);
    var platformArray = [];
    if (platforms) {
      platformArray = platforms[1].replace(/ /g, "").split(",");
    }
    description = description.replace(/\@platform (.+)/, "");

    prop.description = description;
    prop.platforms = platformArray;
  }
}

function renderTypehintRec(typehint) {
  if (typehint.type === "simple") {
    return typehint.value;
  }

  if (typehint.type === "generic") {
    return (
      renderTypehintRec(typehint.value[0]) +
      "<" +
      renderTypehintRec(typehint.value[1]) +
      ">"
    );
  }

  return JSON.stringify(typehint);
}

function renderTypehint(typehint) {
  if (typeof typehint === "object" && typehint.name) {
    return renderType(typehint);
  }
  try {
    var typehint = JSON.parse(typehint);
  } catch (e) {
    return typehint;
  }

  return renderTypehintRec(typehint);
}

function renderTypeNameLink(typeName, docPath, namedTypes) {
  const ignoreTypes = [
    "string",
    "number",
    "boolean",
    "object",
    "function",
    "array"
  ];
  const typeNameLower = typeName.toLowerCase();
  if (ignoreTypes.indexOf(typeNameLower) !== -1 || !namedTypes[typeNameLower]) {
    return typeName;
  }
  return "[" + typeName + "](" + docPath + "#" + typeNameLower + ")";
}

function renderTypeWithLinks(type, docTitle, namedTypes) {
  if (!type || !type.names) {
    return "";
  }

  const docPath = docTitle
    ? "docs/" + docTitle.toLowerCase() + ".html"
    : "docs/";

  return type.names.map(typeName =>
    renderTypeNameLink(typeName, docPath, namedTypes)
  );
}

/* =========== Markdown Generation =========== */

function splitHeader(content) {
  var lines = content.split(/\r?\n/);
  for (var i = 1; i < lines.length - 1; ++i) {
    if (lines[i] === "---") {
      break;
    }
  }
  return {
    header: i < lines.length - 1 ? lines.slice(1, i + 1).join("\n") : null,
    content: lines.slice(i + 1).join("\n")
  };
}

// Extract markdown metadata header
function extractMetadata(content) {
  var metadata = {};
  var both = splitHeader(content);
  var lines = both.header.split("\n");
  for (var i = 0; i < lines.length - 1; ++i) {
    var keyvalue = lines[i].split(":");
    var key = keyvalue[0].trim();
    var value = keyvalue
      .slice(1)
      .join(":")
      .trim();
    // Handle the case where you have "Community #10"
    try {
      value = JSON.parse(value);
    } catch (e) {}
    metadata[key] = value;
  }
  return { metadata: metadata, rawContent: both.content };
}

function generateMarkdownTOCForReferences(references, apiDoc) {
  if (!references || !references.length) {
    return "";
  }

  let markdown = "";
  references
    .filter(ref => {
      return ref.name[0] !== "_";
    })
    .map(ref => {
      markdown +=
        "- [`" +
        ref.name +
        "`](docs/" +
        slugify(apiDoc) +
        ".html#" +
        slugify(ref.name) +
        ")\n";
    });

  return markdown;
}
function buildFrontmatter(metadata) {
  return [
    "---",
    "id: " + metadata.id,
    "title: " + metadata.title,
    "layout: docs", // Force all to use regular docs layout
    "category: " + metadata.category,
    "permalink: " + metadata.permalink,
    "next: " + metadata.next,
    "previous: " + metadata.previous,
    "---"
  ];
}

function generateMarkdownForTable(rows) {
  let markdown = "";
  rows.forEach(items => {
    markdown += "| " + items.join(" | ") + " |\n";
  });
  return markdown + "\n\n";
}

function renderEnumValue(value) {
  // Use single quote strings even when we are given double quotes
  if (value.match(/^"(.+)"$/)) {
    return "'" + value.slice(1, -1) + "'";
  }
  return value;
}

function renderType(type) {
  const baseType = renderBaseType(type);
  return type.nullable ? "[" + baseType + "]" : baseType;
}

var styleReferencePattern = /^[^.]+\.propTypes\.style$/;

function renderBaseType(type) {
  if (type.name === "enum") {
    if (typeof type.value === "string") {
      return type.value;
    }
    return (
      "enum(" + type.value.map(v => renderEnumValue(v.value)).join(", ") + ")"
    );
  }

  if (type.name === "$Enum") {
    if (type.elements[0].signature.properties) {
      return type.elements[0].signature.properties
        .map(p => `'${p.key}'`)
        .join(" ‖ ");
    }
    return type.name;
  }

  if (type.name === "shape") {
    return (
      "object: {" +
      spanJoinMapper(
        Object.keys(type.value),
        key => key + ": " + renderType(type.value[key]),
        ""
      ) +
      "}"
    );
  }

  if (type.name === "union") {
    if (type.value) {
      return spanJoinMapper(type.value, renderType, ", ");
    }
    return spanJoinMapper(type.elements, renderType, " ‖ ");
  }

  if (type.name === "arrayOf") {
    return "array of " + renderType(type.value);
  }

  if (type.name === "instanceOf") {
    return type.value;
  }

  if (type.name === "custom") {
    if (styleReferencePattern.test(type.raw)) {
      var name = type.raw.substring(0, type.raw.indexOf("."));
      return "[" + name + "](docs/" + slugify(name) + ".html#style)";
    }
    if (type.raw === "ColorPropType") {
      return "[color](docs/colors.html)";
    }
    if (type.raw === "EdgeInsetsPropType") {
      return "object: {top: number, left: number, bottom: number, right: number}";
    }
    return type.raw;
  }

  if (type.name === "stylesheet") {
    return "style";
  }

  if (type.name === "func") {
    return "function";
  }

  if (type.name === "signature") {
    return type.raw;
  }

  return type.raw || type.name;
}

function spanJoinMapper(elements, callback, separator) {
  return (
    "" +
    elements.map((rawElement, ii) => {
      const el = callback(rawElement);
      return ii + 1 < elements.length ? "" + el + separator + "" : el;
    }) +
    ""
  );
}

/* =========== <Method/> =========== */

function generateMarkdownReferenceForMethodExamples(examples) {
  if (!examples || !examples.length) {
    return "";
  }

  return examples.map(example => {
    const re = /<caption>(.*?)<\/caption>/gi;
    const result = re.exec(example);
    const caption = result ? result[1] + ":" : "Example:";
    const code = example
      .replace(/<caption>.*?<\/caption>/gi, "")
      .replace(/^\n\n/, "");

    return "\n\n" + caption + "\n\n```javascript\n" + code + "\n```\n\n";
  });
}

function generateMarkdownReferenceForMethodParameters(
  params,
  apiDoc,
  namedTypes
) {
  if (!params || !params.length) {
    return "";
  }

  if (!params[0].type || !params[0].type.names) {
    return "";
  }

  const foundDescription = params.find(p => p.description);
  if (!foundDescription) {
    return "";
  }

  let tableRows = [
    ["Name", "Type", "Required", "Description"],
    ["-", "-", "-", "-"]
  ];
  params
    .filter(param => {
      return param.name[0] !== "_";
    })
    .map(param => {
      let tableRowItems = [];
      tableRowItems.push(param.name);
      tableRowItems.push(renderTypeWithLinks(param.type, apiDoc, namedTypes));
      tableRowItems.push(param.optional ? "Yes" : "No");
      tableRowItems.push(removeLineBreaks(param.description));
      tableRows.push(tableRowItems);
    });

  if (tableRows.length < 3) {
    return "";
  }

  return "**Parameters:**\n\n" + generateMarkdownForTable(tableRows);
}

function generateMarkdownReferenceForMethod(method, apiDoc, namedTypes) {
  let markdown = "";

  markdown += "### `" + method.name + "()`\n\n";

  let modifiers = "";
  if (method.modifiers && method.modifiers.length > 0) {
    modifiers = method.modifiers.join(" ") + " ";
  }

  let signatureParams = "";
  const params = method.params;
  if (params && params.length) {
    signatureParams = params
      .map(param => {
        var res = "";
        if (param.optional) {
          res += "[" + param.name + "]";
        } else {
          res += param.name;
        }
        param.type &&
          param.type.names &&
          (res += ": " + param.type.names.join(", "));
        return res;
      })
      .join(", ");
  }

  let methodReturns = "";
  if (method.returns && method.returns.type) {
    methodReturns += ": " + renderTypehint(method.returns.type);
  }

  markdown +=
    "```javascript\n" +
    modifiers +
    method.name +
    "(" +
    signatureParams +
    ")" +
    methodReturns +
    "\n```\n\n";

  if (method.description) {
    markdown += method.description + "\n\n";
  } else if (method.docblock) {
    markdown += removeCommentsFromDocblock(method.docblock) + "\n\n";
  }

  markdown += generateMarkdownReferenceForMethodParameters(
    method.params,
    apiDoc,
    namedTypes
  );
  markdown += generateMarkdownReferenceForMethodExamples(method.examples);

  return markdown;
}

function generateMarkdownReferenceForMethods(methods, apiDoc, namedTypes) {
  if (!methods || !methods.length) {
    return "";
  }

  let markdownForMethods = [];
  methods
    .filter(method => {
      return method.name[0] !== "_";
    })
    .map(method => {
      markdownForMethods.push(
        generateMarkdownReferenceForMethod(method, apiDoc, namedTypes)
      );
    });

  return markdownForMethods.join("\n\n---\n\n");
}

/* =========== <TypeDef/> =========== */

function generateMarkdownForTypeDefValues(values) {
  if (!values || !values.length) {
    return "";
  }
  if (!values[0].type || !values[0].type.names) {
    return "";
  }

  let tableRows = [["Value", "Description"], ["-", "-"]];
  values.map(value => {
    let tableRowItems = [];
    tableRowItems.push(removeLineBreaks(value.name));
    tableRowItems.push(removeLineBreaks(value.description));
    tableRows.push(tableRowItems);
  });

  if (tableRows.length < 3) {
    return "";
  }

  return "**Constants:**\n\n" + generateMarkdownForTable(tableRows);
}

function generateMarkdownReferenceForTypeDefs(typedefs, apiDoc, namedTypes) {
  if (!typedefs || !typedefs.length) {
    return "";
  }

  let markdownForTypeDefs = [];
  typedefs.map(typedef => {
    markdownForTypeDefs.push(
      generateMarkdownForTypeDef(typedef, apiDoc, namedTypes)
    );
  });

  return markdownForTypeDefs.join("\n\n---\n\n");
}

function generateMarkdownForTypeDef(typedef, apiDoc, namedTypes) {
  let markdown = "";

  const { name, description, type, properties, values } = typedef;

  markdown += "### " + name + "\n\n";
  if (description) {
    markdown += description + "\n\n";
  }

  const tableRows = [["Type"], ["-"], [type.names.join(", ")]];
  markdown += generateMarkdownForTable(tableRows);

  markdown += generateMarkdownForTypeDefProperties(
    properties,
    apiDoc,
    namedTypes
  );
  markdown += generateMarkdownForTypeDefValues(values);

  return markdown;
}

function generateMarkdownForTypeDefProperties(properties, apiDoc, namedTypes) {
  if (!properties || !properties.length) {
    return "";
  }

  if (!properties[0].type || !properties[0].type.names) {
    return "";
  }

  let tableRows = [["Name", "Type", "Description"], ["-", "-", "-"]];
  properties
    .filter(property => {
      return property.name[0] !== "_";
    })
    .map(property => {
      let tableRowItems = [];
      tableRowItems.push(
        property.optional ? "[" + property.name + "]" : property.name
      );
      tableRowItems.push(
        renderTypeWithLinks(property.type, apiDoc, namedTypes)
      );
      tableRowItems.push(removeLineBreaks(property.description));
      tableRows.push(tableRowItems);
    });

  if (tableRows.length < 3) {
    return "";
  }

  return "**Properties:**\n\n" + generateMarkdownForTable(tableRows);
}

/* =========== ComponentDoc =========== */

function generateMarkdownForComponentDocProp(name, prop, props, content) {
  let markdown = "";
  if (name === undefined) {
    return markdown;
  }

  const { required, description, type, flowType } = prop;
  let renderedType = "";
  if (type || flowType) {
    renderedType = renderType(flowType || type);
  }

  markdown += "### `" + name + "`\n\n";

  if (prop.deprecationMessage) {
    markdown += "**Deprecated.** ";
    markdown += prop.deprecationMessage + "\n\n";
  }

  markdown += description + "\n\n";

  const hasPlatforms =
    prop.platforms !== undefined && prop.platforms.length > 0;

  let tableHeader = ["Type", "Required"];
  let tableInfoRow = [renderedType, required ? "Yes" : "No"];
  if (hasPlatforms) {
    tableHeader.push("Platform");
    tableInfoRow.push(prop.platforms.map(platform => `${platform} `));
  }

  const tableRows = [tableHeader, tableHeader.map(() => "-"), tableInfoRow];
  markdown += generateMarkdownForTable(tableRows);

  if (prop.type && prop.type.name === "stylesheet") {
    const stylesheetName = prop.type.value;
    const style = content.styles[stylesheetName];
    extractPlatformFromProps(style.props);
    markdown += generateMarkdownForComponentDocStyleProps(style);
  }

  markdown += "\n\n";
  return markdown;
}

function generateMarkdownForComponentDocStyleProp(name, prop) {
  let markdown = "";

  let renderedType = "";
  if (prop.type) {
    renderedType = renderType(prop.type);
  }
  const hasPlatforms = prop.platforms !== null && prop.platforms.length > 0;

  markdown += "  - **`" + name + "`**: " + renderedType;

  if (hasPlatforms) {
    markdown +=
      " (" + prop.platforms.map(platform => `_${platform}_`).join(", ") + ")";
  }
  markdown += "\n\n";

  if (prop.description) {
    markdown += "    " + prop.description.replace(/\n/g, "\n    ") + "\n\n";
  }

  return markdown;
}

function generateMarkdownForComponentDocStyleProps(style) {
  let markdown = "";
  if (style.composes) {
    style.composes.map(name => {
      var link;
      if (name === "LayoutPropTypes") {
        name = "Layout Props";
        link = "docs/" + slugify(name) + ".html#props";
      } else if (name === "ShadowPropTypesIOS") {
        name = "Shadow Props";
        link = "docs/" + slugify(name) + ".html#props";
      } else if (name === "TransformPropTypes") {
        name = "Transforms";
        link = "docs/" + slugify(name) + ".html#props";
      } else {
        name = name.replace("StylePropTypes", " Style Props");
        link = "docs/" + slugify(name) + ".html#style";
      }

      markdown += "  - [" + name + "...](" + link + ")\n\n";
    });
  }

  Object.keys(style.props)
    .sort(sortByPlatform.bind(null, style.props))
    .sort(sortByRequired.bind(null, style.props))
    .map(name => {
      markdown += generateMarkdownForComponentDocStyleProp(
        name,
        style.props[name]
      );
    });

  return markdown;
}

function generateMarkdownTOCForComponentDocProps(props, content) {
  let markdown = "";

  if (content.composes) {
    content.composes.map(name => {
      markdown +=
        "* [" + name + " props...](docs/" + slugify(name) + ".html#props)\n";
    });
  }

  Object.keys(props)
    .sort(sortByPlatform.bind(null, props))
    .sort(sortByRequired.bind(null, props))
    .map(name => {
      markdown +=
        "- [`" +
        name +
        "`](docs/" +
        slugify(content.componentName) +
        ".html#" +
        slugify(name) +
        ")\n";
    });

  markdown += "\n\n";

  return markdown;
}

function generateMarkdownReferenceForComponentDocProps(props, content) {
  let markdownForProps = [];

  Object.keys(props)
    .sort(sortByPlatform.bind(null, props))
    .sort(sortByRequired.bind(null, props))
    .map(name => {
      markdownForProps.push(
        generateMarkdownForComponentDocProp(name, props[name], props, content)
      );
    });

  return markdownForProps.join("---\n\n");
}

function generateMarkdownForComponentDoc(content, apiDoc) {
  let markdown = "";

  const { description, props, styles, methods, typedef } = content;

  // Description
  if (description) {
    markdown += description + "\n\n";
  }

  const hasProps = props;
  const hasMethods =
    methods && methods.filter(method => method.name[0] !== "_").length > 0;
  const hasTypeDefs = typedef && typedef.length > 0;

  const namedTypes = getNamedTypes(content.typedef);

  if (hasProps) {
    extractPlatformFromProps(props);
    markdown += "### Props\n\n";
    markdown +=
      generateMarkdownTOCForComponentDocProps(props, content) + "\n\n";
  }
  if (hasMethods) {
    markdown += "### Methods\n\n";
    markdown += generateMarkdownTOCForReferences(methods, apiDoc) + "\n\n";
  }
  if (hasTypeDefs) {
    markdown += "### Type Definitions\n\n";
    markdown += generateMarkdownTOCForReferences(typedef, apiDoc) + "\n\n";
  }

  markdown += "\n\n---\n\n";
  markdown += "# Reference\n\n";

  if (hasProps) {
    markdown += "## Props\n\n";
    markdown +=
      generateMarkdownReferenceForComponentDocProps(props, content) + "\n\n";
  }
  if (hasMethods) {
    markdown += "## Methods\n\n";
    markdown +=
      generateMarkdownReferenceForMethods(methods, apiDoc, namedTypes) + "\n\n";
  }

  if (hasTypeDefs) {
    markdown += "## Type Definitions\n\n";
    markdown +=
      generateMarkdownReferenceForTypeDefs(typedef, apiDoc, content) + "\n\n";
  }

  return markdown;
}

/* =========== APIDoc =========== */

function generateMarkdownForAPIDoc(content, apiDoc) {
  let markdown = "";

  const { description, methods, properties, classes, typedef } = content;

  // Description
  if (content.docblock) {
    markdown += removeCommentsFromDocblock(content.docblock);
    markdown += "\n\n";
  } else if (
    content.class &&
    content.class.length &&
    content.class[0].description
  ) {
    markdown += content.class[0].description;
    markdown += "\n\n";
  }

  const namedTypes = getNamedTypes(content.typedef);

  const hasMethods =
    methods &&
    methods.filter(method => {
      return method.name[0] !== "_";
    }).length > 0;
  const hasProperties = properties && properties.length > 0;
  const hasClasses = classes && classes.length > 0;
  const hasTypeDefs = typedef && typedef.length > 0;

  if (hasMethods) {
    markdown += "### Methods\n\n";
    markdown += generateMarkdownTOCForReferences(methods, apiDoc) + "\n\n";
  }
  if (hasProperties) {
    markdown += "### Properties\n\n";
    markdown += generateMarkdownTOCForReferences(properties, apiDoc) + "\n\n";
  }
  if (hasClasses) {
    markdown += "### Classes\n\n";
    markdown += generateMarkdownTOCForReferences(classes, apiDoc) + "\n\n";
  }
  if (hasTypeDefs) {
    markdown += "### Type Definitions\n\n";
    markdown += generateMarkdownTOCForReferences(typedef, apiDoc) + "\n\n";
  }

  markdown += "\n\n---\n\n";
  markdown += "# Reference\n\n";

  if (hasMethods) {
    markdown += "## Methods\n\n";
    markdown +=
      generateMarkdownReferenceForMethods(methods, apiDoc, namedTypes) + "\n\n";
  }
  if (hasProperties) {
    markdown += "## Properties\n\n";
    markdown +=
      generateMarkdownReferenceForAPIDocProperties(properties) + "\n\n";
  }
  if (hasClasses) {
    markdown += "## Classes\n\n";
    markdown +=
      generateMarkdownReferenceForAPIDocClasses(classes, apiDoc, namedTypes) +
      "\n\n";
  }
  if (hasTypeDefs) {
    markdown += "## Type Definitions\n\n";
    markdown +=
      generateMarkdownReferenceForTypeDefs(typedef, apiDoc, namedTypes) +
      "\n\n";
  }

  return markdown;
}

function generateMarkdownReferenceForAPIDocProperty(property) {
  let markdown = "";
  markdown += "####" + property.name;

  if (property.type || property.flowType) {
    markdown += ": " + renderType(property.flowType || property.type);
  }
  markdown += "\n\n";

  if (property.docblock) {
    markdown += removeCommentsFromDocblock(property.docblock);
  }
}

function generateMarkdownReferenceForAPIDocProperties(properties) {
  if (!properties || !properties.length) {
    return "";
  }

  let markdownForProperties = [];
  properties
    .filter(property => {
      return property.name[0] !== "_";
    })
    .map(property => {
      markdownForProperties.push(
        generateMarkdownReferenceForAPIDocProperty(property)
      );
    });

  return markdownForProperties.join("\n\n---\n\n");
}

function generateMarkdownReferenceForAPIDocClass(cls, apiDoc, namedTypes) {
  let markdown = "";
  markdown += "## class " + cls.name;
  if (cls.docblock) {
    markdown += removeCommentsFromDocblock(cls.docblock) + "\n\n";
  }

  if (cls.methods && cls.methods.length > 0) {
    markdown +=
      "### Methods\n\n" +
      generateMarkdownReferenceForMethods(cls.methods, apiDoc, namedTypes);
  }
  if (cls.properties && cls.properties.length > 0) {
    markdown +=
      "### Properties\n\n" +
      generateMarkdownReferenceForAPIDocProperties(cls.properties);
  }

  return markdown;
}

function generateMarkdownReferenceForAPIDocClasses(
  classes,
  apiDoc,
  namedTypes
) {
  if (!classes || !classes.length) {
    return "";
  }

  let markdownForClasses = [];
  classes
    .filter(cls => {
      return cls.name[0] !== "_" && cls.ownerProperty[0] !== "_";
    })
    .map(cls => {
      markdownForClasses.push(
        generateMarkdownReferenceForAPIDocClass(cls, apiDoc, namedTypes)
      );
    });

  return markdownForClasses.join("\n\n---\n\n");
}

/* =========== Building Docs =========== */

function buildAutodocsFile(metadata, content) {
  console.log("[" + content.type + "] generating " + metadata.title);
  const body =
    content.type === "component" || content.type === "style"
      ? generateMarkdownForComponentDoc(content, metadata.title)
      : generateMarkdownForAPIDoc(content, metadata.title);

  const markdown = [...buildFrontmatter(metadata), body]
    .filter(function(line) {
      return line;
    })
    .join("\n");

  return markdown;
}

function buildDocsFile(metadata, rawContent) {
  const markdown = [...buildFrontmatter(metadata), rawContent]
    .filter(function(line) {
      return line;
    })
    .join("\n");

  return markdown;
}

function execute(options) {
  if (options === undefined) {
    options = {};
  }

  var DOCS_MD_DIR = "build/react-native-tags/docs";

  glob.sync("src/react-native/docs/*.*").forEach(rmFile);

  var metadatas = {
    files: []
  };

  function handleMarkdown(content, filename) {
    if (content.slice(0, 3) !== "---") {
      console.error(`Skipping non-markdown file: ${filename}:`);
      console.log(content);
      return;
    }

    const res = extractMetadata(content);
    const metadata = res.metadata;
    const rawContent = res.rawContent;

    if (metadata.sidebar !== false) {
      metadatas.files.push(metadata);
    }

    if (metadata.permalink && metadata.permalink.match(/^https?:/)) {
      return;
    }

    metadata.filename = filename;

    var layout =
      metadata.layout[0].toUpperCase() + metadata.layout.substr(1) + "Layout";

    let outputFile;
    if (layout === "DocsLayout") {
      outputFile = buildDocsFile(metadata, rawContent);
    } else if (layout == "AutodocsLayout") {
      outputFile = buildAutodocsFile(metadata, JSON.parse(rawContent));
    }

    writeFileAndCreateFolder(
      "build/react-native-docs/" + metadata.permalink.replace(/\.html$/, ".md"),
      outputFile
    );
  }

  extractDocs().forEach(function(content) {
    handleMarkdown(content, null);
  });

  var files = glob.sync(DOCS_MD_DIR + "**/*.md");
  files.forEach(function(file) {
    var content = fs.readFileSync(file, { encoding: "utf8" });
    handleMarkdown(content, path.basename(file));
  });

  // we need to pass globals for the components to be configurable
  // metadata is generated in this process which has access to process.env
  // but the web pages are generated in a sandbox context and have only access to CommonJS module files
  metadatas.config = Object.create(null);
  Object.keys(process.env)
    .filter(key => key.startsWith("RN_"))
    .forEach(key => {
      metadatas.config[key] = process.env[key];
    });
}

console.log("convert!");
execute();

module.exports = execute;
