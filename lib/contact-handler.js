/**
 * Node entry — re-exports handleContactRequest for api/contact.js and server/contact-server.js
 */
const { handleContactRequest, sendContactEmail } = require('./contact-send');
const { validatePayload } = require('./contact-core');

module.exports = { handleContactRequest, validatePayload, sendContactEmail };
