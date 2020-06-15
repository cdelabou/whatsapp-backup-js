const WhatsAppWeb = require("baileys")
const fs = require("fs")

class ChatExtractor {
	client = new WhatsAppWeb() // instantiate an instance
	chats
	outputFile

	constructor(outputFile) {
		this.outputFile = outputFile

		this.client.autoReconnect = true
	}


	extract() {
		let rows = 0

		this.extractChat(0)
			.then(() => {
				console.log("extracted all; total " + rows + " rows")
				this.client.logout()
			})
	}


	/**
	 * Extract chat from it's index
	 * @param {*} index 
	 */
	extractChat(index) {
		const id = this.chats[index][1].jid
		console.log("extracting for " + id + "...")
		return this.client.loadEntireConversation(id, m => {
				let result = {
					conversation: id,
					fromMe: m.key.fromMe,
					timestamp: (
						(m.messageTimestamp.high << 32) +
						(m.messageTimestamp.low < 0 ? m.messageTimestamp.low + 1 << 32 : m.messageTimestamp.low)
					) * 1000
				}

				if (m.participant) {
					result.participant = m.participant;
				}

				if (!m.message) { // if message not present, return
					return
				} else if (m.message.conversation) { // if its a plain text message
					result.text = m.message.conversation
				} else if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo &&
					m.message.extendedTextMessage.contextInfo.quotedMessage) { // if its a reply to a previous message

					result.text = m.message.extendedTextMessage.text
					result.quoted = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation
				} else {
					return
				}

				fs.appendFileSync(this.outputFile, JSON.stringify(result) + "\n")
				this.rows += 1
			}, 100)
			.then(() => console.log("finished extraction for " + id))
			.then(() => {
				if (index + 1 < this.chats.length) {
					return this.extractChat(index + 1)
				}
			})
	}

	/**
	 * Extract all your WhatsApp conversations & save them to a file
	 */
	extractChats() {
		fs.writeFileSync(this.outputFile, "");

		this.client.connect(null)
			.then(([_, chats]) => {
				this.chats = chats
				this.extract()
			})
			.catch(err => console.log("got error:", err))
	}

}

new ChatExtractor("output.csv").extractChats()