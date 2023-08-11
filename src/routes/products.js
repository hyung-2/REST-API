const express = require('express')
const Product = require('../models/Product')
const expressAsyncHandler = require('express-async-handler')
const { isAuth, isAdmin } = require('../../auth')

const mongoose = require('mongoose')
const { Types: {ObjectId} } = mongoose

const router = express.Router()

//전체 상품 목록 조회 -관리자만
router.get('/admin', isAuth, isAdmin, expressAsyncHandler(async (req, res, next) => {
  const product = await Product.find({})
  if(product.length === 0){
    res.status(404).json({code: 404, message:'전체 상품이 없습니다.'})
  }else{
    res.json({code: 200, product})
  }
}))

//다른 사용자의 상품 조회(내가 구매한 상품 제외)
router.get('/other', isAuth, expressAsyncHandler(async (req, res, next) => {
  const product = await Product.find({$nor:[{user: req.user._id},{orderUser: req.user._id}]})
  if(product.length === 0){
    res.status(404).json({code: 404, message: '다른 사용자의 상품이 없습니다.'})
  }else{
    res.json({code: 200, product})
  }
}))

//사용자의 전체 상품 목록 조회
router.get('/', isAuth, expressAsyncHandler(async (req, res, next) => {
  const product = await Product.find({ user: req.user._id}).populate('user')
  if(product.length === 0){
    res.status(404).json({code: 404, message: '전체 상품이 없습니다.'})
  }else{
    res.json({code: 200, product})
  }
}))

//사용자가 구매한 전체 상품 목록 조회
router.get('/order/item', isAuth, expressAsyncHandler(async (req, res, next) => {
  const product = await Product.find({orderUser: req.user._id})
  if(product.length === 0){
    res.status(404).json({code: 404, message: '전체 상품이 없습니다.'})
  }else{
    res.json({code:200, product})
  }
}))


//사용자의 특정 상품 조회
router.get('/:id', isAuth, expressAsyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ 
    user: req.user._id,
    _id: req.params.id
  }).populate('user')
  if(!product){
    res.status(404).json({code: 404, message: '찾는 상품이 없습니다.'})
  }else{
    res.json({code: 200, product})
  }
}))



//상품 등록
router.post('/', isAuth, expressAsyncHandler(async (req, res, next) => {
  const searchedProduct = await Product.findOne({
    user: req.user._id,
    name: req.body.name,
  })
  if(searchedProduct){
    res.status(200).json({code: 200, message: '이미 있는 상품입니다.'})
  }else{
    const product = new Product({
      category: req.body.category,
      name: req.body.name,
      description: req.body.description,
      imgUrl: req.body.imgUrl,
      user: req.user._id,
    })
    const newproduct = await product.save()
    if(!newproduct){
      res.status(401).json({code: 401, message: '상품등록에 실패하였습니다.'})
    }else{
      res.status(201).json({
        code: 201,
        message: '새로운 상품이 등록되었습니다!',
        newproduct
      })
    }
  }
}))



//특정 상품 변경
router.put('/:id', isAuth, expressAsyncHandler(async (req, res, next) => {
  const product = await Product.findOne({
    user: req.user._id,
    _id: req.params.id,
  })
  if(!product){
    res.status(404).json({code: 404, message: '해당 상품이 없습니다.'})
  }else{
    product.category = req.body.category || product.category
    product.name = req.body.name || product.name
    product.description = req.body.description || product.description
    product.imgUrl = req.body.imgUrl || product.imgUrl
    product.lastModifiedaAt = new Date()

    const updatedProduct = await product.save()
    res.json({
      code: 200,
      message: '상품 업데이트를 완료했습니다.',
      updatedProduct
    })  
  }
}))

//특정 상품 구매/반품 하기
router.put('/order/:id', isAuth, expressAsyncHandler(async (req, res, next) => {
  const isSold = await Product.findOne({
    _id: req.params.id,
    name: req.body.name,
  })
  if(!isSold){
    res.status(404).json({code: 404, message: '해당 상품이 없습니다.'})
  }else if(req.body.order == false){ //구매
    console.log(isSold)
    isSold.order = true
    isSold.orderDate = new Date()
    isSold.orderUser = req.user._id
    isSold.lastModifiedaAt = isSold.order ? isSold.orderDate : isSold.lastModifiedaAt

    const soldProduct = await isSold.save()
    res.json({
      code: 200,
      message: '상품을 구매하였습니다.',
      soldProduct
    })
  }else if(req.body.order == true){ //반품
    console.log(isSold)
    isSold.order = false
    isSold.orderDate = null
    isSold.orderUser = null
    isSold.lastModifiedaAt = isSold.order ? isSold.lastModifiedaAt : new Date()

    const returnProduct = await isSold.save()
    res.json({
      code: 200,
      message: '상품을 반품하였습니다.',
      returnProduct
    })
  }else if(isSold.order == true){
    res.status(401).json({code: 401, message: '품절된 상품입니다.'})
  }else if(isSold.order == false){
    res.json(`상품의 재고가 남아있습니다.`)
  }
}))



//특정 상품 삭제
router.delete('/:id', isAuth, expressAsyncHandler(async (req, res, next) => {
  const product = await Product.findOne({
    user: req.user._id,
    _id: req.params.id,
  })
  if(!product){
    res.status(404).json({code: 404, message: '해당 상품이 없습니다.'})
  }else{
    await Product.deleteOne({
      user: req.user._id,
      _id: req.params.id,
    })
    res.status(200).json({code: 200, message: '해당 상품을 삭제하였습니다.'})
  }
}))



//그룹핑- 관리자용(전체)
router.get('/group/:field', isAuth, isAdmin, expressAsyncHandler(async (req, res, next) => {
  const docs = await Product.aggregate([
    {$group: {
      _id: `$${req.params.field}`,
      count: {$sum: 1}
    }}
  ])
  console.log(`그룹이 ${docs.length}개 있습니다.`)
  docs.sort((d1, d2) => d1._id - d2._id)
  res.json({code: 200, docs})
}))

//그룹핑 날짜- 관리자용
router.get('/group/date/:field', isAuth, isAdmin, expressAsyncHandler(async (req, res, next) => {
  if(req.params.field === 'createdAt' || req.params.field === 'lastModifiedaAt'){
    const docs = await Product.aggregate([
      {$group: {
        _id: {year: {$year: `$${req.params.field}`}, month: {$month: `$${req.params.field}`}},
        count: {$sum: 1}
      }},
      {$sort: {_id: 1}}
    ])
    console.log(`그룹이 ${docs.length}개 있습니다.`)
    docs.sort((d1, d2) => d1._id - d2._id)
    res.json({code: 200, docs})
  }else{
    res.status(204).json({code: 204, message: 'No content'})
  }
}))


//그룹핑- 사용자용
router.get('/group/user/:field', isAuth, expressAsyncHandler(async (req, res, next) => {
  const docs = await Product.aggregate([
    {$match: {user: new ObjectId(req.user._id)}},
    {$group: {
      _id: `$${req.params.field}`,
      count: {$sum: 1}
    }}
  ])
  console.log(`그룹이 ${docs.length}개 있습니다.`)
  docs.sort((d1, d2) => d1._id - d2._id)
  res.json({code: 200, docs})
}))

//그룹핑 날짜- 사용자(본인)용
router.get('/group/user/date/:field',isAuth, expressAsyncHandler(async (req, res, next) => {
  if(req.params.field === 'createdAt' || req.params.field === 'lastModifiedaAt'){
    const docs = await Product.aggregate([
      {$match: {user: new ObjectId(req.user._id)}},
      {$group: {
        _id: {year: {$year: `$${req.params.field}`}, month: {$month: `$${req.params.field}`}},
        count: {$sum: 1}
      }},
      {$sort: {_id: 1}}
  ])
  console.log(`그룹이 ${docs.length}개 있습니다.`)
  docs.sort((d1, d2) => d1._id - d2._id)
  res.json({code: 200, docs})
  }else{
    res.status(204).json({code: 204, message: 'No content'})
  }
}))

//그룹핑- 사용자가 구매한 상품
router.get('/group/user/order/:field', isAuth, expressAsyncHandler(async (req, res, next) => {
  const docs = await Product.aggregate([
    {$match: {orderUser: new ObjectId(req.user._id)}},
    {$group: {
      _id: `$${req.params.field}`,
      count: {$sum: 1}
    }}
  ])
  console.log(`그룹이 ${docs.length}개 있습니다.`)
  docs.sort((d1, d2) => d1._id - d2._id)
  res.json({code: 200, docs})
}))

//그룹핑 날짜- 사용자가 구매한 상품
router.get('/group/user/order/date/:field', isAuth, expressAsyncHandler(async (req, res, next) => {
  if(req.params.field === 'createdAt' || req.params.field === 'lastModifiedaAt'){
    const docs = await Product.aggregate([
      {$match: {orderUser: new ObjectId(req.user._id)}},
      {$group: {
        _id: {year: {$year: `$${req.params.field}`}, month: {$month: `$${req.params.field}`}},
        count: {$sum: 1}
      }},
      {$sort: {_id: 1}}
    ])
    console.log(`그룹이 ${docs.length}개 있습니다.`)
    docs.sort((d1, d2) => d1._id - d2._id)
    res.json({code: 200, docs})
  }else{
    res.status(204).json({code: 204, message: 'No content'})
  }
}))


module.exports = router