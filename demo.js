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
  $('#list').scrapeTheBarrelRoll(getFakeData, { contentClass: ['span12'] });
});

})(jQuery);
