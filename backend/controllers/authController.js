const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    User.findByEmail(email, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        User.create({ name, email, password }, (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Server error' });
            }

            const token = jwt.sign(
                { id: result.id },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.status(201).json({
                token,
                user: {
                    id: result.id,
                    name,
                    email
                }
            });
        });
    });
};

const login = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    User.findByEmail(email, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    });
};

module.exports = { register, login };