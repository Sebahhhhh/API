// lista degli endpoint da provare in ordine di priorità
const API_ENDPOINTS = [
    '/api',
    'http://localhost:3000/api',
    'https://infamous-spooky-monster-jj9wrqgrpr7cq6w5-3000.app.github.dev/api'
];

let API_BASE = API_ENDPOINTS[0];
let users = [];
let updateInterval;

// fetch con timeout per evitare richieste che si bloccano indefinitamente
// serve per evitare che l'interfaccia rimanga bloccata in caso di problemi di rete
// nel caso ti dice direttamente che non va 
async function fetchWithTimeout(url, options = {}, timeout = 5000) {

    // controllo per nel caso abortire la richiesta 
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// prova ogni endpoint fino a trovarne uno funzionante
// è importante perchè l'API potrebbe essere ospitata in posti diversi
async function testApiConnection() {
    for (const endpoint of API_ENDPOINTS) {
        try {
            const response = await fetchWithTimeout(`${endpoint}/users`, {
                headers: { 'Accept': 'application/json', 'Authorization': 'Bearer 5IDtoken' }
            });
            
            if (response.ok) {
                // salva l'endpoint funzionante per le successive chiamate
                API_BASE = endpoint;
                return true;
            }
        } catch (error) {}
    }
    return false;
}

document.addEventListener('DOMContentLoaded', async function() {
    // verifica connessione prima di procedere
    // se non va mostra messaggio di errore
    if (!await testApiConnection()) {
        document.getElementById('usersList').innerHTML = '<p>Impossibile connettersi all\'API.</p>';
        return;
    }
    
    loadUsers();
    setupEventListeners();
    // aggiorna la lista utenti ogni 2 secondi
    // così i dati restano sempre aggiornati
    updateInterval = setInterval(loadUsers, 2000);
});

function setupEventListeners() {
    document.getElementById('addUserForm')?.addEventListener('submit', handleAddUser);
    document.getElementById('editUserForm')?.addEventListener('submit', handleEditUser);
    
    // chiusura modal con pulsante X
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none');
    });
    
    // chiusura modal cliccando fuori
    // alternativa pratica
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) e.target.style.display = 'none';
    });
}

// carica la lista utenti dall'API
// aggiorna solo se i dati sono cambiati
async function loadUsers() {
    try {
        const response = await fetchWithTimeout(`${API_BASE}/users`, {
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) return;
        
        const newUsers = await response.json();

        // aggiorna solo se i dati sono cambiati per evitare rendering inutili
        if (JSON.stringify(newUsers) !== JSON.stringify(users)) {
            users = newUsers;
            renderUsers();
        }
    } catch (error) {}
}

// mostra la lista utenti nell'interfaccia
function renderUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    if (!users?.length) {
        usersList.innerHTML = '<p>Nessun utente trovato</p>';
        return;
    }
    
    // genera le card utente dinamicamente
    usersList.innerHTML = users.map(user => `
        <div class="user-card">
            <h3>${user.name || 'Nome non disponibile'}</h3>
            <p>Età: ${user.age ?? 'Età non disponibile'}</p>
            <div class="user-actions">
                <button class="btn" onclick="showUserDetails('${user.name}')">Dettagli</button>
                <button class="btn" onclick="editUser('${user.name}')">Modifica</button>
                <button class="btn" onclick="deleteUser('${user.name}')">Elimina</button>
            </div>
        </div>
    `).join('');
}

// mostra i dettagli di un utente in una modal
async function showUserDetails(userName) {
    try {
        // codifica il nome per gestire caratteri speciali nell'url
        const response = await fetchWithTimeout(`${API_BASE}/users/${encodeURIComponent(userName)}`, {
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) return;
        
        const user = await response.json();
        document.getElementById('userDetails').innerHTML = `
            <p><strong>Nome:</strong> ${user.name || 'Non specificato'}</p>
            <p><strong>Età:</strong> ${user.age ?? 'Non specificato'}</p>
        `;
        document.getElementById('userModal').style.display = 'block';
    } catch (error) {}
}

// apre la modal di modifica con i dati dell'utente
function editUser(userName) {
    // trova l'utente da modificare
    const user = users.find(u => u.name === userName);
    if (!user) return;
    
    // popola il form di modifica con i dati attuali
    document.getElementById('editUserId').value = user.name;
    document.getElementById('editUserName').value = user.name || '';
    document.getElementById('editUserEmail').value = user.age || '';
    document.getElementById('editModal').style.display = 'block';
}

// gestisce l'aggiunta di un nuovo utente
async function handleAddUser(event) {
    event.preventDefault();
    
    // prendi i valori dal form
    const name = document.getElementById('newUserName').value.trim();
    const age = parseInt(document.getElementById('newUserEmail').value) || 0;
    
    if (!name) return;
    
    try {
        // timeout più lungo per operazioni di scrittura
        // che potrebbero richiedere più tempo
        const response = await fetchWithTimeout(`${API_BASE}/users`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer 5IDtoken',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, age })
        }, 10000);
        
        if (response.ok) {
            document.getElementById('addUserForm').reset();
            await loadUsers();
        }
    } catch (error) {}
}

// gestisce la modifica di un utente esistente
async function handleEditUser(event) {
    event.preventDefault();
    
    // salva il nome originale per l'url della richiesta
    const oldName = document.getElementById('editUserId').value;
    const name = document.getElementById('editUserName').value.trim();
    const age = parseInt(document.getElementById('editUserEmail').value) || 0;
    
    if (!name) return;
    
    try {
        const response = await fetchWithTimeout(`${API_BASE}/users/${encodeURIComponent(oldName)}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 5IDtoken'
            },
            body: JSON.stringify({ name, age })
        }, 10000);
        
        if (response.ok) {
            closeEditModal();
            await loadUsers();
        }
    } catch (error) {}
}

// elimina un utente 
// mostra un prompt di conferma prima di procedere
async function deleteUser(userName) {
    if (!confirm(`Sei sicuro di voler eliminare l'utente "${userName}"?`)) return;
    
    try {
        const response = await fetchWithTimeout(`${API_BASE}/users/${encodeURIComponent(userName)}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 5IDtoken'
            }
        }, 10000);
        
        if (response.ok) await loadUsers();
    } catch (error) {}
}

// chiude la modal di modifica
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// pulisce l'intervallo quando la pagina viene chiusa
window.addEventListener('beforeunload', () => clearInterval(updateInterval));