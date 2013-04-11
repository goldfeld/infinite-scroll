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
      var display = $('.loaded-counter');
      if (!newlyLoaded) {
        display.text("Loaded all (" + totalLoaded + ") items.");
        handler.stop();
      }
      else { display.text("Loaded " + totalLoaded + " items"); }
      console.log(newlyLoaded);
    },

    positionCallback: function(percentage, absolute, contentSize) {
      var display = percentage * 100;
      if (display < 10) display = display.toString().substr(0, 1);
      else if (display >= 100) display = "100";
      else display = display.toString().substr(0, 2);
      $('.position-counter').text("(" + display + "%)");
    }

  });

});

})(jQuery);
