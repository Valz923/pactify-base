// Les constantes 'db' et 'factionsRef' sont définies dans le HTML et sont accessibles ici.

// --- 1. Gestion de l'Ajout de Faction (CRÉATION) ---

const factionForm = document.getElementById('faction-form');
const messageAjout = document.getElementById('message-ajout');

factionForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const nom = document.getElementById('nom').value.trim();
    const coordonnees = document.getElementById('coordonnees').value.trim();

    if (nom && coordonnees) {
        // 1. Création de l'objet faction
        const nouvelleFaction = {
            // Firebase générera la clé/ID unique via push()
            nom: nom,
            coordonnees: coordonnees,
            dateAjout: new Date().toLocaleString()
        };

        // 2. Écriture dans Firebase (au lieu de localStorage.setItem)
        factionsRef.push(nouvelleFaction)
            .then(() => {
                // Succès
                factionForm.reset();
                displayMessage(messageAjout, `Faction "${nom}" ajoutée et synchronisée !`, 'success');
                // L'affichage sera rafraîchi par l'écouteur de Realtime Database (factionsRef.on('value', ...))
            })
            .catch(error => {
                // Erreur
                displayMessage(messageAjout, `Erreur d'ajout : ${error.message}`, 'error');
            });

    } else {
        displayMessage(messageAjout, 'Veuillez remplir tous les champs.', 'error');
    }
});

/** Affiche un message temporaire */
function displayMessage(element, text, type) {
    element.textContent = text;
    element.className = 'message ' + type;
    if (type === 'success') {
        element.classList.add('success');
    } else if (type === 'error') {
        element.classList.add('error');
    }
    
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
    }, 3000);
}


// --- 2. Gestion de la Suppression de Faction ---

/**
 * Supprime une faction par sa clé Firebase unique.
 * @param {string} key La clé Firebase de la faction à supprimer.
 */
function deleteFaction(key) {
    // Suppression de l'élément directement via sa référence (key)
    factionsRef.child(key).remove()
        .then(() => {
            console.log(`Faction avec clé ${key} supprimée avec succès.`);
            // La mise à jour de l'affichage est automatique via l'écouteur
        })
        .catch(error => {
            console.error("Erreur lors de la suppression:", error);
        });
}


// --- 3. Gestion de l'Affichage et de la Lecture (SYNCHRONISATION EN TEMPS RÉEL) ---

const searchBar = document.getElementById('search-bar');
const resultatsRechercheDiv = document.getElementById('resultats-recherche');
const factionsListUl = document.getElementById('factions-list');

let allFactions = []; // Tableau qui stockera les données synchronisées (clé : 'key', valeur : 'nom, coordonnees, etc.')

// Écoute les changements dans la base de données en temps réel
factionsRef.on('value', (snapshot) => {
    // Cette fonction est exécutée au chargement ET à chaque modification dans la DB
    
    allFactions = []; // Réinitialise le tableau pour le mettre à jour
    const factionsObject = snapshot.val(); // Récupère toutes les données sous forme d'objet

    if (factionsObject) {
        // Convertit l'objet de Firebase en un tableau pour faciliter la recherche/l'affichage
        for (let key in factionsObject) {
            if (factionsObject.hasOwnProperty(key)) {
                allFactions.push({ 
                    key: key, // La clé Firebase (ID unique)
                    ...factionsObject[key] // Les données de la faction (nom, coordonnees, etc.)
                });
            }
        }
    }
    
    // Met à jour les deux listes d'affichage
    renderFactionsList(allFactions);
    // Rafraîchit la recherche avec le terme actuel
    searchFactions(searchBar.value.trim().toLowerCase(), allFactions); 
});

// Écoute l'événement de saisie
searchBar.addEventListener('input', function() {
    const searchTerm = searchBar.value.trim().toLowerCase();
    searchFactions(searchTerm, allFactions);
});

/**
 * Recherche les factions dont le nom contient le terme de recherche.
 */
function searchFactions(term, factions) {
    if (term.length === 0) {
        resultatsRechercheDiv.innerHTML = '<p>Aucune recherche effectuée.</p>';
        return;
    }

    const resultats = factions.filter(faction => 
        faction.nom.toLowerCase().includes(term)
    );

    resultatsRechercheDiv.innerHTML = '';
    
    if (resultats.length > 0) {
        resultats.forEach(faction => {
            const resultDiv = document.createElement('div');
            resultDiv.innerHTML = `
                <strong>${faction.nom}</strong> 
                <br> Coordonnées: ${faction.coordonnees} 
                <br> Ajouté le: ${faction.dateAjout}
            `;
            resultatsRechercheDiv.appendChild(resultDiv);
        });
    } else {
        resultatsRechercheDiv.innerHTML = '<p>Aucune faction trouvée avec ce nom.</p>';
    }
}

/**
 * Affiche toutes les factions dans la liste en bas de page, avec le bouton Supprimer.
 */
function renderFactionsList(factions) {
    factionsListUl.innerHTML = ''; // Vide la liste existante

    if (factions.length === 0) {
        factionsListUl.innerHTML = '<li>Aucune faction enregistrée pour l\'instant.</li>';
        return;
    }

    factions.forEach(faction => {
        const listItem = document.createElement('li');
        
        // Utilise la 'key' Firebase comme identifiant pour la suppression
        listItem.innerHTML = `
            <div class="faction-actions">
                <button class="delete-btn" onclick="deleteFaction('${faction.key}')">Supprimer</button>
            </div>
            <strong>${faction.nom}</strong> 
            <br> Coordonnées: ${faction.coordonnees}
        `;
        factionsListUl.appendChild(listItem);
    });
}
