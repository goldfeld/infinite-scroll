// pass in jquery to make sure it's not redefined.
(function($) {

var getFakeData = function(offset, limit, callback) {
  var data = [];
  if (offset > 700) {
    callback(null, []);
    return;
  }

  for (var i=0; i<limit; i++) {
    var id = offset + i;
    data.push({
      id: id,
      name: "Name " + id,
      description: "Description " + id,
      span: "span" + (1 + id) % 7
    });
  }

  callback(null, data);
};

$(function() {

  handler = $('.barrelbottom').scrapeTheBarrelRoll(getFakeData, {
    contentCss: ['span12'],
    preload: 10,
    bufferHeight: function(height) { return height * 3; },

    loadedCallback: function(newlyLoaded, totalLoaded) {
      display = $('.loaded-counter');
      if (!newlyLoaded) {
        display.text("Loaded all (" + totalLoaded + ") items.");
        handler.stop();
      }
      else { display.text("loaded " + totalLoaded + " items"); }
    }
  });

});

})(jQuery);
