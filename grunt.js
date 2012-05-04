/*
 * Grunt Task File
 * ---------------
 *
 * Task: logless
 * Description: Parses JavaScript files and removes logging statements
 *
 * Usage:
 *  
 *  logless: {
 *    task: {
 *      src: ["file1.js", "file2.js", "other/stuff/*.js"],
 *      dest: "path/to/destination",
 *      names: ["console", "alert"]
 *    }
 *  }
 *
 */

var path = require('path');
var logless = require('logless');

module.exports = function(grunt) {
	grunt.registerMultiTask('logless',
		'Parses JavaScript files and removes logging statements', function() {
			var data = this.data;
			var files = grunt.file.expandFiles(data.src);
			
			files.forEach(function(src) {
				try {
					var parsed = logless.parse(grunt.file.read(src), data.names);
					var target = path.join(data.dest, src);
					grunt.file.write(target, parsed);
					grunt.log.writeln('File "' + src + '" parsed -> "' + target + '"');
				} catch (err) {
					grunt.log.error(src + '\n' + err.stack);
				}
			});
			
			if (this.errorCount) {return false;}
		}
	);
};

