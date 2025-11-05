// Prova prima l'API locale, poi quella remota
const API_ENDPOINTS = [
    '/api',
    'http://localhost:3000/api',
    'https://infamous-spooky-monster-jj9wrqgrpr7cq6w5-3000.app.github.dev/api'
];

let API_BASE = API_ENDPOINTS[0]; // Inizia con il percorso relativo
let users = [];
let updateInterval;

// Test connessione API
async function testApiConnection() {
    for (const endpoint of API_ENDPOINTS) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${endpoint}/users`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    "Authorization": "Bearer 5IDtoken"
                    
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                API_BASE = endpoint;
                console.log(`API connessa a: ${API_BASE}`);
                return true;
            }
        } catch (error) {
            console.log(`Tentativo fallito per ${endpoint}:`, error.message);
        }
    }
    return false;
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inizializzazione applicazione...');
    
    // Testa la connessione API
    const apiConnected = await testApiConnection();
    
    if (!apiConnected) {
        const usersList = document.getElementById('usersList');
        if (usersList) {
            usersList.innerHTML = '<p>Impossibile connettersi all\'API. Verificare che il server sia avviato.</p>';
        }
        return;
    }
    
    loadUsers();
    setupEventListeners();
    
    // Aggiornamento automatico ogni 2 secondi
    updateInterval = setInterval(loadUsers, 2000);
});

function setupEventListeners() {
    // Form aggiunta utente
    const addForm = document.getElementById('addUserForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddUser);
    }
    
    // Form modifica utente
    const editForm = document.getElementById('editUserForm');
    if (editForm) {
        editForm.addEventListener('submit', handleEditUser);
    }
    
    // Chiusura modal
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Chiusura modal cliccando fuori
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

async function loadUsers() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_BASE}/users`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const newUsers = await response.json();
        
        // Aggiorna solo se ci sono cambiamenti
        if (JSON.stringify(newUsers) !== JSON.stringify(users)) {
            users = newUsers;
            renderUsers();
        }
    } catch (error) {
        console.error('Errore nel caricamento utenti:', error);
        const usersList = document.getElementById('usersList');
        if (usersList) {
            if (error.name === 'AbortError') {
                usersList.innerHTML = '<p>Timeout nella connessione all\'API</p>';
            } else {
                usersList.innerHTML = `<p>Errore nel caricamento degli utenti: ${error.message}</p>`;
            }
        }
    }
}

function renderUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    if (!users || users.length === 0) {
        usersList.innerHTML = '<p>Nessun utente trovato</p>';
        return;
    }
    
    usersList.innerHTML = users.map(user => `
        <div class="user-card" data-user-name="${user.name}">
            <h3>${user.name || 'Nome non disponibile'}</h3>
            <p>Età: ${user.age !== undefined ? user.age : 'Età non disponibile'}</p>
            <div class="user-actions">
                <button class="btn" onclick="showUserDetails('${user.name}')">Dettagli</button>
                <button class="btn" onclick="editUser('${user.name}')">Modifica</button>
                <button class="btn" onclick="deleteUser('${user.name}')">Elimina</button>
            </div>
        </div>
    `).join('');
}

async function showUserDetails(userName) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_BASE}/users/${encodeURIComponent(userName)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const user = await response.json();
        
        const userDetails = document.getElementById('userDetails');
        const userModal = document.getElementById('userModal');
        
        if (userDetails && userModal) {
            userDetails.innerHTML = `
                <p><strong>Nome:</strong> ${user.name || 'Non specificato'}</p>
                <p><strong>Età:</strong> ${user.age !== undefined ? user.age : 'Non specificato'}</p>
            `;
            
            userModal.style.display = 'block';
        }
    } catch (error) {
        console.error('Errore nel caricamento dettagli utente:', error);
    }
}

function editUser(userName) {
    const user = users.find(u => u.name === userName);
    if (!user) {
        console.error('Utente non trovato');
        return;
    }
    
    const editUserId = document.getElementById('editUserId');
    const editUserName = document.getElementById('editUserName');
    const editUserEmail = document.getElementById('editUserEmail');
    const editUserPhone = document.getElementById('editUserPhone');
    const editModal = document.getElementById('editModal');
    
    if (editUserId && editUserName && editUserEmail && editUserPhone && editModal) {
        editUserId.value = user.name; // Usa il nome come identificatore
        editUserName.value = user.name || '';
        editUserEmail.value = user.age || ''; // Usa il campo email per l'età
        editUserPhone.style.display = 'none'; // Nascondi il campo telefono
        
        editModal.style.display = 'block';
    }
}

async function handleAddUser(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('newUserName');
    const emailInput = document.getElementById('newUserEmail'); // Usa per l'età
    const phoneInput = document.getElementById('newUserPhone');
    
    if (!nameInput || !emailInput) return;
    
    const userData = {
        name: nameInput.value.trim(),
        age: parseInt(emailInput.value) || 0
    };
    
    if (!userData.name) {
        console.error('Nome è obbligatorio');
        return;
    }
    
    if (userData.age < 0) {
        console.error('L\'età deve essere un numero positivo');
        return;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                "Authorization": "Bearer 5IDtoken",
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            // Reset form
            const form = document.getElementById('addUserForm');
            if (form) form.reset();
            
            // Ricarica la lista immediatamente
            await loadUsers();
            console.log('Utente aggiunto con successo!');
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Errore nell'aggiunta dell'utente: ${errorData.message || 'Errore sconosciuto'}`);
        }
    } catch (error) {
        console.error('Errore nell\'aggiunta utente:', error);
    }
}

async function handleEditUser(event) {
    event.preventDefault();
    
    const userIdInput = document.getElementById('editUserId');
    const nameInput = document.getElementById('editUserName');
    const emailInput = document.getElementById('editUserEmail'); // Usa per l'età
    
    if (!userIdInput || !nameInput || !emailInput) return;
    
    const oldName = userIdInput.value;
    const userData = {
        name: nameInput.value.trim(),
        age: parseInt(emailInput.value) || 0
    };
    
    if (!userData.name) {
        console.error('Nome è obbligatorio');
        return;
    }
    
    if (userData.age < 0) {
        console.error('L\'età deve essere un numero positivo');
        return;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${API_BASE}/users/${encodeURIComponent(oldName)}`, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 5IDtoken'
            },
            body: JSON.stringify(userData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            closeEditModal();
            await loadUsers();
            console.log('Utente modificato con successo!');
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Errore nella modifica dell'utente: ${errorData.message || 'Errore sconosciuto'}`);
        }
    } catch (error) {
        console.error('Errore nella modifica utente:', error);
    }
}

async function deleteUser(userName) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${API_BASE}/users/${encodeURIComponent(userName)}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 5IDtoken'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            await loadUsers();
            console.log('Utente eliminato con successo!');
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Errore nell'eliminazione dell'utente: ${errorData.message || 'Errore sconosciuto'}`);
        }
    } catch (error) {
        console.error('Errore nell\'eliminazione utente:', error);
    }
}

function closeEditModal() {
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.style.display = 'none';
    }
}

// Cleanup quando la pagina viene chiusa
window.addEventListener('beforeunload', function() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});