# gulp-eventsauce
Gulp package for generating code to interact with an eventsauce-based domain. This
module is presently an ES6 module and is largely work in-progress. Feature suggestions
and error reports welcome.

The package is intended to support common scenarios with zero-configuration, as much
as reasonably possible.

## Installation
To install this plugin:

    npm install --save-dev gulp-eventsauce

The task should recieve an eventsauce domain-contract YAML file as an input, and
the destination should be a folder where you want to write out the generated code:

    const saucegen = require('gulp-eventsauce')
  
    gulp.task('saucegen', () =>
      gulp.src('./contracts/domain.yml'
      .pipe(saucegen(options))
      .pipe(gulp.dest('./src/domain')));

To run the task directly:

    gulp saucegen

We recommend integrating into your build pipeline so that:

  * Code should be generated post-linting/instrumentation, unless
    you are attempting to match the styles completely through template
    customisation.
  * Generated code should be added to .gitignore / excluded from source
    control to avoid churn.

## Default Behaviour
The default options (pass null or partially complete object) will:

  * Generates server-oriented ES6 code.
  * Generate a domain folder with nested folders for:
      * Aggregates
      * Commands
      * Events
      * Faults
  * Classes are named with the following rules:
      * Capitalized first letter (i.e. SomeAggregate, MyEvent)
      * Aggregates are suffixed with 'Aggregate' if not already
      * Commands are suffixed with 'Command' if not already
      * Events are suffixed with 'Event' if not already
      * Faults are suffixed with 'Fault' if not already.
   * Physical file names are generated with:
      * .js extension
      * All text is lowercased.
      * Capital lettes in original text are used to break the name.
      * For example: SomeEvent becomes some-event.js

All generated code meets the eslint-airbnb ruleset.

## Feature Roadmap
These are the planned features in order of likely appearance:

  * Multiple configuration defaults/presets that can be fetched from
    the module, such as:
      * ES6 Server Code - swagger-tools/connect microservice host, including
        generating a swagger.yml file to describe the service.
      * ES6 Client Code - Automatically generated client code.
  * Ability to customize code generation structure/core executuion
    path with a callback.
  * Potentially convert code generation to ES3/run on NodeJS 0.x build
    setups.

## Task Options

    const options = {
      // Encoding for template files.
      templateEncoding: 'utf8',

      // Naming rules for objects
      naming: {
        // Aggregates
        aggregate: {
          // file: Physical filename within target folder
          // Must be function with sig: string generateName(agggName, options)
          file: formatAggregateFileName,

          // Public name (i.e. Class/Export name)
          // Must be function with sig: string generateName(agggName, options)
          public: formatAggregatePublishedName,

          // File extension
          extension: '.js',

          // Destination subfolder under gulp.dest
          folder: 'aggregates',

          // Suffix to add to file and object names
          suffix: 'Aggregate',
        },

        // Command DTO
        command: {
          // For command, event and fault these callbacks
          // must be functions with sig: string generateName(agggName, commandName, options)
          file: formatCommandFileName,
          public: formatCommandPublishedName,

          // As above
          extension: '.js',
          folder: 'commands',
          suffix: 'Command',
          prefixAggregateName: false,

          // Generate 'index.js' in root of destination folder?
          generateModule: true,
        },

        // Event DTO
        event: {
          // For command, event and fault these callbacks
          // must be functions with sig: string generateName(agggName, commandName, options)
          file: formatEventFileName,
          public: formatEventPublishedName,0

          extension: '.js',
          folder: 'events',
          suffix: 'Event',
          prefixAggregateName: false,
          generateModule: true,
        },

        // Domain Fault DTO
        fault: {
          // For command, event and fault these callbacks
          // must be functions with sig: string generateName(agggName, commandName, options)
          file: formatFaultFileName,
          public: formatFaultPublishedName,

          extension: '.js',
          folder: 'faults',
          suffix: 'Fault',
          prefixAggregateName: false,
          generateModule: true,
        },

        // Generated file-name for the root of command/event/fault
        // output directories
        subModule: {
          name: 'index.js',
        },

        // Generated root file that links the subModules
        rootModule: {
          name: 'index.js',
        }
      },

      // Template paths - Note that these default templates are part
      // of the gulp-eventsauce package - you only need to add your 
      // own to the project if you wish to change the output.
      templates: {
        aggregate: path.join(__dirname, 'templates', 'es6-server', 'aggregate.handlebars'),
        command: path.join(__dirname, 'templates', 'es6-common', 'command.handlebars'),
        event: path.join(__dirname, 'templates', 'es6-common', 'event.handlebars'),
        fault: path.join(__dirname, 'templates', 'es6-common', 'fault.handlebars'),
        subModule: path.join(__dirname, 'templates', 'es6-common', 'module.handlebars'),
        rootModule: path.join(__dirname, 'templates', 'es6-common', 'module.handlebars'),
      }
    };