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


// load models
require('../models/forecastTopic');
const forecastTopic = mongoose.model('forecastTopics');
require('../models/user');
const User = mongoose.model('users');
require('../models/organization');
const organization = mongoose.model('organizations');

//filter all topics that have submit from user. remove submits from other users
function filterTopicsByUserSubmits(userId) {
    return new Promise((resolve, reject) => {
        forecastTopic.find({})
            .then((topics)=>{
                var userTopics = [];
                for (i = 0; i<topics.length; i++) {
                    if(topics[i].submits.length>0){
                        for (j = 0; j<topics[i].submits.length; j++) {
                            var kyrpa = String(userId);
                            var naama = String(topics[i].submits[j].user)
                            if(kyrpa!=naama){
                                console.log("tässä")
                                console.log(kyrpa)
                                console.log(naama)
                                topics[i].submits.splice(j,1)
                            }
                        }
                    }
                    userTopics.push(topics[i])
                }
            resolve(userTopics)
            })
    })
}

//only show topics that are in user's orgs
function getOrgs(userId) {
        return new Promise((resolve, reject) => {
        User.findOne({_id:userId})
            .populate('submits.user')
            .then(user => {
                let okTopics =[];
                var memberOrganizations=user.memberOrganizations
                forecastTopic.find({})
                    .populate('organizations')
                    .populate('user')
                    .then(topics => {
                        // console.log(`tässä: ${topics}`)
                        if(topics.length>0){
                        for (i = 0; i<topics.length; i++) {
                            if(topics[i].organizations.length>0){
                                for (j = 0; j<topics[i].organizations.length; j++) {
                                    for (l = 0; l<memberOrganizations.length; l++) {
                                        var runk = String(topics[i].organizations[j]._id)
                                        var kari = String(memberOrganizations[l])
                                        if(runk==kari){
                                            topics[i].visible=true
                                            okTopics.push(topics[i])
                                        }
                                    }
                                }
                            }
                        }
                            if(okTopics.length>0){
                                resolve(okTopics)
                            } else {
                                reject("ei löytynyt useriin matchaavaa")
                            }     
                        }
                        else {reject("topics.length on 0")}
                    })       
            })
        }
    )};

//get list of user's orgs
function listOwnOrgs(userId) {
    return new Promise((resolve, reject) => {
        organization.find()
        .then(allOrgs => {
            User.find({_id:userId})
            .then(user => {
            var ownOrgs = [];
            var userLength = user[0].memberOrganizations.length;
            var pituus = allOrgs.length;
                for (i = 0; i<pituus; i++) {
                    var orgArray = allOrgs[i]
                    for (j = 0; j<userLength; j++) {
                        //laitan stringeiksi koska muuten type on jostain syystä objekti jolloin ei toimi ifissä
                        var paska = String(orgArray._id)
                        var housu = String(user[0].memberOrganizations[j]) 
                                
                        if(paska===housu){
                            ownOrgs.push(allOrgs[i])
                        }
                    }
                }
            
        
            if(ownOrgs){
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
                orgs[i].members = [];
                User.find({})
                    .then(users=> {
                        var userPituus = users.length;
                        for (j = 0; j<userPituus; j++){
                            var userOrgsLength = users[j].memberOrganizations.length;
                            if(userOrgsLength>0){
                                for (h = 0; h<userOrgsLength; h++){
                                    var paska = String(orgs[i]._id);
                                    var housussa = String(users[j].memberOrganizations[h])
                                    if(paska===housussa){
                                        members.push(users[j])
                                    }
                                }
                            }
                        }
                    orgs.members = members
                    console.log(orgs)
                    resolve(orgs)        
                    })
            }
        } else {
            reject("no orgs")
        }
    });
}

//shortens guess array. complicated way. hbs helper might make more sense
function shortenGuessArrays(topics){
    return new Promise((resolve, reject) => {
        if(topics.length>0){
            let pituus = topics.length;
            for (i = 0; i<pituus; i++) {
                var nOfOptions = topics[i].options.length;
                if(nOfOptions!=5){
                    var pituus2 = topics[i].submits.length;
                    for (j = 0; j<pituus2; j++) {
                        let difference = 5-nOfOptions
                        if(difference===1){topics[i].submits[j].submittedProbability.splice(4, 1);}
                        if(difference===2){topics[i].submits[j].submittedProbability.splice(3, 2);}
                        if(difference===3){topics[i].submits[j].submittedProbability.splice(2, 3);}
                    }
                }
            } resolve(topics)
        } else {
            reject("no topics")
        }
    })
}





//status related
function openOrClosed(topic, status){
    return new Promise((resolve, reject) => {
        forecastTopic
        .findOne({
        title: topic.title
        })
        .then(topic => {
            //stops before this

            topic.status = status;

            
            if(status != "Unresolved and open"){
                topic.open = false;
                topic.save();
                resolve(topic)
            }
            else {
                topic.open = true;
                topic.result=[0,0,0,0,0];
                topic.save();
                resolve(topic);
            }

        })
    })
}

function setResult(topicId, status){
    return new Promise((resolve, reject) => {
        forecastTopic
        .findOne({
        _id: topicId
        })
            .then((topic) => {
                // var status = String(status);
                //make result array if topic is resolved
                if(status=="Option 0 is True"){
                    topic.result = [1,0,0,0,0];
                    topic.save();   
                    resolve(topic)
                } 
                if(status=="Option 1 is True"){
                    topic.result = [0,1,0,0,0];
                    topic.save();  
                    resolve(topic)
                } 
                if(status=="Option 2 is True"){
                    topic.result = [0,0,1,0,0];
                    topic.save();   
                    resolve(topic)
                } 
                if(status=="Option 3 is True"){
                    topic.result = [0,0,0,1,0];
                    topic.save();   
                    resolve(topic)
                } 
                if(status=="Option 4 is True"){
                    topic.result = [0,0,0,0,1];
                    topic.save();   
                    resolve(topic)
                };
            })
    })
}

//to calculate briers on resolved topic
function calculateBriers(topic){
    return new Promise((resolve, reject) => 
    {
        for (i = 0; i < topic.submits.length; i++){
            var brier = 0;
            var score = 0;
            for (j = 0; j < 5; j++){
                var score = Math.round(Math.pow((topic.submits[i].submittedProbability[j]/100-topic.result[j]), 2)*100)/100;
                var brier = brier+score;
            }
            topic.submits[i].brierScore = brier;
            topic.save()
        };
        resolve(topic)
    })
}


module.exports.getOrgs = getOrgs;
module.exports.listOwnOrgs = listOwnOrgs;
module.exports.fillOrgsMembers = fillOrgsMembers;
module.exports.shortenGuessArrays = shortenGuessArrays;
module.exports.setResult = setResult;
module.exports.openOrClosed = openOrClosed;
module.exports.calculateBriers = calculateBriers;
module.exports.filterTopicsByUserSubmits = filterTopicsByUserSubmits;

