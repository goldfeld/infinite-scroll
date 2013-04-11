// pass in jquery to make sure it's not redefined.
(function($) {

window.app = {};
app.items = [
  { name: 1, description: 'hey' },
  { name: 3, description: 'ho' },
];

var getFakeData = function(offset, limit, callback) {
  var data = [];
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
