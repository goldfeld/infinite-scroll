(function($){
// scrape-the-barrel-roll plugin, providing infinite-scroll functionality.
// by Vic Goldfeld

$.fn.scrapeTheBarrelRoll = function(fetchData, options) {

/*
 * HELPERS
 */

// checks if variable exists. p.s. in coffeescript: s/exists\((\w*)\)/\1\?/g
var exists = function(value) {
  return value !== null && value !== undefined;
};

// helps with assigning the options object to local variable.
var assign = function(value, defaultValue) {
  return exists(value) ? value : defaultValue;
}

// create a single null function for all our no operational needs.
var noop = function() { };

// gets an arbitrarily nested/namespaced value out of a string.
var getValue = function(path) {
  var current = window;
  var frags = path.split('.');
  // do a regular for because it's safer .
  for (var i = 0; i < frags.length; i++) {
    // move one level down the nested namespace.
    current = current[frags[i]];
    if (!exists(current)) throw "Variable " + path + " does not exist.";
  }
  return current;
};

var sequential = 0;
var createStamp = function() {
  return 'scrape-the-barrel-roll-' + (new Date).getTime() + sequential++;
}


/*
 * MINIMAL TEMPLATING
 */

// this is used to create a stringified template out of the dom nodes that
// were inside the element the user selected to make scrollable.
var tmplCreate = function(selector) {
  var tokens = [];

  selector.children().each(function() {
    var self = $(this);
    var bindings = self.data();
    var stamp = createStamp(); // unique timestamp-based token string.
    var hasText = false;

    // iterate each data-attribute binding in a child node.
    for (var bindingType in bindings) {
      var binding = bindings[bindingType];
      
      // save the timestamps along with the binding (data accessor string) they
      // represent, for easily substituting whenever we render the template.
      tokens.push({ stamp: stamp, bind: binding });

      switch (bindingType) {
        case 'text':
          hasText = true;
          self.text(stamp);
          break;
        case 'addClass': self.addClass(stamp); break;
      }
    }

    // create subtemplates for each child node.
    subtemplate = tmplCreate(self);
    tokens = tokens.concat(subtemplate.tokens);
    if (!hasText) self.html(subtemplate.html);

  });

  // our reusable, tokenized template object.
  return { html: selector.html(), tokens: tokens };
}

// our rendering accepts a template object and a data context, which we will
// use to match the data in the context to the token array of the template.
var tmplRender = function(template, context) {
  var tokens = template.tokens;
  var rendering = template.html;
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    rendering = rendering.replace(token.stamp, context[token.bind]);
  }
  return rendering;
}


/* BASIC BUILDING BLOCKS */

// save this closure's reference to the container(s) as a jQuery collection.
var selector = this;
// get the fixed container's height to orient our infinite scroll.
var height = selector.innerHeight();


/* PASSED OPTIONS */

// various hooks for plugin user to react to different outcomes.
var loadedCallback = assign(options.loadedCallback, noop);
var positionCallback = assign(options.positionCallback, noop);
var errCallback = assign(options.errCallback, noop);

// instead of handling every scroll event, we only handle it every so often,
// by default 50ms.
var scrollInterval = assign(options.scrollInterval, 50);

// since we have no way of knowing the visual size of items coming from the
// data source, our best guess is to preload just one item, unless the user
// tells us how many.
var preload = assign(options.preload, 1);

// custom user classes for our generated content wrapper div.
var contentCss = exists(options.contentCss) ?
  ' class=' + options.contentCss.join(' ') : '';

// the buffer area we need to load in advance.
var buffer, bufferO = options.bufferHeight;
// a function that adjusts the buffer area e.g. when the browser is resized.
var getBufferSize;

// default buffer to be set at double the scrollable area's height.
if (!exists(bufferO)) {
  getBufferSize = function(height) { return height * 2; };
} else switch (typeof bufferO) {
  case 'function': getBufferSize = bufferO; break;
  default: getBufferSize = function() { return bufferO; }; break;
}
// initialize the buffer's size.
buffer = getBufferSize(height);


/*
 * INITIALIZATION
 */

// create our template object out of the selector's children,
// a one-time operation.
var template = tmplCreate(selector);
// empty the selector's children, so that we can replace it with a content
// wrapper which will get the rendered instances of the template.
selector.empty();

// create a content div wrapping the rendered templates, so that we can
// measure the height of loaded content, while abstracting away from the
// plugin user the need to structure his html this way.
var contentStamp = createStamp();
var contentId = '#' + contentStamp;
var content = $("<div" + contentCss + " id='" + contentStamp + "'></div>");
selector.append(content);


/*
 * INFINITE LOADING
 */

// keep track of how many items we needed to load last time, use it as a base.
var lastNeeded = preload;
// keey track of the content's height on the previous load operation.
var lastHeight = height;
// count how many items loaded total so far.
var loadedItems = 0;

// state of our infinite scroll: busy loading new items or done and ready.
var loading = false;

// our callback renders the received items, and calls loadedCallback and
// positionCallback if successful, and errCallback otherwise.
var renderDataCallback = function(err, data, errCallback, loadedCallback) {

  if (exists(err)) { errCallback(err); return; }
  if (!exists(data)) {
    errCallback({ msg: "Error: Data property not available from fetch data "
      + "function's callback" });
    return;
  }

  content = $(contentId);
  // this is where we append new content proper.
  for (var i = 0; i < data.length; i++)
    content.append(tmplRender(template, data[i]));

  loadedItems += data.length;
  // call back saying we successfully loaded `data.length` new items, bringing
  // the total to `loadedItems`.
  loadedCallback(data.length, loadedItems);
  loading = false;
};

var mouseWheelHandler = function() {
  var contentHeight = $(contentId)[0].scrollHeight;

  var scrollTop = selector.scrollTop();
  var contentTop = contentHeight - height;

  var percentage = contentTop <= 0 ? 0 : scrollTop / contentTop;
  positionCallback(percentage, scrollTop, contentHeight);

  // load new items whenever our scroll offset goes over our content offset.
  if (!loading && scrollTop >= contentTop - buffer) {

    loading = true;
    // since we need to pass our rendering callback more arguments than the
    // fetchData callback should give, we set an anonymous function as the
    // callback, wrapping our real callback in it's closure.
    fetchData(loadedItems, lastNeeded, function(err, data) {
      renderDataCallback(err, data, errCallback, loadedCallback);
    });

    // if our content height didn't hit the buffered requirement, we need to
    // load more next time.
    if (contentHeight < lastHeight + buffer) { lastNeeded++; }
    // if we overload, decrement our needs;
    else lastNeeded--;

    lastHeight = contentHeight;
  }

  // since the watch runs once, schedule it to run again.
  setTimeout(scrollWatch, scrollInterval);

};

// update height reference and recalculate buffer when window is resized.
var resizeHandler = function() {
  height = selector.innerHeight();
  buffer = getBufferSize(height);
}
selector.on('resize', resizeHandler);

var scrollWatch = function() { selector.one('mousewheel', mouseWheelHandler); };
var scrollStop = function() {
  selector.unbind('mousewheel', mouseWheelHandler);
  selector.unbind('resize', resizeHandler);
};

// set a watch on the mousewheel.
scrollWatch();

// begin fetching an initial batch.
fetchData(loadedItems, lastNeeded, function(err, data) {
  renderDataCallback(err, data, errCallback, loadedCallback);
});

return { stop: scrollStop };
};

})(jQuery);
