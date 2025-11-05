// routes/user.js

const express = require('express');
const router = express.Router();

// Simulazione di un database in memoria
let users = [
    { name: 'Mario Rossi', age: 30 },
    { name: 'Luigi Verdi', age: 25 }
];

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - age
 *       properties:
 *         name:
 *           type: string
 *           description: Nome dell'utente
 *         age:
 *           type: integer
 *           description: Età dell'utente
 *       example:
 *         name: "Mario Rossi"
 *         age: 30
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve a list of users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/users', (req, res) => {
    res.json(users);
});

/**
 * @swagger
 * /users/{name}:
 *   get:
 *     summary: Retrieve users with specific name
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the user to retrieve
 *     responses:
 *       200:
 *         description: Details of the user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/users/:name', (req, res) => {
    const name = req.params.name;
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad Request
 *       409:
 *         description: Conflict - User already exists
 */
router.post('/users', (req, res) => {
    const { name, age } = req.body;
    
    if (!name || age === undefined || age === null) {
        return res.status(400).json({ message: 'Name and age are required' });
    }
    
    if (typeof age !== 'number' || age < 0) {
        return res.status(400).json({ message: 'Age must be a positive number' });
    }
    
    // Verifica se l'utente esiste già
    const existingUser = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
    }
    
    const newUser = {
        name: name.trim(),
        age: parseInt(age)
    };
    
    users.push(newUser);
    res.status(201).json(newUser);
});

/**
 * @swagger
 * /users/{name}:
 *   put:
 *     summary: Aggiorna un utente
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Nome dell'utente da aggiornare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Utente aggiornato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Utente non trovato
 */
router.put('/users/:name', (req, res) => {
    const oldName = req.params.name;
    const { name, age } = req.body;
    
    if (!name || age === undefined || age === null) {
        return res.status(400).json({ message: 'Name and age are required' });
    }
    
    if (typeof age !== 'number' || age < 0) {
        return res.status(400).json({ message: 'Age must be a positive number' });
    }
    
    const userIndex = users.findIndex(u => u.name.toLowerCase() === oldName.toLowerCase());
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    // Se il nome è cambiato, verifica che il nuovo nome non esista già
    if (name.toLowerCase() !== oldName.toLowerCase()) {
        const existingUser = users.find(u => u.name.toLowerCase() === name.toLowerCase());
        if (existingUser) {
            return res.status(409).json({ message: 'User with new name already exists' });
        }
    }
    
    users[userIndex] = {
        name: name.trim(),
        age: parseInt(age)
    };
    
    res.json(users[userIndex]);
});

/**
 * @swagger
 * /users/{name}:
 *   delete:
 *     summary: Elimina un utente
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Nome dell'utente da eliminare
 *     responses:
 *       200:
 *         description: Utente eliminato
 *       404:
 *         description: Utente non trovato
 */
router.delete('/users/:name', (req, res) => {
    const name = req.params.name;
    const userIndex = users.findIndex(u => u.name.toLowerCase() === name.toLowerCase());
    
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    users.splice(userIndex, 1);
    res.json({ message: 'User deleted successfully' });
});

module.exports = router;