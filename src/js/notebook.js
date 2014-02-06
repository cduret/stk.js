/* global Stk */

var prelude = [': sum 0 [+] fold ;',
               ': product 1 [*] fold ;',
               ': concatenation "" [concat] fold ;'].join('\n');

var cur_line = 0;
var editors = [];

var new_prompt = function(num) {
  return $('<div class="block"/>').append(
         $('<div id="'+num+'" class="prompt">In ['+num+'] :</div>')).append(
            $('<div id="editor_'+num+'"/>'));
         //$('<div class="editor_container"/>').append($('<div id="editor_'+num+'"/>')));
};

var setup_editor = function(line) {
  var id = 'editor_'+line;
  var editor = ace.edit(id);

  editor.getSession().setMode('ace/mode/forth');
  editor.setTheme('ace/theme/chrome');
  editor.getSession().setUseSoftTabs(true);
  editor.getSession().setTabSize(2);
  editor.renderer.setShowGutter(false);
  //editor.setKeyboardHandler('ace/keyboard/vim');

  var heightUpdateFunction = function() {
    // http://stackoverflow.com/questions/11584061/
    var newHeight =
              editor.getSession().getScreenLength() *
              editor.renderer.lineHeight +
              editor.renderer.scrollBar.getWidth();

    $('#'+id).height(newHeight.toString() + 'px');
    $('#'+id+'-section').height(newHeight.toString() + 'px');

    // This call is required for the editor to fix all of
    // its inner structure for adapting to a change in size
    editor.resize();
  };

  // Set initial size to match initial content
  heightUpdateFunction();

  // Whenever a change happens inside the ACE editor, update
  // the size again
  editor.getSession().on('change', heightUpdateFunction);

  editor.commands.addCommand({
    name: 'exec',
    bindKey: {win: 'Ctrl-Enter', mac: 'Command-Option-Enter'},
    exec: function(editor) {
      $('body').trigger('exec', [line]);
    }
  });

  editor.commands.addCommand({
    name: 'rm',
    bindKey: {win: 'Ctrl-Backspace', mac: 'Command-Option-Backspace'},
    exec: function(editor) {
      $('body').trigger('rm', [line]);
    }
  });

  return editor;
};

var setup_cell = function(id, edit, error) {
  var e = (error===undefined)?false:error;
  var error_class = e?' error':'';
  var answer_elt = $('#answer_'+id);

  if( answer_elt.size() === 0 ) {
    $('body').append($('<div class="block"/>').append(
                     $('<div id="answer_'+id+'" class="answer'+error_class+'"/>')));
  }

  if( edit ) {
    answer_elt.html('');
  }

  if( answer_elt.hasClass('error') ) {
    answer_elt.removeClass('error');
    answer_elt.html('');
  }

  if( e && !answer_elt.hasClass('error') ) {
    answer_elt.addClass('error');
    answer_elt.html('');
  }
};

var add_prompt = function(line) {
  $('body').append( new_prompt(line) );
  var editor = setup_editor(line);
  editor.focus();
  editors.push(editor);
};

var remove_prompt = function(line) {
  var editor = editors[line];
  var elt = $('#editor_'+line).parent().remove();

  editor.destroy();

  if( line+1 < editors.length ) {
    editors = editors.slice(0, line).concat(editors.slice(line+1));
  } else {
    editors = editors.slice(0, line);
  }
};

var remove_answer = function(line) {
  var elt = $('#answer_'+line).parent().remove();
};

var eval_cell = (function() {
  var mk_io = function(id, edit) {
    return {
      write: function(out) {
        var answer_elt = $('#answer_'+id);
        answer_elt.append(out.replace(/\n/g, '<br/>'));
      }
    };
  };

  return function(line) {
    var code = editors[line].getSession().getValue();
    if( code.trim().length > 0 ) {
      var last_line = (line+1) === cur_line;
      var cell_edit = !last_line || $('#answer_'+line).size() !== 0;
      var io = mk_io(line, cell_edit);
      try {
        setup_cell(line, cell_edit, false);
        Stk.interpret(code, io);
        if( last_line ) {
          add_prompt(cur_line++);
        }
      } catch(ex) {
        setup_cell(line, cell_edit, true);
        io.write(ex.message, true);
      }
      $('html, body').animate({scrollTop:$(document).height()}, 'slow');// scroll to bottom
    }
  };
})();

var remove_cell = function(line) {
  if( cur_line > 1 ) {
    remove_prompt(line);
    remove_answer(line);
    return true;
  }
  return false;
};

$(document).ready(function() {
  Stk.interpret(prelude);

  add_prompt(cur_line++);

  $('body').on('exec', function(e, line) {
    eval_cell(line);
  });

  $('body').on('rm', function(e, line) {
    if( remove_cell(line) ) {
      cur_line--;
      editors[editors.length-1].focus();
    }
  });

});
