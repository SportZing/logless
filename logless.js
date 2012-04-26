
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
	
	// The recursive traverser
	(function traverse(level, callback) {
		switch (level[0]) {
			
			case 'toplevel':
				async.forEach(level[1], traverse, callback);
			break;
			
			case 'stat':
				traverse(level[1], callback);
			break;
			
			case 'unary-prefix':
				traverse(level[2], callback);
			break;
			
			case 'call':
				traverse(parseCall(level), callback);
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
			
			case 'function':
				var argNames   = callWhat[2];
				var funcBody   = callWhat[3];
				var argValues  = node[2];
				
				argValues.forEach(function(arg, i) {
					if (names.test(arg)) {
						argNames[i] = argValues[i] = null;
					}
				});
				
				callWhat[2] = collapseNulls(argNames);
				node[2] = collapseNulls(argValues);
				
				return funcBody;
			break;
			
		}
	}
	
}

// ------------------------------------------------------------------
//  Tests AST node structures against a blacklist of names

function NameTester(names) {
	this.names = names;
}

NameTester.prototype.test = function(node) {
	return (this.names.indexOf(buildName(node)) >= 0);
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





















