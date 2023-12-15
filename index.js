// Group 1-1
// Members:  McKay Boody, Nick Dizes, Lindsey Gordon, Mo Galbraith
// Program Description:
// This website application is for Diabetics to find good recipes that help with their symptoms, and it
// provides users the ability to create an account so that they can log in and save recipes to use later.

const express = require('express');
const session = require('express-session');

let app = express();
var path = require('path');
const bodyParser = require('body-parser');

const port = process.env.PORT || 3000;

// Set up express-session middleware
app.use(
  session({
    secret: 'lksajdflkj--DFASDFASD-laskfdjlkasdjf_FADSASDF',
    resave: false,
    saveUninitialized: false,
  })
);

// authentication middleware
const authenticate = (req, res, next) => {
  if (req.session && req.session.loggedIn) {
    // User is logged in, continue to the next middleware
    next();
  } else {
    // User is not logged in, redirect to the login page
    res.redirect('/index.html');
  }
};

// set the view engine to ejs
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.urlencoded({ extended: true }));

// Serve static files with express
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const knex = require('knex')({
  client: 'pg',
  connection: {
    // If we use AWS, the host will be different
    host: process.env.RDS_HOSTNAME || 'localhost',
    user: process.env.RDS_USERNAME || 'postgres',
    password: process.env.RDS_PASSWORD || 'password',
    database: process.env.RDS_DB_NAME || 'NutritionDB',
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  },
});

// landing page view
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});
// landing page view
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

// about page view
app.get('/pages-about.html', (req, res) => {
  res.sendFile(path.join(__dirname, '/pages-about.html'));
});

// recipes page view
app.get('/pages-recipes.html', (req, res) => {
  res.sendFile(path.join(__dirname, '/pages-recipes.html'));
});
// FAQ page view
app.get('/pages-faq.html', (req, res) => {
  res.sendFile(path.join(__dirname, '/pages-faq.html'));
});

// pages-contact page view
app.get('/pages-contact.html', (req, res) => {
  res.sendFile(path.join(__dirname, '/pages-contact.html'));
});

// login page view
app.get('/pages-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '/pages-login.html'));
});
// signup page view
app.get('/pages-signup.html', (req, res) => {
  res.sendFile(path.join(__dirname, '/pages-signup.html'));
});

//  recipes page with ejs
app.get('/recipes.ejs', async (req, res) => {
  try {
    const data = await knex.select().from('Recipes');
    if (req.session.loggedIn) {
      const loggedInPersonID = req.session.personID;
      res.render('recipes', { data, loggedInPersonID });
    } else {
      res.render('recipes', { data, loggedInPersonID: null });
    }
    // Render the EJS template
    /* pass data to the template if needed */
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//  saved recipes page with ejs
app.get('/savedRecipes.ejs', async (req, res) => {
  try {
    // Check if the user is logged in
    if (req.session.loggedIn) {
      const loggedInPersonID = req.session.personID;
      // Fetch saved recipes for the logged-in user
      const data = await knex
        .select('*')
        .from('public.Recipes')
        .innerJoin(
          'public.PersonRecipes',
          'public.Recipes.RecipeID',
          '=',
          'public.PersonRecipes.RecipeID'
        )
        .where('public.PersonRecipes.PersonID', loggedInPersonID)
        .orderBy('public.Recipes.RecipeID', 'asc');

      // Render the EJS template
      res.render('savedRecipes', { data, loggedInPersonID });
    } else {
      // User is not logged in, render the EJS template without data
      res.render('savedRecipes', { data: [], loggedInPersonID: null });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// login
app.post('/login', async (req, res) => {
  try {
    console.log('req.body:', req.body);
    const { Email, Password } = req.body;

    const user = await knex('Person').where({ Email, Password }).first();
    console.log('user', user);

    if (user) {
      // Set the session variable on successful login
      req.session.loggedIn = true;
      req.session.personID = user.PersonID;
      res.redirect('/savedRecipes.ejs');
    } else {
      // If no user is found, handle the authentication failure
      res.status(401).send('Invalid username or password');
      // res.redirect('/pages-login.html');
    }
  } catch (error) {
    console.error('Database Query Error:', error);
    res.status(401).send('Invalid username or password');
    res.redirect('/pages-login.html');
    // res.status(500).send('Internal Server Error');
  }
});

//  logout route
app.get('/logout', (req, res) => {
  // Clear the session variable on logout
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    // Redirect to the login page after logout
    res.redirect('/index.html');
  });
});
// create a new account
app.post('/signup', async (req, res) => {
  try {
    console.log('req.body:', req.body);
    let { Email } = req.body;
    const emailCheck = await knex('Person').where({ Email }).first();
    console.log('emailCheck', emailCheck);
    if (emailCheck) {
      res.status(401).send('Username already exists');
    } else if (!emailCheck) {
      const Person = {
        FirstName: req.body.FirstName,
        LastName: req.body.LastName,
        Email: req.body.Email,
        Password: req.body.Password,
      };
      const personResult = await knex('Person').insert(Person);
      console.log('Insert Person Result:', personResult);
      res.redirect('/pages-login.html');
    }
  } catch (error) {
    console.error('Database Insert Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// saving a recipe to a user's account
app.post('/saveRecipe', async (req, res) => {
  try {
    console.log('req.body:', req.body);
    const savedRecipe = {
      PersonID: req.session.personID,
      RecipeID: req.body.recipeID,
    };
    console.log('savedRecipe', savedRecipe);
    const savedRecipeResult = await knex('PersonRecipes').insert(savedRecipe);
    console.log('savedRecipeResult', savedRecipeResult);
    res.redirect('/savedRecipes.ejs');
  } catch (error) {
    console.error('Database Insert Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// listen message
app.listen(port, () =>
  console.log(`Server is running on http://localhost:${port}`)
);
