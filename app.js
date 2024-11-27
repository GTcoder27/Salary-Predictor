const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/AC_wanderlust";



main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,"/public")));
app.use(methodOverride("_method")); 
app.engine("ejs",ejsMate)

app.get("/", (req, res) => {
  res.render("listings/home.ejs");
});


//Index Route
app.get("/listings", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
});

//New Route
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

//Show Route
app.get("/listings/:id", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  res.render("listings/show.ejs", { listing });
});

//Create Route
app.post("/listings",
  wrapAsync(async (req, res,next) => {
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listings");
})
);

//Edit Route
app.get("/listings/:id/edit", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});

//Update Route
app.put("/listings/:id", async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`); 
}); 

//Delete Route
app.delete("/listings/:id", async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  res.redirect("/listings");
});

// Reviews
app.post("/listings/:id/reviews", async (req, res) => {
  let {id} = req.params;
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);

  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();
  console.log("new review saved");
  res.redirect(`/listings/${id}`);
});

// Delete Reviews
app.delete("/listings/:id/reviews/:reviewId", async (req, res) => {
  let {id,reviewId} = req.params;
  
  await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});   // to remove id from reviews array
  await Review.findByIdAndDelete(reviewId);
  res.redirect(`/listings/${id}`)
});


// app.use("listings",listings);



app.all("*",(err,req,res,next)=>{
  console.log("page not found")
  // next(new ExpressError(404,"page not found"));
  res.send("Page not found");
})

// app.use((err,req,res,next)=>{
//   let {statusCode, message} = err;  
//   res.status(statusCode).end(message);
// })


app.listen(3000);
