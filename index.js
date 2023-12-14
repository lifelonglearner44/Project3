// Group 1-1
// Members:  McKay Boody, Nick Dizes, Lindsey Gordon, Mo Galbraith
// Program Description: This Program is a website for the Provo City Social Media Health Committee to
// improve the mental health of Provo residents through improving the use of Social Media. The main components of the website are a survey, dashboard, admin report, and admin login features.

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
// admin register page view
app.get('/adminRegister.ejs', authenticate, (req, res) => {
  const isAuthenticated = req.session.loggedIn;
  if (isAuthenticated) {
    res.render('adminRegister', { isAuthenticated });
  } else if (!isAuthenticated) {
    res.redirect('/pages-login.html');
  }
});
// admin profile page view
app.get('/users-profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, '/users-profile.html'));
});

//  recipes page with ejs
app.get('/recipes.ejs', async (req, res) => {
  try {
    const data = await knex.select().from('Recipes');

    // Render the EJS template
    res.render('recipes', { data });
    /* pass data to the template if needed */
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//  saved recipes page with ejs
app.get('/savedRecipes.ejs', async (req, res) => {
  try {
    const data = await knex
      .select('*')
      .from('public.Recipes')
      .innerJoin(
        'public.PersonRecipes',
        'public.Recipes.RecipeID',
        '=',
        'public.PersonRecipes.RecipeID'
      )
      .where('public.PersonRecipes.PersonID', 4)
      .orderBy('public.Recipes.RecipeID', 'asc');

    // Render the EJS template
    res.render('savedRecipes', { data });

    /* pass data to the template if needed */
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//  admin report page view with ejs
app.get('/adminReport.ejs', authenticate, async (req, res) => {
  try {
    const isAuthenticated = req.session.loggedIn;

    const data = await knex.select().from('Survey_Responses');

    // Render the EJS template
    res.render('adminReport', { data, isAuthenticated });
    /* pass data to the template if needed */
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
      // res.redirect('/adminReport.ejs');
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

// Example logout route
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
// posting to the database
app.post('/registerNewAccount', async (req, res) => {
  try {
    console.log('req.body:', req.body);
    let { Username } = req.body;
    const usernameCheck = await knex('User').where({ Username }).first();
    console.log('usernameCheck', usernameCheck);
    if (usernameCheck) {
      res.status(401).send('Username already exists');
    } else if (!usernameCheck) {
      const User = {
        First_Name: req.body.First_Name,
        Last_Name: req.body.Last_Name,
        Username: req.body.Username,
        Email: req.body.Email,
        Password: req.body.Password,
      };
      const surveyResult = await knex('User').insert(User);
      console.log('Insert survey Result:', surveyResult);
      res.send('User successfully created!');
    }
  } catch (error) {
    console.error('Database Insert Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// posting to the database
app.post('/surveyPost', async (req, res) => {
  try {
    // console.log('req.body:', req.body);
    // console.log('req', req);
    // // console.log('req', req);
    const Survey_Responses = {
      Origin: 'Provo',
      Date: new Date(),
      Time: new Date().toTimeString().slice(0, 8),
      Age: req.body.Age,
      Gender: req.body.Gender,
      Relationship_Status: req.body.Relationship_Status,
      Occupation_Status: req.body.Occupation_Status,
      Use_Social_Media: req.body.Use_Social_Media,
      Average_Usage_Hours: req.body.Average_Usage_Hours,
      Without_Specific_Purpose: req.body.Without_Specific_Purpose,
      Distracted_From_Tasks: req.body.Distracted_From_Tasks,
      Restless_Without: req.body.Restless_Without,
      Easily_Distracted: req.body.Easily_Distracted,
      Bothered_By_Worries: req.body.Bothered_By_Worries,
      Difficulty_Concentrating: req.body.Difficulty_Concentrating,
      Comparison_Through_Social_Media: req.body.Comparison_Through_Social_Media,
      Comparison_Feelings: req.body.Comparison_Feelings,
      Validation_From_Social_Media: req.body.Validation_From_Social_Media,
      Depressed_Or_Down: req.body.Depressed_Or_Down,
      Interest_In_Daily_Activities: req.body.Interest_In_Daily_Activities,
      Sleep_Issues: req.body.Sleep_Issues,
    };

    // console.log('Survey_Responses:', Survey_Responses);

    const surveyResult = await knex('Survey_Responses')
      .insert(Survey_Responses)
      .returning('Survey_Response_ID');

    // Assuming surveyResult is an array with the generated IDs
    const Survey_Response_ID = surveyResult[0].Survey_Response_ID;

    // Now you can use Survey_Response_ID in your subsequent logic
    console.log('Generated Survey_Response_ID:', Survey_Response_ID);

    // console.log('id', surveyResult[0]);
    // // console.log('Insert survey Result:', surveyResult);
    const Organization_IDs = req.body.Organization_ID || [];
    const Social_Platform_IDs = req.body.Social_Platform_ID || [];
    // console.log('Organization_IDs', Organization_IDs);
    // console.log('Social_Platform_IDs', Social_Platform_IDs);
    const mainEntries = [];

    // loop through the Organization_IDs and Social_Platform_IDs arrays
    for (const organizationID of Organization_IDs) {
      for (const socialPlatformID of Social_Platform_IDs) {
        mainEntries.push({
          Survey_Response_ID: Survey_Response_ID,
          Organization_ID: organizationID,
          Social_Platform_ID: socialPlatformID,
        });
      }
    }

    // console.log('Main Entries:', mainEntries);

    // Use a for loop to insert each entry into the 'Main' table
    for (const entry of mainEntries) {
      try {
        await knex('Main').insert(entry);
        console.log('Inserted:', entry);
      } catch (error) {
        console.error('Error inserting:', error);
      }
    }

    res.send('Data successfully inserted into the table!');
  } catch (error) {
    console.error('Database Insert Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// listen message
app.listen(port, () =>
  console.log(`Server is running on http://localhost:${port}`)
);
