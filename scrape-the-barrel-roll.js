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
var tmplCreate = function(selector) {
  var tokens = [];

  selector.children().each(function() {
    var self = $(this);
    var bindings = self.data();
    var stamp = createStamp();
    var hasText = false;
    // iterate each data-attritube binding in a node.
    for (var bindingType in bindings) {
      var binding = bindings[bindingType];
      
      tokens.push({ stamp: stamp, bind: binding });

      switch (bindingType) {
        case 'text':
          hasText = true;
          self.text(stamp);
          break;
        case 'addClass': self.addClass(stamp); break;
        /*case 'forEach':
          var statement = value;
          // save a copy of the children, because we'll only be able to
          // process them after tmplForEach finishes completely.
          var tmpl = $(node).children().clone();
          // empty the nodes to prevent them from being further processed
          // within this data source context.
          node.empty();
          // add a callback to be run at the end of the function.
          postProcess.push(function() {
            
            tmplForEach(statement, tmpl); });
          break;
        */
      }
    }

    // create subtemplates for the children, if any.
    subtemplate = tmplCreate(self);
    tokens = tokens.concat(subtemplate.tokens);
    if (!hasText) self.html(subtemplate.html);

  });

  // our reusable, tokenized template object.
  return { html: selector.html(), tokens: tokens };
}

var tmplRender = function(template, context) {
  // for each node in the template, we're gonna match the instance data
  // to the binding requested by a data-attribute.
  var tokens = template.tokens;
  var render = template.html;
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    render = render.replace(token.stamp, context[token.bind]);
  }
  return render;
}

/* outdated rendering
var tmplForEach = function(target, statement, template) {
  var keywords = statement.split(' ');

  var item = keywords[1];
  var source = getValue(keywords[3]);

  // this an array of callbacks that will be called after tmplForEach is
  // completely done, and it is used for nested forEach bindings, because
  // when encoutering such bindings we need to save their inner template,
  // then empty those nodes to prevent them from being bound by the current
  // context data.
  // instead it has to be bound by whatever data source is being called for
  // in the nested forEach.
  var postProcess = []

  //console.log(template.clone().length);
  var instances = [];
  for (var i = 0; i < source.length; i++) {
    instances.push({ template: template.clone(), data: source[i] });
  }

  // iterate each instance context for which we are repeating the template.
  for (var i = 0; i < instances.length; i++) {
    var instance = instances[i];
    tmplRender(instance.template, instance.data);
  }

  // now actually insert the data-bound clones where the template was.
  for (var i = 0; i < instances.length; i++) {
    var clone = instances[i].template;
    target.append(clone);   
    console.log('1', clone.html(), instances[i].template.length);
  }

  // run post processing tasks.
  for (var i = 0; i < postProcess.length; i++) {
    postProcess[i]();
  }
};
*/

/* PASSED OPTIONS */
//
var contentCss = exists(options.contentCss) ?
  ' class=' + options.contentCss.join(' ') : '';
// the buffer area we need to load in advance, default to double the height.
var buffer = exists(options.bufferHeight) ? options.bufferHeight : height * 2;
// since we have no way of knowing the visual size of items coming from the
// data source, our best guess is to preload just one item, unless the user
// tells us how many.
var preload = exists(options.preload) ? options.preload : 1;

/*
 * INITIALIZATION
 */

// save this closure's reference to the container(s) as a jQuery collection.
var selector = this;

// get the fixed container's height to orient our infinite scroll.
var height = selector.innerHeight();

var statement = selector.data('infiniteScroll');
var template = tmplCreate(selector);

selector.empty();

var contentStamp = createStamp();
var contentId = '#' + contentStamp;
var content = $("<div id='" + contentStamp
    + "' class='" + contentClass + " infinite-scroll-content'></div>");
selector.append(content);

//tmplForEach(content, statement, template);

/*
 * INFINITE LOADING
 */

// keep track of how many items we needed to load last time, use it as a base.
var lastNeeded = preload;
// keey track of the content's height on the previous load operation.
var lastHeight = height;
// count how many items loaded total so far.
var loadedItems = 0;

// this variable is set each time we begin loading new items, to keep what the
// initial height was.
var initialHeight;
// state of our infinite scroll: busy loading new items or done and ready.
var loading = false;
// a flag saying whether we're done with our data source.
var noMore = false;

// our callback renders the received items, checks if they're enough for the
// time being, and calls itself again if they're not.
var renderDataCallback = function(err, data) {
  var responseError = exists(err);
  if (responseError || !exists(data))
    console.log(responseError ? err : "Data property non-existent");
    
  if (!data.length) {
    noMore = true;
    return;
  }// else { console.log(template, data[0], tmplRender(template, data[0])); }

  // this is where we append new content proper.
  for (var i = 0; i < data.length; i++)
    $(contentId).append(tmplRender(template, data[i]));

  loadedItems += data.length;
  $('.loaded-counter').text("loaded " + loadedItems + " items");

  loading = false;

};

var watch = function() {
  selector.one('mousewheel', function() {
    if (noMore) return;

    var currentHeight = $(contentId)[0].scrollHeight;
    // don't account for the buffer to trigger a new batch load, load as soon
    // as we actually begin to use the buffer at all; that is, whenever our
    // scroll offset plus the view's height trespasses the content height.
    if (!loading && selector.scrollTop() + height > currentHeight) {
      loading = true;
      fetchData(loadedItems, lastNeeded, function(err, data) {
        renderDataCallback(err, data, initialHeight);
      });

      // if our content height didn't hit the buffered requirement, we need to
      // load more next time.
      if (currentHeight < lastHeight + buffer) { lastNeeded++; }
      // if we overload, decreases our needs;
      else if (currentHeight > lastHeight + buffer) lastNeeded--;
      lastHeight = currentHeight;
      console.log(lastNeeded);
    }

    // since the watch runs once, schedule it to run again.
    setTimeout(watch, 100);

  });
};

// set a watch on the mousewheel
watch();

// begin fetching an initial batch.
fetchData(loadedItems, lastNeeded, function(err, data) {
  renderDataCallback(err, data, initialHeight);
});

};
})(jQuery);
