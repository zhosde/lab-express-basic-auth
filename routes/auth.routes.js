const { Router } = require("express");
const router = new Router();

const mongoose = require('mongoose');

const bcryptjs = require("bcryptjs");
const saltRounds = 10;

const User = require("../models/User.model");

const {isLoggedIn, isLoggedOut} = require('../middleware/route-guard')

// Iteration#1 Sign Up
router.get("/signup", (req, res) => res.render("auth/signup"));

router.post("/signup", (req, res, next) => {
  const { username, password } = req.body;

  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    res
      .status(500)
      .render('auth/signup', { errorMessage: 'Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.' });
    return;
  }

  if (!username || !password) {
    res.render('auth/signup', { errorMessage: 'All fields are mandatory. Please provide your username, email and password.' });
    return;
  }

  bcryptjs
    .genSalt(saltRounds)
    .then((salt) => bcryptjs.hash(password, salt))
    .then((hashedPassword) => {
      return User.create({
        username,
        passwordHash: hashedPassword
      });
    })
    .then((userFromDB) => {
        console.log(userFromDB),
        res.redirect(`/userProfile?username=${userFromDB.username}`)})
        .catch(error => {
          if (error instanceof mongoose.Error.ValidationError) {
            res.status(500).render('auth/signup', { errorMessage: error.message });
          } else if (error.code === 11000) {
            res.status(500).render('auth/signup', {
               errorMessage: 'Username needs to be unique. Either username is already used.'
            });
          } else {
            next(error);
          }
        });
});

router.get('/login', (req, res) => res.render('auth/login'))

router.post('/login', (req, res, next) => {
  const { username, password } = req.body;
 
  if (username === '' || password === '') {
    res.render('auth/login', {
      errorMessage: 'Please enter both, username and password to login.'
    });
    return;
  }
 
  User.findOne({ username })
    .then(user => {
      if (!user) {
        res.render('auth/login', { errorMessage: 'Username is not registered. Try with other name.' });
        return;
      } else if (bcryptjs.compareSync(password, user.passwordHash)) {
        res.render('users/user-profile', { user });

        req.session.currentUser = user;
        res.redirect('/userProfile');

      } else {
        res.render('auth/login', { errorMessage: 'Incorrect password.' });
      }
    })
    .catch(error => next(error));
});

router.get('/userProfile', (req, res) => {
  res.render('users/user-profile', { userInSession: req.session.currentUser });
});

router.post('/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) next(err);
    res.redirect('/');
  });
});
 
router.get('/main', isLoggedIn, (req,res,next)=> {
  res.render('vip/main')
})

router.get('/private', isLoggedIn, (req,res,next)=> {
  res.render('vip/private')
})

module.exports = router;
