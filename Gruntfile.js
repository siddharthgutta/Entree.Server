/* eslint strict: 0 */

'use strict';

module.exports = grunt => {
  require('load-grunt-tasks')(grunt);
  require('./tasks/grunt-filetransform')(grunt);

  const gruntConfig = {
    clean: {
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
    }
  };

  grunt.initConfig(gruntConfig);

  grunt.registerTask('compile', [
    'clean:compiled',
    'filetransform:babel'
  ]);

  grunt.registerTask('clear', [
    'clean:compiled'
  ]);
};
