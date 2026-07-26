const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir les fichiers statiques (HTML, CSS, images, logos)
app.use(express.static(__dirname));

// --- Connexion & Initialisation de la Base de Données ---
const db = new sqlite3.Database('./iac_database.db', (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données:', err.message);
    } else {
        console.log('✅ Connecté à la base de données SQLite (iac_database.db).');
    }
});

// Création de la table 'membres' si elle n'existe pas
db.run(`
    CREATE TABLE IF NOT EXISTS membres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        genre TEXT NOT NULL,
        date_naissance TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        telephone TEXT NOT NULL,
        ville TEXT NOT NULL,
        niveau_etude TEXT NOT NULL,
        profession TEXT NOT NULL,
        domaine_expertise TEXT NOT NULL,
        commission TEXT NOT NULL,
        motivation TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// --- Routes HTTP ---

// 1. Page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Page d'inscription
app.get('/inscription', (req, res) => {
    res.sendFile(path.join(__dirname, 'inscription.html'));
});

// 3. Traitement du formulaire d'inscription (API POST)
app.post('/api/inscription', async (req, res) => {
    const {
        nom, prenom, genre, date_naissance, email,
        telephone, ville, niveau_etude, profession,
        domaine_expertise, commission, motivation, password
    } = req.body;

    // Vérification sommaire
    if (!email || !password || !nom || !prenom) {
        return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
    }

    try {
        // Hachage du mot de passe pour la sécurité
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertion dans la base de données
        const sql = `
            INSERT INTO membres (
                nom, prenom, genre, date_naissance, email,
                telephone, ville, niveau_etude, profession,
                domaine_expertise, commission, motivation, password
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            nom, prenom, genre, date_naissance, email,
            telephone, ville, niveau_etude, profession,
            domaine_expertise, commission, motivation, hashedPassword
        ];

        db.run(sql, params, function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ success: false, message: 'Cette adresse e-mail est déjà inscrite.' });
                }
                console.error(err.message);
                return res.status(500).json({ success: false, message: 'Erreur lors de l'enregistrement.' });
            }

            // Succès
            res.status(201).json({
                success: true,
                message: 'Félicitations ! Votre adhésion à l\'IAC a été enregistrée avec succès.',
                memberId: this.lastID
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
});

// 4. Lancement du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur IAC démarré sur : http://localhost:${PORT}`);
});