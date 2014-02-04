/* global Stk */

var PS1 = '(scratchpad) ';

var welcome = ['        _____________    ',
  '  _____\\__    ___/  | __',
 ' /  ___/ |    |  |  |/ /',
 ' \\___ \\  |    |  |    < ',
' /____ > |____|  |__|_ \\',
     ' \\/              \\/'].join('\n');

var prelude = [': sum 0 [+] fold ;',
               ': product 1 [*] fold ;',
               ': concatenation "" [concat] fold ;',
               ': >>t {"t"} swap concat ;',
               ': >>tx {} cons {"tx"} swap concat ;',
               ': >>ty {} cons {"ty"} swap concat ;',
               ': >>r {"r"} swap concat ;',
               ': >>rx {} cons {"rx"} swap concat ;',
               ': >>ry {} cons {"rx"} swap concat ;',
               ': >>rz {} cons {"rz"} swap concat ;',
               ': transition {} cons cons cons {"transition"} swap concat ;'
              ];

var tests = [ '{1 2} {1 2} = assert',
              '{1 2 3} length 3 = assert',
              '"hello" length 5 = assert',
              '"" small assert',
              '"a" small assert',
              '"ab" small not assert',
              '[] small assert',
              '[1] small assert',
              '[1 2] small not assert',
              '{} small assert',
              '{1} small assert',
              '{1 2} small not assert',
              '1 [1 =] [1 +] [2 +] ifte 2 = assert',
              '1 [2 =] [1 +] [2 +] ifte 3 = assert',
              '[dup * 1 +] 3 swap i 10 = assert',
              '{1 2 3} [1 +] map {2 3 4} = assert',
              '{1 2 3} 8 [+] fold 14 = assert',
              '[dup * 1 +] [[1 +] [id] ifnumber] map 5 swap i 27 = assert',
              '5 [ 1 = ] [ ] [ dup pred ] [ * ] linrec 120 = assert',
              '5 [1] [*] primrec 120 = assert',
              '12 [small] [] [pred dup pred] [+] binrec 144 = assert'
             ];

var print_stack = function(output) {
  var i;
  var stack = Stk.stack();
  if( stack.length > 0 ) {
    output.Write('Data stack ---\n', 'jqconsole-output');
    for(i=0;i<stack.length;i++) {
      output.Write(Stk.fragment_to_string(stack[i])+'\n', 'jqconsole-output');
    }
  }
};

var add_old_prompt_handlers = function(jqc) {
  var old = $('.jqconsole-old-prompt > span');
  old.find('span').off('mouseenter mouseleave');
  old.each(function() {
    var s = $(this).text();
    //$(this).text('');
    $(this).html(PS1);
    var txt = s.substring(PS1.length,s.length-1);
    $(this).append($('<span/>').text(txt +'\n'));
  });
  var spans = old.find('span');
  var handler = function() {
    jqc.SetPromptText($(this).text().trim());
  };
  spans.mouseenter(function(e) {
    $(e.target).addClass('selected');
    $(e.target).bind('click', handler);
  });
  spans.mouseleave(function(e) {
    $(e.target).removeClass('selected');
    $(e.target).unbind('click', handler);
  });
};

$(document).ready(function() {
  var jqc = $('#console').jqconsole(welcome+'\n\n', PS1);

  Stk.interpret_strings(prelude);
  Stk.interpret_strings(tests);

  var handler = function(command) {
    if( command ) {
      try {
        Stk.interpret_string(command, jqc);
        print_stack(jqc);
      } catch(e) {
        jqc.Write('ERROR: ' + e.message + '\n', 'jqconsole-error');
      }
    }
    add_old_prompt_handlers(jqc);
    jqc.Prompt(true, handler);
  };

  handler();
});
