# WhatsApp Backup JS

Extracteur de conversations whatsapp basé sur la librairie [Baileys](https://github.com/adiwajshing/Baileys).

## Documentation de l'API
Nous avons réalisé une [documentation de l'API](./MESSAGES.md).

## Installation et lancement
Pour utiliser et installer l'outil il faut disposer de [Node.JS](https://nodejs.org/en/) (version 14), npm et git.
```sh
git clone https://github.com/banilaste/whatsapp-backup-js.git
cd whatsapp-backup-js
npm install
```

Il suffit ensuite de lancer le script pour démarrer l'extraction.
```sh
node ./index.js
```
Un QR code est alors à scanner sur votre application whatsapp (Menu > WhatsApp Web), l'extraction commence ensuite dans un dossier correspondant au nom et numéro de l'utilisateur dont les données sont extraits.

## Formats de données
Dans le dossier extrait on trouve les différents fichiers suivants :
- **messages.dump :** contient l'ensemble des messages sous format JSON (un message par ligne)
- **contacts.json :** objet JSON contenant l'ensemble des contacts utilisés dans les différentes conversations (ne correspondent pas forcément aux contacts directs de l'utilisateur, ces derniers pouvant avoir des groupes de discussion communs)
- **chats.json :** liste des toutes les conversations (id, nom de la conversation...)
- **autres fichiers (pdf, images...) :** médias extraits des conversations whatsapp, chaque fichier est nommé en fonction de l'ID de message correspondant 

A noter que certains médias ne peuvent pas être extrait, ayant expirés et n'étant pas/plus stockés sur le téléphone.

## Maintenir le projet
Le projet s'est fixé sur une version de [Baileys](https://github.com/adiwajshing/Baileys) arbitraire (un commit donnant un outil fonctionnel, la release n'étant pas sortie au moment du développement). Compte tenu de la jeunesse de la librairie, il est possible que le fonctionnement change rapidement, toutefois il sera nécessaire de faire la mise à jour quand WhatsApp modifiera son API.

Pour ce faire, se référer à la documentation de la librairie, et installer sa dernière version avant toute modification :
```sh
npm install --save baileys@latest
```
