const getDefaultConfig = () => {
  const logLevels = Object.freeze(['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']);
  const enrichMessage = ({ message, logLevel }) => ({
    timestamp: new Date().toISOString(),
    logLevel,
    message,
  });
  const getLogFunctionName = (logLevel) => logLevel.toLowerCase();
  const logLevel = 'INFO';
  const formatOutput = (o) => JSON.stringify(o);
  const writeOutput = ({ message }) => {
    // eslint-disable-next-line no-console
    console.log(message);
    return message;
  };
  const noOp = () => '';
  return Object.freeze({
    enrichMessage,
    formatOutput,
    getLogFunctionName,
    logLevel,
    logLevels,
    noOp,
    writeOutput,
  });
};

const createOperativeLogFunction = ({ config, logLevel }) => {
  const { enrichMessage, formatOutput, writeOutput } = config;
  return (message) => {
    const enrichedMessage = enrichMessage({ logLevel, message });
    const formattedOutput = formatOutput(enrichedMessage);
    return writeOutput({ logLevel, message: formattedOutput });
  };
};

const createLogFunction = ({ config, logLevel: aLogLevel }) => {
  const { logLevels, logLevel } = config;
  const logLevelWeightEntries = logLevels.map((thisLogLevel, weight) => [thisLogLevel, weight]);
  const logWeightsByLevel = Object.fromEntries(logLevelWeightEntries);
  const baseLogLevelWeight = logWeightsByLevel[logLevel] === undefined
    ? logLevelWeightEntries.length
    : logWeightsByLevel[logLevel];
  const logLevelWeight = logWeightsByLevel[aLogLevel];
  return logLevelWeight < baseLogLevelWeight
    ? config.noOp
    : createOperativeLogFunction({ config, logLevel });
};

const createLogger = (config = {}) => {
  const effectiveConfig = Object.freeze({ ...getDefaultConfig(), ...config });
  Object.freeze(effectiveConfig.logLevels);
  const { logLevels, getLogFunctionName } = effectiveConfig;
  const createLogFunctionEntry = (logLevel) => [
    getLogFunctionName(logLevel),
    createLogFunction({ config: effectiveConfig, logLevel }),
  ];
  const loggerEntries = logLevels.map(createLogFunctionEntry);
  const logger = Object.fromEntries(loggerEntries);
  return Object.freeze({ ...logger, getConfig: () => effectiveConfig });
};

module.exports = {
  createLogger,
  getDefaultConfig,
};
