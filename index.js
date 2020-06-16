const WhatsAppWeb = require("baileys")
const fs = require("fs")

class ChatExtractor {
	client = new WhatsAppWeb() // instantiate an instance
	chats
	outputFile
	outputFolder
	rows = 0

	constructor() {
		this.client.autoReconnect = true
	}

	/**
	 * Extract chat from it's index
	 * @param {*} index
	 */
	extractChat(index) {
		const id = this.chats[index][1].jid
		console.log("extracting for " + id + "...")
		return this.client.loadEntireConversation(id, m => {
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
		this.client.connect(null)
			.then(([userInfos, chats, contacts]) => {
				this.chats = chats

				// Creating files
				this.outputFolder = folderNamingCallback(userInfos);
				this.outputFile = this.outputFolder + "/messages.dump";

				if (!fs.existsSync(this.outputFolder)) {
					fs.mkdirSync(this.outputFolder);
				}

				fs.writeFileSync(this.outputFile, "");

				// #lalignelaplusimportanteducode
				// A ne surtout pas supprimer vous anéantiriez tout un projet !!
				fs.writeFileSync(this.outputFolder + "/contacts.json", JSON.stringify(contacts))
				fs.writeFileSync(this.outputFolder + "/chats.json", JSON.stringify(chats))

				// Extract data
				return this.extractChat(0)
					.then(() => {
						console.log("extracted all; total " + this.rows + " rows")
						this.client.logout()
					});
			})
			.catch(err => console.log("got error:", err));
	}

}

new ChatExtractor().extractChats((userInfos) => {
	let now = new Date()
	return userInfos.name.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[\s\/\\]+/g, "_")
	 	+ '_' + userInfos.id.replace(/@.*$/g, "")
		+`_${now.getHours()}h${now.getMinutes()}_${now.getDate()}-${now.getMonth()}-${now.getFullYear()}`
})
