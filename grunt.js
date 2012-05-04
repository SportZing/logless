/*
 * Grunt Task File
 * ---------------
 *
 * Task: logless
 * Description: Parses JavaScript files and removes logging statements
 *
 */

var logless = require('logless');

module.exports = function(grunt) {
	grunt.registerMultiTask('logless',
		'Parses JavaScript files and removes logging statements', function() {
			var data = this.data;
			var files = grunt.file.expandFiles(data.src);
			
			files.src.forEach(function(src) {
				try {
					var parsed = logless.parse(grunt.file.read(src), data.terms);
					var target = data.dest + '/' + src;
					grunt.file.write(target, parsed);
					grunt.log.writeln('File "' + src + '" parsed -> "' + target + '"');
				} catch (err) {
					grunt.log.error(err);
				}
			});
			
			if (this.errorCount) {return false;}
		}
	);
};

