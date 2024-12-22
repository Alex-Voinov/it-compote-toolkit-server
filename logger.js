const { createLogger, format, transports } = require('winston');

const logger = createLogger({
    level: process.env.LOGGING_LEVEL || 'info',
    format: format.combine(
        format.colorize(), 
        format.timestamp({ format: process.env.LOGGING_TIMESTAMP_FORMAT || 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level}: ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: `logs/${process.env.LOGGING_LEVEL || 'info'}.log` }), 
    ],
});

module.exports = logger;
