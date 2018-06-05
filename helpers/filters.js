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

function openOrClosed(topic, status){
    return new Promise((resolve, reject) => {
        console.log("openor closedissa")
        console.log(status)
        forecastTopic
        .findOne({
        title: topic.title
        })
        .then(topic => {
            //stops before this
            console.log("findin läpi")

            topic.status = status;
            console.log(topic.status)

            
            if(status != "Unresolved and open"){
                console.log("closedin puolella")
                topic.open = false;
                topic.save();
                resolve(topic)
            }
            else {
                console.log("openin puolella")
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
                console.log(`status setresultissa: ${status}`)
                //make result array if topic is resolved
                if(status=="Option 0 is True"){
                    console.log("optiossa 0")
                    topic.result = [1,0,0,0,0];
                    topic.save();   
                    console.log(`ennen resolvea: ${topic}`)
                    resolve(topic)
                } 
                if(status=="Option 1 is True"){
                    topic.result = [0,1,0,0,0];
                    console.log("optiossa 1")
                    topic.save();  
                    console.log(`ennen resolvea: ${topic}`)
                    resolve(topic)
                } 
                if(status=="Option 2 is True"){
                    topic.result = [0,0,1,0,0];
                    topic.save();   
                    console.log(`ennen resolvea: ${topic}`)
                    resolve(topic)
                } 
                if(status=="Option 3 is True"){
                    topic.result = [0,0,0,1,0];
                    topic.save();   
                    console.log(`ennen resolvea: ${topic}`)
                    resolve(topic)
                } 
                if(status=="Option 4 is True"){
                    topic.result = [0,0,0,0,1];
                    topic.save();   
                    console.log(`ennen resolvea: ${topic}`)
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
module.exports.setResult = setResult;
module.exports.openOrClosed = openOrClosed;
module.exports.calculateBriers = calculateBriers;
