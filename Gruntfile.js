/* eslint strict: 0 */

'use strict';

const config = require('config');

module.exports = grunt => {
  require('load-grunt-tasks')(grunt);
  require('./tasks/grunt-filetransform')(grunt);

  const gruntConfig = {
    jade: {
      dist: {
        options: {
          data: {config: JSON.stringify(config.get('Client'))},
          optimizationLevel: 3
        },
        files: [{
          expand: true,
          cwd: 'views/',
          src: ['**/*.jade'],
          dest: 'public/',
          ext: '.html'
        }]
      }
    },
    clean: {
      build: ['public/', './package.noDevDeps.json'],
      cordova: ['cordova/plugins', 'cordova/www', 'cordova/platforms'],
      compiled: ['./**/*.compiled.js', './**/*.compiled.js.map']
    },
    filetransform: {
      babel: {
        options: {
          transformer: require('./tasks/babel-cli'),
          extSrc: '.es6',
          extDest: '.compiled.js',
          env: 'server'
        },
        files: [{
          expand: true,
          src: ['**/*.es6', '!**/node_modules/**'],
          ext: '.compiled.js'
        }]
      }
    },
    concurrent: {
      clean: ['clean:build', 'clean:compiled'],
      build: ['imagemin', 'browserify:dist', 'filetransform:babel', ['sass:dist', 'postcss:dist'], 'jade:dist'],
      'build-production': ['imagemin', ['browserify:dist'], 'compile',
        ['sass:dist', 'postcss:dist'], 'jade:dist']
    }
  };

  grunt.initConfig(gruntConfig);

  grunt.registerTask('compile', [
    'clean:compiled',
    'filetransform:babel'
  ]);
};
