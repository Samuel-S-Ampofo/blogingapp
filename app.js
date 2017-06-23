
// Severe set  up 
const express = require('express');
const app = express();
const Sequelize = require('sequelize');
const cookies = require( "cookies" );
const session = require('express-session');
const bcrypt = require('bcrypt');
// const saltRounds = 10;



// body parser

const bodyParser = require('body-parser');
app.use('/', bodyParser()); //???

// app.use(session({
// 	secret: process.env.secret,
// 	resave: true,
// 	saveUninitialized: false
// }));


app.use(session({
	secret: 'this should keep you safe',
	resave: true,
	saveUninitialized: false
}));


// postgressql database creation and sync.

var sequelize = new Sequelize('postgres://user:password@localhost/my_db');


//definition of tables

var Blogpost = sequelize.define('blogpost', {
    topic: Sequelize.STRING,
    postmessage: Sequelize.STRING
});


//definition of comments table

var Postcomment = sequelize.define('postcomment', {
    postcomment: Sequelize.STRING
});


//define blog user tables
var Person = sequelize.define('person', {
    firstname: Sequelize.STRING,
    lastname: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING
});

//a person has many blogPost
Person.hasMany(Blogpost);

//... but a blogPost belongs to a single person.
Blogpost.belongsTo(Person);

//... but a blogPost has many psot comments
Blogpost.hasMany(Postcomment);

//... but a post commentbelongs to  to a single blogpost.
Postcomment.belongsTo(Blogpost);

//... person has many commentbelongs to  to a single blogpost.
Person.hasMany(Postcomment);

//... person has many commentbelongs to  to a single blogpost.
Postcomment.belongsTo(Person);

sequelize
    //sync the models
    .sync()



// use and sets views and static files.
app.set('views', 'views');
app.set('view engine', 'pug');
app.use('/', express.static('./public')); 



// starting point login.
app.get('/', function (req, res){

  res.render('login')
});


// login page to wall

app.get('/login', function (req, res){

  res.render('login')
})


app.post('/login', function (req, res){

	let eMail = req.body.email
	let passWord = req.body.password
		console.log(eMail);
		console.log(passWord);

		Person.findOne({
			where: {
				email: eMail
				}
			})
		.then( (user) => {
			 	var hash =  user.password
				  bcrypt.compare(passWord, hash, function(err, result) {
					 		if(result === true){
					 			req.session.user = user;
					 			res.redirect('profile');}
					 			else{

					 			}
					});
		});
});


app.get('/profile', function (req, res){
	var user = req.session.user;

 	console.log("this is the userid;" + user.id);
	 Blogpost.findAll({order: '"updatedAt" DESC',
	 	where:{ 
	 		personId:user.id  //
	 		// include: [Account, {model: Comment, include: [Account]}]
	 	}, include: [Person, {model: Postcomment, include: [Person]}]
	})
	.then(function (userblogs){
		console.log("These are the blogs: " + userblogs);
	   		 res.render('profile',{
	   		 	userblogs: userblogs
	   		 });
   	})


		// Postcomment.findAll(
		// 		// where: {
		// 		// 	blogpostId: postId
		// 		// }
		// 	)
		// .then(function(postcomments){
		// 	console.log("this  are your post comenet" + postcomments )
		// // 	res.render('profile', {
		// // 		postcomments: postcomments
		// // 	});
		// });
});


app.post('/comment', function (req, res){
	    const postId = req.body.commentId
		const comment = req.body.comment
		console.log("this is your postcomment" + postId);
		// console.log("Post id: " + postId)
		Postcomment.create({
			postcomment: comment,
			blogpostId: postId,
			personId: req.session.user.id   //  || 1 if this doesn't fully work yet you get undefined and therefore I did a simple trick -- if everything works you need to delete || 1
		});
		
		res.redirect('home')
});

//find all blog posts
app.get('/home', function (req, res){
	Blogpost.findAll(
		{order: '"updatedAt" DESC', 
		include: 
			[Person, {model: Postcomment, include: [Person]}]
	})
	.then(function (blogposts){
		res.render('home',{
   			blogposts:blogposts
   		});
	});
});



// signup

app.get('/signup', function (req, res){		
  res.render('signup')
})


app.post('/signup', function (req, res){

	let firstName = req.body.firstname
	let lastName = req.body.lastname
	let eMail = req.body.email
	let password = req.body.password

	bcrypt.hash(password, 10, function(err, hash) {

		Person.create({
	    firstname: firstName ,
	    lastname: lastName,
	    email: eMail,
	    password:hash 
		})
		.then( () => {
		res.render('login') //res.render happens after the person is created -- synchronisity as you want it
		})
	});
});



app.post('/message', function (req, res){

	let postTopic = req.body.postopic
	let postMessage = req.body.postmessage

	Blogpost.create({
		topic: postTopic,
	    postmessage: postMessage,
	    personId: req.session.user.id
	})

  res.redirect('profile')
})


app.get('/messages/:postId', (req, res) => {
	const postId = req.userblog.id
	const postComment = req.body.comment


	Blogpost.findOne({
		where: {
			id: postId
		}
	})
	.then( (postcomment) =>{
		res.render("blogpost_detail", {
			blogPost: blogPost
		})
	})
})

// http://localhost:3000/comment/2
// http://localhost:3000/comment/135
app.get('/comment', (req, res) => {
	
});


app.get('/logout', function (req, res) {

	req.session.destroy(function(error) {
		if(error) {
			throw error;
		}
		res.redirect('login');
	})
});



// sever initiation

const listener = app.listen(3000, () => {
    console.log('server has started at ', listener.address().port)
});



