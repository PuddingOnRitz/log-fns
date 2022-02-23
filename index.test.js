/* eslint-disable no-console */
const { range } = require('ramda');

const { createLogger, getDefaultConfig } = require('./index');

const callAllLogFunctions = (logger) => {
  const { logLevels } = logger.getConfig();
  logLevels.forEach((logLevel) => {
    const loggerFunctionName = logger.getConfig().getLogFunctionName(logLevel);
    logger[loggerFunctionName](`Calling logger.${loggerFunctionName}...`);
  });
};

const testConfigEquality = (base, compare) => {
  const isNotFunctionEntry = ([, value]) => typeof value !== 'function';
  const normalizeConfig = (o) => Object.entries(o)
    .filter(isNotFunctionEntry)
    .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});
  expect(normalizeConfig(base)).toEqual(normalizeConfig(compare));
};

describe('Index unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('Test formatOutput', () => {
    const message = 'Hello!';
    const output = getDefaultConfig().formatOutput({ message });
    const expected = JSON.stringify({ message });
    expect(output).toEqual(expected);
  });
  test('Test writeOutput', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');
    const message = 'Hello!';
    const writeOutputForLogLevel = (logLevel) => getDefaultConfig().writeOutput({ logLevel, message });
    getDefaultConfig().logLevels.forEach(writeOutputForLogLevel);
    expect(consoleLogSpy).toHaveBeenCalledWith(message);
    expect(consoleLogSpy).toHaveBeenCalledTimes(6);
  });
  test('Test default logger', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');
    const logger = createLogger();
    expect(logger.getConfig()).toEqual(logger.getConfig());
    testConfigEquality(logger.getConfig(), getDefaultConfig());
    callAllLogFunctions(logger);
    expect(consoleLogSpy).toHaveBeenCalledTimes(4);
  });
  test('Test TRACE logger', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');
    const logger = createLogger({ logLevel: 'TRACE' });
    testConfigEquality(logger.getConfig(), { ...getDefaultConfig(), logLevel: 'TRACE' });
    callAllLogFunctions(logger);
    expect(consoleLogSpy).toHaveBeenCalledTimes(6);
  });
  test('Test FATAL logger', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');
    const logger = createLogger({ logLevel: 'FATAL' });
    testConfigEquality(logger.getConfig(), { ...getDefaultConfig(), logLevel: 'FATAL' });
    callAllLogFunctions(logger);
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
  });

  test('Test custom async logging', async () => {
    const writeOutput = async ({ message }) => message;
    const logger = createLogger({ writeOutput });
    const expectedMessage = 'Hello!';
    const { message } = await logger.info(expectedMessage).then(JSON.parse);
    expect(message).toEqual(expectedMessage);
  });

  test('Test custom log levels', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');
    const logLevels = ['NORMAL', 'IMPORTANT', 'VERY_IMPORTANT'];
    const logger = createLogger({ logLevel: 'IMPORTANT', logLevels });
    callAllLogFunctions(logger);
    expect(consoleLogSpy).toHaveBeenCalledTimes(2);
  });

  test('Test getLogFunctionName', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');
    const getLogFunctionName = (logLevel) => `${logLevel.toLowerCase()}Log`;
    const logger = createLogger({ getLogFunctionName });
    const { message } = JSON.parse(logger.infoLog('Hello!'));
    expect(message).toEqual('Hello!');
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
  });

  const LOG_CALL_COUNT = 1000 * 1000;
  test(`Stress Test: Make ${LOG_CALL_COUNT.toLocaleString('en-US')} no-op logger calls`, () => {
    const logger = createLogger();
    range(0, LOG_CALL_COUNT).map((callNumber) => logger.debug(`Call#: ${callNumber}`));
  });

  const LOGGER_COUNT = 10 * 1000;
  test(`Stress Test: Create ${LOGGER_COUNT.toLocaleString('en-US')} loggers`, () => {
    range(0, LOGGER_COUNT).map(() => createLogger());
  });

  test('Log object', () => {
    const logString = createLogger().info({ color: 'Blue', greeting: 'Hello!' });
    const { timestamp, ...restOfLog } = JSON.parse(logString);
    expect(Date.parse(timestamp)).not.toBe(NaN);
    expect(restOfLog).toEqual({
      logLevel: 'INFO',
      message: {
        color: 'Blue',
        greeting: 'Hello!',
      },
    });
  });

  test('Disable logging', () => {
    const logger = createLogger({ logLevel: null, noOp: () => 'NoOp!' });
    const logMessage = logger.info('Info!');
    expect(logMessage).toBe('NoOp!');
  });

  test('Setting the Log Level', () => {
    const logger = createLogger({ logLevel: 'DEBUG' });

    const debugMessage = logger.debug('Debugging...');
    expect(debugMessage).not.toBe('');
    const traceMessage = logger.trace('Tracing...');
    expect(traceMessage).toBe('');
    const warnMessage = logger.warn('Warning...');
    expect(warnMessage).not.toBe('');
  });

  test('Deferred execution', () => {
    const logger = createLogger();
    const getDate = jest.fn(() => new Date());
    logger.debug(() => `Today: ${getDate()}`);
    logger.info(() => `Today: ${getDate()}`);
    expect(getDate).toHaveBeenCalledTimes(1);
  });

  test('Complex object', () => {
    const logger = createLogger();
    const msg = logger.info({ greeting: 'Hello', name: 'Joan' });
    const { message: { greeting, name } } = JSON.parse(msg);
    expect(greeting).toBe('Hello');
    expect(name).toBe('Joan');
  });
});
