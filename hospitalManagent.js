var express         = require("express");
var bodyParser      = require("body-parser");
var mongoose        = require("mongoose");
var passport        = require("passport");
var flash 			= require("connect-flash");
var methodOverride  = require("method-override");
var LocalStrategy   =  require("passport-local");
var nodemailer      = require("nodemailer");
var async           = require("async");
var crypto          = require("crypto");
var Doctor          = require("./models/doctor");
var seedDB          = require("./seeds");
var Review          = require("./models/review");
var User            = require("./models/user");
var Appointment     = require("./models/appointment");
var Patient         = require("./models/patient");
var app = express();
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user:'',
    pass:''
  }
});

app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
mongoose.connect("mongodb://localhost/Hospital_Management",{useNewUrlParser:true,useUnifiedTopology: true});
app.use(bodyParser.urlencoded({extended:true}));
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
//seedDB();
app.locals.moment = require('moment');
//Passport Configuration
app.use(require("express-session")({
	secret:"ESCN",
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());
app.use(function(req,res,next){
	res.locals.currentUser = req.user;
	res.locals.error       = req.flash("error");
	res.locals.success     = req.flash("success");
	next();
});


app.set("view engine","ejs")
app.get("/",function(req,res){
	res.render("landing");
});

app.get("/doctors",function(req,res){
	Doctor.find({},function(err,allDoctors){
		if(err)
			console.log(err);
		else{
			res.render("doctors",{doctors:allDoctors});
		}
	});
	
});

app.post("/doctors",isLoggedIn,function(req,res){
	var name 	      = req.body.name,
	 	image	      = req.body.image,
	 	sex			  = req.body.sex,
	 	contactNumber = req.body.contactNumber,
	 	qualification = req.body.qualification,
		salary 	      = req.body.salary,
		did           = req.body.did;
	var author = {
		id:req.user._id,
		username:req.user.username
	}
	var newDoctor = 	{name:name,author:author,image:image,sex:sex,contactNumber:contactNumber,qualification:qualification,salary:salary,DID:did};
	Doctor.create(newDoctor,function(err,newlyCreated){
		if(err)
			console.log(err);
		else
			res.redirect("/doctors");
});
	
	
});
// Edit routes
app.get("/doctors/:id/edit",checkUser,function(req,res){
	Doctor.findById(req.params.id,function(err,foundDoctor){
				 res.render("edit",{doctor:foundDoctor});
});
});
//Update route
app.put("/doctors/:id",checkUser,function(req,res){
	Doctor.findByIdAndUpdate(req.params.id,req.body.doctor,function(err,updatedDoc){
		if(err){
			res.redirect("/doctors");
		}else{
			res.redirect("/doctors/" + req.params.id);
			}
		});
});

//Destroy route
app.delete("/doctors/:id",checkUser,function(req,res) {
	Doctor.findByIdAndRemove(req.params.id,function(err,deleted){
		if(err){
			res.redirect("/doctors");
				}else{
					res.redirect("/doctors");
				}
});
});
app.get("/doctors/new",isLoggedIn,function(req,res){
	res.render("newdoc");
});

//SHOW ROUTE
app.get("/doctors/:id",function(req,res){
	Doctor.findById(req.params.id).populate("reviews").exec(function(err,foundDoctor){
		if(err)
			console.log(err);
		else
			{
			res.render("show1",{doctors:foundDoctor});}
			
	});
	
});
app.get("/doctorsv2/:id",function(req,res){
	Doctor.findById(req.params.id,function(err,foundDoctor){
		if(err)
			{
				console.log(err);
			}
		else
			{
				res.render("show11",{doctors:foundDoctor});
			}
	});
});

// Patients ROUTE
app.get("/patients",function(req,res){
	Patient.find({},function(err,allpatients){
		if(err)
			{
				console.log(err);
			}
        else
			{
				res.render("patient",{patient:allpatients});
			}
	});
});
app.post("/patients",isLoggedIn,function(req,res){
    var name       =req.body.name;
	var image      =req.body.image;
	var age        =req.body.age;
	var gender     =req.body.gender;
    var phone_no   =req.body.phone_no;
	var room_no    =req.body.room_no;
    var patient_id =req.body.patient_id;
	var author = {
		id:req.user._id,
		username:req.user.username
	}
	var newpatient={name:name,image:image,age:age,gender:gender,phone_no:phone_no,room_no:room_no,
	 patient_id:patient_id,auth:author};
	Patient.create(newpatient,function(err,newlycreated){
     if(err)
		 {
			 console.log(err);
		 }
	else{
		res.redirect("/patients");
	}
		
	});

});

app.get("/patients/new",isLoggedIn,function(req,res){
	res.render("patient_new.ejs");
});

app.get("/patients/:id",function(req,res){
	//res.send("THIS WILL BE THE SHOW PAGE");
	Patient.findById(req.params.id,function(err,foundpatients){
		if(err)
			{
				console.log(err);
			}
		else
			{
				res.render("show2",{patient:foundpatients});
			}
	});
});
//Review Routes

app.get("/doctors/:id/review/new",isLoggedIn,function(req,res){
	Doctor.findById(req.params.id,function(err,doctor){
		if(err)
			console.log(err);
		else
		   res.render("review",{doctors:doctor});
	});
});

app.post("/doctors/:id/review",isLoggedIn,function(req,res){
	Doctor.findById(req.params.id,function(err,doctor){
		if(err)
			{
				console.log(err);
				res.redirect("doctors");
			}
			else{
				Review.create(req.body.review,function(err,reviews){
					if(err)
						console.log(err);
					else{
						reviews.author.id = req.user._id;
						reviews.author.username = req.user.username;
						reviews.save();
						doctor.reviews.push(reviews);
						doctor.save();
						req.flash("success","Successfully added review");
						res.redirect("/doctors/" + doctor._id);
						}
				});
			}
	});
});

//reviews editing routes
app.get("/doctors/:id/review/:reviews_id/edit",checkUserReview,function(req,res){
	Review.findById(req.params.reviews_id,function(err,foundReview){
		if(err){
		    req.flash("error","Something went wrong");
			res.redirect("back");
		}else{
		res.render("edit_reviews",{doctors_id:req.params.id,review:foundReview});
		}
});
});

// reviews update routes
app.put("/doctors/:id/review/:reviews_id",checkUserReview,function(req,res){
	Review.findByIdAndUpdate(req.params.reviews_id,req.body.review,function(err,updatedReview){
		if(err){
			res.redirect("back");
		}else{
			res.redirect("/doctors/" + req.params.id);
		}
});
})

//Reviews Destroy routes
app.delete("/doctors/:id/review/:reviews_id",checkUserReview,function(req,res){
		Review.findByIdAndRemove(req.params.reviews_id,function(err){
			if(err){
				res.redirect("back");
			}else{
				req.flash("success","Review Deleted");
				res.redirect("/doctors/" + req.params.id);
			}
});
});
/// Auth routes
app.get("/register",function(req,res){
	res.render("register");
});

app.post("/register",function(req,res){
	var newUser = new User({
		username:req.body.username,
		email:req.body.email});
	User.register(newUser,req.body.password,function(err,user){
		if(err)
		{
				req.flash("error",err.message);
				 res.redirect("register");
		}
		passport.authenticate("local")(req,res,function(){
			req.flash("success","Successfully registered welcome "+ user.username);
			res.redirect("/doctors");
		});
});
});

//Login Form
app.get("/login",function(req,res){
	res.render("login");
})


app.post("/login",passport.authenticate("local",{
	successRedirect :"/",
	failureRedirect :"/login"
}),function(req,res){
	res.send("login logic happens here");
});

//logout route

app.get("/forgot",function(req,res){
	res.render("forgot");
});

app.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token1 = buf.toString('hex');
        done(err, token1);
      });
    },
    function(token1, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token1;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token1, user);
        });
      });
    },
    function(token1, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user:'' ,
          pass:''
        }
      });
      var mailOptions = {
        to: user.email,
        from:'' ,
        subject: 'People Tree Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token1 + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});


app.get('/reset/:token1', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token1, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token1: req.params.token1});
  });
});


app.post('/reset/:token1', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token1, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user:'' ,
          pass:''        }
      });
      var mailOptions = {
        to: user.email,
        from:'' ,
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account at People Tree with email ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/doctors');
  });
});



app.get("/logout",function(req,res){
	req.logout();
	req.flash("success","Logged You Out");
	res.redirect("/doctors");
});

//Appointmet Routes
app.get("/appoint",isLoggedIn,function(req,res){
	Doctor.find({},function(err,alldocs){
		if(err){
			console.log(err);
		}else{
			res.render("appointment",{docs:alldocs});
		}
	});
});


app.post("/appoint",function(req,res){
	var name          =req.body.name,
		contactNumber =req.body.contactNumber,
		email         = req.body.email,
		date          = req.body.date,
		doctor        =req.body.selectedDoc;
	//console.log(req.body.selectedDoc);
	Appointment.countDocuments({date:req.body.date},function(err,count){
	var token = count+1;
		var time = token*20;
		var d = new Date(req.body.date);
		d.setHours(9,time,0);
	var newAppointment = {name:name,contactNumber:contactNumber,email:email,date:date,tokenNumber:token,doctor:doctor};
	Appointment.create(newAppointment,function(err,newlyCreated){
		if(err)
			console.log(err);
		else{
			var mailOptions = {
  			  from:'' ,
 			  to: req.body.email,
			  subject: 'Demo',
  			  text: `Hi ` + name + ` your appointment with `+ doctor+` is at `+ d.getHours()+`:`+ d.getMinutes() +`  on `+ date +   ` at people tree has been booked and your token number is ` + token +`.`
				};
			transporter.sendMail(mailOptions, function(error, info){
 			 if (error) {
   			 console.log(error);
 			 } else {
   		 console.log('Email sent: ' + info.response);
  		}
});
			res.redirect("/doctors");
		}		
});
});
});

app.get("/appoint/select",function(req,res){
	res.render("appointment_calender");
});
app.post("/appoint/view",function(req,res){
	Appointment.find({date:req.body.date},function(err,foundAppointment){
		if(err){
			console.log(err);
				}else{
					var asdf = req.body.date;
				res.render("appointment_view",{appoint:foundAppointment,date:asdf});
				}
	});
	
});
function isLoggedIn(req,res,next)
{
	if(req.isAuthenticated())
		{
			return next();
		}
	req.flash("error","You need to be logged in to that ");
	res.redirect("/login");
}

function checkUser(req,res,next)
{
	if(req.isAuthenticated()){
		Doctor.findById(req.params.id,function(err,foundDoctor){
		if(err)
			{
				req.flash("error","Doctor not found");
				res.redirect("back");
			}else{
				if(foundDoctor.author.id.equals(req.user.id)){
				 next();
				}else{
					req.flash("error","You don't have permission to do that");
					res.redirect("back");
				}
				}
			});
	}else{
		req.flash("error","You need to be logged in to do that");
		res.redirect("back");
	}
}
function checkUserReview(req,res,next)
{
	if(req.isAuthenticated()){
		Review.findById(req.params.reviews_id,function(err,foundReview){
		if(err)
			{
				res.redirect("back");
			}else{
				if(foundReview.author.id.equals(req.user.id)){
				 next();
				}else{
						req.flash("error","You don't have access to do that");
						res.redirect("back");
				}
				}
			});
	}else{
		req.flash("error","You need to be logged in to do that");
		res.redirect("back");
	}
}
app.listen(3000,function(){
	console.log("Hospital Manangement server has started");
});