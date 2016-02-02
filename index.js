/**
 *   ___             _   ___                       EventSauce
 *   | __|_ _____ _ _| |_/ __| __ _ _  _ __ ___    CQRS / Event Sourcing Framework for NodeJS
 *   | _|\ V / -_) ' \  _\__ \/ _` | || / _/ -_)   (c) 2016 Steve Gray / eventualconsistency.net
 *   |___|\_/\___|_||_\__|___/\__,_|\_,_\__\___|   This code is MIT licenced.
 **/
'use strict';

// NPM External dependencies.
const debug = require('debug')('gulp-eventsauce:plugin');
const defaults = require('defaults');
const fs = require('fs');
const gutil = require('gulp-util');
const Handlebars = require('handlebars');
const path = require('path');
const through = require('through2');
const util = require('util');
const yamljs = require('yamljs');

const defaultOptions = {
  templateEncoding: 'utf8',
  naming: {
    aggregate: {
      file: formatAggregateFileName,
      public: formatAggregatePublishedName,
      extension: '.js',
      folder: 'aggregates',
      suffix: 'Aggregate',
    },
    command: {
      file: formatCommandFileName,
      extension: '.js',
      public: formatCommandPublishedName,
      folder: 'commands',
      suffix: 'Command',
      prefixAggregateName: false,
      generateModule: true,
    },
    event: {
      file: formatEventFileName,
      extension: '.js',
      public: formatEventPublishedName,
      folder: 'events',
      suffix: 'Event',
      prefixAggregateName: false,
      generateModule: true,
    },
    fault: {
      file: formatFaultFileName,
      extension: '.js',
      public: formatFaultPublishedName,
      folder: 'faults',
      suffix: 'Fault',
      prefixAggregateName: false,
      generateModule: true,
    },
    subModule: {
      name: 'index.js',
    },
    rootModule: {
      name: 'index.js',
    }
  },
  templates: {
    aggregate: path.join(__dirname, 'templates', 'es6-server', 'aggregate.handlebars'),
    command: path.join(__dirname, 'templates', 'es6-common', 'command.handlebars'),
    event: path.join(__dirname, 'templates', 'es6-common', 'event.handlebars'),
    fault: path.join(__dirname, 'templates', 'es6-common', 'fault.handlebars'),
    subModule: path.join(__dirname, 'templates', 'es6-common', 'module.handlebars'),
    rootModule: path.join(__dirname, 'templates', 'es6-common', 'module.handlebars'),
  }
};

/**
 * Capitalize the first letter of a string
 * @param   {string}      input       - String to process
 * @returns {string}                  - Original string with capitalized first letter.
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Seperate an input string by any capital letters in the text, and then
 * return the lowercased string joined with some divider.
 *
 * @param {string}        input       - String to process
 * @param {string}        divider     - String to place between each item.
 * @returns {string}                  - Lowercased, split by capitals and joined with dividers.
 */
function seperateByCaps(input, divider) {
  const members = input.split(/(?=[A-Z])/);
  return members.join(divider).toLowerCase();
}

/**
 * Clean-up an input string, capitalizing the first letter and applying a suffix if one
 * does not exist.
 *
 * @param {string}        input       - String to process
 * @param {string}        suffix      - Suffix to apply if not already there.
 * @returns {string}                  - String with uppercased first letter, suffixed.
 */
function cleanupAndTerminate(input, suffix) {
  let formatted = capitalizeFirstLetter(input);
  if (!formatted.toLowerCase().endsWith(suffix.toLowerCase())) {
    formatted = formatted + suffix;
  }
  return formatted;
}

/**
 * Format the name of an aggregate for external reference/publication.
 *
 * @param   {string}      aggName     - Input string (Aggregate name)
 * @param   {object}      options     - Options
 * @returns {string}                  - Formatted name for  purposes.
 */
function formatAggregatePublishedName(aggName, options) {
 return cleanupAndTerminate(aggName, options.suffix);
}

/**
 * Format the file-name of an aggregate for code generation
 *
 * @param   {string}      aggName     - Input string (Aggregate name)
 * @param   {object}      options     - Options
 * @returns {string}                  - Formatted name for  purposes.
 */
function formatAggregateFileName(aggName, options) {
  // Combine with aggregate name
  let formatted = capitalizeFirstLetter(aggName);

  // Suffix with tail text
  formatted = cleanupAndTerminate(formatted, options.suffix);

  // Split up and lowercase the name
  formatted = seperateByCaps(formatted, '-');

  // Add extension for filename
  formatted = formatted + options.extension;
  return formatted;
}

/**
 * Format the name of an command for external reference/publication.
 *
 * @param   {string}      aggName     - Aggregate name
 * @param   {string}      commandName - Command name
 * @param   {object}      options     - Options
 * @returns {string}                  - Formatted name.
 */
function formatCommandPublishedName(aggName, commandName, options) {
  if (options.prefixAggregateName) {
    return cleanupAndTerminate(aggName, cleanupAndTerminate(commandName, options.suffix));
  }
  return cleanupAndTerminate(commandName, options.suffix);
}

/**
 * Format the file-name of a command for code generation
 *
 * @param   {string}      aggName     - Aggregate name
 * @param   {string}      commandName - Command name
 * @param   {object}      options     - Options
 * @returns {string}                  - Formatted name.
 */
function formatCommandFileName(aggName, commandName, options) {
  // Combine with aggregate name
  let formatted = (options.prefixAggregateName ?
    capitalizeFirstLetter(aggName) : '')
    + capitalizeFirstLetter(commandName);

  // Suffix with tail text
  formatted = cleanupAndTerminate(formatted, options.suffix);

  // Split up and lowercase the name
  formatted = seperateByCaps(formatted, '-');

  // Add extension for filename
  formatted = formatted + options.extension;
  return formatted;
}

/**
 * Format the name of an event for external reference/publication.
 *
 * @param   {string}      aggName     - Aggregate name
 * @param   {string}      eventName   - Event name
 * @param   {object}      options     - Options
 * @returns {string}                  - Formatted name.
 */
function formatEventPublishedName(aggName, eventName, options) {
  if (options.prefixAggregateName) {
    return cleanupAndTerminate(aggName, cleanupAndTerminate(eventName, options.suffix));
  }
  return cleanupAndTerminate(eventName, options.suffix);
}

/**
 * Format the file-name of an event for code generation
 *
 * @param   {string}      aggName     - Aggregate name
 * @param   {string}      eventName   - Event name
 * @param   {object}      options     - Options
 * @returns {string}                  - Formatted name.
 */
function formatEventFileName(aggName, eventName, options) {
  // Combine with aggregate name
  let formatted = (options.prefixAggregateName ?
    capitalizeFirstLetter(aggName) : '')
    + capitalizeFirstLetter(eventName);

  // Suffix with tail text
  formatted = cleanupAndTerminate(formatted, options.suffix);

  // Split up and lowercase the name
  formatted = seperateByCaps(formatted, '-');

  // Add extension for filename
  formatted = formatted + options.extension;
  return formatted;
}

/**
 * Format the name of a fault for external reference/publication.
 *
 * @param   {string}      aggName     - Aggregate name
 * @param   {string}      faultName   - Fault name
 * @param   {object}      options     - Options
 * @returns {string}                  - Formatted name.
 */
function formatFaultPublishedName(aggName, faultName, options) {
  if (options.prefixAggregateName) {
    return cleanupAndTerminate(aggName, cleanupAndTerminate(faultName, options.suffix));
  }
  return cleanupAndTerminate(faultName, options.suffix);
}

/**
 * Format the file-name of a fault for code generation
 *
 * @param   {string}      aggName     - Aggregate name
 * @param   {string}      faultName   - Fault name
 * @param   {object}      options     - Options
 * @returns {string}                  - Formatted name.
 */
function formatFaultFileName(aggName, faultName, options) {
  // Combine with aggregate name
  let formatted =  (options.prefixAggregateName ?
    capitalizeFirstLetter(aggName) : '')
    + capitalizeFirstLetter(faultName);

  // Suffix with tail text
  formatted = cleanupAndTerminate(formatted, options.suffix);

  // Split up and lowercase the name
  formatted = seperateByCaps(formatted, '-');

  // Add extension for filename
  formatted = formatted + options.extension;
  return formatted;
}

/**
 * Is the object null or undefined?
 * @param   {object}      obj         - Object to test
 * @returns {boolean}                 - True if undefined or null, false otherwise.
 */
function isNullOrUndefined(obj) {
  return obj === null || obj === undefined;
}

/**
 * Load a handlebars template from a file.
 * @param   {string}    path          - Path to file
 * @param   {string}    encoding      - File encoding to use
 * @param   {object}    handlebars    - Handlebars instance to use.
 * @returns {object}                  - Handlebars template instance
 */
function loadTemplate(path, encoding, handlebars) {
  try {
    debug('    Loading text file template from %s', path);
    const fileContent = fs.readFileSync(path, encoding);

    debug('        Parsing with handlebars');
    const template = handlebars.compile(fileContent);

    debug('        Compiled succesfully.');
    return template;
  } catch (err) {
    throw new Error(util.format('Error loading template %s: %s', path, err.toString()));
  }
}

/**
 * Generate a gulp stream context for this plugin.
 * @param   {object}      options     - Plugin options
 * @returns {object}                  - Gulp pipeline stage/stream activity.
 */
function generator(options) {
  // No options, no win
  debug('Applying configuaration defaults');
  const configuration = defaults(options, defaultOptions);
  debug('Resulting configuration:');
  debug(configuration);

  // Build our handlebars instance and load the required templates.
  debug('Constructing handlebars instance');
  const handleBars = Handlebars.create();
  var templateSet = {};
  for (let key in configuration.templates) {
     templateSet[key] = loadTemplate(configuration.templates[key], configuration.templateEncoding, handleBars); 
  }
  
  /**
   * Process the code-generation activities for a single eventsauce YAML file.
   * @param   {object}    file        - File being processed from input stream.
   * @param   {string}    encoding    - Text encoding to use when reading file
   * @param   {Function}  callback    - File encoding callback
   * @returns {object}                - Overall result (dummy/not used by gulp upstream).
   */
  function processEventSauceSpec(file, encoding, callback) {
      if (!configuration) {
          throw new Error('No config');
      }
    // Validate arguments
    if (isNullOrUndefined(file)) {
      this.push(file);
      return callback();
    }

    debug('Processing file: %s', file.path);
    try {
      // Parse the YAML file
      const fileContent = file.contents.toString(encoding);
      debug('    Parsing file text as YAML');
      const model = yamljs.parse(fileContent);

      const flags = {};
      const collections = {};

      for (const aggregateName in model.aggregates) {
        // Generate some commmon aggregate things
        debug('        Processing aggregate: %s', aggregateName);
        const aggNaming = configuration.naming.aggregate;
        const aggDef = model.aggregates[aggregateName];
        aggDef.className = aggNaming.public(aggregateName, aggNaming);
        debug('            Class Name: %s', aggDef.className);
        aggDef.fileName = aggNaming.file(aggregateName, aggNaming);
        debug('            File Name:  %s', aggDef.fileName);
        aggDef.model = model;
        // Render our template to the appropriate path
        const aggPath = path.join(aggNaming.folder, aggDef.fileName);
        debug('            Rendering template...');
        const aggOutput = templateSet.aggregate(aggDef);
        this.push(new gutil.File({
          path: aggPath,
          contents: new Buffer(aggOutput),
        }));

        /**
         * Process a sub-object collection from this aggregate.
         */
        function processSubObject(self, typeName, template, collection, namingOptions) {
          for (const subName in collection) {
            debug('            Processing %s: %s', typeName, subName);
            const subDef = collection[subName];
            subDef.className = namingOptions.public(aggregateName, subName, namingOptions);
            debug('               Class Name:  %s', subDef.className);
            subDef.fileName = namingOptions.file(aggregateName, subName, namingOptions);
            debug('               File Name:  %s', subDef.fileName);
            subDef.aggregate = aggDef;
            flags[typeName] = namingOptions.folder;
            const subPath = path.join(namingOptions.folder, subDef.fileName);
            debug('               Pathed Name:  %s', subPath);
            if (!collections[typeName]) {
              collections[typeName] = [];
              collections[typeName].items = [];
              collections[typeName].folder = namingOptions.folder;
            }
            collections[typeName].items.push({
              className: subDef.className,
              fileName: subDef.fileName,
              fullPath: subPath,
            });
            // Render our template to the appropriate path
            debug('               Rendering template...');
            const subOutput = template(subDef);
            if (self == null) {
              throw new Error('null');
            }
            self.push(new gutil.File({
              path: subPath,
              contents: new Buffer(subOutput),
            }));
          }
        }

        // Process sub-constructs
        if (aggDef.commands) {
          processSubObject(this, 'command', templateSet.command, aggDef.commands, configuration.naming.command);
        }
        if (aggDef.events) {
          processSubObject(this, 'event', templateSet.event, aggDef.events, configuration.naming.event);
        }
        if (aggDef.faults) {
          processSubObject(this, 'fault', templateSet.fault, aggDef.faults, configuration.naming.fault);
        }
      }

      // Generate global objects
      for (const key in flags) {
        debug('Rendering global flag file for %s', key);
        const folderName = flags[key];
        const items = collections[key];
        const rendered = templateSet.subModule(items);
        this.push(new gutil.File({
          path: path.join(folderName, configuration.naming.subModule.name),
          contents: new Buffer(rendered),
        }));
      }
      // Generate root module
      debug('Rendering root module');
      const data = {};
      data.items = [];
      for (const key in flags) {
        data.items.push({
          className: key,
          fileName: collections[key].folder,
        });
      }
      const rendered = templateSet.rootModule(data);
      this.push(new gutil.File({
        path: path.join(configuration.naming.rootModule.name),
        contents: new Buffer(rendered),
      }));
      
      
    } catch (err) {
      debug('    Unhandled exception occured in plugin. Raising context error.');
      debug(err);
      this.emit('error', err);
    } finally {
      callback();
    }
  }

  return through.obj(processEventSauceSpec);
}

module.exports = generator;
