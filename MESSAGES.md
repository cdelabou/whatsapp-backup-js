# Doc communication web socket whatsapp web

## Note
Lorsque vous envoyez des messages à un serveur Web WhatsApp, ils doivent être dans un format spécifique. Il est assez simple et ressemble à `messageTag,JSON`, par exemple `1515590796,["données"],123`. Notez qu'apparemment, le messageTag peut être n'importe quoi. Cette application utilise principalement l'horodatage actuel comme balise, juste pour être un peu unique. WhatsApp lui-même utilise souvent des balises de message comme `s1`, `1234.--0` ou quelque chose comme ça. Il est évident que la balise du message peut ne pas contenir de virgule. En outre, des objets JSON sont possibles, ainsi que des charges utiles. 


## Etapes de communication:
### Requête d'initialisation (Avant scan code QR):
#### Requete
Utilisée pour initialiser une connection entre le serveur et le websocket  
`messageTag,["admin","init",<whats app version>,["<OS>","<navigator>","<arch>"],"<clientId>", <condition>]`

Exemple : `1588844230.--87,["admin", "init", [2, 2017, 6], ["Linux", "Chrome", "x86_64"], "okRkd/Cnma/fSEsSmom6TA==", true]`
- **whats app version** : La version whatsapp web est sous forme de tableau du type : `[2, 2017, 6]`
- **[\<OS\>,\<navigator\>,\<arch\>]** : Ensuite un tableau est defini à l'aide d'un tableau contenant sous la forme de **chaine de caractères** : l'os, le navigateur utilisé et l'architecture système : `["Linux", "Chrome", "x86_64"]`
- **clientId** : ID de client généré automatiquement et contenant 16 octets générés aléatoirement, en python nous utilisons `base64.b64encode(os.urandom(16))`. Sur le whatsapp web officiel il est accessible dans le [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- **condition** : Défini si whatsapp doit se souvenir de du navgateur, en réalité c'est l'option est a vrai si le navigateur n'est pas en mode privé **et** que la case "se souvenir de moi" est coché.

#### Réponse
`messageTag,{"status":200,"ref":"1@xxxxxxxxxxxxxxxxxxxxxxxxxxxx","ttl":20000,"update":false,"curr":"2.2017.6","time":1588861531330.0}`
- **status** : devrait être de 200
- **ref** : dans l'application, ceci est traité comme l'ID du serveur ; important pour la génération de QR.
- **ttl** : est 20000, peut-être le temps après que le code QR devient invalide
- **update** : un drapeau booléen
- **curr** : la version actuelle de WhatsApp Web, par exemple 2.2017.6
- **time** : l'heure à laquelle le serveur a répondu, en tant que millisecondes à virgule flottante, par exemple 1515592039037.0

### Requête de login (Avant scan code QR)
#### Requête
Cette commande est utilisé pour se relogger:   
`messageTag,["admin","login","<clientToken>","<serverToken>","<clientId>","takeover"]`  
- **clientToken** : Le token client se trouve dans `localStorage` du naviateur sous le nom `WAToken1`
- **serverToken** : Le token client se trouve dans `localStorage` du naviateur sous le nom `WAToken2`
- **clientId** : Le client ID est le même que le client ID precédent 

#### Réponse
Jamais testé

### Messages recus scan du code QR

Immédiatement après avoir scanné le code QR, le serveur web reçoit plusieurs messages JSON importants qui établissent les détails du cryptage. Ceux-ci utilisent le format de message spécifié et ont un tableau JSON comme charge utile. Leur tag de message n'a pas de signification particulière, on peut tout de même noter, que les messages en clair on les tags `s[1-4]`, que certain messages chiffré on des lettre se suivant a la fin du tag `--[a-e]` et que certain contiennent la valeur `preempt-<suite du tag>`. 

#### Messages en clair
##### 1. Le premier message avec le tag `s1` et le tableau `Conn` se présente comme ceci

```json
["Conn", {
    "ref": "1@<ref>",
    "wid": "<phone id>",
    "connected": true,
    "isResponse": "false",
    "serverToken": "1@<server token>",
    "browserToken": "<browser token>",
    "clientToken": "<client token>",
    "lc": "FR",
    "lg": "fr",
    "locales": "fr-FR,en-GB,de-DE",
    "is24h": true,
    "secret": "<secret key>",
    "protoVersion": [0, 17],
    "binVersion": 11,
    "battery": 30,
    "plugged": false,
    "platform": "android",
    "features": {
        "URL": true,
        "FLAGS": "EAEYASgBOAFAAUgBWAFgAWgBeAGYAQGgAQGwAQK4AQHIAQHYAQHoAQLwAQP4AQOIAgE="
    },
    "phone": {
        "wa_version": "2.20.140",
        "mcc": "208",
        "mnc": "015",
        "os_version": "10",
        "device_manufacturer": "Xiaomi",
        "device_model": "sagit",
        "os_build_number": "lineage_sagit-userdebug 10 QQ2A.200405.005 7e35f894ba"
    },
    "pushname": "Albert",
    "tos": 0
}]
```  

- **Conn** : le tableau contient un objet JSON comme deuxième élément avec des informations de connexion contenant les attributs suivants et bien d'autres encore :  
    - **battery** : le pourcentage actuel de la batterie de votre téléphone
    - **browserToken** : utilisé pour se déconnecter sans connexion WebSocket active (pas encore implémenté)
    - **clientToken** : habitué à reprendre les sessions fermées alias "Remember me" (pas encore implémenté)
    - **phone** : un objet contenant des informations détaillées sur votre téléphone, par exemple fabricant de l'appareil, modèle de l'appareil, numéro de construction de l'appareil, version de l'appareil.
    - **plateform** : le système d'exploitation de votre téléphone, par exemple android
    - **pushname** : le nom que vous avez fourni à WhatsApp
    - **secret** C'est la clé de chiffrement utilisé pour chiffrer les messages **(souvenez-vous de ceci !)**
    - **serverToken** : utilisé pour reprendre les sessions fermées alias "Remember me" (pas encore implémenté)
    - **wid** : votre numéro de téléphone dans le format d'identification du chat (voir ci-dessous)
    
##### 2. Le deuxième message avec le tag `s2` et le tableau `Blocklist` se présente comme ceci : 

```json
["Blocklist", {
    "id": 1,
    "blocklist": []
}]
``` 
- Contient surement les contact bloqué. A BESOIN D'ETRE TESTER ! 

##### 3. Le troisième message avec le tag `s3` et le tableau `Stream` se présente comme ceci :
```json
["Stream", "update", false, "2.2017.6"]
```
- Stream : le tableau comporte quatre éléments au total
    - La chaine stream
    - La chaine update
    - Un booléen inconnu
    - La version de Whatsapp web

##### 4. Le quatrième message avec le tag `s4` et le tableau `Props` se présente comme ceci :
```json
["Props", {
    "camelotWeb": false,
    "preloadStickers": false,
    "webVoipInternalTester": false,
    "webCleanIncomingFilename": 1,
    "webEnableModelStorage": false,
    "wsCanCacheRequests": false,
    "fbCrashlog": true,
    "bucket": "",
    "gifSearch": "tenor",
    "maxFileSize": 100,
    "media": 64,
    "maxSubject": 25,
    "maxParticipants": 257,
    "imageMaxKBytes": 1024,
    "imageMaxEdge": 1600,
    "statusVideoMaxDuration": 30,
    "frequentlyForwardedMessages": 1,
    "suspiciousLinks": 1,
    "fwdUiStartTs": 1531267200,
    "restrictGroups": 1,
    "productCatalogOpenDeeplink": 1,
    "multicastLimitGlobal": 5,
    "finalLiveLocation": 1,
    "frequentlyForwardedMax": 1,
    "mmsMediaKeyTTL": 172800,
    "stickers": 1,
    "announceGroups": 1001,
    "groupDescLength": 512
}]
```
- Props : le tableau contient un objet JSON comme deuxième élément avec plusieurs propriétés comme imageMaxKBytes (1024), maxParticipants (257), videoMaxEdge (960) et autres.

#### Messages chiffré 

##### 1. Contact fréquent ?

Le premier message chiffré recu ressemble à cela: 
```json
[
  'action',
  None,
  [
    [
      'contacts',
      {
        'type': 'frequent'
      },
      [
        [
          'message',
          {
            'jid': '<JID_1>@c.us'
          },
          None
        ],
        [
          'image',
          {
-            'jid': '<JID_2>@c.us'
          },
          None
        ],
        [
          'video',
          {
            'jid': '<JID_2>@g.us'
          },
          None
        ]
      ]
    ]
  ]
]
```
Cela ressemble a une liste des 4 contact a qui il a été envoyer recement des videos, images, messages. Pour l'exemple il n'y a que 1 JID pour chaque type en réalité le tableau contact en contient 4 de chaque.

##### 2. Converstions récentes

Voici le message représentant les conversations récentes

```json
[
    'response',
    {
        'type': 'chat'
    },
    [
        ['chat',
            {
                'jid': '<jid>',
                'count': '0',
                't': '1584197869',
                'mute': '0',
                'modify_tag': '111421',
                'spam': 'false'
            },
            None
        ],
        [<Une ou plusieurs autre fois le même tableau>]
    ]
]
```

Ce message contient les information des contacts qui vont s'afficher à droite (Liste des conversations). Pour chaque contact les informations suivantes :
- **jid** : L'identifiant whatsapp d'un contact 
- **count** : Le compte des messages chargé
- **t** : 
- **mute** : `'0'` si non muet, `` temps en seconde sinon ?? A VERIFIER 
- **modify_tag** : 
- **spam** : 

##### 3. Message content

```json
[
  'action',
  {
    'add': 'last'
  },
  [
    {
      'key': {
        'remoteJid': '<jid>',
        'fromMe': False,
        'id': '3EB0118290995EC1ACD8'
      },
      'message': {
        'conversation': 'test'
      },
      'messageTimestamp': '389294857064076995',
      'status': 'ERROR'
    },
    [<Une ou plusieurs autre fois le même tableau>]
  ]
]
```

Ce message contient les messages contenus dans les conversation chargé précédement

## Requêtes

Certains messages correspondent à des requêtes, on peut faire le matching entre une requête et sa réponse grace au numéro de message précédent les données.

| Requête | Réponse | Description | Chiffrée |
| ---- | ---- | ---- | ---- |
| `["admin","init",[2,2017,6],["Windows","Chrome","10"],"<id client>",true]` | `{ status: 200, ref: "...", ...}` | Initialisation de la session, vérification de la validité de la version / compatibilité navigateur | Non |
| `["admin","login","<clef 1>","<clef 2>","<clef 3>","takeover"]` |`{"status":200}` | Reprise d'une session précédente (pas de QR code à scanner) | Non |
| `["query", {type: "contacts", epoch: "1"}, None]` | `["response", {type: "contacts", duplicate: "true"}, None]` | A déterminer (contacts "actifs"?) | Oui |
| `["query", {type: "chat", epoch: "1"}, None]` | `["response", {type: "chat", duplicate: "true"}, None]` | A déterminer (conversation "actives"?) | Oui |
| `["query", {type: "status", epoch: "1"}, None]` | `["response", {type: "status", checksum: "<checksum en base64>"}, None]` | Vérification de la validité du status | Oui |
| `["action", {type: "set", epoch: "1"}, [["presence", {type: "available"}, None]]]` | `{"status":200}` | Met l'utilisateur courent en actif | Oui (requête uniquement) |
| `["query", {type: "emoji", epoch: "1"}, None]` | [`"response', {type: "emoji"}, [ ["item", {code: "\xf0\x9f\x98\x82", value: 1.0}, None], ["item", {code: "\xf0\x9f\x98\x85", value: 1.9}, None], ["item", {code: "\xf0\x9f\x99\x82", value: 0.814625}, None] ]]` | A déterminer (émojis utilisés fréquemment?) | Oui |
| `["query", {type: "message", kind: "before", jid: "<user id>", count: 50, index: "DFF75B2EBD3AB12CC22E8AF692699B3B", owner: false, epoch: "5"}, None]` | liste de message (TODO) | Demande de nouveaux messages précédent le message donné | Oui |

Lors d'une session continue, le serveur ping également continuellement le client avec des messages (sans tags) du type `!1267823872`, le nombre suivant `!` étant probablement le timestamp actuel coté serveur. Le client répond alors un message contenant uniquement `?,,` pour signifier de son status actif.

## Messages serveurs
Ces messages sont envoyés depuis le serveur sans forcément être corrélés à une requête client.

| Format | Description | Binaire |
| ---- | ---- | ---- |
| `[ "action", None, [["contacts", {type: "frequent"}, [ ["message, image or video", {jid: "<user id>"}, None], ... ]]]]` | Liste des contacts fréquents (le tableau contient 3 entrées par id d'utilisateur, une `message`, une `image`, une `video`) | Oui
| `[ "Stream", "update", false, "2.2017.6" ]` | Version du serveur et besoin de mise à jour | Non |
| `["Props", { properties... }]`| Différentes propriétés numériques du client (nombre max de participants...) | Non
| `['action', {'add': 'before', 'last': 'true'}, [ messages... ]]`| Ajoute des conversations à la liste des conversations (ou messages?) | Oui |
| `['action', None, [['battery', {'value': '21', 'live': 'true', 'powersave': 'false'}, None]]]` | Informations sur le téléphone connecté | Oui