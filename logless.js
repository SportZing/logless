
var fs     = require('fs');
var jsp    = require('uglify-js').parser;
var pro    = require('uglify-js').uglify;
var async  = require('async');

var READABLE = true;

/**
 * Parse a block of code, removing all given references
 * to a given set of names
 */
exports.parse = function(code, names, callback) {
	if (typeof callback !== 'function') {
		throw new TypeError('Callback required');
	}
	var ast = getAst(code);
	removeNames(ast, names, function(err) {
		if (err) {return callback(err);}
		callback(null, genCode(ast));
	});
};

exports.parse.file = function(file, names, callback) {
	if (typeof callback !== 'function') {
		throw new TypeError('Callback required');
	}
	fs.readFile(file, function(err, data) {
		if (err) {return callback(err);}
		exports.parse(String(data), names, callback);
	});
};

// ------------------------------------------------------------------
//  Internals

function getAst(code) {
	return jsp.parse(code);
}

function genCode(ast) {
	if (! READABLE) {
		ast = pro.ast_mangle(ast);
		ast = pro.ast_squeeze(ast);
	}
	return pro.gen_code(ast, {
		beautify: READABLE
	});
}

// Actually traverse/parse the AST
function removeNames(ast, names, callback) {
	names = new NameTester(names);
	
	var index, scope;
	
	// The recursive traverser
	(function traverse(level, callback) {
		console.log('\n', level);
		switch (level[0]) {
			
			case 'toplevel':
			case '_function':
				index = 0;
				scope = level[1];
				async.forEachSeries(level[1],
					function(current, next) {
						traverse(current, function() {
							index++;
							next();
						});
					},
					function() {
						if (level[0] === '_function') {
							names.blacklists.pop();
						}
						level[1] = collapseNulls(level[1]);
						callback.apply(this, arguments);
					}
				);
			break;
			
			case 'stat':
				traverse(level[1], callback);
			break;
			
			case 'unary-prefix':
				traverse(level[2], callback);
			break;
			
			case 'call':
				if (level[1][0] === 'function') {
					traverse(parseCall(level), callback);
				} else {
					parseCall(level);
					callback();
				}
			break;
			
			default:
				console.log(level);
				callback();
			break;
			
		}
	}(ast, callback));
	
	// Parse "call" nodes
	function parseCall(node) {
		var callWhat = node[1];
		switch (callWhat[0]) {
			
			case 'dot':
			case 'name':
				if (names.test(callWhat)) {
					scope[index] = null;
				}
			break;
			
			case 'function':
				var argNames   = callWhat[2];
				var funcBody   = callWhat[3];
				var argValues  = node[2];
				
				var blacklist = [ ]
				argValues.forEach(function(arg, i) {
					if (names.test(arg)) {
						blacklist.push(argNames[i]);
						argNames[i] = argValues[i] = null;
					}
				});
				
				callWhat[2] = collapseNulls(argNames);
				node[2] = collapseNulls(argValues);
				names.blacklists.push(blacklist);
				
				return ['_function', funcBody];
			break;
			
		}
	}
	
}

// ------------------------------------------------------------------
//  Tests AST node structures against a blacklist of names

function NameTester(names) {
	this.names = names;
	this.blacklists = [ ];
}

NameTester.prototype.test = function(node) {
	var names = this.names.concat(
		flattenArrays(this.blacklists)
	);
	var testName = buildName(node);
	if (names.indexOf(testName)) {return true;}
	for (var i = 0, c = names.length; i < c; i++) {
		if (testName.indexOf(names[i]) === 0 &&
			(testName.length <= names[i].length || testName[names[i].length] === '.')
		) {return true;}
	}
	return false;
};

NameTester.prototype.addToCurrentBlacklist = function(name) {
	name = Array.isArray(name) ? name : [name];
	if (! this.blacklists.length) {
		this.blacklists.push([ ]);
	}
	var current = this.blacklists[this.blacklists.length - 1];
	current.push.apply(current, name);
};

// Convert an AST name/dot structure into an expression
function buildName(node, segments) {
	segments = segments || [ ];
	switch (node[0]) {
		case 'dot':
			buildName(node[1], segments);
			segments.push(node[2]);
		break;
		case 'name':
			segments.push(node[1]);
		break;
		case 'call':
			segments.push('*');
		break;
	}
	return segments.join('.');
}

// ------------------------------------------------------------------
//  Utilities

function collapseNulls(arr) {
	var result = [ ];
	arr.forEach(function(value) {
		if (value !== null) {
			result.push(value);
		}
	});
	return result;
}

function flattenArrays(arr) {
	arr.join(',').split(',');
}



















