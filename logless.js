
var fs   = require('fs');
var jsp  = require('uglify-js').parser;
var pro  = require('uglify-js').uglify;

// ------------------------------------------------------------------
//  Public parsers
 
exports.parse = function(code, names) {
	return genCode(doParse(code, names));
};

exports.parse.file = function(file, names, callback) {
	fs.readFile(file, function(err, data) {
		if (err) {
			return callback(err);
		}
		try {
			var result = removeNames(String(data), names);
			callback(null, result);
		} catch (e) {callback(e);}
	});
};

exports.parse.fileSync = function(file, names) {
	return exports.parse(
		String(fs.readFileSync(file)), names
	);
};

// ------------------------------------------------------------------
//  Main parser

function doParse(code, names) {
	names = new Blacklist(names);
	
	var statement;
	var walker = new Walker(getAst(code), function(node) {
		switch (node.name) {
			
			case 'toplevel':
				// pass
			break;
			
			case 'var':
				for (var i = 0; i < node.node[1].length; i++) {
					var sub = node.node[1][i];
					if (sub[1][0].name !== 'function') {
						if (names.test(sub[1][1])) {
							names.addToCurrentBlacklist(sub[0]);
							node.node[1].splice(i--, 1);
						}
					}
				}
				if (! node.node[1].length) {
					node.remove();
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
					
					case 'function':
						var argNames = sub[2];
						var argValues = node.node[2];
						
						var blacklist = [ ];
						for (var i = 0; i < argValues.length; i++) {
							if (names.test(argValues[i])) {
								blacklist.push(argNames[i]);
								argNames.splice(i, 1);
								argValues.splice(i--, 1);
							}
						}
						
						names.addBlacklist(blacklist);
						node.after(function() {
							names.removeCurrentBlacklist();
						});
					break;
					
					case 'dot':
					case 'name':
						if (names.test(node.value[0])) {
							statement.remove();
						}
					break;
					
				}
			break;
			
			case 'unary-prefix':
			default:
				// pass
			break;
		
		}
	});
	walker.walk();
	return walker.ast;
}

// ------------------------------------------------------------------
//  AST Walker Constructor

function Walker(ast, onstep) {
	this.ast       = ast;
	this.path      = [ ];
	this.onstep    = onstep;
	this.current   = ast;
	this.parents   = [ ];
}

Walker.prototype.handleNode = function(node) {
	if (Node.isNode(node)) {
		node = new Node(node, this.parents.slice(-1)[0], this);
		this.onstep.call(this, node);
	}
};

Walker.prototype.walk = function() {
	var node = this.handleNode(this.current);
	if (Array.isArray(this.current)) {
		var depth = this.path.length;
		var parent = this.current;
		this.parents.push(parent);
		var previous = [ ];
		for (var key = 0; key < parent.length; key++) {
			
			this.path.push(key);
			this.current = parent[key];
			
			if (previous.indexOf(this.current) >= 0) {continue;}
			previous.push(this.current);
			
			this.walk();
			
			if (this.path.length <= depth) {break;}
			key = this.path.pop();
			
		}
		this.parents.pop();
		this.current = parent;
	}
	if (node && node._after) {
		node._after.call(this, node);
	}
};

// ------------------------------------------------------------------
//  AST Node Constructor

function Node(node, parent, walker) {
	this.node      = node;
	this.parent    = parent;
	this.name      = (typeof node[0] === 'object') ? node[0].name : node[0];
	this.value     = node.slice(1);
	this.walker    = walker;
	this.depth     = walker.path.length;
	this._after    = null;
}

Node.prototype.after = function(func) {
	this._after = func;
};

Node.prototype.remove = function() {
	this.walker.path.splice(this.depth);
	this.parent.splice(this.walker.path[this.depth - 1]--, 1);
};

Node.isNode = function(node) {
	return (
		(node && node[0] === 'toplevel') || (
			Array.isArray(node) && node[0] && (typeof node[0] === 'object') && node[0].name
		)
	);
};

Node.buildName = function() {
	return buildName(this.node);
};

// ------------------------------------------------------------------
//  Tests AST node structures against a blacklist of names

function Blacklist(names) {
	this.blacklists = [ ];
	this.names = names.slice();
}

Blacklist.prototype.test = function(node) {
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

Blacklist.prototype.addBlacklist = function(blacklist) {
	this.blacklists.push(blacklist || [ ]);
};

Blacklist.prototype.addToCurrentBlacklist = function(name) {
	name = Array.isArray(name) ? name : [name];
	if (! this.blacklists.length) {
		this.addBlacklist();
	}
	var current = this.blacklists.slice(-1)[0];
	current.push.apply(current, name);
};

Blacklist.prototype.removeCurrentBlacklist = function() {
	this.blacklists.pop();
};

// ------------------------------------------------------------------
//  Utilities

function getAst(code) {
	return jsp.parse(code, false, true);
}

function genCode(ast) {
	return pro.gen_code(ast, {beautify: true});
}

function buildName(node, segments) {
	segments = segments || [ ];
	switch ((typeof node[0] === 'object' && node[0]) ? node[0].name : node[0]) {
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
		case 'defun':
		case 'function':
			segments.push(node[1][0]);
		break;
	}
	return segments.join('.');
}

function flattenArrays(arr) {
	return arr.join(',').split(',');
}
	
function Log(foo, depth) {
	console.log(
		'\n' + require('util').inspect(foo, false, depth || 3) + '\n'
	);
}

/* End of file logless.js */
