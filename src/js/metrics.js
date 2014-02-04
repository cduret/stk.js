(function($) {
  $.textMetrics = function(elt, txt) {

    var h = 0, w = 0;

    var div = document.createElement('div');
    document.body.appendChild(div);
    $(div).css({
      position: 'absolute',
      left: -1000,
      top: -1000,
      display: 'none'
    });

    if( txt ) {
      $(div).html(txt);
    } else {
      $(div).html(elt.html());
    }
    var styles = ['font-size','font-style', 'font-weight', 'font-family','line-height', 'text-transform', 'letter-spacing'];
    $(styles).each(function() {
      var s = this.toString();
      $(div).css(s, $(elt).css(s));
    });

    h = $(div).outerHeight();
    w = $(div).outerWidth();

    $(div).remove();

    var ret = {
      height: h,
      width: w
    };

    return ret;
  };
})(jQuery);
