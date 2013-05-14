from bottle import get, route, request, post, template, redirect, response, Bottle, delete
from bottle import HTTPResponse

from models import Users

import bottle

import hashlib

import os
import json
from json import dumps
filepath = os.getcwd()

bottle.TEMPLATE_PATH.insert(0, filepath + '/static/templates/')

secretkey = 84251450

app = Bottle()

@route('/api/users', method='POST')
def register():
    # Test script from terminal:
    # http post localhost:8081/api/users username='David' password='David'
    try :
        user = request.json['username']
        password = request.json['password']
    except :
        response.content_type = 'application/json'
        response.status = '400 missing username or password'
        return
                
    # Hash password with sha 224 prior to storing
    hashedpw = hashlib.sha224(password).hexdigest()
    
    # Check to see if username is already taken
    checkUser = Users.objects(username = user)
    
    if( checkUser.count() != 0 ):
        response.content_type = 'application/json'
        response.status = '400 username taken'
        return     
    
    # Create a new instance of user and save it to the database
    newUser = Users()
    newUser.username = user
    newUser.password = hashedpw
    newUser.save()
    
    # Build response
    location = '/users/' + user
    response.content_type = 'application/json'
    response.status = 201
    response.set_cookie('session', newUser.username, secret=secretkey)
    response.headers['Location'] = location
    return
    
    
@route('/api/sessions/<user>', method='DELETE')
def logout(user):
    # Test script from terminal:
    # http post localhost:8081/api/sessions/David     
    response.content_type = 'application/json'
    response.delete_cookie('session')
    return
    
@route('/api/sessions', method='GET')
def get_username():
    session_user = request.get_cookie('session', secret=secretkey)
    if session_user:
        return json.dumps({'username': session_user})
    return HTTPResponse(status=404)

@route('/api/sessions', method='POST')
def login():
    # Test script from terminal:
    # http post localhost:8081/api/sessions username='David' password='David'
    try :
        username = request.json['username']
        password = request.json['password']
    except :
        response.content_type = 'application/json'
        response.status = '400 missing username or password'
        return
        
    # Hash password with sha 224 prior to storing
    hashedpw = hashlib.sha224(password).hexdigest()
   
    # Attempt to retrieve user from the database
    newUser = Users.objects(username = username)
    
    if( newUser.count() == 0 ):
        response.content_type = 'application/json'
        response.status = '400 invalid username or password'
        return 
    
    # Check given password against what is in the database
    if( newUser[0].password == hashedpw ):  # Password matches
        location = '/users/' + username    
        response.content_type = 'application/json'
        response.status = 201
        response.set_cookie('session', username, secret=secretkey)
        response.headers['Location'] = location        
        return
                 
    else:   # Username or password were not valid.
        response.content_type = 'application/json'
        response.status = '400 invalid username or password'
        return   
