// This code is copied from the Baileys Whatsapp web library (used as dependency) with a small patch allowing to 
// load correctly

/**
 * Load the entire friggin conversation with a group or person
 * @param {string} jid the id of the group or person
 * @param {function} onMessage callback for every message retreived
 * @param {number} [chunkSize] the number of messages to load in a single request
 * @param {boolean} [mostRecentFirst] retreive the most recent message first or retreive from the converation start
 */
module.exports = function loadEntireConversation(client, jid, onMessage, chunkSize = 25, mostRecentFirst = true) {
	var offsetID = null

	const loadMessage = () => {
		return client.loadConversation(jid, chunkSize, offsetID, mostRecentFirst)
			// Added [] around json
			.then(([json]) => {
				if (json[2]) {
					// callback with most recent message first (descending order of date)
					let lastMessage
					if (mostRecentFirst) {
						for (var i = json[2].length - 1; i >= 0; i--) {
							onMessage(json[2][i][2])
							lastMessage = json[2][i][2]
						}
					} else {
						for (var i = 0; i < json[2].length; i++) {
							onMessage(json[2][i][2])
							lastMessage = json[2][i][2]
						}
					}
					// if there are still more messages
					if (json[2].length >= chunkSize) {
						offsetID = lastMessage.key // get the last message
						return new Promise((resolve, reject) => {
							// send query after 200 ms
							setTimeout(() => loadMessage().then(resolve).catch(reject), 200)
						})
					}
				}
			})
	}

	return loadMessage()
}