//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose')
const _ = require('lodash')

const app = express();
const Schema = mongoose.Schema

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.connect('mongodb://localhost/todolistDB', { useNewUrlParser: true })

const itemsSchema = {
  name: String
}

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const Item = mongoose.model("Item", itemsSchema)
const List = mongoose.model("List", listSchema)

const item1 = new Item({
  name: 'Welcome to your todolist'
})

const item2 = new Item({
  name: 'Hit the + button to add a new item'
})

const item3 = new Item({
  name: '<-- Hit this to delete an item'
})

const defaultItems = [item1, item2, item3];


app.get("/", function (req, res) {

  Item.find({}, function (err, arr) {
    if (arr.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err)
        } else {
          console.log('success')
        }
      })
      res.redirect('/')
    } else {
      res.render("list", { listTitle: 'Today', newListItems: arr })
    }
  })
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem
  const listName = req.body.list

  const item = new Item({
    name: itemName
  })

  if (listName === 'Today') {
    item.save()
    res.redirect('/')
  } else {
    List.findOne({ name: listName }, function (err, result) {
      if (!err) {
        result.items.push(item)
        result.save()
        res.redirect("/" + listName)
      }
    })
  }

});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox
  const listName = req.body.list
  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, function (err, result) {
      if (err) {
        console.log(err)
      } else {
        res.redirect('/')
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}},{new: true}, function(err, result) {
      if (!err) {
        res.redirect('/' + listName)
      } else {
        console.log(err)
      }
    })
  }
})

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName)

  List.findOne({ name: customListName }, function (err, result) {
    if (!err) {
      if (!result) {
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save()
        res.redirect('/' + customListName)
      } else {
        res.render("list", { listTitle: result.name, newListItems: result.items })
      }
    }
  })
})

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
