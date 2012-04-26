# Logless

Parses JavaScript code for specific objects/namespaces/calls and removes them. Designed to automatically remove logging from production code. Built on top of [UglifyJS](https://github.com/mishoo/UglifyJS).

## Install

```bash
$ npm install logless
```

## Progmatic Usage

```javascript
var logless = require('logless');

// ...
```

### Parsing Code

```javascript
logless.parse(jsCodeString, ['console.log', 'alert'], function(err, result) {
	if (err) {throw err;}
	
	// ...
	
});
```

### Parsing A File's Contents

```javascript
logless.parse.file('/path/to/file.js', ['console.log', 'alert'], function(err, result) {
	if (err) {throw err;}
	
	// ...
	
});
```

## CLI Usage

_Under Construction_


