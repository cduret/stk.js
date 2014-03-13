/* global Objects */
/* global Parsimmon */
/* global Tests */

var Parser = (function() {
  // parsimmon

  var alt = Parsimmon.alt;
  var digit = Parsimmon.digit;
  var fail = Parsimmon.fail;
  var lazy = Parsimmon.lazy;
  var letter = Parsimmon.letter;
  var regx = Parsimmon.regex;
  var seq = Parsimmon.seq;
  var succeed = Parsimmon.succeed;
  var str = Parsimmon.string;
  var wspc = Parsimmon.whitespace;
  var owspc = Parsimmon.optWhitespace;

  var not_string = function(e) { return typeof(e) !== 'string'; };
  var parse_num = function(x) { return {number: Number(x)}; };
  var parse_str = function(s) { return {string: s.slice(1, s.length-1)}; };

  var SYM_REGEX = /-|_|\/|\\|@|\+|\*|%|=|\?|!|\^|~|{|}|\[|\]|&|'|"|#|\||°|§|<|>|ç/;
  var symbol = regx(SYM_REGEX);

  var ID_REGEX = /^[^(\s|:|;|{|}|\[|\]|"|TUPLE|USE)]+/;
  var identifier = regx(ID_REGEX).map(function(s) { return {identifier: s}; });

  var NUM_REGEX = /^[+-]?[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?/;
  var number = regx(NUM_REGEX).map(parse_num);

  var STR_REGEX = /^".*?"/;
  var string = regx(STR_REGEX).map(parse_str);

  var literal = number.or(string);

  var space_sep = function (parser) {
    var space_parser = regx(/^\s+/m).then(parser).many();
    return seq(parser, space_parser).map(function(results) {
      return [results[0]].concat(results[1]);
    }).or(succeed([]));
  };

  var quotation;
  var array = seq(regx(/^{\s*/m),space_sep(lazy(function() {
      return alt(literal, array, quotation);
    })), regx(/\s*?}/m)).map(function(results) {
      return {array: results[1]};
    });

  quotation = seq(regx(/^\[\s*/m),space_sep(lazy(function() {
      return alt(literal, identifier, quotation, array);
    })), regx(/\s*?\]/m)).map(function(results) {
      return {quotation: results[1]};
    });

  var comment = str('(').then(function() {
    return alt(letter, digit, symbol, wspc).many().skip(str(')'));
  }).map(function(s) { return {comment: s.join('')}; });

  var instruction = alt(literal, identifier, array, quotation);

  var typed_definition = str(':').then(function() {
    return wspc.then(function() {
      return identifier.then(function(id) {
        return wspc.then(function() {
          return comment.then(function(type_sig) {
            return seq(owspc, space_sep(instruction), regx(/\s*?;/m)).map(function(body) {
              return {definition: id, type_sig: type_sig, body: body[1]};
            });
          });
        });
      });
    });
  });

  var simple_definition = str(':').then(function() {
    return wspc.then(function() {
      return identifier.then(function(id) {
        return wspc.then(function() {
          return seq(owspc, space_sep(instruction), regx(/\s*?;/m));
        }).map(function(body) {
          return {definition: id, body: body[1]};
        });
      });
    });
  });

  var definition = typed_definition.or(simple_definition);

  var tuple = str('TUPLE:').then(function() {
    return wspc.then(function() {
      return identifier.then(function(name) {
        return seq(owspc, space_sep(identifier), regx(/\s*?;/m)).map(function(fields) {
          return {tuple: name, fields: fields[1]};
        });
      });
    });
  });

  var use = str('USE:').then(function() {
    return wspc.then(function() {
      return seq(owspc, space_sep(identifier), regx(/\s*?;/m)).map(function(modules) {
        return {use: modules[1]};
      });
    });
  });

  var program = space_sep(alt(instruction, comment, definition, use, tuple)).map(function(all) {
    return { program : all};
  });

  Tests.assert_all('parser tests', [
    { body: function() { return seq(literal).parse('18'); },
      expected: [{number: 18}] },
    { body: function() { return seq(literal).parse('"18"'); },
      expected: [{string: '18'}] },
    { body: function() { return space_sep(literal).parse('18 19 22 33'); },
      expected: [{number: 18},{number: 19},{number: 22},{number: 33}] },
    { body: function() { return space_sep(literal).parse('18 "19" 22 "33"'); },
      expected: [{number: 18},{string: '19'},{number: 22},{string: '33'}] },
    { body: function() { return array.parse('{1 {2} {3 4}   }'); },
      expected: {array: [{number:1}, {array: [{number:2}]}, {array:[{number:3},{number:4}]}]} },
    { body: function() { return quotation.parse('[1 ["2"] [3 4]   ]'); },
      expected: {quotation: [{number:1}, {quotation: [{string:'2'}]}, {quotation:[{number:3},{number:4}]}]} },
    { body: function() { return quotation.parse('[=]'); },
      expected: {quotation: [{identifier: '='}]} },
    { body: function() { return quotation.parse('[{1} =]'); },
      expected: {quotation: [{array: [{number: 1}]}, {identifier: '='}]} },
    { body: function() { return quotation.parse('[{1} [=] ]'); },
      expected: {quotation: [{array: [{number: 1}]}, {quotation: [{identifier: '='}]}]} },
    { body: function() { return comment.parse('(hello world !)'); },
      expected: {comment: 'hello world !'} },
    { body: function() { return comment.parse('( n n -- n )'); },
      expected: {comment: ' n n -- n '} },
    { body: function() { return instruction.parse('toto_is_cool!'); },
      expected: {identifier: 'toto_is_cool!'} },
    { body: function() { return instruction.parse('[ "toto" is "cool"]'); },
      expected: {quotation: [{string: 'toto'}, {identifier: 'is'}, {string: 'cool'}]} },
    { body: function() { return instruction.parse('{"toto" {7.13} 100}'); },
      expected: {array: [{string: 'toto'}, {array: [{number: 7.13}]}, {number: 100}]} },
    { body: function() { return definition.parse(': toto ( n -- n ) 77 + ;'); },
      expected: {definition: {identifier:'toto'}, type_sig: {comment: ' n -- n '}, body: [{number: 77}, {identifier: '+'}]} },
    { body: function() { return definition.parse(': toto 22 [77] i + ;'); },
      expected: {definition: {identifier:'toto'}, body: [{number: 22}, {quotation: [{number: 77}]}, {identifier: 'i'}, {identifier: '+'}]} },
    { body: function() { return tuple.parse('TUPLE: car wheel doors engine ;'); },
      expected: {tuple: {identifier: 'car'}, fields: [{identifier: 'wheel'}, {identifier: 'doors'}, {identifier: 'engine'}]} },
    { body: function() { return use.parse('USE: toto/tut root ;'); },
      expected: {use: [{identifier: 'toto/tut'}, {identifier: 'root'}]} }
  ]);

  return {
    // TODO : do a parsing for each line (loop) and throw line number when failed !
    parse : function(code) {
      //syntax_check(code);
      var line;
      var body = code.split('\n');
      try {
        var programs = [];
        for(line=0;line<body.length;line++) {
          programs.push(program.parse(body[line]));
        }
        return programs.reduce(function(acc, p) {
          return { program: acc.program.concat(p.program) };
        }, { program: [] });
      } catch(e) {
        if( e.match(/^Parse Error: .*$/gm) !== null ) {
          var col, mcol = /.*?at character ([0-9]+).*$/gm.exec(e);
          if( mcol !== null && mcol.length > 1 ) {
            col = Number(mcol[1]);
            throw {
              parse_error: {
                row: line,
                col: col,
                message: e
              }
            };
          } else {
            var m = /.*?the end of the string\n    parsing: '((.|\n)*)'/gm.exec(e);
            if( m !== null && m.length > 1 ) {
              col = body[line].length-m[1].length;
              throw {
                parse_error: {
                  row: line,
                  col: col,
                  message: e
                }
              };
            }
          }
        }
        console.error('unknown exception -> '+e);
        throw e;
      }
    }
  };
})();
