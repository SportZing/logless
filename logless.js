
var fs        = require('fs');
var jsp       = require('uglify-js').parser;
var burrito   = require('burrito');

/**
 * Parse a block of code, removing all given references
 * to a given set of names
 */
exports.parse = function(code, names) {
	var ast = getAst(code);
	return removeNames(ast, names);
};

exports.parse.file = function(file, names) {
	return exports.parse(
		String(fs.readFileSync(file)), names
	);
};

// ------------------------------------------------------------------
//  Internals

function getAst(code) {
	return jsp.parse(code, false, true);
}

function removeNames(ast, names) {
	var statement;
	names = new NameTester(names);
	return burrito(ast, function(node) {
		switch (node.name) {
			
			case 'var':
				node.node[1].forEach(function(sub, i) {
					if (names.test(sub[1][1])) {
						names.addToCurrentBlacklist(sub[0]);
						node.node[1][i] = null;
					}
				});
				collapseNulls(node.node[1]);
				if (! node.node[1].length) {
					node.state.delete();
				}
			break;
			
			case 'assign':
				// TODO
			break;
			
			case 'stat':
				statement = node;
			break;
			
			case 'call':
				var sub = node.node[1];
				switch (sub[0]) {
					
					// TODO Also needs to handle removing blacklisted
					// names at the end of a function scope
					case 'function':
						var argNames = sub[2];
						var argValues = node.node[2];
						
						var blacklist = [ ];
						argValues.forEach(function(arg, i) {
							if (names.test(arg)) {
								blacklist.push(argNames[i]);
								argNames[i] = argValues[i] = null;
							}
						});
						
						collapseNulls(argNames);
						collapseNulls(argValues);
						
						names.addBlacklist(blacklist);
					break;
					
					case 'dot':
					case 'name':
						if (names.test(node.value[0])) {
							statement.state.delete();
						}
					break;
					
					default:
						// XXX Should not happen
					break;
					
				}
			break;
			
			case 'unary-prefix':
				return;
			break;
			
			default:
				// XXX Safely ignored
			break;
		
		}
		
	});
}
	
	function Log(foo, depth) {
		console.log(
			'\n' + require('util').inspect(foo, true, depth || 3) + '\n'
		);
	}

// ------------------------------------------------------------------
//  Tests AST node structures against a blacklist of names

function NameTester(names) {
	this.blacklists = [ ];
	this.names = names.slice();
}

NameTester.prototype.test = function(node) {
	var names = flattenArrays([ this.names, this.blacklists ]);
	var testName = buildName(node);
	if (names.indexOf(testName) >= 0) {return true;}
	for (var i = 0, c = names.length; i < c; i++) {
		if (testName.indexOf(names[i]) === 0 &&
			(testName.length <= names[i].length || testName[names[i].length] === '.')
		) {return true;}
	}
	return false;
};

NameTester.prototype.addBlacklist = function(blacklist) {
	this.blacklists.push(blacklist || [ ]);
};

NameTester.prototype.addToCurrentBlacklist = function(name) {
	name = Array.isArray(name) ? name : [name];
	if (! this.blacklists.length) {
		this.addBlacklist();
	}
	var current = this.blacklists[this.blacklists.length - 1];
	current.push.apply(current, name);
};

// Convert an AST name/dot structure into an expression
function buildName(node, segments) {
	segments = segments || [ ];
	switch ((typeof node[0] === 'string') ? node[0] : node[0].name) {
		case 'dot':
			buildName(node[1], segments);
			segments.push(node[2]);
		break;
		case 'name':
			segments.push(node[1]);
		break;
		case 'call':
			buildName(node[1], segments);
		break;
	}
	return segments.join('.');
}

// ------------------------------------------------------------------
//  Utilities

function collapseNulls(arr) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] === null) {
			arr.splice(i--, 1);
		}
	}
}

function flattenArrays(arr) {
	return arr.join(',').split(',');
}

/* End of file logless.js */
