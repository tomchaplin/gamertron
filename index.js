// Get in pre-requisites
const path = require('path');
const express = require('express');
const ejs = require('ejs')
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const passwordHasher = require('password-hash-and-salt');

// Setup prerequisites
const app = express();
app.use(express.json());
const adapter = new FileSync('db.json');
const db = low(adapter);

// Globals
const ADMIN_PASS = 'admin_pass';
const NODE_PORT = process.env.PORT || 4000;
const SITE_TITLE = 'Gamertron';
const templateDirectory = path.join(__dirname, 'templates');

// Setup defaults
db.defaults({ users: [], showResults: false}).write();

function userExists(user) {
	return db.get('users')
		.find({user: user})
		.size()
		.value() > 1;
}

function preflightChecks(req, res, next) {
	if(typeof(req.body.user) === 'undefined' || req.body.user.length == 0) {
		res.status(400);
		res.json({err: 'No user provided'});
		return
	}
	if(typeof(req.body.pass) === 'undefined' || req.body.pass.length == 0) {
		res.status(400);
		res.json({err: 'No password provided'});
		return
	}
	next()
}

function computeMurderer() {
	// Pick random user
	let numUsers = db.get('users').size().value();
	let randUser = Math.floor(Math.random()*numUsers);
	// Make sure nobody is the murderer
	db.get('users')
		.each( user => { user.murderer = false })
		.write();
	// Set the random user to be the murderer.
	db.get('users').nth(randUser).assign({murderer: true}).write();
}

app.get('/', (req, res) => {
	let templateName = (db.get('showResults').value()
		? path.join(templateDirectory, 'reveal.ejs')
		: path.join(templateDirectory, 'collect.ejs')
	);
	ejs.renderFile(templateName, {title: SITE_TITLE}, {}, (err, str) => {
		res.send(str);
	});
});

app.get('/admin', (req, res) => {
	ejs.renderFile(path.join(templateDirectory, 'admin.ejs'), {title: SITE_TITLE}, {}, (err, str) => {
		res.send(str);
	});
});

/*
 * New user route should except form data to register a new user
 * Only active when showResults = false
 * It should register the new user and then serve them with a sucess message
 */
app.post('/new_user', preflightChecks, (req, res) => {
	if (db.get('showResults').value()){ 
		res.status(400);
		res.json({err: 'Not accepting new users'});
		return
	}
	if(userExists(req.body.user)){
		res.status(400);
		res.json({err: 'User already exists'});
		return;
	}
	passwordHasher(req.body.pass).hash( (err, hash) => {
		db.get('users')
			.push({user: req.body.user, hash: hash, murderer: false})
			.write();
		res.status(200);
		res.json({err: false, user: req.body.user});
		console.log(`${req.body.user} has joined the game`);
	});
});

/*
 * Reveal user page
 * Only active when showResults = true
 * Should accept login info, verify it and then serve them with the results
 */
app.post('/get_results', preflightChecks, (req, res) => {
	if (!db.get('showResults').value()) {
		res.status(400);
		res.json({err: 'Result not yet ready'});
		return;
	}
	if (!userExists(req.body.user)){
		res.status(400);
		res.json({err: 'No such user'});
		return;
	}
	let user = db.get('users')
		.find({user: req.body.user})
		.value();
	let correctHash = user.hash
	passwordHasher(req.body.pass).verifyAgainst(correctHash, (err, verified) => {
		if(!verified) {
			res.status(400);
			res.json({err: 'Wrong password'});
		} else {
			res.status(200);
			res.json({err: false, user: req.body.user, murderer: user.murderer});
			console.log(`${req.body.user} just retrieved their results`);
		}
	});
});

app.post('/change_mode', (req, res) => {
	if(typeof(req.body.showResults) === 'undefined'
		|| typeof(req.body.pass) === 'undefined'
		|| req.body.pass !== ADMIN_PASS) {
		res.status(400);
		res.json({err: 'Bad admin request'});
		return;
	}
	db.set('showResults', req.body.showResults).write();
	if( req.body.showResults ) {
		computeMurderer();
	}
	res.status(200);
	res.json({err: false, showResults: req.body.showResults});
	console.log('Changed mode');
})

app.use(express.static(path.join(__dirname, 'public'), {index: false, extensions:['html']}));
app.listen(NODE_PORT, () => console.log(`Listening on ${NODE_PORT}`));
