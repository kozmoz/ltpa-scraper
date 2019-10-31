const scrapeService = require('./scrape-services');

// make scrape() public available.
exports.scrape = scrape;

/**
 * Load all orders and return an JS (JSON) object.
 *
 * @param {Object} configuration Configuration object with the properties 'username', 'password', 'url' and 'verbose'
 * @param {string} configuration.username Username
 * @param {string} configuration.password Password
 * @param {string} configuration.url URL
 * @param {boolean} [configuration.verbose] If true, show verbose logging
 * @return {Promise} A promise that resolves with all the orders as JSON object
 */
function scrape(configuration) {
    return scrapeService.getTokens(configuration);
}

