require.config({
  baseUrl: '/',
  paths: {
    jquery: 'lib/jquery/jquery',
    text: 'lib/requirejs-text/text',
    base64: 'lib/base64/base64.min',
    hogan: 'lib/hogan/web/builds/2.0.0/hogan-2.0.0.amd',
    hgn: 'lib/requirejs-hogan-plugin/hgn',
    json: 'lib/requirejs-plugins/src/json',
    jasmine: 'lib/jasmine/lib/jasmine-core/jasmine',
    'jasmine-html': 'lib/jasmine/lib/jasmine-core/jasmine-html',
    'jasmine-jquery': 'lib/jasmine-jquery/lib/jasmine-jquery',
    inherits: 'lib/inherits/inherits',
    'event-emitter': 'lib/event-emitter/src/event-emitter',
  },
  packages: [{
    name: "thread",
    location: "src"
  },{
    name: "streamhub-sdk",
    location: "lib/streamhub-sdk/src"
  },{
    name: "streamhub-sdk-tests",
    location: "lib/streamhub-sdk/tests"
  },{
    name: "streamhub-sdk/auth",
    location: 'lib/streamhub-sdk/src/auth'
  },{
    name: "streamhub-sdk/collection",
    location: 'lib/streamhub-sdk/src/collection'
  },{
    name: "streamhub-sdk/content",
    location: 'lib/streamhub-sdk/src/content'
  },{
    name: "streamhub-sdk/modal",
    location: "lib/streamhub-sdk/src/modal"
  },{
    name: "stream",
    location: "lib/stream/src"
  },{
    name: "view",
    location: "lib/view/src",
    main: "view"
  },{
    name: 'streamhub-editor',
    location: 'lib/streamhub-editor/src/javascript'
  },{
    name: 'annotations',
    location: 'lib/annotations/src/javascript'
  },{
    name: 'annotations/events',
    location: 'lib/annotations/src/javascript/events',
    main: 'events'
  },{
    name: 'annotations/adapters',
    location: 'lib/annotations/src/javascript/adapters',
    main: 'adapters'
  },{
    name: 'templates',
    location: 'src/templates'
  },{
    name: 'livefyre-bootstrap',
    location: 'lib/livefyre-bootstrap/src'
  }],
  shim: {
    jquery: {
        exports: '$'
    },
    jasmine: {
        exports: 'jasmine'
    },
    'jasmine-html': {
        deps: ['jasmine'],
        exports: 'jasmine'
    },
    'jasmine-jquery': {
        deps: ['jquery']
    }
  }
});
