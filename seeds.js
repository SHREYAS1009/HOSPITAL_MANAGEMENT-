var mongoose = require("mongoose");
var Doctor = require("./models/doctor");
var Review = require("./models/review");

var data = [
    {
        name: "Cloud's Rest", 
        image: "https://farm4.staticflickr.com/3795/10131087094_c1c0a1c859.jpg",
        description: "blah blah blah"
    },
   
    {
        name: "Canyon Floor", 
        image: "https://farm1.staticflickr.com/189/493046463_841a18169e.jpg",
        description: "blah blah blah"
    }
]

function seedDB(){
   //Remove all campgrounds
 Doctor.deleteMany({}, function(err){
        if(err){
            console.log(err);
        }
       
	 Review.deleteMany({},function(err) {
		 if(err)
			 console.log(err);
		
	 });
         //add a few campgrounds
        data.forEach(function(seed){
        Doctor.create(seed, function(err,doctor){
                if(err){
                    console.log(err)
                } else {
                  //  console.log("added a doctor");
                    //create a  review
                    Review.create(
                        {
                            text: "This place is great, but I wish there was internet",
                            author: "Homer"
                        }, function(err, review){
                            if(err){
                                console.log(err);
                            } else {
                                doctor.reviews.push(review);
                                doctor.save();
                               // console.log("Created new review");
                            }
                        });
                }
            });
        });
    }); 
    //add a few comments
}

module.exports = seedDB;