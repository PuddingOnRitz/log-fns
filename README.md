# Abstract
The `log-fns` project is a simple lightweight logging library for JavaScript.

# Quick Start
## Installation
```bash
npm i log-fns

```
## Basic Usage
```javascript
const { createLogger } = require('log-fns');

// Create a logger with the default configuration
const logger = createLogger();

// Log a string
logger.info('Hello, log-fns!');

// Log an object
logger.info({ greeting: 'Hello', name: 'Joan' });

// Defer calculation of an expensive message so it is not called if the log level isn't enabled
logger.trace(() => 'Hello, expensive trace message!');
```

_Output_
```
{"timestamp":"2022-02-23T03:06:35.206Z","logLevel":"INFO","message":"Hello, log-fns!"}
{"timestamp":"2022-02-23T03:06:35.207Z","logLevel":"INFO","message":{"greeting":"Hello","name":"Joan"}}
```