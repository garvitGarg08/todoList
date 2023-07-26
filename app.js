const express = require('express');
const bodyParser = require('body-parser');
const mongoose=require("mongoose");
const app = express();
const _=require("lodash"); 

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0/todolistDB",{useNewUrlParser:true});

const itemsSchema={
  name: String
};
const Item=mongoose.model("Item",itemsSchema);
const item1=new Item({
  name: "Welcome to your todolist!"
})
const item2=new Item({
  name: "Hit the + button to add a new item."
})
const item3=new Item({
  name: "<-- Hit this to delete an item."
})

const defaultItems=[item1,item2,item3];

const listSchema={
  name:String,
  items:[itemsSchema]
};
const List=mongoose.model("List",listSchema);


// app.get("/",  function(req, res) {
//    Item.find({},function(err,foundItems){
//      res.render("list", {
//       listTitle: "Today",
//       listItems: foundItems
//     });
//   });

 
// });
app.get("/", async function(req, res) {
  try {
    const foundItems = await Item.find({});

   if(foundItems.length===0){
     Item.insertMany(defaultItems)
      .then(function () {
        console.log("Successfully saved defult items to DB");
      })
      .catch(function (err) {
        console.log(err);
      });
      res.redirect("/");
   }
    else{
      res.render("list", {
        listTitle: "Today",
        listItems: foundItems
      });
    }
   
  } catch (err) {
    // Handle any errors that might occur during the database query or rendering
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/:customListName", async function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  try {
    let foundList = await List.findOne({ name: customListName });
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      foundList = await list.save();
    }
    res.render("list", {
      listTitle: foundList.name,
      listItems: foundList.items
    });
  } catch (err) {
    console.error("Error finding or creating list:", err);
    res.status(500).send("Error finding or creating list.");
  }
});



app.post("/", function(req, res){

   const itemName=req.body.newTodo;
   const listName=req.body.listSubmit;
   const item=new Item({
    name:itemName
   });
   if(listName==="Today"){
   item.save();
   res.redirect("/");
   }
   else{
    List.findOne({ name: listName })
  .then(foundList => {
    foundList.items.push(item);
    return foundList.save();
  })
  .then(() => {
    res.redirect("/" + listName);
  })
  .catch(err => {
    console.error("Error finding or updating list:", err);
    res.status(500).send("Error finding or updating list.");
  });
   }
 
});

app.post("/delete", async function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName=req.body.listName;
  if(listName==="Today"){
  try {
    await Item.findByIdAndRemove(checkedItemId);
    console.log("Successfully deleted checked item.");
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).send("Error deleting item.");
  }

}
else{
  async function updateList() {
    try {
      const foundList = await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + listName);
    } catch (err) {
      console.error(err);
      // Handle the error and send an appropriate response
    }
  }
  
  updateList();
}

});

app.listen(3000, function() {
  console.log("Server running on port 3000.");
});