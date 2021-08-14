const express = require('express');
const cors = require('./cors');
const authenticate = require('../authenticate');
const Favorite = require('../models/favorite');
const Campsite = require('../models/campsite')
const { Mongoose, isValidObjectId } = require('mongoose');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.find({ user: req.user._id })
            .populate('favorite.user')
            .populate('favorite.campsite')
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite)
            })
            .catch(err => next(err))
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                let found = false;
                if (favorite) {
                    req.body.forEach(newFav => {
                        if (!favorite.campsites.includes(newFav._id)) {
                            favorite.campsites.push(newFav._id);
                            found = true;
                        }
                    });
                    if (!found) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('No new favorites were added, all new favorites already exist for this user');
                    } else {
                        favorite.save()
                            .then(favorite => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite);
                            })
                            .catch(err => next(err));
                    }
                } else {
                    Favorite.create({
                        user: req.user._id,
                        campsites: req.body
                    })
                        .then(favorite => {
                            console.log('Favorite Created');
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        })
                        .catch(err => next(err));
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 200;
        res.end('PUT operation not supported on /favorites')
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndDelete({ user: req.user._id })
            .then(favorite => {
                if (favorite) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                } else {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('You do not have any favorites to delete');
                }
            })
            .catch(err => next(err));
    });

favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`GET not supported on /favorites/${req.params.campsiteId}`)
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then(favorite => {
                Campsite.findById(req.params.campsiteId)
                    .then(campsite => {
                        if (favorite?.campsites.includes(req.params.campsiteId) && campsite) {
                            res.end(`${campsite.name} (id: ${req.params.campsiteId}) is already a favorite campsite`);
                        } else if (campsite) {
                            if (favorite) {
                                favorite.campsites.push(req.params.campsiteId);
                                favorite.save()
                                    .then(favorite => {
                                        console.log(`${campsite.name} (id: ${req.params.campsiteId} added to favorites)`);
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(favorite);
                                    })
                                    .catch(err => next(err));
                            } else {
                                Favorite.create({
                                    user: req.user._id,
                                    campsites: req.params.campsiteId
                                })
                                    .then(favorite => {
                                        console.log(`${campsite.name} (id: ${req.params.campsiteId} added to favorites)`);
                                        res.statusCode = 200;
                                        res.setHeader('Content-Type', 'application/json');
                                        res.json(favorite);
                                    })
                                    .catch(err => next(err));
                            }
                        }
                        else {
                            res.end(`Campsite with id ${req.params.campsiteId} is not a valid campsite`)
                        }
                    })
                    .catch(err => next(err))
            })
            .catch(err => next(err));
    })
    .put(cors.cors, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`PUT not supported on /favorites/${req.params.campsiteId}`)
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user.id })
            .then(favorite => {
                if (favorite.campsites.length) {
                    if (favorite.campsites.includes(req.params.campsiteId)) {
                        favorite.campsites.splice(favorite.campsites.indexOf(req.params.campsiteId), 1);
                        favorite.save()
                            .then(favorite => {
                                console.log('fav: ', favorite)
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite);
                            })
                            .catch(err => next(err));
                    } else {
                        res.send(`Campsite to remove (id: ${req.params.campsiteId}) is not in the array`)
                    }
                } else {
                    res.setHeader('Content-Type', 'plain/text');
                    res.send(`There are no favorites for this user (id: ${req.user._id}) to delete.`)
                }
            })
            .catch(err => next(err));
    });

module.exports = favoriteRouter;
