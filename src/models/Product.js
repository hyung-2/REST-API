const mongoose = require('mongoose')

const { Schema } = mongoose
const { Types: { ObjectId }} = Schema

const productSchema = new Schema({
  category: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  imgUrl: {
    type: String,
    required: true,
    trim: true,
  },
  user: {
    type: ObjectId,
    required: true,
    ref: 'User'
  },
  order: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  orderDate: {
    type: Date,
    default: null
  },
  lastModifiedaAt: {
    type: Date,
    default: Date.now,
  },
})

const Product = mongoose.model('Product', productSchema)

module.exports = Product


