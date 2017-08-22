/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 *
 * @copyright Lea Verou <http://lea.verou.me>. MIT License.
 * @providesModule Prism
 * @noflow
 */

/* eslint-disable */

'use strict';

var React = require('React');

var _ = {
  util: {
    type: function(o) {
      return Object.prototype.toString
        .call(o)
        .match(/\[object (\w+)\]/)[1];
    },

    // Deep clone a language definition (e.g. to extend it)
    clone: function(o) {
      var type = _.util.type(o);

      switch (type) {
        case 'Object':
          var clone = {};

          for (var key in o) {
            if (o.hasOwnProperty(key)) {
              clone[key] = _.util.clone(o[key]);
            }
          }

          return clone;

        case 'Array':
          return o.slice();
      }

      return o;
    },
  },

  languages: {
    extend: function(id, redef) {
      var lang = _.util.clone(_.languages[id]);

      for (var key in redef) {
        lang[key] = redef[key];
      }

      return lang;
    },

    // Insert a token before another token in a language literal
    insertBefore: function(inside, before, insert, root) {
      root = root || _.languages;
      var grammar = root[inside];
      var ret = {};

      for (var token in grammar) {
        if (grammar.hasOwnProperty(token)) {
          if (token == before) {
            for (var newToken in insert) {
              if (insert.hasOwnProperty(newToken)) {
                ret[newToken] = insert[newToken];
              }
            }
          }

          ret[token] = grammar[token];
        }
      }

      return (root[inside] = ret);
    },

    // Traverse a language definition with Depth First Search
    DFS: function(o, callback) {
      for (var i in o) {
        callback.call(o, i, o[i]);

        if (_.util.type(o) === 'Object') {
          _.languages.DFS(o[i], callback);
        }
      }
    },
  },

  tokenize: function(text, grammar) {
    var Token = _.Token;

    var strarr = [text];

    var rest = grammar.rest;

    if (rest) {
      for (var token in rest) {
        grammar[token] = rest[token];
      }

      delete grammar.rest;
    }

    tokenloop: for (var token in grammar) {
      if (
        !grammar.hasOwnProperty(token) || !grammar[token]
      ) {
        continue;
      }

      var pattern = grammar[token],
        inside = pattern.inside,
        lookbehind = !!pattern.lookbehind,
        lookbehindLength = 0;

      pattern = pattern.pattern || pattern;

      for (var i = 0; i < strarr.length; i++) {
        // Don’t cache length as it changes during the loop

        var str = strarr[i];

        if (strarr.length > text.length) {
          // Something went terribly wrong, ABORT, ABORT!
          break tokenloop;
        }

        if (str instanceof Token) {
          continue;
        }

        pattern.lastIndex = 0;

        if (pattern.exec) {
          var match = pattern.exec(str);

          if (match) {
            if (lookbehind) {
              lookbehindLength = match[1].length;
            }

            var from = match.index - 1 + lookbehindLength,
              match = match[0].slice(lookbehindLength),
              len = match.length,
              to = from + len,
              before = str.slice(0, from + 1),
              after = str.slice(to + 1);

            var args = [i, 1];

            if (before) {
              args.push(before);
            }

            var wrapped = new Token(
              token,
              inside ? _.tokenize(match, inside) : match
            );

            args.push(wrapped);

            if (after) {
              args.push(after);
            }

            Array.prototype.splice.apply(strarr, args);
          }
        }
      }
    }

    return strarr;
  },

  hooks: {
    all: {},

    add: function(name, callback) {
      var hooks = _.hooks.all;

      hooks[name] = hooks[name] || [];

      hooks[name].push(callback);
    },

    run: function(name, env) {
      var callbacks = _.hooks.all[name];

      if (!callbacks || !callbacks.length) {
        return;
      }

      for (
        var i = 0, callback;
        (callback = callbacks[i++]);

      ) {
        callback(env);
      }
    },
  },
};

var Token = (_.Token = function(type, content) {
  this.type = type;
  this.content = content;
});

Token.reactify = function(o, key) {
  if (typeof o == 'string') {
    return o;
  }

  if (Array.isArray(o)) {
    return o.map(function(element, i) {
      return Token.reactify(element, i);
    });
  }

  var attributes = {
    className: 'token ' + o.type,
    key: key,
  };
  if (o.type == 'comment') {
    attributes.spellCheck = true;
  }

  return React.DOM.span(
    attributes,
    Token.reactify(o.content)
  );
};

_.languages.markup = {
  comment: /&lt;!--[\w\W]*?-->/g,
  prolog: /&lt;\?.+?\?>/,
  doctype: /&lt;!DOCTYPE.+?>/,
  cdata: /&lt;!\[CDATA\[[\w\W]*?]]>/i,
  tag: {
    pattern: /&lt;\/?[\w:-]+\s*(?:\s+[\w:-]+(?:=(?:("|')(\\?[\w\W])*?\1|[^\s'">=]+))?\s*)*\/?>/gi,
    inside: {
      tag: {
        pattern: /^&lt;\/?[\w:-]+/i,
        inside: {
          punctuation: /^&lt;\/?/,
          namespace: /^[\w-]+?:/,
        },
      },
      'attr-value': {
        pattern: /=(?:('|")[\w\W]*?(\1)|[^\s>]+)/gi,
        inside: {
          punctuation: /=|>|"/g,
        },
      },
      punctuation: /\/?>/g,
      'attr-name': {
        pattern: /[\w:-]+/g,
        inside: {
          namespace: /^[\w-]+?:/,
        },
      },
    },
  },
  entity: /&amp;#?[\da-z]{1,8};/gi,
};

_.languages.xml = _.languages.markup;

_.languages.css = {
  comment: /\/\*[\w\W]*?\*\//g,
  atrule: {
    pattern: /@[\w-]+?.*?(;|(?=\s*{))/gi,
    inside: {
      punctuation: /[;:]/g,
    },
  },
  url: /url\((["']?).*?\1\)/gi,
  selector: /[^\{\}\s][^\{\};]*(?=\s*\{)/g,
  property: /(\b|\B)[\w-]+(?=\s*:)/ig,
  string: /("|')(\\?.)*?\1/g,
  important: /\B!important\b/gi,
  ignore: /&(lt|gt|amp);/gi,
  punctuation: /[\{\};:]/g,
};

_.languages.insertBefore('markup', 'tag', {
  style: {
    pattern: /(&lt;|<)style[\w\W]*?(>|&gt;)[\w\W]*?(&lt;|<)\/style(>|&gt;)/ig,
    inside: {
      tag: {
        pattern: /(&lt;|<)style[\w\W]*?(>|&gt;)|(&lt;|<)\/style(>|&gt;)/ig,
        inside: _.languages.markup.tag.inside,
      },
      rest: _.languages.css,
    },
  },
});

_.languages.clike = {
  comment: {
    pattern: /(^|[^\\])(\/\*[\w\W]*?\*\/|(^|[^:])\/\/.*?(\r?\n|$))/g,
    lookbehind: true,
  },
  string: /("|')(\\?.)*?\1/g,
  'class-name': {
    pattern: /((?:(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/ig,
    lookbehind: true,
    inside: {
      punctuation: /(\.|\\)/,
    },
  },
  keyword: /\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/g,
  boolean: /\b(true|false)\b/g,
  function: {
    pattern: /[a-z0-9_]+\(/ig,
    inside: {
      punctuation: /\(/,
    },
  },
  number: /\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee]-?\d+)?)\b/g,
  operator: /[-+]{1,2}|!|&lt;=?|>=?|={1,3}|(&amp;){1,2}|\|?\||\?|\*|\/|\~|\^|\%/g,
  ignore: /&(lt|gt|amp);/gi,
  punctuation: /[{}[\];(),.:]/g,
};

_.languages.javascript = _.languages.extend('clike', {
  keyword: /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
  number: /\b-?(0x[\dA-Fa-f]+|0b[01]+|0o[0-7]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|Infinity)\b/,
  // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
  function: /[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*(?=\()/i,
  operator: /-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/,
});

_.languages.insertBefore('javascript', 'keyword', {
  regex: {
    pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,
    lookbehind: true,
    greedy: true,
  },
});

_.languages.insertBefore('javascript', 'string', {
  'template-string': {
    pattern: /`(?:\\\\|\\?[^\\])*?`/,
    greedy: true,
    inside: {
      interpolation: {
        pattern: /\$\{[^}]+\}/,
        inside: {
          'interpolation-punctuation': {
            pattern: /^\$\{|\}$/,
            alias: 'punctuation',
          },
          rest: _.languages.javascript,
        },
      },
      string: /[\s\S]+/,
    },
  },
});

_.languages.insertBefore('markup', 'tag', {
  script: {
    pattern: /(&lt;|<)script[\w\W]*?(>|&gt;)[\w\W]*?(&lt;|<)\/script(>|&gt;)/ig,
    inside: {
      tag: {
        pattern: /(&lt;|<)script[\w\W]*?(>|&gt;)|(&lt;|<)\/script(>|&gt;)/ig,
        inside: _.languages.markup.tag.inside,
      },
      rest: _.languages.javascript,
    },
  },
});

_.languages.swift = _.languages.extend('clike', {
  string: {
    pattern: /("|')(\\(?:\((?:[^()]|\([^)]+\))+\)|\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: true,
    inside: {
      interpolation: {
        pattern: /\\\((?:[^()]|\([^)]+\))+\)/,
        inside: {
          delimiter: {
            pattern: /^\\\(|\)$/,
            alias: 'variable',
          },
          // See rest below
        },
      },
    },
  },
  keyword: /\b(as|associativity|break|case|catch|class|continue|convenience|default|defer|deinit|didSet|do|dynamic(?:Type)?|else|enum|extension|fallthrough|final|for|func|get|guard|if|import|in|infix|init|inout|internal|is|lazy|left|let|mutating|new|none|nonmutating|operator|optional|override|postfix|precedence|prefix|private|Protocol|public|repeat|required|rethrows|return|right|safe|self|Self|set|static|struct|subscript|super|switch|throws?|try|Type|typealias|unowned|unsafe|var|weak|where|while|willSet|__(?:COLUMN__|FILE__|FUNCTION__|LINE__))\b/,
  number: /\b([\d_]+(\.[\de_]+)?|0x[a-f0-9_]+(\.[a-f0-9p_]+)?|0b[01_]+|0o[0-7_]+)\b/i,
  constant: /\b(nil|[A-Z_]{2,}|k[A-Z][A-Za-z_]+)\b/,
  atrule: /@\b(IB(?:Outlet|Designable|Action|Inspectable)|class_protocol|exported|noreturn|NS(?:Copying|Managed)|objc|UIApplicationMain|auto_closure)\b/,
  builtin: /\b([A-Z]\S+|abs|advance|alignof(?:Value)?|assert|contains|count(?:Elements)?|debugPrint(?:ln)?|distance|drop(?:First|Last)|dump|enumerate|equal|filter|find|first|getVaList|indices|isEmpty|join|last|lexicographicalCompare|map|max(?:Element)?|min(?:Element)?|numericCast|overlaps|partition|print(?:ln)?|reduce|reflect|reverse|sizeof(?:Value)?|sort(?:ed)?|split|startsWith|stride(?:of(?:Value)?)?|suffix|swap|toDebugString|toString|transcode|underestimateCount|unsafeBitCast|with(?:ExtendedLifetime|Unsafe(?:MutablePointers?|Pointers?)|VaList))\b/,
});
_.languages.swift['string'].inside[
  'interpolation'
].inside.rest = _.util.clone(_.languages.swift);

_.languages.c = _.languages.extend('clike', {
  keyword: /\b(asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/,
  operator: /\-[>-]?|\+\+?|!=?|<<?=?|>>?=?|==?|&&?|\|?\||[~^%?*\/]/,
  number: /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)[ful]*\b/i,
});

_.languages.insertBefore('c', 'string', {
  macro: {
    // allow for multiline macro definitions
    // spaces after the # character compile fine with gcc
    pattern: /(^\s*)#\s*[a-z]+([^\r\n\\]|\\.|\\(?:\r\n?|\n))*/im,
    lookbehind: true,
    alias: 'property',
    inside: {
      // highlight the path of the include statement as a string
      string: {
        pattern: /(#\s*include\s*)(<.+?>|("|')(\\?.)+?\3)/,
        lookbehind: true,
      },
      // highlight macro directives as keywords
      directive: {
        pattern: /(#\s*)\b(define|elif|else|endif|error|ifdef|ifndef|if|import|include|line|pragma|undef|using)\b/,
        lookbehind: true,
        alias: 'keyword',
      },
    },
  },
  // highlight predefined macros as constants
  constant: /\b(__FILE__|__LINE__|__DATE__|__TIME__|__TIMESTAMP__|__func__|EOF|NULL|stdin|stdout|stderr)\b/,
});
_.languages.objectivec = _.languages.extend('c', {
  keyword: /\b(asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|in|self|super)\b|(@interface|@end|@implementation|@protocol|@class|@public|@protected|@private|@property|@try|@catch|@finally|@throw|@synthesize|@dynamic|@selector)\b/,
  string: /("|')(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|@"(\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
  operator: /-[->]?|\+\+?|!=?|<<?=?|>>?=?|==?|&&?|\|\|?|[~^%?*\/@]/,
});

_.languages.java = _.languages.extend('clike', {
  keyword: /\b(abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while)\b/,
  number: /\b0b[01]+\b|\b0x[\da-f]*\.?[\da-fp\-]+\b|\b\d*\.?\d+(?:e[+-]?\d+)?[df]?\b/i,
  operator: {
    pattern: /(^|[^.])(?:\+[+=]?|-[-=]?|!=?|<<?=?|>>?>?=?|==?|&[&=]?|\|[|=]?|\*=?|\/=?|%=?|\^=?|[?:~])/m,
    lookbehind: true,
  },
});

_.languages.insertBefore('java', 'function', {
  annotation: {
    alias: 'punctuation',
    pattern: /(^|[^.])@\w+/,
    lookbehind: true,
  },
});

_.languages.powershell = {
  comment: [
    {
      pattern: /(^|[^`])<#[\s\S]*?#>/,
      lookbehind: true,
    },
    {
      pattern: /(^|[^`])#.*/,
      lookbehind: true,
    },
  ],
  string: [
    {
      pattern: /"(`?[\s\S])*?"/,
      greedy: true,
      inside: {
        function: {
          pattern: /[^`]\$\(.*?\)/,
          // Populated at end of file
          inside: {},
        },
      },
    },
    {
      pattern: /'([^']|'')*'/,
      greedy: true,
    },
  ],
  // Matches name spaces as well as casts, attribute decorators. Force starting with letter to avoid matching array indices
  namespace: /\[[a-z][\s\S]*?\]/i,
  boolean: /\$(true|false)\b/i,
  variable: /\$\w+\b/i,
  // Cmdlets and aliases. Aliases should come last, otherwise "write" gets preferred over "write-host" for example
  // Get-Command | ?{ $_.ModuleName -match "Microsoft.PowerShell.(Util|Core|Management)" }
  // Get-Alias | ?{ $_.ReferencedCommand.Module.Name -match "Microsoft.PowerShell.(Util|Core|Management)" }
  function: [
    /\b(Add-(Computer|Content|History|Member|PSSnapin|Type)|Checkpoint-Computer|Clear-(Content|EventLog|History|Item|ItemProperty|Variable)|Compare-Object|Complete-Transaction|Connect-PSSession|ConvertFrom-(Csv|Json|StringData)|Convert-Path|ConvertTo-(Csv|Html|Json|Xml)|Copy-(Item|ItemProperty)|Debug-Process|Disable-(ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)|Disconnect-PSSession|Enable-(ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)|Enter-PSSession|Exit-PSSession|Export-(Alias|Clixml|Console|Csv|FormatData|ModuleMember|PSSession)|ForEach-Object|Format-(Custom|List|Table|Wide)|Get-(Alias|ChildItem|Command|ComputerRestorePoint|Content|ControlPanelItem|Culture|Date|Event|EventLog|EventSubscriber|FormatData|Help|History|Host|HotFix|Item|ItemProperty|Job|Location|Member|Module|Process|PSBreakpoint|PSCallStack|PSDrive|PSProvider|PSSession|PSSessionConfiguration|PSSnapin|Random|Service|TraceSource|Transaction|TypeData|UICulture|Unique|Variable|WmiObject)|Group-Object|Import-(Alias|Clixml|Csv|LocalizedData|Module|PSSession)|Invoke-(Command|Expression|History|Item|RestMethod|WebRequest|WmiMethod)|Join-Path|Limit-EventLog|Measure-(Command|Object)|Move-(Item|ItemProperty)|New-(Alias|Event|EventLog|Item|ItemProperty|Module|ModuleManifest|Object|PSDrive|PSSession|PSSessionConfigurationFile|PSSessionOption|PSTransportOption|Service|TimeSpan|Variable|WebServiceProxy)|Out-(Default|File|GridView|Host|Null|Printer|String)|Pop-Location|Push-Location|Read-Host|Receive-(Job|PSSession)|Register-(EngineEvent|ObjectEvent|PSSessionConfiguration|WmiEvent)|Remove-(Computer|Event|EventLog|Item|ItemProperty|Job|Module|PSBreakpoint|PSDrive|PSSession|PSSnapin|TypeData|Variable|WmiObject)|Rename-(Computer|Item|ItemProperty)|Reset-ComputerMachinePassword|Resolve-Path|Restart-(Computer|Service)|Restore-Computer|Resume-(Job|Service)|Save-Help|Select-(Object|String|Xml)|Send-MailMessage|Set-(Alias|Content|Date|Item|ItemProperty|Location|PSBreakpoint|PSDebug|PSSessionConfiguration|Service|StrictMode|TraceSource|Variable|WmiInstance)|Show-(Command|ControlPanelItem|EventLog)|Sort-Object|Split-Path|Start-(Job|Process|Service|Sleep|Transaction)|Stop-(Computer|Job|Process|Service)|Suspend-(Job|Service)|Tee-Object|Test-(ComputerSecureChannel|Connection|ModuleManifest|Path|PSSessionConfigurationFile)|Trace-Command|Unblock-File|Undo-Transaction|Unregister-(Event|PSSessionConfiguration)|Update-(FormatData|Help|List|TypeData)|Use-Transaction|Wait-(Event|Job|Process)|Where-Object|Write-(Debug|Error|EventLog|Host|Output|Progress|Verbose|Warning))\b/i,
    /\b(ac|cat|chdir|clc|cli|clp|clv|compare|copy|cp|cpi|cpp|cvpa|dbp|del|diff|dir|ebp|echo|epal|epcsv|epsn|erase|fc|fl|ft|fw|gal|gbp|gc|gci|gcs|gdr|gi|gl|gm|gp|gps|group|gsv|gu|gv|gwmi|iex|ii|ipal|ipcsv|ipsn|irm|iwmi|iwr|kill|lp|ls|measure|mi|mount|move|mp|mv|nal|ndr|ni|nv|ogv|popd|ps|pushd|pwd|rbp|rd|rdr|ren|ri|rm|rmdir|rni|rnp|rp|rv|rvpa|rwmi|sal|saps|sasv|sbp|sc|select|set|shcm|si|sl|sleep|sls|sort|sp|spps|spsv|start|sv|swmi|tee|trcm|type|write)\b/i,
  ],
  // per http://technet.microsoft.com/en-us/library/hh847744.aspx
  keyword: /\b(Begin|Break|Catch|Class|Continue|Data|Define|Do|DynamicParam|Else|ElseIf|End|Exit|Filter|Finally|For|ForEach|From|Function|If|InlineScript|Parallel|Param|Process|Return|Sequence|Switch|Throw|Trap|Try|Until|Using|Var|While|Workflow)\b/i,
  operator: {
    pattern: /(\W?)(!|-(eq|ne|gt|ge|lt|le|sh[lr]|not|b?(and|x?or)|(Not)?(Like|Match|Contains|In)|Replace|Join|is(Not)?|as)\b|-[-=]?|\+[+=]?|[*\/%]=?)/i,
    lookbehind: true,
  },
  punctuation: /[|{}[\];(),.]/,
};

// Variable interpolation inside strings, and nested expressions
_.languages.powershell.string[
  0
].inside.boolean = _.languages.powershell.boolean;
_.languages.powershell.string[
  0
].inside.variable = _.languages.powershell.variable;
_.languages.powershell.string[
  0
].inside.function.inside = _.util.clone(
  _.languages.powershell
);

_.languages.java = _.languages.extend('clike', {
  keyword: /\b(abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while)\b/,
  number: /\b0b[01]+\b|\b0x[\da-f]*\.?[\da-fp\-]+\b|\b\d*\.?\d+(?:e[+-]?\d+)?[df]?\b/i,
  operator: {
    pattern: /(^|[^.])(?:\+[+=]?|-[-=]?|!=?|<<?=?|>>?>?=?|==?|&[&=]?|\|[|=]?|\*=?|\/=?|%=?|\^=?|[?:~])/m,
    lookbehind: true,
  },
});

class Prism extends React.Component {
  render() {
    var grammar = _.languages[this.props.language];
    if (!grammar) {
      grammar = _.languages.javascript;
    }
    return (
      <div
        className={'prism language-' + this.props.language}
      >
        {Token.reactify(
          _.tokenize(this.props.children, grammar)
        )}
      </div>
    );
  }
}

Prism._ = _;
Prism.defaultProps = {
  language: 'javascript',
};

module.exports = Prism;
