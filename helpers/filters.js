var mongoose = require("mongoose");
var express = require('express');
const path = require('path');
var exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const moment = require('moment');

//console.log`(${}`)

// load models
require('../models/forecastTopic');
const forecastTopic = mongoose.model('forecastTopics');
require('../models/user');
const User = mongoose.model('users');
require('../models/organization');
const organization = mongoose.model('organizations');

function getOrgs(userId) {
        return new Promise((resolve, reject) => {

        User.findOne({_id:userId})
            .populate('submits.user')
            .then(user => {

                let okTopics =[];
                var memberOrganizations=user.memberOrganizations
                
                forecastTopic.find({})
                    .then(topics => {
                        console.log(topics.length)
                        if(topics.length>0){
                        for (i = 0; i<topics.length; i++) {
                            if(topics[i].organizations.length>0){
                                for (j = 0; j<topics[i].organizations.length; j++) {
                                    for (l = 0; l<memberOrganizations.length; l++) {
                                        if(topics[i].organizations[j]==memberOrganizations[l]){
                                            topics[i].visible=true
                                            okTopics.push(topics[i])
                                        }
                                    }
                                }
                            }
                            if(okTopics.length>0){
                                resolve(okTopics)
                            } else {
                                reject("ei löytynyt")
                            }     
                        }
                        }
                        else {reject("ei löydy")}
                    })       
            })
        }
    )};

function listOwnOrgs(userId) {
    return new Promise((resolve, reject) => {
        organization.find()
        .then(allOrgs => {
            User.find({_id:userId})
            .then(user => {
            console.log(`userin orgit pituus: ${user[0].memberOrganizations.length}`)
            var ownOrgs = [];
            var userLength = user[0].memberOrganizations.length;
            var pituus = allOrgs.length;
                for (i = 0; i<pituus; i++) {
                    console.log(`i: ${i}`)
                    console.log("all orgs loopissa")
                    var orgArray = allOrgs[i]
                    for (j = 0; j<userLength; j++) {
                        //laitan stringeiksi koska muuten type on jostain syystä objekti jolloin ei toimi ifissä
                        var paska = String(orgArray._id)
                        var housu = String(user[0].memberOrganizations[j]) 
                                
                        if(paska===housu){
                            console.log("kukkuu")
                            ownOrgs.push(allOrgs[i])
                        }
                    }
                }
            
        
            if(ownOrgs){
                console.log(`positiivisella:${ownOrgs}`)
                resolve(ownOrgs)
            }
            else {
                console.log("rejectissä")
                reject("joku tökkii")
            }
            })
        })

    });
}

function fillOrgsMembers(orgs){
    return new Promise((resolve, reject) => {
        var members = [];

        if(orgs.length>0){

            var pituus = orgs.length;
            for (i = 0; i<pituus; i++) {
                var org = orgs[i]
                User.find({})
                    .then(users=> {
                        var userPituus = users.length;
                        for (j = 0; j<userPituus; j++){
                            var userOrgsLength = users[j].memberOrganizations.length;
                            if(userOrgsLength>0){
                                for (h = 0; h<userOrgsLength; h++){
                                    var paska = String(org._id);
                                    var housussa = String(users[j].memberOrganizations[h])
                                    if(paska===housussa){
                                        console.log(paska)
                                        console.log(housussa)
                                        members.push(users[j])

                                    }
                                }
                            }
                        }
                    org.members = members
                    console.log(`membersarray: ${members}`)
                    resolve(orgs)        
                    })
            }
        } else {
            reject("no orgs")
        }
    });
}

module.exports.getOrgs = getOrgs;
module.exports.listOwnOrgs = listOwnOrgs;
module.exports.fillOrgsMembers = fillOrgsMembers;
