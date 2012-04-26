/* 
  Consumer Profile Capability App - Main
  Configures application-wide loggers
  Creates Profile Application core singleton object 
*/
!function($, Application, Logger, exports) {

  // Logging defaults to INFO, so override contexts if desired
  Logger.configure([
    {context: 'nike.profile.mixins.loader.loader', level: Logger.ERROR, save: true},
    {context: 'nike.profile.mixins.events.mediator', level: Logger.LOG, save: true},
    // {context: 'nike.widgets.profile.routers.Profile', level: Logger.LOG, save: true},
    {context: 'nike.profile.core.Application', level: Logger.DEBUG, save: true}
  ]);

  var logger = Logger.getLogger(exports.namespace+'.main');

  // Create an instance of Profile Application
  var app = new Application({
    defaultView: 'dashboard'
  });

  // Only one Application instance should exist
  exports.main = app;

  $(function() {
    logger.log('DOM READY');
    // Everything should be registered at DOM ready, so start app
    app.start();
  });

}(
  $,
  nike.profile.Application,
  nike.util.Logger,
  nike.ns('nike.profile')
);
