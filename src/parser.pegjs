{
  var ast = require('./ast')

  function extractList(list, index) {
    return list.map(function(element) { return element[index]; });
  }

  function buildList(head, tail, index) {
    return [head].concat(extractList(tail, index));
  }

  function loc() {
    return { ...location(), source: options.source }
  }
}

statements =
    head:insnLineWithComment tail:(LineTerminator insnLineWithComment)* {
      return buildList(head, tail, 1);
    }

insnLineWithComment =
  __ insn:insnLine lineComment? {
    return insn
  }

insnLine =
  __ {
    // empty line is a no-op
    return ast.mkAsmLine(null, null, loc());
  }

ws "whitespace" = WhiteSpace*
__ = ws

WhiteSpace "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
  / "\u00A0"
  / "\uFEFF"
  / Zs

// Separator, Space
Zs = [\u0020\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]

lineComment = (';' (!LineTerminator .)*)

LineTerminator = [\n\r]
