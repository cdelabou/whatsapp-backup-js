const WhatsAppWeb = require("baileys")
const fs = require("fs")

class ChatExtractor {
	client = new WhatsAppWeb() // instantiate an instance
	chats
	outputFile
	outputContactFile
	outputFolder
	rows = 0

	constructor() {
		this.client.autoReconnect = true
	}


	extract() {
		this.extractChat(0)
			.then(() => {
				console.log("extracted all; total " + this.rows + " rows")
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
				/*let result = {
					conversation: id,
					fromMe: m.key.fromMe,
					timestamp: m.messageTimestamp.toNumber() * 1000
				}

				if (m.participant) {
					result.participant = m.participant;
				}

				if (m.messageStubType) {
					switch(m.messageStubType) {
						case "GROUP_PARTICIPANT_ADD":
							result.participantAdded = m.messageStubParameters
							break;
						case "REVOKE":
							result.stubType = "MESSAGE_DELETED";
							break;
						case "E2E_ENCRYPTED":
						case "GROUP_CREATE":
						default:
							// metadata messages
							result.stubType = m.messageStubType
					}
				} else if (!m.message) { // if message not present, return
					return
				} else if (m.message.conversation) { // if its a plain text message
					result.text = m.message.conversation
				} else if (m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo &&
					m.message.extendedTextMessage.contextInfo.quotedMessage) { // if its a reply to a previous message

					result.text = m.message.extendedTextMessage.text
					result.quoted = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation
				} else {
					return
				}*/

				if (m.message) {
					if (m.message.audioMessage || m.message.imageMessage || m.message.videoMessage || m.message.documentMessage || m.message.stickerMessage) {
						this.client.decodeMediaMessage(m.message, this.outputFolder + "/" + m.key.id)
							.catch((err) => console.error("unable to decode media for message " + m.key.id, err))
					}
				}
				fs.appendFileSync(this.outputFile, JSON.stringify(m) + "\n")
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
	extractChats(folderNamingCallback) {
		this.client.connectSlim(null)
			.then((userInfos) => {
				const promise = this.client.registerCallbackOneTime (["response",  "type:chat"]);

				// Creating files
				this.outputFolder = folderNamingCallback(userInfos);
				this.outputFile = this.outputFolder + "/" + "messages.dump";
				this.outputContactFile = this.outputFolder + "/" + "contact.dump";
				if (!fs.existsSync(this.outputFolder)) {
					fs.mkdirSync(this.outputFolder);
				}
				fs.writeFileSync(this.outputFile, "");

				// Wait for chats
				return promise;
			})
			.then(([_, __, chats]) => {
				this.chats = chats
				// #lalignelaplusimportanteducode
				// A ne surtout pas supprimer vous anéantiriez tout un projet !!
				fs.writeFileSync(this.outputContactFile, JSON.stringify(this.chats))
				this.extract()
			})
			.catch(err => console.log("got error:", err))
	}

}

new ChatExtractor().extractChats((userInfos) => {
	let now = new Date()
	return userInfos.name.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[\s\/\\]+/g, "_")
	 	+ '_+' + userInfos.id.replace(/@.*$/g, "")
		+`_${now.getHours()}:${now.getMinutes()}-${now.getDate()}-${now.getMonth()}-${now.getFullYear()}`
})
