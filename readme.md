# Logless

Parses JavaScript code for specific objects/namespaces/calls and removes them. Designed to automatically remove logging from production code. Built on top of [UglifyJS](https://github.com/mishoo/UglifyJS).

_Still In Beta_

## Install

```bash
$ npm install logless [-g]
```

The `-g` flag should be used for CLI usage.

## Progmatic Usage

```javascript
var logless = require('logless');

// ...
```

### Parsing Code

```javascript
var parsedCode = logless.parse(jsCodeString, ['console.log', 'alert']);
```

### Parsing A File's Contents

```javascript
// Async file read
logless.parse.file('/path/to/file.js', ['console.log', 'alert'], function(err, parsedCode) {
	// ...
});

// Sync file read
var parsedCode = logless.parse.fileSync('/path/to/file.js', ['console.log', 'alert']);
```

## CLI Usage

```bash
$ logless [--input <in-file>] [--output <out-file>] --names <names>...
```

If `--input` is omitted, JavaScript code is read from stdin. If `--output` is omitted, the result is sent to stdout.

## MIT License

Copyright (C) 2012 James Brumond

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

