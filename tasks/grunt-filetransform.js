/**
 * Created by kfu on 6/18/16.
 */

/* eslint strict: 0 */

'use strict';

const fs = require('fs');
const util = require('util');

/*
 * Create JS file from es6 file
 */
function createJSFromES6(grunt, transformer, input, output, options) {
  console.log(`Transforming: ${input} ... ${output}`);
  const data = transformer.transform(input, output, options);

  for (const f in data) {
    if (data.hasOwnProperty(f)) {
      grunt.file.write(f, data[f]);
    }
  }
}

/**
 * Gets the last modified timestamp of a file
 *
 * @param {String} filePath: string path to the file
 * @returns {Number} timestamp of when the file was last modified
 */
function getMTimestamp(filePath) {
  const stats = fs.statSync(filePath);
  const mtime = new Date(util.inspect(stats.mtime));
  return mtime.getTime();
}


module.exports = function fileTransform(grunt) {
  grunt.registerMultiTask('filetransform', 'File transform module', function transform() {
    const options = this.options({transformer: null});
    const transformer = options.transformer;

    let compiledCount = 0;
    let alreadyCompiledCount = 0;

    if (transformer && typeof transformer.transform === 'function') {
      this.files.forEach(file => {
        // Get Input and Output file paths
        const input = file.src[0];
        const output = file.dest;

        try {
          // Get last modified time from the output js file
          const outmtime = getMTimestamp(output);

          try {
            // Get last modified time from the input es6 file
            const inmtime = getMTimestamp(input);

            // Check if the modified time for the input es6 file is more recent
            // than the time the output js was created
            if (inmtime >= outmtime) {
              createJSFromES6(grunt, transformer, input, output, options);
              compiledCount += 1;
            } else {
              console.log(`${output} is already up to date. | No Transform needed`);
              alreadyCompiledCount += 1;
            }
          } catch (err) {
            // Error should not occur since input file should be exist, transforming anyways
            console.log(`Could not get stats for ${input}`);
            createJSFromES6(grunt, transformer, input, output, options);
            compiledCount += 1;
          }
        } catch (err) {
          // If output file not found or not accessible, creates new output js file
          createJSFromES6(grunt, transformer, input, output, options);
          compiledCount += 1;
        }
      });
    }
    console.log(`Total Transformed: ${compiledCount}/${(alreadyCompiledCount + compiledCount)}`);
  });
};
