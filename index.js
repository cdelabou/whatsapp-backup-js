const WhatsAppWeb = require("baileys")
const fs = require("fs")

class ChatExtractor {
	client = new WhatsAppWeb() // instantiate an instance
	chats
	offset
	produceAnonData
	outputFile

	constructor(authCreds, outputFile, produceAnonData = false, offset = null) {
		this.offset = offset;
		this.produceAnonData = produceAnonData
		this.outputFile = outputFile

		this.client.autoReconnect = true
	}


	extract() {
		let rows = 0
		this.encounteredOffset = !this.offset

		if (!this.offset) {
			fs.writeFileSync(this.outputFile, "chat,input,output\n") // write header to file
		}

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
		if (id.includes("g.us") || !this.encounteredOffset) { // skip groups
			if (id === this.offset) {
				this.encounteredOffset = true
			}
			if (index + 1 < this.chats.length) {
				return this.extractChat(index + 1)
			}
			return
		}
		console.log("extracting for " + id + "...")
		var curInput = ""
		var curOutput = ""
		var lastMessage
		return this.client.loadEntireConversation(id, m => {
				var text
				if (!m.message) { // if message not present, return
					return
				} else if (m.message.conversation) { // if its a plain text message
					text = m.message.conversation
				} else if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo) { // if its a reply to a previous message
					const mText = m.message.extendedTextMessage.text
					const quotedMessage = m.message.extendedTextMessage.contextInfo.quotedMessage
					// if it's like a '.' and the quoted message has no text, then just forget it
					if (mText.length <= 2 && !quotedMessage.conversation) {
						return
					}
					// if somebody sent like a '.', then the text should be the quoted message
					if (mText.length <= 2) {
						text = quotedMessage.conversation
					} else { // otherwise just use this text
						text = mText
					}
				} else {
					return
				}
				// if the person who sent the message has switched, flush the row
				if (lastMessage && !m.key.fromMe && lastMessage.key.fromMe) {

					let row = "" + (this.produceAnonData ? "" : id) + ",\"" + curInput + "\",\"" + curOutput + "\"\n"
					fs.appendFileSync(this.outputFile, row)
					rows += 1
					curInput = ""
					curOutput = ""
				}

				if (m.key.fromMe) {
					curOutput += curOutput === "" ? text : ("\n" + text)
				} else {
					curInput += curInput === "" ? text : ("\n" + text)
				}

				lastMessage = m
			}, 50, false) // load from the start, in chunks of 50
			.then(() => console.log("finished extraction for " + id))
			.then(() => {
				if (index + 1 < this.chats.length) {
					return this.extractChat(index + 1)
				}
			})
	}

	/**
	 * Extract all your WhatsApp conversations & save them to a file
	 * produceAnonData => should the Id of the chat be recorded
	 * */
	extractChats() {
		this.client.connect(null)
			.then(([_, chats]) => {
				this.chats = chats
				this.extract()
			})
			.catch(err => console.log("got error:", err))
	}

}

new ChatExtractor(null, "output.csv").extractChats()