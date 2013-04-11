# Scrape The Barrel Roll

This is basic infinite scroll functionality bundled as a jQuery plugin.

It's only requirement is a data fetching function that is called each time the user gets near the content bottom, and the function takes a callback to return it's results asynchronously, so it can be used both for client-side as well as remote data.

So, for example, to use it on an element with class .barrelbottom:

`var handler = $('.barrelbottom').scrapeTheBarrelRoll(fetchData, options);`.

The handler object can now be used to stop the infinite scroll at any point, e.g. when there's no more data to load, with `handler.stop()`. The second argument, the options object, isn't required and may otherwise contain any of the properties described in the `Options` section of this document.

### fetchData Function
`fetchData(offset, limit, callback)`

`offset`: where in tha data source the user currently is (i.e. how many items have loaded).

`limit`: how many new items scrape-the-barrel-roll wants to load this time.

`callback`: instead of returning a result from the function, you should execute the callback when you have the requested items.

**The callback function in turn expects these arguments**
callback(error, data)

`error`: if present, the callback will halt, and the errCallback function will be called with `error` as an argument.

`data`: should contain an array of new data to be loaded, up to `limit`, **or should be an empty array if the offset is beyond the data source's length.** Note that returning an empty array does not stop the infinite scroll, and to do that you should call `handler.stop()`, where handler is the value returned by the plugin's initial call.

## Options (none are required)
* `preload`: how many items should we load at the beginning, before any user interaction. The default i 1, because the size of the items is completely unkown, so it's heavily suggested that you pass in a value that makes sense to your use case.
* `contentCss`: any css classes to put in the div content wrapper that will be created between the selector ('.barrelbottom' in this example). Note that the content wrapper will be created regardless of whether this option is passed, since it's necessary for the plugin. You can see Bootstrap usage for this on demo.html & demo.js.
* `bufferHeight`: how much content we should load offscreen, before the user scrolls there. If this option isn't passed, we default to double your selector's height. You can pass a fixed number, but I suggest passing a function that takes the selector area's current height (the view's height, not the content height), e.g. `function(height) { return height * 2.71828; }`. 
* `scrollInterval`: in milliseconds, how often we should handle the scrolling event for checking if we need to load new content, defaults to `50`.
* `errCallback`: a custom function that will be called if there's any error coming from fetchData's callback. An error object will be passed, though it's properties depend on what fetchData returned, or a single `msg` property if an error is found inside the plugin.
* `loadedCallback`: a custom function called after the rendering of new items is successful, and receives how many items were just loaded as first argument, and the current total count of loaded items as second.
* `positionCallback`: called whenever scrolling is handled (depends on `scrollInterval`), receiving three arguments: the percentage position we are in, the absolute position we are in, and the total height of loaded content so far.
