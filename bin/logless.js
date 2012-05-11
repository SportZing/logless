#!/usr/bin/env node

/**
 * CLI For logless
 */

var logless = require('../logless');

var opts = {
	input: null,
	output: null,
	terms: null,
	beautify: true
};

var args = process.argv.slice(2);

if (! args.length) {
	console.log('No parameters given. Use `logless --help` for usage.');
	process.exit(0);
}

while (args.length) {
	switch (args.shift()) {
		
		case '--help':
			console.log([
				'',
				'  usage: logless [--input <in-file>] [--output <out-file>] [--terms <terms>...]',
				'',
				'  Options:',
				'',
				'    --help',
				'      Show this message',
				'',
				'    --input',
				'      Select an input file (defaults to stdin)',
				'',
				'    --output',
				'      Select an output file (defaults to stdout)',
				'',
				'    --beautify <yes|no>',
				'      Should resulting code be beautified?',
				'',
				'    --terms',
				'      Followed by a list of blacklist terms (eg. --terms "console.log" "alert").',
				'      Because this takes all remaining args, this option should be last.',
				''
			].join('\n'));
			process.exit(0);
		break;
		
		case '--grunt':
			var fs = require('fs');
			var path = require('path');
			var output = path.resolve(process.cwd(), args.shift());
			fs.stat(output, function(err, stats) {
				if (err) {throw err;}
				if (stats.isDirectory()) {
					output = path.join(output, 'logless.js');
				}
				fs.readFile(path.join(__dirname, '../grunt.js'), function(err, data) {
					if (err) {throw err;}
					console.log('> Creating logless grunt task file...');
					fs.writeFile(output, data, function(err) {
						if (err) {throw err;}
						console.log('> Grunt task file created at ' + output);
						process.exit(0);
					});
				});
			});
			return;
		break;
		
		case '--input':
			opts.input = args.shift();
		break;
		
		case '--output':
			opts.output = args.shift();
		break;
		
		case '--beautify':
			opts.beautify = (args.shift().toLowerCase() === 'yes');
		break;
		
		case '--terms':
			opts.terms = args.splice(0);
		break;
		
	}
}

if (! opts.terms) {
	console.error('No blacklist terms given.');
	process.exit(1);
}

readInput(function(code) {
	writeOutput(
		logless.parse(code, opts.terms)
	);
});

// ------------------------------------------------------------------
//  I/O Shortcuts

function readInput(callback) {
	if (opts.input === null) {
		var stdin = '';
		process.stdin.resume();
		process.stdin.setEncoding('utf8');
		process.on('data', function(chunk) {
			stdin += chunk;
		});
		process.on('end', function() {
			callback(stdin);
		});
	} else {
		require('fs').readFile(opts.input, function(err, data) {
			if (err) {throw err;}
			callback(String(data));
		});
	}
}

function writeOutput(output) {
	if (opts.output === null) {
		process.stdout.write(output + '\n');
	} else {
		require('fs').writeFile(opts.output, output, function(err) {
			if (err) {throw err;}
		});
	}
}

/* End of file logless.js */
/* Location: ./bin/logless.js */
