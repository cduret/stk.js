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
              ].join('\n');

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

  Stk.interpret(prelude);

  var io = {
    write: function(out) {
      jqc.Write(out, 'jqconsole-output');
    }
  };

  var handler = function(command) {
    if( command ) {
      try {
        Stk.interpret(command, io);
        Stk.print_stack(io);
      } catch(e) {
        jqc.Write('ERROR: ' + e.message + '\n', 'jqconsole-error');
      }
    }
    add_old_prompt_handlers(jqc);
    jqc.Prompt(true, handler);
  };

  handler();
});
